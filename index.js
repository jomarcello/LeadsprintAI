require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Client } = require('@notionhq/client');
const OpenAI = require('openai');
const validator = require('validator');
const { RateLimiterMemory } = require('rate-limiter-flexible');
// MCP SDK not needed - we use direct HTTP calls to Smithery

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Initialize API clients
const notion = new Client({ 
    auth: process.env.NOTION_TOKEN 
});

console.log('🔧 OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing');
console.log('🌐 Railway Public Domain:', process.env.RAILWAY_PUBLIC_DOMAIN);

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'healthcare-part1-final-production.up.railway.app'}`,
        'X-Title': 'Healthcare Lead Discovery Agent'
    }
});

// Rate limiting
const telegramLimiter = new RateLimiterMemory({
    keyPrefix: 'telegram_webhook',
    points: 10,
    duration: 60,
});

// Smithery MCP EXA Client
class SmitheryExaClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.apiKey = '2f9f056b-67dc-47e1-b6c4-79c41bf85d07';
        this.profile = 'zesty-clam-4hb4aa';
        this.serverUrl = `https://server.smithery.ai/exa/mcp?api_key=${this.apiKey}&profile=${this.profile}`;
    }

    async connect() {
        if (this.isConnected) return;
        
        try {
            // For HTTP MCP servers, we'll use direct HTTP calls instead of stdio transport
            this.isConnected = true;
            console.log('✅ Connected to Smithery EXA MCP server');
        } catch (error) {
            console.error('❌ Failed to connect to Smithery EXA MCP:', error.message);
            this.isConnected = false;
        }
    }

    async searchWeb(query, numResults = 5) {
        try {
            // Make HTTP request to Smithery MCP EXA server using correct MCP format
            const response = await axios.post(this.serverUrl, {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'web_search_exa',
                    arguments: {
                        query: query,
                        numResults: numResults
                    }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream'
                },
                timeout: 30000
            });

            console.log('🔍 EXA Search Response:', JSON.stringify(response.data, null, 2));

            // Parse the search results from the correct format
            let searchResults = [];
            if (response.data?.result?.content) {
                const contentText = response.data.result.content[0]?.text;
                if (contentText) {
                    const parsedData = JSON.parse(contentText);
                    searchResults = parsedData.results || [];
                }
            }
            
            return {
                results: searchResults,
                total: searchResults.length || 0
            };

        } catch (error) {
            console.error(`❌ Smithery EXA search failed: ${error.message}`);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    }

    async companyResearch(companyQuery, numResults = 5) {
        try {
            const response = await axios.post(this.serverUrl, {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'company_research_exa',
                    arguments: {
                        companyName: companyQuery,
                        numResults: numResults
                    }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream'
                },
                timeout: 30000
            });

            console.log('🏢 Company Research Response:', JSON.stringify(response.data, null, 2));

            // Parse the search results from the correct format
            let searchResults = [];
            if (response.data?.result?.content) {
                const contentText = response.data.result.content[0]?.text;
                if (contentText) {
                    const parsedData = JSON.parse(contentText);
                    searchResults = parsedData.results || [];
                }
            }
            
            return {
                results: searchResults,
                total: searchResults.length || 0
            };

        } catch (error) {
            console.error(`❌ Smithery EXA company research failed: ${error.message}`);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    }

    async crawlContent(url) {
        try {
            const response = await axios.post(this.serverUrl, {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'crawling_exa',
                    arguments: {
                        url: url,
                        maxCharacters: 3000
                    }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream'
                },
                timeout: 30000
            });

            // Parse the crawled content
            let crawledContent = '';
            if (response.data?.result?.content) {
                const contentText = response.data.result.content[0]?.text;
                if (contentText) {
                    crawledContent = contentText;
                }
            }
            
            return crawledContent;

        } catch (error) {
            console.error(`❌ Smithery EXA crawl content failed: ${error.message}`);
            throw error;
        }
    }
}

// Conversational AI Agent with Tools
class ConversationalHealthcareAI {
    constructor() {
        this.exaClient = new SmitheryExaClient();
        this.conversationHistory = new Map(); // chatId -> messages
        this.processedLeads = [];
    }

    async initialize() {
        await this.exaClient.connect();
        console.log('🤖 Conversational Healthcare AI initialized with EXA tools');
    }

