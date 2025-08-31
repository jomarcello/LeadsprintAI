const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

// Simulate the complex search results that cause the problem
const complexSearchResults = `HEALTHCARE SEARCH RESULTS - Please summarize these clinics with their names, addresses, and contact details:
[
  {
    "tool": "web_search_exa",
    "query": "Find 1 cosmetic clinic in Amsterdam",
    "results": {
      "results": [
        {
          "id": "https://www.amsterdamcosmeticclinic.com/",
          "title": "Amsterdam Cosmetic Clinic",
          "url": "https://www.amsterdamcosmeticclinic.com/",
          "publishedDate": "2022-12-21T00:00:00.000Z",
          "author": "",
          "text": "Amsterdam Cosmetic Clinic is de plek waar jouw natuurlijke schoonheid centraal staat. Injectables, huidtherapie en huidverjonging dragen bij aan een stralende look. Met de holistische aanpak van dokter Saloua en haar enthousiaste en deskundige team blijft je glow heel lang bewaard. Tel: 020 214 62 50"
        },
        {
          "id": "https://oranaesthetics.nl/en/",
          "title": "Oran Aesthetics",
          "url": "https://oranaesthetics.nl/en/",
          "text": "Oran Aesthetics is a cosmetic clinic in Amsterdam. Contact: info@oranaesthetics.nl, 020 - 2157338. We offer botox, filler and skin improvement treatments."
        }
      ],
      "total": 2
    }
  }
]

IMPORTANT: Only provide healthcare provider information. Do not generate any code or technical content.`;

async function testComplexQuery(modelName) {
    console.log(`\n🧪 Testing ${modelName} with complex search results...`);
    
    try {
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
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
                },
                {
                    role: 'user',
                    content: 'Find 1 cosmetic clinic in Amsterdam'
                },
                {
                    role: 'assistant',
                    content: "I've searched for healthcare providers matching your request. Let me provide you with the clinic information..."
                },
                {
                    role: 'system',
                    content: complexSearchResults
                }
            ],
            temperature: 0.7,
            max_tokens: 1500,
            stream: false
        });

        const aiResponse = response.choices[0].message.content;
        console.log(`✅ SUCCESS`);
        console.log(`Response (first 200 chars): ${aiResponse.substring(0, 200)}...`);
        
        // Check if it generated code
        const codePatterns = [
            /import\s+.*from/i,
            /function\s*\(/i,
            /const\s+\w+\s*=/i,
            /class\s+\w+/i,
            /\.prototype\./i,
            /export\s+(default|const)/i,
            /React\.useState/i,
            /<\w+\s+.*>/,
            /\{[\s\S]*\}/,
            /console\.log/i,
            /async\s+function/i,
            /await\s+fetch/i,
            /public\s+int/i,
            /Map<.*>/i
        ];
        
        const hasCode = codePatterns.some(pattern => pattern.test(aiResponse));
        console.log(`Contains code: ${hasCode ? '❌ YES' : '✅ NO'}`);
        
        // Check healthcare keywords
        const healthcareKeywords = ['clinic', 'hospital', 'doctor', 'dental', 'medical', 'practice', 'treatment', 'health', 'patient', 'care', 'provider'];
        const hasHealthcare = healthcareKeywords.some(keyword => aiResponse.toLowerCase().includes(keyword));
        console.log(`Contains healthcare info: ${hasHealthcare ? '✅ YES' : '❌ NO'}`);
        
        return { success: true, hasCode, hasHealthcare, response: aiResponse };
        
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testBestModels() {
    const models = [
        'deepseek/deepseek-chat-v3.1:free',
        'meta-llama/llama-3.3-70b-instruct:free', 
        'mistralai/mistral-7b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free'
    ];
    
    console.log('🚀 Testing models with complex search results (like production)...\n');
    
    for (const model of models) {
        await testComplexQuery(model);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay
    }
}

testBestModels().catch(console.error);