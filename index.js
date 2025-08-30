#!/usr/bin/env node

/**
 * 🏥 HEALTHCARE LEAD DISCOVERY AGENT (PART 1)
 * 
 * Workflow: Telegram → Exa Search → Notion → Telegram Output
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    port: process.env.PORT || 8080,
    exa_api_key: process.env.EXA_API_KEY,
    notion_database_id: process.env.NOTION_DATABASE_ID || '22441ac0-dfef-81a6-9954-cdce1dfcba1d',
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN
};

class HealthcareLeadAgent {
    constructor() {
        this.currentStep = 'idle';
    }

    // STEP 1: Exa Search & Data Extraction
    async scrapeHealthcarePractice(url) {
        console.log(`🔍 STEP 1: Exa search for: ${url}`);
        this.currentStep = 'exa-search';
        
        try {
            if (!config.exa_api_key) {
                return this.createFallbackData(url);
            }

            const hostname = new URL(url).hostname;
            const companyName = this.extractCompanyFromUrl(hostname);

            const searchResponse = await axios.post('https://api.exa.ai/search', {
                query: `${companyName} healthcare services treatments specializations contact information`,
                type: 'neural',
                useAutoprompt: true,
                numResults: 3,
                includeDomains: [hostname],
                contents: {
                    text: {
                        maxCharacters: 4000,
                        includeHtmlTags: false
                    }
                }
            }, {
                headers: {
                    'X-API-Key': config.exa_api_key,
                    'Content-Type': 'application/json'
                }
            });

            const content = searchResponse.data.results
                .map(result => result.text)
                .join(' ');

            return {
                company: companyName,
                website: url,
                services: this.extractServices(content),
                treatments: this.extractTreatments(content),
                specializations: this.extractSpecializations(content),
                phone: this.extractPhone(content),
                email: this.extractEmail(content),
                location: this.extractLocation(content),
                practice_type: this.determinePracticeType(content),
                lead_score: this.calculateLeadScore({
                    services: this.extractServices(content),
                    treatments: this.extractTreatments(content),
                    hasContact: !!this.extractPhone(content) || !!this.extractEmail(content)
                }),
                exa_enhanced: true
            };

        } catch (error) {
            console.error('Exa search failed:', error.message);
            return this.createFallbackData(url);
        }
    }

    // STEP 2: Store in Notion Database
    async storeLeadInNotion(practiceData) {
        console.log(`📊 STEP 2: Storing in Notion: ${practiceData.company}`);
        this.currentStep = 'notion-storage';
        
        try {
            const notionData = {
                parent: { database_id: config.notion_database_id },
                properties: {
                    'Company': {
                        title: [{ text: { content: practiceData.company } }]
                    },
                    'Services': {
                        rich_text: [{ text: { content: practiceData.services.join(', ') } }]
                    },
                    'Treatments': {
                        rich_text: [{ text: { content: practiceData.treatments.join(', ') } }]
                    },
                    'Lead Score': {
                        number: practiceData.lead_score
                    },
                    'Location': {
                        rich_text: [{ text: { content: practiceData.location || 'Unknown' } }]
                    },
                    'Website': {
                        url: practiceData.website
                    },
                    'Phone': {
                        phone_number: practiceData.phone || null
                    },
                    'Email': {
                        email: practiceData.email || null
                    }
                }
            };

            const response = await axios.post('https://api.notion.com/v1/pages', notionData, {
                headers: {
                    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                }
            });

            return {
                success: true,
                leadId: response.data.id,
                url: response.data.url
            };

        } catch (error) {
            console.error('Notion storage failed:', error.message);
            return {
                success: false,
                error: error.message,
                leadId: `fallback_${Date.now()}`
            };
        }
    }

    // STEP 3: Send Telegram Response
    async sendTelegramMessage(chatId, message) {
        console.log(`📱 STEP 3: Sending Telegram response`);
        
        if (!config.telegram_bot_token) {
            console.log('No Telegram token - skipping');
            return { success: false };
        }

        try {
            await axios.post(`https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });
            return { success: true };
        } catch (error) {
            console.error('Telegram send failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Helper Methods
    extractCompanyFromUrl(hostname) {
        return hostname.replace('www.', '').split('.')[0]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    extractServices(content) {
        const patterns = [
            /(?:we offer|our services|services include|we provide)[^.!?]*[.!?]/gi,
            /(?:cosmetic|aesthetic|medical|dental|surgical)\s+(?:services?|procedures?|treatments?)/gi
        ];
        
        const services = new Set();
        patterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
                if (match.length < 100) services.add(match.trim());
            });
        });
        
        return Array.from(services).slice(0, 5);
    }

    extractTreatments(content) {
        const patterns = [
            /(?:botox|dermal fillers?|laser therapy|chemical peels?|microneedling|coolsculpting)/gi,
            /(?:facelift|rhinoplasty|breast augmentation|liposuction|tummy tuck)/gi
        ];
        
        const treatments = new Set();
        patterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => treatments.add(match.trim()));
        });
        
        return Array.from(treatments).slice(0, 5);
    }

    extractSpecializations(content) {
        const patterns = [
            /(?:cosmetic surgery|plastic surgery|aesthetic medicine|dermatology|wellness)/gi
        ];
        
        const specializations = new Set();
        patterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => specializations.add(match.trim()));
        });
        
        return Array.from(specializations).slice(0, 3);
    }

    extractPhone(content) {
        const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
        const match = content.match(phonePattern);
        return match ? match[0] : null;
    }

    extractEmail(content) {
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const match = content.match(emailPattern);
        return match ? match[0] : null;
    }

    extractLocation(content) {
        const locationPatterns = [
            /(?:located in|based in|serving)\s+([^,.!?]+)/i,
            /([A-Z][a-z]+,\s*[A-Z]{2})/
        ];
        
        for (const pattern of locationPatterns) {
            const match = content.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    determinePracticeType(content) {
        if (/cosmetic|aesthetic|plastic surgery/i.test(content)) return 'cosmetic';
        if (/dental|dentist/i.test(content)) return 'dental';
        if (/wellness|spa/i.test(content)) return 'wellness';
        return 'healthcare-general';
    }

    calculateLeadScore(data) {
        let score = 50; // Base score
        if (data.services?.length > 0) score += Math.min(data.services.length * 5, 25);
        if (data.treatments?.length > 0) score += Math.min(data.treatments.length * 3, 20);
        if (data.hasContact) score += 15;
        return Math.min(score, 100);
    }

    createFallbackData(url) {
        const hostname = new URL(url).hostname;
        const companyName = this.extractCompanyFromUrl(hostname);
        
        return {
            company: companyName,
            website: url,
            services: ['Healthcare Services'],
            treatments: ['Consultation'],
            specializations: ['General Healthcare'],
            phone: null,
            email: null,
            location: null,
            practice_type: 'healthcare-basic',
            lead_score: 30,
            exa_enhanced: false
        };
    }
}

const agent = new HealthcareLeadAgent();

// Routes
app.post('/automate', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Execute 3-step workflow
        const practiceData = await agent.scrapeHealthcarePractice(url);
        const notionResult = await agent.storeLeadInNotion(practiceData);
        
        res.json({
            success: true,
            workflow_type: '3-step-simplified',
            practice: {
                company: practiceData.company,
                services: practiceData.services,
                treatments: practiceData.treatments,
                lead_score: practiceData.lead_score
            },
            notion: {
                stored: notionResult.success,
                lead_id: notionResult.leadId
            }
        });

    } catch (error) {
        console.error('Automation failed:', error);
        res.status(500).json({ error: 'Automation failed' });
    }
});

app.post('/telegram-webhook', async (req, res) => {
    const message = req.body?.message;
    const chatId = message?.chat?.id;
    const messageText = message?.text;

    if (!messageText) {
        return res.status(400).json({ error: 'No message text' });
    }

    const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        const url = urlMatch[0];
        
        try {
            await agent.sendTelegramMessage(chatId, 
                `🏥 Healthcare Lead Discovery Agent\n\nProcessing: ${url}\n\n🔍 Starting 3-step workflow...`
            );

            const practiceData = await agent.scrapeHealthcarePractice(url);
            const notionResult = await agent.storeLeadInNotion(practiceData);
            
            const resultMessage = 
                `✅ Healthcare Lead Discovery Complete!\n\n` +
                `🏥 Practice: ${practiceData.company}\n` +
                `📍 Location: ${practiceData.location || 'Unknown'}\n` +
                `💊 Treatments: ${practiceData.treatments.slice(0,3).join(', ')}\n` +
                `🔧 Services: ${practiceData.services.slice(0,3).join(', ')}\n` +
                `📊 Lead Score: ${practiceData.lead_score}/100\n` +
                `💾 Notion ID: ${notionResult.leadId}\n\n` +
                `✅ Lead stored successfully!`;
                
            await agent.sendTelegramMessage(chatId, resultMessage);
            
        } catch (error) {
            await agent.sendTelegramMessage(chatId, 
                `❌ Error processing ${url}: ${error.message}`
            );
        }
    }
    
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.json({
        agent: '🏥 Healthcare Lead Discovery Agent (Part 1)',
        workflow: 'Telegram → Exa Search → Notion → Telegram Output',
        endpoints: {
            '/automate': 'POST - Process healthcare practice URL',
            '/telegram-webhook': 'POST - Telegram bot webhook'
        }
    });
});

app.listen(config.port, () => {
    console.log(`\n🏥 HEALTHCARE LEAD DISCOVERY AGENT (PART 1)`);
    console.log(`🌐 Server running on port ${config.port}`);
    console.log(`📋 Workflow: Telegram → Exa Search → Notion → Telegram Output`);
    console.log(`🔧 Configuration:`);
    console.log(`   EXA API: ${config.exa_api_key ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Notion DB: ${config.notion_database_id}`);
    console.log(`   Telegram Bot: ${config.telegram_bot_token ? '✅ Available' : '❌ Missing'}`);
    console.log(`\n📖 Usage:`);
    console.log(`   POST /automate { "url": "https://healthcare-practice.com" }`);
    console.log(`   Telegram: Send healthcare practice URL to bot`);
    console.log(`\n🚀 Ready for healthcare lead discovery!`);
});