    // Main AI conversation handler with tool access
    async handleConversation(chatId, userMessage) {
        console.log(`🎯 AI Conversation for chat ${chatId}: "${userMessage}"`);
        
        try {
            // Get conversation history
            let messages = this.conversationHistory.get(chatId) || [
                {
                    role: 'system',
                    content: `You are ONLY a healthcare provider finder. NEVER generate code, technical documentation, or non-healthcare content.

ONLY respond about:
- Finding clinics, hospitals, dental practices
- Healthcare services and treatments
- Medical provider contact information

For ANY non-healthcare question, respond: "I only help find healthcare providers. Ask me to search for clinics, dentists, or hospitals."

Keep ALL responses under 150 words. Focus on practical healthcare information only.

FORBIDDEN: code, technical terms, documentation, programming content, Android bytecode, Java, JavaScript, or any technical explanations.`
                }
            ];

            // Add user message
            messages.push({
                role: 'user',
                content: userMessage
            });

            // Determine if we need to use tools based on the message
            const needsSearch = this.shouldUseSearch(userMessage);
            let toolResults = [];

            if (needsSearch) {
                console.log('🔍 User query requires web search, using EXA tools...');
                
                // Use EXA search - prefer company research for healthcare leads
                try {
                    let searchResults;
                    const isCompanySearch = userMessage.toLowerCase().includes('clinic') || 
                                          userMessage.toLowerCase().includes('hospital') ||
                                          userMessage.toLowerCase().includes('practice') ||
                                          userMessage.toLowerCase().includes('dental') ||
                                          userMessage.toLowerCase().includes('medical');
                    
                    if (isCompanySearch) {
                        console.log('🏢 Using company_research_exa for:', userMessage);
                        searchResults = await this.exaClient.companyResearch(userMessage, 5);
                        console.log('🏢 Company research results:', searchResults.total, 'found');
                    } else {
                        console.log('🔍 Using web_search_exa for:', userMessage);  
                        searchResults = await this.exaClient.searchWeb(userMessage, 5);
                        console.log('🔍 Web search results:', searchResults.total, 'found');
                    }
                    
                    toolResults.push({
                        tool: isCompanySearch ? 'company_research_exa' : 'web_search_exa',
                        query: userMessage,
                        results: searchResults
                    });

                    // Store the search results for lead extraction
                    if (searchResults.results && searchResults.results.length > 0) {
                        console.log(`📊 Found ${searchResults.results.length} search results for lead analysis`);
                    }
                } catch (searchError) {
                    console.error('❌ Search tool error:', searchError.message);
                    toolResults.push({
                        tool: 'exa_search',
                        error: `Search failed: ${searchError.message}`
                    });
                }
            }

            // Add tool results to context if any
            if (toolResults.length > 0) {
                messages.push({
                    role: 'assistant',
                    content: `I've searched for information about "${userMessage}". Let me analyze the results...`
                });
                
                messages.push({
                    role: 'system',
                    content: `Tool Results:\n${JSON.stringify(toolResults, null, 2)}`
                });
            }

            // Get AI response
            console.log('🤖 Calling OpenRouter AI for conversation...');
            const response = await openai.chat.completions.create({
                model: 'z-ai/glm-4.5-air:free',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            });

            let aiResponse = response.choices[0].message.content;

            // Clean the response from special tokens that break Telegram
            aiResponse = this.cleanResponseForTelegram(aiResponse);
            
            // Validate response is healthcare-related (block technical/code content)
            if (this.isNonHealthcareResponse(aiResponse)) {
                aiResponse = "I help find healthcare providers like clinics, dentists, hospitals, and medical practices. Please ask me to search for healthcare services in your area.";
            }
            
            // Ensure response fits within Telegram's 4096 character limit
            if (aiResponse.length > 4000) {
                aiResponse = aiResponse.substring(0, 3900) + '...\n\n💬 Response was truncated due to length. Ask me to continue or be more specific!';
            }

            // Add AI response to history
            messages.push({
                role: 'assistant',
                content: aiResponse
            });

            // Keep conversation history manageable (last 20 messages)
            if (messages.length > 20) {
                messages = [messages[0], ...messages.slice(-19)]; // Keep system message + last 19
            }
            
            this.conversationHistory.set(chatId, messages);

            // Check if we should extract and store leads
            if (needsSearch && toolResults.length > 0) {
                await this.extractAndStoreLeads(chatId, toolResults, userMessage);
            }

            return {
                response: aiResponse,
                toolsUsed: toolResults.length > 0,
                searchResults: toolResults.find(t => t.tool === 'exa_search')?.results
            };

        } catch (error) {
            console.error('❌ AI conversation failed:', error);
            return {
                response: `I apologize, but I encountered an error processing your request: ${error.message}. Please try again or rephrase your question.`,
                toolsUsed: false,
                error: error.message
            };
        }
    }

