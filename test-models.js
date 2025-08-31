const OpenAI = require('openai');

// Test verschillende models
const models = [
    'deepseek/deepseek-chat-v3.1:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free', 
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'moonshotai/kimi-k2:free'
];

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

async function testModel(modelName) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    
    try {
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You help find healthcare providers. When given search results about clinics, summarize the provider names and services. Do not generate code.'
                },
                {
                    role: 'user', 
                    content: 'I found Amsterdam Cosmetic Clinic that offers botox and fillers. Please summarize this healthcare provider.'
                }
            ],
            temperature: 0.7,
            max_tokens: 200,
            stream: false
        });

        const aiResponse = response.choices[0].message.content;
        console.log(`✅ ${modelName} - SUCCESS`);
        console.log(`Response: ${aiResponse.substring(0, 100)}...`);
        
        // Check if it generated code
        const hasCode = /function|class|import|const.*=|\.prototype|{.*}/.test(aiResponse);
        console.log(`Contains code: ${hasCode ? '❌ YES' : '✅ NO'}`);
        
        return { success: true, hasCode, response: aiResponse };
        
    } catch (error) {
        console.log(`❌ ${modelName} - FAILED: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testAllModels() {
    console.log('🚀 Testing available free models on OpenRouter...\n');
    
    for (const model of models) {
        await testModel(model);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay
    }
}

testAllModels().catch(console.error);