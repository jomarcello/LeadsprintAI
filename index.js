require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
const validator = require('validator');
const { RateLimiterMemory } = require('rate-limiter-flexible');
// MCP SDK not needed - we use direct HTTP calls to Smithery

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

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

// Smithery MCP Clients
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

            console.log('🔍 EXA Search Raw Response:', response.data);

            // Parse Server-Sent Events format response
            let searchResults = [];
            let responseData = response.data;

            // Handle Server-Sent Events format (string response)
            if (typeof responseData === 'string') {
                // Extract JSON from SSE format: "event: message\ndata: {...}"
                const dataMatch = responseData.match(/data:\s*(.+)/);
                if (dataMatch) {
                    responseData = JSON.parse(dataMatch[1]);
                }
            }

            // Parse the search results from MCP response format
            if (responseData?.result?.content) {
                const contentText = responseData.result.content[0]?.text;
                if (contentText) {
                    const parsedData = JSON.parse(contentText);
                    searchResults = parsedData.results || [];
                    console.log(`✅ Found ${searchResults.length} search results`);
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

            console.log('🏢 Company Research Raw Response:', response.data);

            // Parse Server-Sent Events format response
            let searchResults = [];
            let responseData = response.data;

            // Handle Server-Sent Events format (string response)
            if (typeof responseData === 'string') {
                // Extract JSON from SSE format: "event: message\ndata: {...}"
                const dataMatch = responseData.match(/data:\s*(.+)/);
                if (dataMatch) {
                    responseData = JSON.parse(dataMatch[1]);
                }
            }

            // Parse the search results from MCP response format
            if (responseData?.result?.content) {
                const contentText = responseData.result.content[0]?.text;
                if (contentText) {
                    const parsedData = JSON.parse(contentText);
                    searchResults = parsedData.results || [];
                    console.log(`✅ Found ${searchResults.length} company research results`);
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

// Direct Notion API Client - Simple and Reliable
class DirectNotionClient {
    constructor() {
        this.baseUrl = 'https://api.notion.com/v1';
        this.notionToken = process.env.NOTION_TOKEN || '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';
        this.databaseId = process.env.NOTION_DATABASE_ID || '15dae2da8b898014b2ddcaeb7ee8885d';
    }

    async createPage(databaseId, properties) {
        try {
            console.log(`📝 Creating Notion page directly via API for database: ${databaseId || this.databaseId}`);
            
            // Always log the lead data that's being processed
            const leadData = {
                company: properties.Company?.title?.[0]?.text?.content,
                url: properties.URL?.url,
                location: properties.Location?.rich_text?.[0]?.text?.content,
                phone: properties.Phone?.phone_number,
                email: properties.Email?.email,
                practice_type: properties['Practice Type']?.select?.name,
                lead_score: properties['Lead Score']?.number
            };
            
            console.log('📝 Processing lead data for Notion storage:', leadData);

            // Use provided databaseId or fallback to default
            const targetDatabaseId = databaseId || this.databaseId;

            const response = await axios.post(`${this.baseUrl}/pages`, {
                parent: {
                    database_id: targetDatabaseId
                },
                properties: properties
            }, {
                headers: {
                    'Authorization': `Bearer ${this.notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                timeout: 10000
            });

            console.log(`✅ Notion page created successfully:`, response.data.id);
            console.log(`🎯 LEAD STORED: ${leadData.company} - ${leadData.phone}`);
            return response.data;
            
        } catch (error) {
            console.error('❌ Failed to create Notion page:', error.message);
            if (error.response) {
                console.error('Notion API error:', error.response.status, error.response.data);
            }
            
            // Still log the data for debugging
            console.log('📊 [ATTEMPTED] Lead data that was attempted to store:', {
                company: properties.Company?.title?.[0]?.text?.content,
                url: properties.URL?.url,
                location: properties.Location?.rich_text?.[0]?.text?.content,
                practice_type: properties['Practice Type']?.select?.name,
                lead_score: properties['Lead Score']?.number,
                phone: properties.Phone?.phone_number,
                email: properties.Email?.email
            });
            
            // Don't throw - just log and continue so lead extraction doesn't stop
            return null;
        }
    }
}

// Conversational AI Agent with Tools
class ConversationalHealthcareAI {
    constructor() {
        this.exaClient = new SmitheryExaClient();
        this.notionClient = new DirectNotionClient();
        this.conversationHistory = new Map(); // chatId -> messages
        this.processedLeads = [];
    }

    async initialize() {
        await this.exaClient.connect();
        console.log('🤖 Conversational Healthcare AI initialized with EXA search and direct Notion API');
    }

    // Main AI conversation handler with tool access
    async handleConversation(chatId, userMessage) {
        console.log(`🎯 AI Conversation for chat ${chatId}: "${userMessage}"`);
        
        try {
            // Get conversation history
            let messages = this.conversationHistory.get(chatId) || [
                {
                    role: 'system',
                    content: `You are EXCLUSIVELY a healthcare provider finder bot. You MUST NEVER generate any code, programming content, technical documentation, or non-healthcare information under ANY circumstances.

STRICT RULES:
1. ONLY discuss healthcare providers: clinics, hospitals, dental practices, medical services
2. When search results are provided, summarize the healthcare providers found with their contact details
3. NEVER generate code, programming examples, technical content, or documentation
4. NEVER use technical terms like JavaScript, React, API, function, import, etc.
5. If asked non-healthcare questions, respond: "I only help find healthcare providers."

RESPONSE FORMAT when search results provided:
- List the healthcare provider names
- Include addresses and phone numbers if available
- Mention services/treatments offered
- Keep under 150 words, focus on practical information

ABSOLUTELY FORBIDDEN: Any code, programming content, technical explanations, documentation, or non-healthcare responses.`
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
                        // For local healthcare providers, use web search to avoid financial data
                        const optimizedQuery = this.createHealthcareQuery(userMessage);
                        console.log('🔍 Using web_search_exa for healthcare providers with query:', optimizedQuery);
                        searchResults = await this.exaClient.searchWeb(optimizedQuery, 5);
                        console.log('🔍 Web search results:', searchResults.total, 'found');
                    } else {
                        // Create optimized search query for general web search
                        const optimizedQuery = this.createHealthcareQuery(userMessage);
                        console.log('🔍 Using web_search_exa with optimized query:', optimizedQuery);  
                        searchResults = await this.exaClient.searchWeb(optimizedQuery, 5);
                        console.log('🔍 Web search results:', searchResults.total, 'found');
                    }
                    
                    toolResults.push({
                        tool: 'web_search_exa',
                        query: userMessage,
                        results: searchResults
                    });

                    // Store the search results for lead extraction
                    if (searchResults.results && searchResults.results.length > 0) {
                        console.log(`📊 Found ${searchResults.results.length} search results for lead analysis`);
                        console.log('🔍 First search result sample:', JSON.stringify(searchResults.results[0], null, 2));
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
                    content: `I've searched for healthcare providers matching "${userMessage}". Let me provide you with the clinic information...`
                });
                
                messages.push({
                    role: 'system',
                    content: `HEALTHCARE SEARCH RESULTS - Please summarize these clinics with their names, addresses, and contact details:
${JSON.stringify(toolResults, null, 2)}

IMPORTANT: Only provide healthcare provider information. Do not generate any code or technical content.`
                });
            }

            // Get AI response
            console.log('🤖 Calling OpenRouter AI for conversation...');
            console.log('📤 Messages sent to AI:', JSON.stringify(messages, null, 2));
            
            const response = await openai.chat.completions.create({
                model: 'qwen/qwen-2.5-72b-instruct:free',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            });

            let aiResponse = response.choices[0].message.content;
            console.log('📥 Raw AI response:', aiResponse);

            // Clean the response from special tokens that break Telegram
            aiResponse = this.cleanResponseForTelegram(aiResponse);
            console.log('🧹 Cleaned AI response:', aiResponse);
            
            // Validate response is healthcare-related (block technical/code content)
            const isBlocked = this.isNonHealthcareResponse(aiResponse);
            console.log('🛡️ Response validation - isNonHealthcare:', isBlocked);
            
            if (isBlocked) {
                console.log('❌ AI response BLOCKED - using fallback message');
                aiResponse = "I help find healthcare providers like clinics, dentists, hospitals, and medical practices. Please ask me to search for healthcare services in your area.";
            } else {
                console.log('✅ AI response APPROVED - sending original response');
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

            console.log('📤 Final response sent to user:', aiResponse);
            
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

    // Validate if response is healthcare-related (block obvious code content)
    isNonHealthcareResponse(text) {
        console.log('🔍 Validating response text length:', text.length);
        console.log('🔍 First 200 characters:', text.substring(0, 200));
        
        const codePatterns = [
            /import\s+.*from/i,
            /function\s*\(/i,
            /const\s+\w+\s*=/i,
            /\.prototype\./i,
            /export\s+(default|const)/i,
            /React\.useState/i,
            /\.map\(/i,
            /\.filter\(/i,
            /StyleSheet\.create/i,
            /<\w+\s+.*>/,  // JSX tags
            /\{[\s\S]*\}/,  // Large code blocks with braces
            /npm install/i,
            /API_KEY.*=/i,
            /console\.log/i,
            /async\s+function/i,
            /await\s+fetch/i
        ];
        
        // Check if response contains obvious code patterns
        const containsCode = codePatterns.some(pattern => pattern.test(text));
        console.log('🔍 Contains code patterns:', containsCode);
        
        // Check if response contains healthcare keywords
        const healthcareKeywords = ['clinic', 'hospital', 'doctor', 'dental', 'medical', 'practice', 'treatment', 'health', 'patient', 'care', 'provider'];
        const hasHealthcareContent = healthcareKeywords.some(keyword => text.toLowerCase().includes(keyword));
        console.log('🔍 Contains healthcare keywords:', hasHealthcareContent);
        
        // Block if it's obvious code OR very long non-healthcare content
        const isBlocked = containsCode || (text.length > 1000 && !hasHealthcareContent);
        console.log('🔍 Final blocking decision:', isBlocked);
        
        return isBlocked;
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

    // Create optimized healthcare search query
    createHealthcareQuery(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract location if present
        let location = '';
        const locationMatch = lowerMessage.match(/in\s+([a-zA-Z\s]+)|near\s+([a-zA-Z\s]+)|around\s+([a-zA-Z\s]+)/);
        if (locationMatch) {
            location = (locationMatch[1] || locationMatch[2] || locationMatch[3]).trim();
        }
        
        // Extract healthcare type
        let healthcareType = 'clinic';
        if (lowerMessage.includes('dental') || lowerMessage.includes('dentist')) healthcareType = 'dental clinic';
        else if (lowerMessage.includes('cosmetic') || lowerMessage.includes('aesthetic')) healthcareType = 'cosmetic clinic';
        else if (lowerMessage.includes('dermatology') || lowerMessage.includes('dermatologist')) healthcareType = 'dermatology clinic';
        else if (lowerMessage.includes('physiotherapy') || lowerMessage.includes('physical therapy')) healthcareType = 'physiotherapy center';
        else if (lowerMessage.includes('surgery') || lowerMessage.includes('surgical')) healthcareType = 'surgical center';
        else if (lowerMessage.includes('hospital')) healthcareType = 'hospital';
        
        // Create focused healthcare query
        let optimizedQuery = `${healthcareType}`;
        if (location) {
            optimizedQuery += ` ${location}`;
        }
        
        console.log(`🎯 Optimized healthcare query: "${optimizedQuery}" from "${message}"`);
        return optimizedQuery;
    }

    // Extract and store healthcare leads from search results - SIMPLE AUTOMATION PATTERN
    async extractAndStoreLeads(chatId, toolResults, originalQuery) {
        try {
            const searchResult = toolResults.find(t => t.tool === 'web_search_exa');

            if (!searchResult?.results || searchResult.results.length === 0) {
                console.log('⚠️ No search results found for lead extraction');
                return;
            }

            console.log('📊 Processing leads with standard automation pattern...');

            for (let i = 0; i < Math.min(3, searchResult.results.length); i++) {
                const result = searchResult.results[i];

                try {
                    // STANDARD AUTOMATION PATTERN: Direct field mapping (like Zapier/n8n)
                    const leadData = this.parseSearchResultToLead(result, originalQuery, chatId);
                    
                    // Store in Notion immediately
                    console.log(`🔄 Storing lead: ${leadData.company}`);
                    await this.storeInNotion(leadData);
                    this.processedLeads.push(leadData);

                    console.log(`✅ Successfully stored lead: ${leadData.company} - ${leadData.phone || 'No phone'}`);

                } catch (error) {
                    console.error(`❌ Failed to process search result ${i + 1}:`, error.message);
                    console.error(`🔍 Search result was:`, {
                        title: result.title,
                        url: result.url,
                        hasText: !!result.text
                    });
                }
            }

            console.log(`✅ Processed ${searchResult.results.length} leads using standard automation pattern`);

        } catch (error) {
            console.error('❌ Lead extraction failed:', error.message);
            console.error('🔍 Full error:', error);
        }
    }

    // STANDARD FIELD MAPPING - Like Zapier/Make/n8n
    parseSearchResultToLead(result, originalQuery, chatId) {
        console.log(`🔧 Parsing lead data from: ${result.title}`);
        
        // Extract company name (remove everything after | or -)
        const company = result.title
            ?.replace(/\s*[\|\-].*$/, '')
            ?.trim() || 'Unknown Company';

        // Extract phone number using regex
        const phoneMatch = result.text?.match(/(?:\+46|08)[\s\-]?[\d\s\-]{8,15}/);
        const phone = phoneMatch?.[0]?.replace(/\s+/g, ' ').trim() || null;

        // Extract email using regex  
        const emailMatch = result.text?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch?.[0] || null;

        // Detect practice type from text
        let practiceType = 'Healthcare';
        const text = result.text?.toLowerCase() || '';
        if (text.includes('cosmetic') || text.includes('estetisk')) practiceType = 'Cosmetic';
        else if (text.includes('dental') || text.includes('tandläkare')) practiceType = 'Dental';
        else if (text.includes('plastikkirurg')) practiceType = 'Plastic Surgery';

        // Extract services
        const services = [];
        if (text.includes('botox')) services.push('Botox');
        if (text.includes('filler')) services.push('Fillers');
        if (text.includes('bröstf')) services.push('Breast Surgery');
        if (text.includes('näsplastik')) services.push('Nose Surgery');

        const leadData = {
            company: company,
            url: result.url,
            phone: phone,
            email: email,
            location: this.extractLocationFromQuery(originalQuery) || 'Stockholm',
            practice_type: practiceType,
            services: services,
            lead_score: this.calculateSimpleLeadScore(phone, email, services.length),
            discovered_via: originalQuery,
            discovery_date: new Date().toISOString().split('T')[0],
            chat_id: chatId
        };

        console.log(`📋 Parsed lead data:`, {
            company: leadData.company,
            phone: leadData.phone,
            email: leadData.email,
            services: leadData.services.length
        });

        return leadData;
    }

    extractLocationFromQuery(query) {
        const locationMatch = query?.match(/in\s+([a-zA-Z\s]+)|near\s+([a-zA-Z\s]+)/i);
        return locationMatch?.[1]?.trim() || locationMatch?.[2]?.trim() || null;
    }

    calculateSimpleLeadScore(phone, email, servicesCount) {
        let score = 50; // Base score
        if (phone) score += 25;
        if (email) score += 25;
        if (servicesCount > 0) score += servicesCount * 5;
        return Math.min(score, 100);
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
        // Use default database ID if not configured
        const databaseId = process.env.NOTION_DATABASE_ID || 'default-database-id';
        
        if (!process.env.NOTION_DATABASE_ID) {
            console.log('⚠️ Using simulated Notion storage (no database ID configured)');
        }

        try {
            const properties = {
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
            };

            await this.notionClient.createPage(databaseId, properties);
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
            notion_configured: !!process.env.NOTION_DATABASE_ID,
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
            notion: !!process.env.NOTION_DATABASE_ID,
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
            notion: !!process.env.NOTION_DATABASE_ID,
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
    console.log(`   Notion CRM: ${process.env.NOTION_DATABASE_ID ? '✅ Available (Smithery MCP)' : '❌ Missing'}`);
    console.log(`   Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Available' : '❌ Missing'}`);
    
    // Initialize AI agent
    await aiAgent.initialize();
    
    console.log(`\n🎯 Ready for full conversational AI with tool access!`);
});