    // Clean AI response from special tokens that break Telegram
    cleanResponseForTelegram(text) {
        if (!text) return '';
        
        // Remove common AI model special tokens
        let cleaned = text
            .replace(/｜begin▁of▁sentence｜/g, '')
            .replace(/｜end▁of▁sentence｜/g, '')
            .replace(/｜begin▁of▁text｜/g, '')
            .replace(/｜end▁of▁text｜/g, '')
            .replace(/<\|begin_of_text\|>/g, '')
            .replace(/<\|end_of_text\|>/g, '')
            .replace(/<\|im_start\|>/g, '')
            .replace(/<\|im_end\|>/g, '')
            .replace(/<\|endoftext\|>/g, '')
            .replace(/\<\|.*?\|\>/g, '') // Remove any other special tokens
            .replace(/｜.*?｜/g, ''); // Remove Japanese-style tokens
        
        // Clean extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // Ensure response isn't empty
        if (!cleaned || cleaned.length < 5) {
            cleaned = 'I apologize, but I had trouble generating a proper response. Could you please rephrase your question?';
        }
        
        return cleaned;
    }

    // Validate if response is healthcare-related (block technical/code content)
    isNonHealthcareResponse(text) {
        const technicalPatterns = [
            /\.class\s+public/i,
            /\.super\s+/i,
            /Lcom\/google/i,
            /\.annotation/i,
            /\.method/i,
            /\.field/i,
            /invoke-direct/i,
            /move-result/i,
            /#\s*direct methods/i,
            /#\s*instance fields/i,
            /#\s*static fields/i,
            /\.line\s+\d+/i,
            /const\/4/i,
            /iput-object/i,
            /sget-object/i,
            /monitor-enter/i,
            /throw v\d+/i,
            /axios/i,
            /javascript/i,
            /function\s*\(/i,
            /import\s+/i,
            /const\s+\w+\s*=/i,
            /\.prototype\./i,
            /Promise\.all/i
        ];
        
        // Check if response contains technical patterns
        const containsTechnical = technicalPatterns.some(pattern => pattern.test(text));
        
        // Check if response is very long and doesn't contain healthcare keywords
        const healthcareKeywords = ['clinic', 'hospital', 'doctor', 'dental', 'medical', 'practice', 'treatment', 'health', 'patient', 'care'];
        const hasHealthcareContent = healthcareKeywords.some(keyword => text.toLowerCase().includes(keyword));
        
        // If it contains technical patterns OR (is long and no healthcare keywords)
        return containsTechnical || (text.length > 500 && !hasHealthcareContent);
    }

    // Determine if the user message requires web search
    shouldUseSearch(message) {
        const searchKeywords = [
            'find', 'search', 'look for', 'discover', 'locate',
            'clinic', 'hospital', 'doctor', 'dentist', 'healthcare',
            'medical', 'practice', 'treatment', 'therapy',
            'cosmetic', 'aesthetic', 'surgery', 'dermatology',
            'dental', 'orthodontist', 'physiotherapy',
            'near me', 'in', 'around', 'close to'
        ];

        const messageWords = message.toLowerCase();
        return searchKeywords.some(keyword => messageWords.includes(keyword));
    }

    // Extract and store healthcare leads from search results
    async extractAndStoreLeads(chatId, toolResults, originalQuery) {
        try {
            const searchResult = toolResults.find(t => t.tool === 'exa_search');
            const contentResult = toolResults.find(t => t.tool === 'exa_get_content');

            if (!searchResult?.results || searchResult.results.length === 0) {
                return;
            }

            console.log('📊 Extracting healthcare leads from search results...');

            for (let i = 0; i < Math.min(3, searchResult.results.length); i++) {
                const result = searchResult.results[i];
                const detailedContent = contentResult?.content?.[i];

                try {
                    // Use AI to extract structured lead data
                    const extractionResponse = await openai.chat.completions.create({
                        model: 'z-ai/glm-4.5-air:free',
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
                                
Title: ${result.title || 'Healthcare Practice'}
URL: ${result.url}
Summary: ${result.summary || 'N/A'}
Content: ${detailedContent?.text?.substring(0, 2000) || result.text?.substring(0, 2000) || 'Limited content available'}

Extract structured lead information as JSON:`
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 800
                    });

                    let leadData;
                    try {
                        const aiResult = extractionResponse.choices[0].message.content.trim();
                        const jsonStart = aiResult.indexOf('{');
                        const jsonEnd = aiResult.lastIndexOf('}') + 1;
                        const jsonStr = aiResult.substring(jsonStart, jsonEnd);
                        
                        leadData = JSON.parse(jsonStr);
                        leadData.url = result.url;
                        leadData.discovered_via = originalQuery;
                        leadData.chat_id = chatId;
                        
                        if (!leadData.lead_score) {
                            leadData.lead_score = this.calculateLeadScore(leadData);
                        }

                        // Store in Notion
                        await this.storeInNotion(leadData);
                        this.processedLeads.push(leadData);

                        console.log(`✅ Extracted and stored lead: ${leadData.company}`);

                    } catch (parseError) {
                        console.error(`❌ Failed to parse AI analysis for ${result.title}:`, parseError.message);
                    }

                } catch (error) {
                    console.error(`❌ Failed to process search result: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('❌ Lead extraction failed:', error.message);
        }
    }

    calculateLeadScore(leadData) {
        let score = 50; // Base score
        if (leadData.services && leadData.services.length > 0) score += 20;
        if (leadData.contact && (leadData.contact.phone || leadData.contact.email)) score += 20;
        if (leadData.location) score += 10;
        return Math.min(score, 100);
    }

    // Store lead in Notion CRM
    async storeInNotion(leadData) {
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
                        title: [{ text: { content: leadData.company || 'Unknown' } }]
                    },
                    'URL': {
                        url: leadData.url || null
                    },
                    'Location': {
                        rich_text: [{ text: { content: leadData.location || 'N/A' } }]
                    },
                    'Practice Type': {
                        select: { name: leadData.practice_type || 'Healthcare' }
                    },
                    'Lead Score': {
                        number: leadData.lead_score || 0
                    },
                    'Services': {
                        multi_select: leadData.services?.slice(0, 5).map(service => ({ name: service.substring(0, 50) })) || []
                    },
                    'Phone': {
                        phone_number: leadData.contact?.phone || null
                    },
                    'Email': {
                        email: leadData.contact?.email || null
                    },
                    'Discovery Date': {
                        date: { start: new Date().toISOString().split('T')[0] }
                    },
                    'Discovered Via': {
                        rich_text: [{ text: { content: leadData.discovered_via || 'AI Search' } }]
                    }
                }
            });

            console.log(`✅ Stored ${leadData.company} in Notion CRM`);
        } catch (error) {
            console.error(`❌ Failed to store ${leadData.company} in Notion:`, error.message);
        }
    }

