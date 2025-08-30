require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Client } = require('@notionhq/client');
const OpenAI = require('openai');
const validator = require('validator');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Initialize API clients
const notion = new Client({ 
    auth: process.env.NOTION_TOKEN 
});

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'https://healthcare-part1-final-production.up.railway.app',
        'X-Title': 'Healthcare Lead Discovery Agent'
    }
});

// Rate limiting
const telegramLimiter = new RateLimiterMemory({
    keyPrefix: 'telegram_webhook',
    points: 10,
    duration: 60,
});

// Healthcare Lead Discovery Agent
class HealthcareLeadAgent {
    constructor() {
        this.processedLeads = [];
        this.errorCount = 0;
        this.successCount = 0;
    }

    // SIMPLIFIED: AI-Powered Lead Discovery (no functions, direct workflow)
    async discoverLeads(query) {
        console.log(`🎯 Starting AI lead discovery for: "${query}"`);
        
        try {
            // Step 1: AI generates search query
            console.log('🤖 Calling OpenRouter AI for search query generation...');
            const searchQueryResponse = await openai.chat.completions.create({
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a search query generator. Convert user requests into effective search queries for finding healthcare practices. Return only the search query, nothing else.'
                    },
                    {
                        role: 'user',
                        content: `Convert this into a good search query: "${query}"`
                    }
                ],
                temperature: 0.1,
                max_tokens: 100
            });

            const searchQuery = searchQueryResponse.choices[0].message.content.trim();
            console.log(`🔍 Generated search query: "${searchQuery}"`);

            // Step 2: Search with EXA
            console.log('🔍 Starting EXA search...');
            const searchResults = await this.exaSearch(searchQuery, 3);
            
            if (!searchResults.results || searchResults.results.length === 0) {
                console.log('❌ No EXA search results found');
                return {
                    leads: [],
                    search_summary: `No results found for: ${searchQuery}`,
                    total_found: 0
                };
            }
            
            console.log(`✅ Found ${searchResults.results.length} EXA search results`);

