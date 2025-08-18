import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || !voice) {
      return new Response('Missing text or voice', { status: 400 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('Missing OpenAI API key', { status: 500 });
    }
    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    });
    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(`OpenAI error: ${errText}`, { status: 500 });
    }
    const audioBuffer = await openaiRes.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response('Server error: ' + errorMessage, { status: 500 });
  }
} 