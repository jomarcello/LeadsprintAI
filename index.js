const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Healthcare Lead Agent
class HealthcareAgent {
    async processLead(url) {
        console.log(`Processing healthcare lead: ${url}`);
        
        // Mock lead processing
        const company = url.replace('https://', '').split('.')[0] + ' Healthcare';
        
        return {
            company,
            url,
            services: ['Healthcare Services'],
            treatments: ['Consultation'],
            lead_score: 75,
            status: 'processed'
        };
    }
    
    async storeInNotion(leadData) {
        console.log(`Storing lead in Notion: ${leadData.company}`);
        
        // Mock Notion storage
        return {
            success: true,
            leadId: `notion_${Date.now()}`
        };
    }
}

const agent = new HealthcareAgent();

// Routes
app.post('/automate', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL required' });
    }
    
    try {
        const leadData = await agent.processLead(url);
        const notionResult = await agent.storeInNotion(leadData);
        
        res.json({
            success: true,
            workflow: '3-step-simplified',
            practice: leadData,
            notion: notionResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        agent: '🏥 Healthcare Lead Discovery Agent (Part 1)',
        workflow: 'Telegram → Exa Search → Notion → Telegram Output',
        status: 'ready'
    });
});

app.listen(PORT, () => {
    console.log(`🏥 HEALTHCARE PART 1 AGENT READY ON PORT ${PORT}`);
});