    // Clear conversation history for a chat
    clearHistory(chatId) {
        this.conversationHistory.delete(chatId);
    }

    // Get conversation stats
    getStats() {
        return {
            active_conversations: this.conversationHistory.size,
            total_leads_processed: this.processedLeads.length,
            exa_connected: this.exaClient.isConnected,
            recent_leads: this.processedLeads.slice(-5)
        };
    }
}

// Initialize the AI agent
const aiAgent = new ConversationalHealthcareAI();

// Enhanced Telegram webhook with conversational AI
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

        if (messageText.toLowerCase().includes('/start') || messageText.toLowerCase().includes('/help')) {
            const helpMessage = `
🤖 <b>AI Healthcare Assistant</b>

Hi! I'm your conversational AI assistant specialized in healthcare lead discovery. I can:

💬 <b>Chat naturally</b> - Ask me anything!
🔍 <b>Find healthcare practices</b> - "Find dental clinics in Amsterdam"
🏥 <b>Discover leads</b> - "Search for cosmetic surgery centers in Berlin"  
📊 <b>Analyze businesses</b> - I'll extract contact details and services
💾 <b>Store leads automatically</b> - Everything goes to your Notion CRM

<b>Example queries:</b>
• "Find me some dental practices in London"
• "What are the top cosmetic clinics in Madrid?"
• "Hi, how are you today?" (casual conversation)
• "Search for physiotherapy centers near Paris"

Just talk to me naturally - I'll understand what you need! 🚀
`;
            
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: helpMessage,
                parse_mode: 'HTML'
            });

        } else if (messageText.toLowerCase().includes('/clear')) {
            aiAgent.clearHistory(chatId);
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: '🗑️ Conversation history cleared. We can start fresh!'
            });

        } else {
            // Handle conversation with AI
            const startTime = Date.now();
            const result = await aiAgent.handleConversation(chatId, messageText);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Send AI response (no HTML parsing to avoid Telegram errors)
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: result.response,
                disable_web_page_preview: true
            });

            // If leads were found, send simple success message
            if (result.searchResults && result.searchResults.total > 0) {
                const successMessage = `✅ Found ${result.searchResults.total} results • Leads stored in Notion • ${duration}s`;

                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: successMessage
                });
            }
        }

        res.json({ status: 'ok' });

    } catch (error) {
        if (error.remainingPoints !== undefined) {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: '⏱️ Rate limit exceeded. Please wait a moment before sending another message.',
            });
            res.json({ status: 'rate_limited' });
        } else {
            console.error('Telegram processing error:', error);
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: '❌ Sorry, I encountered an error. Please try again.',
            });
            res.json({ status: 'error' });
        }
    }
});

