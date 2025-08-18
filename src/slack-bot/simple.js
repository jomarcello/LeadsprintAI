#!/usr/bin/env node

const { App } = require('@slack/bolt');
const OpenAI = require('openai').default;
require('dotenv').config();

// Load environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN || !OPENAI_API_KEY) {
  console.error('Missing required environment variables');
  console.error('Required:', { 
    SLACK_BOT_TOKEN: !!SLACK_BOT_TOKEN, 
    SLACK_SIGNING_SECRET: !!SLACK_SIGNING_SECRET, 
    SLACK_APP_TOKEN: !!SLACK_APP_TOKEN, 
    OPENAI_API_KEY: !!OPENAI_API_KEY 
  });
  process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Initialize Slack app
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: SLACK_APP_TOKEN,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000
});

// AI Assistant function
async function getAIResponse(message, userId, channelId) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Je bent een behulpzame AI assistent in Slack. Je spreekt Nederlands en helpt gebruikers met vragen en taken.
          
Huidige context:
- Gebruiker: ${userId}
- Kanaal: ${channelId}
- Je kunt alleen tekstuele antwoorden geven

Wees vriendelijk, behulpzaam en beknopt. Je kunt vragen beantwoorden, uitleg geven, en helpen met verschillende taken.`
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || "Sorry, ik kon geen antwoord genereren.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "Sorry, er is een fout opgetreden bij het verwerken van je bericht.";
  }
}

// Handle app mentions
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('🔥 Received mention:', { 
      user: event.user, 
      channel: event.channel, 
      text: event.text?.substring(0, 50) + '...' 
    });

    const message = event.text.replace(/<@.*?>/, '').trim();
    const response = await getAIResponse(message, event.user || 'unknown', event.channel);
    
    await say({
      text: response,
      thread_ts: event.ts
    });

    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('❌ Error handling mention:', error);
    await say({
      text: "Sorry, er is een fout opgetreden. Probeer het later opnieuw.",
      thread_ts: event.ts
    });
  }
});

// Handle direct messages
app.event('message', async ({ event, say }) => {
  // Only respond to DMs
  if (event.channel_type !== 'im') {
    return;
  }

  // Skip bot messages
  if (event.subtype === 'bot_message' || event.bot_id) {
    return;
  }

  try {
    console.log('💬 Received DM:', { 
      user: event.user, 
      text: event.text?.substring(0, 50) + '...' 
    });

    const response = await getAIResponse(event.text, event.user, event.channel);
    await say(response);

    console.log('✅ DM response sent successfully');

  } catch (error) {
    console.error('❌ Error handling DM:', error);
    await say("Sorry, er is een fout opgetreden. Probeer het later opnieuw.");
  }
});

// Handle slash commands
app.command('/ai', async ({ command, ack, respond }) => {
  await ack();

  try {
    console.log('🔨 Received slash command:', { 
      user: command.user_id, 
      text: command.text?.substring(0, 50) + '...' 
    });

    const response = await getAIResponse(command.text, command.user_id, command.channel_id);
    
    await respond({
      text: response,
      response_type: 'in_channel'
    });

    console.log('✅ Slash command response sent successfully');

  } catch (error) {
    console.error('❌ Error handling slash command:', error);
    await respond({
      text: "Sorry, er is een fout opgetreden. Probeer het later opnieuw.",
      response_type: 'ephemeral'
    });
  }
});

// Error handling
app.error(async (error) => {
  console.error('❌ Slack app error:', error);
});

// Start the app
(async () => {
  try {
    console.log('🚀 Starting Slack AI Bot...');
    await app.start();
    
    console.log('⚡️ Slack AI Bot is running!');
    console.log('🤖 Ready to receive messages...');
    console.log('📡 Socket Mode enabled');
    
    // Test OpenAI connection
    try {
      const testResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 10
      });
      console.log('✅ OpenAI connection successful');
    } catch (error) {
      console.error('❌ OpenAI connection failed:', error);
    }

    console.log('\n🎯 How to use:');
    console.log('   📝 Mention the bot: @AI Assistant Bot Hello!');
    console.log('   💬 Send a DM: Direct message to the bot');
    console.log('   🔨 Slash command: /ai What is the weather?');
    console.log('\n⚡️ Bot is ready for action!');

  } catch (error) {
    console.error('💥 Failed to start bot:', error);
    process.exit(1);
  }
})(); 