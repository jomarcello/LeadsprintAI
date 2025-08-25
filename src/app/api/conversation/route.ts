import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPractice } from '@/lib/practice-config';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [], context = {} } = await request.json();
    
    const practice = getCurrentPractice();
    
    const response = await generateHealthcareResponse(message, practice, conversationHistory, context);
    
    return NextResponse.json({ 
      response,
      practice: practice.id
    });
    
  } catch (error) {
    console.error('Conversation API error:', error);
    
    return NextResponse.json({ 
      response: 'I apologize, but we are experiencing technical difficulties. Please try again in a moment.',
      practice: practice.id || 'healthcare'
    });
  }
}

async function generateHealthcareResponse(message: string, practice: any, history: any[], context: any): Promise<string> {
  try {
    const conversationContext = history.map(h => `User: ${h.user}\n${practice.chat?.assistantName || 'Assistant'}: ${h.agent}`).join('\n');
    const contextInfo = Object.entries(context).map(([key, value]) => `${key}: ${value}`).join(', ');
    
    // Use practice configuration for professional healthcare response
    const systemPrompt = practice.chat?.systemPrompt 
      ? practice.chat.systemPrompt.replace(/\[PRACTICE_NAME\]/g, practice.name)
                                  .replace(/\[DOCTOR_NAME\]/g, practice.doctor)
                                  .replace(/\[LOCATION\]/g, practice.location)
      : `You are a professional healthcare appointment assistant for ${practice.name}.
         Managed by ${practice.doctor}, specializing in ${practice.type}.
         
         Available services: ${practice.services?.map(s => `${s.name} - ${s.description}`).join(', ') || 'General healthcare services'}
         
         Your role:
         - Answer questions about services and treatments
         - Help with appointments and scheduling
         - Be professional, friendly, and health-focused
         - Keep responses concise and helpful
         
         Current customer context: ${contextInfo || 'None'}
         
         Conversation history: ${conversationContext}
         
         Customer said: "${message}"
         
         Please respond professionally:`;

    // Simple response generation - could integrate with OpenAI, Claude, or other AI service
    // For now, return a basic professional response
    if (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('schedule')) {
      return `Thank you for contacting ${practice.name}! I'd be happy to help you schedule an appointment with ${practice.doctor}. What type of treatment or service are you interested in?`;
    }
    
    if (message.toLowerCase().includes('service') || message.toLowerCase().includes('treatment')) {
      const servicesList = practice.services?.slice(0, 3).map(s => s.name).join(', ') || 'various healthcare services';
      return `At ${practice.name}, we offer ${servicesList} and more. Would you like to schedule a consultation to discuss which treatment would be best for you?`;
    }
    
    return `Thank you for contacting ${practice.name}. I'm here to help you with appointments and information about our services. How can I assist you today?`;
    
  } catch (error) {
    console.error('Healthcare Response Error:', error);
    throw error;
  }
}

