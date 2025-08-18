/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { practiceConfigs } from '@/lib/practice-config';

export async function POST(request: NextRequest) {
  try {
    const { message, history, practiceId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Determine practice configuration with robust detection
    let practiceConfig;
    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';
    
    console.log(`🔍 Chat API Request Details:`, {
      practiceId,
      referer,
      host,
      availablePractices: Object.keys(practiceConfigs)
    });

    // Priority 1: Explicit practiceId from client
    if (practiceId && practiceConfigs[practiceId]) {
      practiceConfig = practiceConfigs[practiceId];
      console.log(`✅ Using practiceId from client: ${practiceId}`);
    }
    // Priority 2: Host header detection for tunnels/ports
    else if (host.includes('spinealign-center') || host.includes(':3000')) {
      practiceConfig = practiceConfigs.spinealign;
      console.log(`✅ Using SpineAlign from host: ${host}`);
    }
    else if (host.includes('smith-chiropractic') || host.includes(':3001')) {
      practiceConfig = practiceConfigs.smith;
      console.log(`✅ Using Smith from host: ${host}`);
    }
    // Priority 3: Referer header detection
    else if (referer.includes('spinealign-center') || referer.includes(':3000')) {
      practiceConfig = practiceConfigs.spinealign;
      console.log(`✅ Using SpineAlign from referer: ${referer}`);
    }
    else if (referer.includes('smith-chiropractic') || referer.includes(':3001')) {
      practiceConfig = practiceConfigs.smith;
      console.log(`✅ Using Smith from referer: ${referer}`);
    }
    // Priority 4: Environment variable (server-side)
    else if (process.env.PRACTICE_ID && practiceConfigs[process.env.PRACTICE_ID]) {
      practiceConfig = practiceConfigs[process.env.PRACTICE_ID];
      console.log(`✅ Using practice from environment: ${process.env.PRACTICE_ID}`);
    }
    // Priority 5: Port-based detection
    else if (process.env.PORT === '3000') {
      practiceConfig = practiceConfigs.spinealign;
      console.log(`✅ Using SpineAlign from PORT=3000`);
    }
    else if (process.env.PORT === '3001') {
      practiceConfig = practiceConfigs.smith;
      console.log(`✅ Using Smith from PORT=3001`);
    }
    // Final fallback: Smith Chiropractic
    else {
      practiceConfig = practiceConfigs.smith;
      console.log(`⚠️ Using Smith as final fallback`);
    }

    console.log(`💬 Final chat configuration: ${practiceConfig.name} (${practiceConfig.id})`);

    // Prepare messages for the API
    const messages = [
      {
        role: 'system',
        content: practiceConfig.chat.systemPrompt
      },
      // Add conversation history (last 10 messages for context)
      ...(history || []).slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI API:', data);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message.content;

    return NextResponse.json({
      message: aiMessage,
      timestamp: new Date().toISOString(),
      practice: practiceConfig.name,
      practiceId: practiceConfig.id,
      doctor: practiceConfig.doctor,
      debug: {
        detectedPractice: practiceConfig.id,
        usedMethod: practiceId ? 'clientPracticeId' : 
                   host.includes('spinealign-center') || host.includes(':3000') ? 'hostHeader' :
                   host.includes('smith-chiropractic') || host.includes(':3001') ? 'hostHeader' :
                   process.env.PRACTICE_ID ? 'environmentVar' :
                   process.env.PORT ? 'portDetection' : 'fallback',
        serverPort: process.env.PORT,
        serverPracticeId: process.env.PRACTICE_ID
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 