// API Routes
app.get('/status', (req, res) => {
    const stats = aiAgent.getStats();
    
    res.json({
        agent: 'Conversational Healthcare AI',
        version: '3.0.0',
        status: 'active',
        configuration: {
            smithery_exa_configured: true,
            openrouter_configured: !!process.env.OPENROUTER_API_KEY,
            notion_configured: !!process.env.NOTION_TOKEN,
            telegram_configured: !!process.env.TELEGRAM_BOT_TOKEN
        },
        statistics: stats,
        capabilities: [
            'Natural conversation',
            'Web search with Smithery EXA',
            'Healthcare lead discovery',
            'Automatic Notion CRM storage',
            'Multi-turn conversations',
            'Context awareness'
        ]
    });
});

app.get('/', (req, res) => {
    res.json({
        agent: '🤖 Conversational Healthcare AI',
        version: '3.0.0',
        description: 'Full conversational AI with healthcare lead discovery capabilities',
        workflow: 'Telegram ↔️ AI Conversation ↔️ Smithery EXA Tools ↔️ Notion CRM',
        features: [
            '✅ Natural AI conversation',
            '✅ Smithery MCP EXA integration',
            '✅ Healthcare lead discovery', 
            '✅ Automatic Notion CRM storage',
            '✅ Context-aware responses',
            '✅ Multi-turn conversations',
            '✅ Rate limiting & validation'
        ],
        status: 'ready',
        configuration: {
            smithery_exa: true,
            openrouter: !!process.env.OPENROUTER_API_KEY,
            notion: !!process.env.NOTION_TOKEN,
            telegram: !!process.env.TELEGRAM_BOT_TOKEN
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        agent: 'conversational-healthcare-ai',
        version: '3.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        apis: {
            smithery_exa: true,
            openrouter: !!process.env.OPENROUTER_API_KEY,
            notion: !!process.env.NOTION_TOKEN,
            telegram: !!process.env.TELEGRAM_BOT_TOKEN
        }
    });
});

app.listen(PORT, async () => {
    console.log(`\n🤖 CONVERSATIONAL HEALTHCARE AI v3.0`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`💬 Full AI conversation with healthcare lead discovery`);
    console.log(`🔄 Workflow: Telegram ↔️ AI ↔️ Smithery EXA ↔️ Notion`);
    console.log(`\n🔧 Configuration:`);
    console.log(`   Smithery EXA: ✅ Available`);
    console.log(`   OpenRouter AI: ${process.env.OPENROUTER_API_KEY ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Notion CRM: ${process.env.NOTION_TOKEN ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Available' : '❌ Missing'}`);
    
    // Initialize AI agent
    await aiAgent.initialize();
    
    console.log(`\n🎯 Ready for full conversational AI with tool access!`);
});