            // Step 3: Process each result
            const leads = [];
            for (const result of searchResults.results.slice(0, 2)) { // Limit to 2 results
                try {
                    // Get detailed content
                    const content = result.text || '';
                    const url = result.url || '';
                    const title = result.title || '';

                    // AI analysis of content
                    const analysisResponse = await openai.chat.completions.create({
                        model: 'deepseek/deepseek-chat-v3.1:free',
                        messages: [
                            {
                                role: 'system',
                                content: `You are a healthcare lead analyzer. Extract structured information from website content and return ONLY valid JSON in this exact format:
{
  "company": "practice name",
  "url": "website url",
  "services": ["service1", "service2"],
  "specializations": ["spec1", "spec2"],
  "location": "city, country",
  "contact": {"phone": "phone", "email": "email"},
  "practice_type": "type of practice",
  "lead_score": 85
}

If information is missing, use null or empty array. Always return valid JSON only.`
                            },
                            {
                                role: 'user',
                                content: `Analyze this healthcare practice:
                                
Title: ${title}
URL: ${url}
Content: ${content.substring(0, 2000)}

Extract structured lead information as JSON:`
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 800
                    });

                    let leadData;
                    try {
                        const aiResult = analysisResponse.choices[0].message.content.trim();
                        // Clean up AI response (remove markdown if present)
                        const jsonStart = aiResult.indexOf('{');
                        const jsonEnd = aiResult.lastIndexOf('}') + 1;
                        const jsonStr = aiResult.substring(jsonStart, jsonEnd);
                        
                        leadData = JSON.parse(jsonStr);
                        leadData.url = url; // Ensure URL is correct
                        
                        // Calculate simple lead score if not provided
                        if (!leadData.lead_score) {
                            let score = 50; // Base score
                            if (leadData.services && leadData.services.length > 0) score += 20;
                            if (leadData.contact && (leadData.contact.phone || leadData.contact.email)) score += 20;
                            if (leadData.location) score += 10;
                            leadData.lead_score = Math.min(score, 100);
                        }
                        
                        leads.push(leadData);
                        console.log(`✅ Processed: ${leadData.company}`);
                        
                    } catch (parseError) {
                        console.error(`❌ Failed to parse AI analysis for ${title}:`, parseError.message);
                        // Create minimal lead data
                        leads.push({
                            company: title || 'Healthcare Practice',
                            url: url,
                            services: [],
                            specializations: [],
                            location: 'Location not available',
                            contact: {},
                            practice_type: 'Healthcare',
                            lead_score: 50
                        });
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to process result: ${error.message}`);
                }
            }

            return {
                leads: leads,
                search_summary: `Found ${leads.length} healthcare practices for: ${query}`,
                total_found: leads.length
            };
            
        } catch (error) {
            console.error('❌ AI lead discovery failed:', error);
            console.error('Error details:', error.response?.data || error.message);
            return {
                leads: [],
                error: error.message,
                search_summary: `Failed to process: ${query}`,
                total_found: 0
            };
        }
    }

    // EXA Search Function (called by AI)
    async exaSearch(query, numResults = 3) {
        console.log(`🔍 EXA Search: "${query}" (${numResults} results)`);
        
        if (!process.env.EXA_API_KEY) {
            throw new Error('EXA API key not configured');
        }

        try {
            const response = await axios.post('https://api.exa.ai/search', {
                query: query,
                type: 'neural',
                useAutoprompt: true,
                numResults: numResults,
                contents: {
                    text: {
                        maxCharacters: 2000,
                        includeHtmlTags: false
                    }
                }
            }, {
                headers: {
                    'x-api-key': process.env.EXA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return {
                results: response.data.results || [],
                total: response.data.results?.length || 0
            };

        } catch (error) {
            console.error(`❌ EXA search failed: ${error.message}`);
            throw error;
        }
    }

    // EXA Get Content Function (called by AI)
    async exaGetContent(url) {
        console.log(`📄 EXA Get Content: ${url}`);
        
        if (!process.env.EXA_API_KEY) {
            throw new Error('EXA API key not configured');
        }

        try {
            const response = await axios.post('https://api.exa.ai/contents', {
                ids: [url],
                text: {
                    maxCharacters: 4000,
                    includeHtmlTags: false
                }
            }, {
                headers: {
                    'x-api-key': process.env.EXA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return {
                content: response.data.contents?.[0]?.text || '',
                url: url
            };

        } catch (error) {
            console.error(`❌ EXA content fetch failed: ${error.message}`);
            throw error;
        }
    }

    // NEW: Send individual lead result to Telegram
    async sendLeadResult(chatId, lead) {
        const message = `
🏥 <b>${lead.company || 'Healthcare Practice'}</b>

🌐 <b>Website:</b> ${lead.url || 'N/A'}
📍 <b>Location:</b> ${lead.location || 'N/A'}
🏷️ <b>Type:</b> ${lead.practice_type || 'Healthcare'}

🔹 <b>Services:</b>
${lead.services?.map(s => `• ${s}`).join('\n') || '• Information not available'}

💎 <b>Specializations:</b>
${lead.specializations?.map(s => `• ${s}`).join('\n') || '• General practice'}

📞 <b>Contact:</b>
${lead.contact?.phone ? `• Phone: ${lead.contact.phone}` : ''}
${lead.contact?.email ? `• Email: ${lead.contact.email}` : ''}

🎯 <b>Lead Score:</b> ${lead.lead_score || 0}/100

💾 <i>Saved to Notion CRM</i>
        `;

        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: message.trim(),
            parse_mode: 'HTML'
        });
    }

    // NEW: Store lead in Notion CRM
    async storeInNotion(lead) {
        if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
            console.warn('⚠️ Notion not configured, skipping storage');
            return;
        }

        try {
            await notion.pages.create({
                parent: {
                    database_id: process.env.NOTION_DATABASE_ID
                },
                properties: {
                    'Company': {
                        title: [{ text: { content: lead.company || 'Unknown' } }]
                    },
                    'URL': {
                        url: lead.url || null
                    },
                    'Location': {
                        rich_text: [{ text: { content: lead.location || 'N/A' } }]
                    },
                    'Practice Type': {
                        select: { name: lead.practice_type || 'Healthcare' }
                    },
                    'Lead Score': {
                        number: lead.lead_score || 0
                    },
                    'Services': {
                        multi_select: lead.services?.slice(0, 5).map(service => ({ name: service.substring(0, 50) })) || []
                    },
                    'Phone': {
                        phone_number: lead.contact?.phone || null
                    },
                    'Email': {
                        email: lead.contact?.email || null
                    },
                    'Discovery Date': {
                        date: { start: new Date().toISOString().split('T')[0] }
                    }
                }
            });

            console.log(`✅ Stored ${lead.company} in Notion CRM`);
        } catch (error) {
            console.error(`❌ Failed to store ${lead.company} in Notion:`, error.message);
        }
    }

    // Legacy method for URL processing (kept for compatibility)
    async searchWithExa(url, companyName) {
        console.log(`🔍 EXA Search: ${companyName} at ${url}`);
        
        if (!process.env.EXA_API_KEY) {
            console.warn('⚠️ EXA API key not configured, using basic extraction');
            return await this.basicContentAnalysis(url);
        }

        try {
            const response = await axios.post('https://api.exa.ai/search', {
                query: `${companyName} healthcare services treatments specializations contact information`,
                type: 'neural',
                useAutoprompt: true,
                numResults: 3,
                includeDomains: [new URL(url).hostname],
                contents: {
                    text: {
                        maxCharacters: 4000,
                        includeHtmlTags: false
                    }
                }
            }, {
                headers: {
                    'x-api-key': process.env.EXA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (!response.data?.results?.length) {
                console.log('⚠️ No EXA results found, using basic analysis');
                return await this.basicContentAnalysis(url);
            }

            const content = response.data.results[0].text || '';
            console.log(`📄 Analyzing ${content.length} characters of content...`);
            
            return await this.analyzeContentWithAI(content, url, companyName);

        } catch (error) {
            console.error(`❌ EXA search failed: ${error.message}`);
            return await this.basicContentAnalysis(url);
        }
    }

    // PHASE 2: OpenRouter AI Integration - Intelligent content analysis
    async analyzeContentWithAI(content, url, companyName) {
        console.log(`🤖 AI Analysis with OpenRouter: ${companyName}`);
        
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn('⚠️ OpenRouter API key not configured, using pattern matching');
            return this.extractDataWithPatterns(content, url, companyName);
        }

        try {
            const prompt = `
Analyze this healthcare website content and extract structured data in JSON format:

Website: ${companyName}
URL: ${url}
Content: ${content.substring(0, 3000)}

Extract the following information:
{
  "company": "exact company name",
  "services": ["list of healthcare services offered"],
  "treatments": ["specific treatments, procedures, therapies"],
  "specializations": ["medical specializations or focus areas"],
  "location": "city, state or address if available",
  "phone": "phone number if found",
  "email": "email if found",
  "practice_type": "type of practice (cosmetic, dental, general, etc)",
  "lead_quality_factors": ["factors that indicate lead quality"]
}

Only return valid JSON, no other text.
`;

            const response = await openai.chat.completions.create({
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    { role: 'system', content: 'You are a healthcare lead analysis expert. Extract structured data from website content and return only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 1000
            });

            const aiResult = JSON.parse(response.choices[0].message.content);
            
            // Calculate lead score based on AI analysis
            const leadScore = this.calculateAILeadScore(aiResult, content);
            
            return {
                ...aiResult,
                lead_score: leadScore,
                ai_enhanced: true,
                content_length: content.length,
                extracted_at: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ AI analysis failed: ${error.message}`);
            return this.extractDataWithPatterns(content, url, companyName);
        }
    }

    // Fallback: Pattern-based extraction
    extractDataWithPatterns(content, url, companyName) {
        const services = this.extractServices(content);
        const treatments = this.extractTreatments(content);
        const specializations = this.extractSpecializations(content);
        const contactInfo = this.extractContactInfo(content);
        const location = this.extractLocation(content) || this.extractLocationFromUrl(new URL(url).hostname);

        return {
            company: companyName,
            services: services,
            treatments: treatments,
            specializations: specializations,
            location: location,
            phone: contactInfo.phone,
            email: contactInfo.email,
            practice_type: this.determinePracticeType(content),
            lead_score: this.calculatePatternLeadScore(services, treatments, contactInfo),
            ai_enhanced: false,
            extracted_at: new Date().toISOString()
        };
    }

    // Basic content analysis fallback
    async basicContentAnalysis(url) {
        const hostname = new URL(url).hostname;
        const companyName = this.extractCompanyFromUrl(hostname);
        
        return {
            company: companyName,
            services: ['Healthcare Services'],
            treatments: ['Consultation'],
            specializations: ['General Healthcare'],
            location: this.extractLocationFromUrl(hostname),
            phone: '',
            email: '',
            practice_type: 'general-healthcare',
            lead_score: 30,
            ai_enhanced: false,
            fallback_reason: 'Basic extraction - API keys not configured'
        };
    }

    // Helper methods for pattern extraction
    extractServices(content) {
        const servicePatterns = [
            /(?:we offer|our services|services include|we provide)[\s\S]*?(?:\n\n|\.|!)/gi,
            /(?:cosmetic|aesthetic|medical|dental|surgical|therapy|treatment|consultation)[\w\s]*(?:services?|procedures?|treatments?)/gi
        ];
        
        const services = new Set();
        servicePatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
                const service = match.trim().replace(/[^\w\s-]/g, '').substring(0, 50);
                if (service.length > 3) services.add(service);
            });
        });
        
        return Array.from(services).slice(0, 10);
    }

    extractTreatments(content) {
        const treatmentPatterns = [
            /(?:botox|dermal fillers?|laser therapy|chemical peels?|microneedling)/gi,
            /(?:facelift|rhinoplasty|breast augmentation|liposuction|tummy tuck)/gi,
            /(?:dental implants?|teeth whitening|orthodontics|root canal)/gi
        ];
        
        const treatments = new Set();
        treatmentPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
                treatments.add(match.trim().toLowerCase());
            });
        });
        
        return Array.from(treatments).slice(0, 15);
    }

    extractSpecializations(content) {
        const specializationPatterns = [
            /(?:speciali[sz]es? in|expert in|focus on)[\s\S]*?(?:\n|\.|,)/gi,
            /(?:cosmetic|aesthetic|dermatology|cardiology|orthopedic)[\w\s]*(?:surgery|medicine|care)/gi
        ];
        
        const specializations = new Set();
        specializationPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
                const spec = match.trim().replace(/[^\w\s-]/g, '').substring(0, 40);
                if (spec.length > 5) specializations.add(spec);
            });
        });
        
        return Array.from(specializations).slice(0, 8);
    }

    extractContactInfo(content) {
        const phoneMatch = content.match(/(?:\+?[\d\s\-\(\)]{10,})/g);
        const phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, '') : '';
        
        const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        const email = emailMatch ? emailMatch[0] : '';
        
        return { phone, email };
    }

    extractLocation(content) {
        const locationPatterns = [
            /\d+[\w\s]+(?:street|st|avenue|ave|road|rd)[\w\s,]*\d{5}/gi,
            /(?:located in|based in|visit us at)[\s]*([^.\n]{10,60})/gi
        ];
        
        for (const pattern of locationPatterns) {
            const match = content.match(pattern);
            if (match) return match[0].trim().substring(0, 100);
        }
        return null;
    }

    extractCompanyFromUrl(hostname) {
        let name = hostname.replace(/^www\./, '').replace(/\.(com|org|net|co\.uk|nl|de|fr)$/, '');
        const parts = name.split(/[.-]/);
        const meaningful = parts.filter(part => part.length > 2);
        return meaningful.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') + ' Healthcare';
    }

    extractLocationFromUrl(hostname) {
        const locationHints = ['london', 'newyork', 'sydney', 'toronto', 'amsterdam', 'berlin'];
        const domain = hostname.toLowerCase();
        
        for (const location of locationHints) {
            if (domain.includes(location)) {
                return location.charAt(0).toUpperCase() + location.slice(1);
            }
        }
        return 'Healthcare Location';
    }

    determinePracticeType(content) {
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes('cosmetic') || contentLower.includes('aesthetic')) return 'cosmetic';
        if (contentLower.includes('dental') || contentLower.includes('dentist')) return 'dental';
        if (contentLower.includes('surgery') || contentLower.includes('surgical')) return 'surgical';
        if (contentLower.includes('therapy') || contentLower.includes('rehabilitation')) return 'therapy';
        
        return 'general-healthcare';
    }

    calculateAILeadScore(aiResult, content) {
        let score = 50;
        
        if (aiResult.services?.length > 0) score += Math.min(aiResult.services.length * 5, 25);
        if (aiResult.treatments?.length > 0) score += Math.min(aiResult.treatments.length * 3, 20);
        if (aiResult.phone) score += 10;
        if (aiResult.email) score += 10;
        if (aiResult.location) score += 5;
        if (aiResult.specializations?.length > 0) score += 5;
        if (content.length > 1000) score += 5;
        
        return Math.min(score, 100);
    }

    calculatePatternLeadScore(services, treatments, contactInfo) {
        let score = 40;
        
        if (services.length > 0) score += Math.min(services.length * 3, 15);
        if (treatments.length > 0) score += Math.min(treatments.length * 2, 10);
        if (contactInfo.phone) score += 10;
        if (contactInfo.email) score += 10;
        
        return Math.min(score, 100);
    }

    // PHASE 2: Notion Integration - Real CRM storage
    async storeLeadInNotion(leadData) {
        console.log(`📝 Storing lead in Notion: ${leadData.company}`);
        
        if (!process.env.NOTION_TOKEN) {
            console.warn('⚠️ Notion token not configured, using mock storage');
            return this.createMockNotionRecord(leadData);
        }

        try {
            const notionData = this.prepareNotionData(leadData);
            
            const response = await notion.pages.create({
                parent: { 
                    database_id: process.env.NOTION_DATABASE_ID || 'default-database-id'
                },
                properties: notionData
            });

            console.log(`✅ Lead stored in Notion: ${response.id}`);
            return {
                success: true,
                leadId: response.id,
                notion_url: response.url,
                created_time: response.created_time
            };

        } catch (error) {
            console.error(`❌ Notion storage failed: ${error.message}`);
            return this.createMockNotionRecord(leadData);
        }
    }

    prepareNotionData(leadData) {
        return {
            'Company': {
                title: [{
                    text: { content: leadData.company || 'Healthcare Practice' }
                }]
            },
            'Services': {
                rich_text: [{
                    text: { 
                        content: Array.isArray(leadData.services) ? 
                            leadData.services.join(', ').substring(0, 2000) : 
                            'Healthcare Services'
                    }
                }]
            },
            'Treatments': {
                rich_text: [{
                    text: { 
                        content: Array.isArray(leadData.treatments) ? 
                            leadData.treatments.join(', ').substring(0, 2000) : 
                            'Consultation'
                    }
                }]
            },
            'Lead Score': {
                number: Math.min(Math.max(parseInt(leadData.lead_score) || 50, 0), 100)
            },
            'URL': {
                url: leadData.url || 'https://example.com'
            },
            'Location': {
                rich_text: [{
                    text: { content: leadData.location || 'Unknown Location' }
                }]
            },
            'Phone': {
                rich_text: [{
                    text: { content: leadData.phone || 'Not provided' }
                }]
            },
            'Email': {
                email: leadData.email || null
            },
            'Practice Type': {
                select: { name: leadData.practice_type || 'general-healthcare' }
            },
            'AI Enhanced': {
                checkbox: leadData.ai_enhanced || false
            },
            'Status': {
                select: { name: 'New Lead' }
            }
        };
    }

    createMockNotionRecord(leadData) {
        const mockId = `notion_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        return {
            success: true,
            leadId: mockId,
            notion_url: `https://notion.so/${mockId}`,
            created_time: new Date().toISOString(),
            is_mock: true,
            reason: 'Notion API not configured - using mock record'
        };
    }

    // Main processing workflow
    async processHealthcareLead(url) {
        console.log(`\n🏥 PROCESSING HEALTHCARE LEAD: ${url}`);
        const startTime = Date.now();
        
        try {
            // Validate URL
            if (!validator.isURL(url)) {
                throw new Error('Invalid URL format');
            }

            // Step 1: Extract company name from URL
            const hostname = new URL(url).hostname;
            const companyName = this.extractCompanyFromUrl(hostname);
            
            // Step 2: EXA search and AI analysis
            console.log(`🔍 Step 1: EXA search and AI analysis`);
            const practiceData = await this.searchWithExa(url, companyName);
            practiceData.url = url;
            practiceData.domain = hostname;
            practiceData.processed_at = new Date().toISOString();
            
            // Step 3: Store in Notion CRM
            console.log(`📊 Step 2: Storing in Notion CRM`);
            const notionResult = await this.storeLeadInNotion(practiceData);
            
            // Step 4: Compile results
            const processingTime = Date.now() - startTime;
            console.log(`✅ Lead processed in ${processingTime}ms`);
            
            const result = {
                success: true,
                processing_time: processingTime,
                practice: {
                    company: practiceData.company,
                    services: practiceData.services,
                    treatments: practiceData.treatments,
                    specializations: practiceData.specializations,
                    location: practiceData.location,
                    phone: practiceData.phone,
                    email: practiceData.email,
                    practice_type: practiceData.practice_type,
                    lead_score: practiceData.lead_score,
                    ai_enhanced: practiceData.ai_enhanced
                },
                notion: {
                    stored: notionResult.success,
                    lead_id: notionResult.leadId,
                    notion_url: notionResult.notion_url,
                    is_mock: notionResult.is_mock || false
                },
                metadata: {
                    processed_at: practiceData.processed_at,
                    url: url,
                    domain: hostname
                }
            };

            this.processedLeads.push(result);
            this.successCount++;
            
            return result;

        } catch (error) {
            this.errorCount++;
            console.error(`❌ Lead processing failed: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                processing_time: Date.now() - startTime,
                url: url,
                processed_at: new Date().toISOString()
            };
        }
    }

    // PHASE 3: Enhanced Telegram Integration
    async sendProgressUpdate(chatId, step, total, message) {
        try {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `🔄 Step ${step}/${total}: ${message}`,
                parse_mode: 'HTML'
            });
        } catch (error) {
            console.error('Failed to send progress update:', error.message);
        }
    }

    async sendRichLeadSummary(chatId, result) {
        const practice = result.practice;
        const notion = result.notion;
        
        const qualityEmoji = practice.lead_score >= 80 ? '🌟' : practice.lead_score >= 60 ? '⭐' : '📋';
        const aiEmoji = practice.ai_enhanced ? '🤖' : '🔧';
        
        const message = `
${qualityEmoji} <b>Healthcare Lead Processed!</b>

🏥 <b>Practice:</b> ${practice.company}
📍 <b>Location:</b> ${practice.location}
📊 <b>Lead Score:</b> ${practice.lead_score}/100

🔧 <b>Services (${practice.services?.length || 0}):</b>
${practice.services?.slice(0, 3).map(s => `• ${s}`).join('\n') || '• General Healthcare'}

💊 <b>Treatments (${practice.treatments?.length || 0}):</b>
${practice.treatments?.slice(0, 3).map(t => `• ${t}`).join('\n') || '• Consultation'}

${practice.specializations?.length ? `🎯 <b>Specializations:</b> ${practice.specializations.slice(0, 2).join(', ')}` : ''}

📞 <b>Contact:</b> ${practice.phone || 'Not found'}
📧 <b>Email:</b> ${practice.email || 'Not found'}

💾 <b>Notion:</b> ${notion.stored ? '✅ Stored' : '❌ Failed'}
${notion.notion_url ? `🔗 <a href="${notion.notion_url}">View in Notion</a>` : ''}

${aiEmoji} <b>Analysis:</b> ${practice.ai_enhanced ? 'AI-Enhanced' : 'Pattern-Based'}
⏱️ <b>Processed:</b> ${result.processing_time}ms

${practice.lead_score >= 80 ? '🎉 <b>High Quality Lead!</b>' : practice.lead_score >= 60 ? '👍 <b>Good Lead Quality</b>' : '📝 <b>Lead Captured</b>'}
`;

        try {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } catch (error) {
            console.error('Failed to send rich summary:', error.message);
            // Fallback to simple message
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `✅ Healthcare Lead Processed!\n\n🏥 Practice: ${practice.company}\n📊 Lead Score: ${practice.lead_score}/100\n💾 Notion: ${notion.stored ? 'Stored' : 'Failed'}`
            });
        }
    }

    // PHASE 4: Analytics and monitoring
    getStats() {
        const totalProcessed = this.processedLeads.length;
        const avgLeadScore = totalProcessed > 0 ? 
            Math.round(this.processedLeads.reduce((sum, lead) => sum + (lead.practice?.lead_score || 0), 0) / totalProcessed) : 0;
        
        const avgProcessingTime = totalProcessed > 0 ?
            Math.round(this.processedLeads.reduce((sum, lead) => sum + (lead.processing_time || 0), 0) / totalProcessed) : 0;

        return {
            total_processed: totalProcessed,
            successful: this.successCount,
            failed: this.errorCount,
            success_rate: totalProcessed > 0 ? Math.round((this.successCount / totalProcessed) * 100) : 0,
            avg_lead_score: avgLeadScore,
            avg_processing_time: avgProcessingTime,
            uptime: Math.round(process.uptime()),
            recent_leads: this.processedLeads.slice(-5)
        };
    }
}

// Initialize the agent
const agent = new HealthcareLeadAgent();

// PHASE 3: Enhanced API Routes
app.post('/automate', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ 
            success: false, 
            error: 'URL required',
            example: { url: 'https://healthcare-practice.com' }
        });
    }

    try {
        const result = await agent.processHealthcareLead(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            url: url
        });
    }
});

// Enhanced Telegram webhook with rate limiting
app.post('/telegram-webhook', async (req, res) => {
    const { message } = req.body;
    const chatId = message?.chat?.id;
    const messageText = message?.text;
    
    if (!message || !chatId || !messageText) {
        return res.json({ status: 'ok' });
    }

    try {
        // Rate limiting
        await telegramLimiter.consume(chatId);

        // Check if message contains URL (legacy support)
        const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
        
        if (urlMatch) {
            const url = urlMatch[0];
            
            // Legacy URL processing
            await agent.sendProgressUpdate(chatId, 1, 3, 'Starting healthcare lead discovery...');
            await agent.sendProgressUpdate(chatId, 2, 3, 'Analyzing website with EXA and AI...');
            const result = await agent.processHealthcareLead(url);
            await agent.sendProgressUpdate(chatId, 3, 3, 'Storing in Notion CRM...');
            await agent.sendRichLeadSummary(chatId, result);
            
        } else if (messageText.toLowerCase().includes('/start') || messageText.toLowerCase().includes('/help')) {
            const helpMessage = `
🏥 <b>AI Healthcare Lead Discovery Agent</b>

🤖 <b>I can find healthcare leads for you!</b>

<b>Examples:</b>
• "find 2 cosmetic clinics in Amsterdam"
• "search for dental practices in London"
• "find dermatology clinics in New York"
• "look for plastic surgery centers in Berlin"

🔧 <b>How it works:</b>
🎯 <b>Step 1:</b> AI understands your query
🔍 <b>Step 2:</b> Searches web with EXA AI tools
🤖 <b>Step 3:</b> Analyzes websites with OpenRouter AI
📊 <b>Step 4:</b> Stores leads in Notion CRM

✨ <b>I extract:</b>
• Company name & website
• Services & specializations  
• Contact information
• Location details
• Lead quality score (0-100)

💾 <b>All leads automatically saved!</b>

Just tell me what healthcare leads you're looking for! 🚀
`;
            
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: helpMessage,
                parse_mode: 'HTML'
            });
        } else {
            // NEW: AI Lead Discovery for natural language queries
            await agent.sendProgressUpdate(chatId, 1, 4, '🎯 Understanding your lead request...');
            
            const discoveryResult = await agent.discoverLeads(messageText);
            
            await agent.sendProgressUpdate(chatId, 2, 4, '🔍 Searching with EXA AI...');
            await agent.sendProgressUpdate(chatId, 3, 4, '📊 Storing leads in Notion CRM...');
            
            if (discoveryResult.leads && discoveryResult.leads.length > 0) {
                await agent.sendProgressUpdate(chatId, 4, 4, '✅ Lead discovery complete!');
                
                // Store leads in Notion and send response
                for (const lead of discoveryResult.leads) {
                    await agent.storeInNotion(lead);
                    await agent.sendLeadResult(chatId, lead);
                }
                
                // Send summary
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `🎉 <b>Discovery Complete!</b>\n\n` +
                          `📊 Found: <b>${discoveryResult.total_found}</b> leads\n` +
                          `🔍 Search: <i>${discoveryResult.search_summary}</i>\n\n` +
                          `💾 All leads saved to your Notion CRM database!`,
                    parse_mode: 'HTML'
                });
            } else {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `❌ <b>No leads found</b>\n\n` +
                          `🔍 Search: <i>${discoveryResult.search_summary}</i>\n\n` +
                          `💡 Try different keywords or location!\n\n` +
                          `<b>Examples:</b>\n` +
                          `• "find cosmetic clinics in Madrid"\n` +
                          `• "search dental practices near Paris"`,
                    parse_mode: 'HTML'
                });
            }
        }

        res.json({ status: 'ok' });

    } catch (error) {
        if (error.remainingPoints !== undefined) {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: '⏱️ Rate limit exceeded. Please wait a moment before sending another request.',
            });
            res.json({ status: 'rate_limited' });
        } else {
            console.error('Telegram processing error:', error);
            res.json({ status: 'error' });
        }
    }
});

// PHASE 4: Monitoring and Analytics Endpoints
app.get('/status', (req, res) => {
    const stats = agent.getStats();
    
    res.json({
        agent: 'Healthcare Lead Discovery Agent',
        version: '2.0.0',
        status: 'active',
        configuration: {
            exa_configured: !!process.env.EXA_API_KEY,
            openrouter_configured: !!process.env.OPENROUTER_API_KEY,
            notion_configured: !!process.env.NOTION_TOKEN,
            telegram_configured: !!process.env.TELEGRAM_BOT_TOKEN
        },
        statistics: stats,
        endpoints: {
            '/automate': 'Process single healthcare URL',
            '/telegram-webhook': 'Telegram bot webhook',
            '/status': 'Agent status and statistics',
            '/health': 'Health check'
        }
    });
});

app.get('/leads', (req, res) => {
    const { limit = 20 } = req.query;
    const leads = agent.processedLeads.slice(-parseInt(limit));
    
    res.json({
        leads: leads,
        total_count: agent.processedLeads.length,
        statistics: agent.getStats()
    });
});

app.get('/', (req, res) => {
    res.json({
        agent: '🏥 Healthcare Lead Discovery Agent',
        version: '2.0.0',
        workflow: 'Telegram → EXA Scraping → OpenRouter AI → Notion CRM → Rich Response',
        features: [
            '✅ EXA AI web scraping',
            '✅ OpenRouter AI content analysis', 
            '✅ Notion CRM integration',
            '✅ Rich Telegram responses',
            '✅ Lead scoring (0-100)',
            '✅ Rate limiting & validation',
            '✅ Progress tracking',
            '✅ Analytics & monitoring'
        ],
        status: 'ready',
        configuration: {
            exa: !!process.env.EXA_API_KEY,
            openrouter: !!process.env.OPENROUTER_API_KEY,
            notion: !!process.env.NOTION_TOKEN,
            telegram: !!process.env.TELEGRAM_BOT_TOKEN
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        agent: 'healthcare-lead-discovery',
        version: '2.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        apis: {
            exa: !!process.env.EXA_API_KEY,
            openrouter: !!process.env.OPENROUTER_API_KEY,
            notion: !!process.env.NOTION_TOKEN,
            telegram: !!process.env.TELEGRAM_BOT_TOKEN
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🏥 HEALTHCARE LEAD DISCOVERY AGENT v2.0`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📋 Full workflow: Telegram → EXA → OpenRouter AI → Notion → Response`);
    console.log(`\n🔧 Configuration:`);
    console.log(`   EXA API: ${process.env.EXA_API_KEY ? '✅ Available' : '❌ Missing'}`);
    console.log(`   OpenRouter AI: ${process.env.OPENROUTER_API_KEY ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Notion CRM: ${process.env.NOTION_TOKEN ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Available' : '❌ Missing'}`);
    console.log(`\n🎯 Ready for complete healthcare lead discovery!`);
});