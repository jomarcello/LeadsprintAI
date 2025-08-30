# 🏥 Healthcare Lead Discovery Agent (Part 1)

Simplified 3-step healthcare lead discovery workflow:

## 🔄 Workflow

1. **Telegram Input** → Receive healthcare practice URL
2. **Exa Search & Data Extraction** → Scrape practice data with AI  
3. **Notion Storage** → Store lead in database
4. **Telegram Output** → Send results back to user

## 🚀 Quick Start

```bash
npm install
node index.js
```

## 📱 API Endpoints

- `POST /automate` - Process healthcare practice URL
- `POST /telegram-webhook` - Telegram bot webhook
- `GET /` - Status and info

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

- `EXA_API_KEY` - For enhanced web scraping
- `TELEGRAM_BOT_TOKEN` - For Telegram bot
- `NOTION_TOKEN` - For database storage
- `NOTION_DATABASE_ID` - Target Notion database

## 🎯 Part 1 Focus

This agent **only** handles lead discovery and storage. No demo creation, no deployment automation - just the core 3-step workflow.

**What's included:**
- ✅ Exa AI web scraping for healthcare data
- ✅ Notion database integration
- ✅ Telegram bot webhook
- ✅ Lead scoring and validation

**What's NOT included:**
- ❌ Demo website generation
- ❌ Railway deployment automation
- ❌ ElevenLabs voice agents
- ❌ GitHub repository creation
- ❌ Complex multi-step workflows