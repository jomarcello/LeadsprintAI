import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPractice } from '@/lib/practice-config';

const GEMINI_API_KEY = 'AIzaSyB82katqt-X1myT_8Ig5IMFgfABLmNrclY';

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'th', conversationHistory = [], context = {} } = await request.json();
    
    const practice = getCurrentPractice();
    
    const response = await generateGeminiResponse(message, practice, conversationHistory, language, context);
    
    return NextResponse.json({ 
      response,
      language,
      practice: practice.id
    });
    
  } catch (error) {
    console.error('Conversation API error:', error);
    
    return NextResponse.json({ 
      response: 'ขออภัยค่ะ ขณะนี้ระบบมีปัญหา กรุณาลองใหม่ในอีกสักครู่ค่ะ',
      language: 'th',
      practice: 'beautymed'
    });
  }
}

async function generateGeminiResponse(message: string, practice: any, history: any[], language: string, context: any): Promise<string> {
  try {
    const conversationContext = history.map(h => `User: ${h.user}\nRobin: ${h.agent}`).join('\n');
    const contextInfo = Object.entries(context).map(([key, value]) => `${key}: ${value}`).join(', ');
    
    const systemPrompt = language === 'th' 
      ? `คุณคือ Robin ผู้ช่วยนัดหมายของ ${practice.name} คลินิกความงาม 
         ดูแลโดย ${practice.doctor} ซึ่งเชี่ยวชาญด้าน ${practice.type}
         
         บริการที่มี: ${practice.services.map(s => `${s.name} - ${s.description}`).join(', ')}
         
         บทบาทของคุณ:
         - ตอบคำถามเกี่ยวกับบริการและการรักษา
         - ช่วยนัดหมายและให้ข้อมูลเวลาที่ว่าง
         - พูดคุยแบบเป็นมิตรและเข้าใจง่าย
         - ใช้ภาษาไทยที่สุภาพและอ่อนน้อม
         - ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอื่น
         
         ข้อมูลปัจจุบันของลูกค้า: ${contextInfo || 'ยังไม่มี'}
         
         ตอบแบบสั้นกะทัดรัด ไม่เกิน 2-3 ประโยค
         
         ประวัติการสนทนา: ${conversationContext}
         
         ลูกค้าพูดว่า: "${message}"
         
         กรุณาตอบในบทบาท Robin เป็นภาษาไทยเท่านั้น:`
      : `You are Robin, the appointment assistant for ${practice.name} beauty clinic.
         Managed by ${practice.doctor}, specializing in ${practice.type}.
         
         Available services: ${practice.services.map(s => `${s.name} - ${s.description}`).join(', ')}
         
         Your role:
         - Answer questions about services and treatments
         - Help with appointments and scheduling
         - Be friendly and conversational
         - Keep responses concise (2-3 sentences max)
         
         Current customer context: ${contextInfo || 'None'}
         
         Conversation history: ${conversationContext}
         
         Customer said: "${message}"
         
         Please respond as Robin:`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

