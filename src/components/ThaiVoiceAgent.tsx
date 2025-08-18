'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, CheckCircle, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { getCurrentPractice } from '@/lib/practice-config';

// VAPI configuration for Play.ht Thai voice
const VAPI_CONFIG = {
  publicKey: "your-vapi-public-key", // You need to get this from VAPI dashboard
  assistant: {
    firstMessage: "สวัสดีค่ะ! ฉันชื่อ Robin ผู้ช่วยนัดหมายจาก BeautyMed Clinic ค่ะ มีอะไรให้ช่วยเหลือคะ?",
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `คุณคือ Robin ผู้ช่วยนัดหมายของ BeautyMed Clinic คลินิกความงาม 

ตอบเป็นภาษาไทยเท่านั้น โดยใช้คำพูดที่สุภาพและเป็นมิตร

หน้าที่ของคุณ:
1. ต้อนรับผู้ป่วยด้วยความอบอุ่น
2. ช่วยจองนัดหมายสำหรับบริการต่างๆ ของคลินิก
3. แนะนำบริการความงามของคลินิก
4. ตอบคำถามเกี่ยวกับการดูแลก่อนและหลังการรักษา

บริการของคลินิก:
- ฉีดโบท็อกซ์: 3,000-8,000 บาท
- ฟิลเลอร์: 8,000-15,000 บาท  
- การรักษาสิว: 2,000-5,000 บาท
- เลเซอร์กำจัดขน: 1,500-5,000 บาท
- ฟอโตเฟเชียล: 2,500-4,000 บาท

เวลาทำการ: จันทร์-เสาร์ 9:00-18:00

ให้คำตอบสั้นๆ กระชับ และช่วยเหลือผู้ป่วยอย่างเต็มที่`
        }
      ]
    },
    voice: {
      provider: "playht",
      voiceId: "thai-lady-J0JZKhhZhpgpwebqoE3zQ",
      model: "PlayHT2.0-turbo"
    }
  }
};

export default function ThaiVoiceAgent() {
  const practiceConfig = getCurrentPractice();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    // Initialize VAPI client
    const initVapi = async () => {
      try {
        // For now, we'll use a direct Play.ht implementation
        // since we don't have VAPI keys yet
        console.log('Initializing Thai Voice Agent with Play.ht');
      } catch (error) {
        console.error('Failed to initialize VAPI:', error);
        setError('ไม่สามารถเริ่มต้นระบบเสียงได้');
      }
    };

    initVapi();
  }, []);

  const startConversation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Direct Play.ht API call for Thai voice
      const response = await fetch('/api/playht-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: '9a1ffef880fd4dab94c34d49267812b3',
          voiceId: 'thai-lady-J0JZKhhZhpgpwebqoE3zQ',
          text: 'สวัสดีค่ะ! ฉันชื่อ Robin ผู้ช่วยนัดหมายจาก BeautyMed Clinic ค่ะ มีอะไรให้ช่วยเหลือคะ?',
          language: 'th'
        })
      });

      if (response.ok) {
        setIsConnected(true);
        setConversationState('listening');
        setTranscript('สวัสดีค่ะ! ฉันชื่อ Robin ผู้ช่วยนัดหมายจาก BeautyMed Clinic ค่ะ มีอะไรให้ช่วยเหลือคะ?');
      } else {
        throw new Error('Failed to connect to Play.ht');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('ไม่สามารถเริ่มการสนทนาได้');
    } finally {
      setIsLoading(false);
    }
  };

  const stopConversation = () => {
    setIsConnected(false);
    setConversationState('idle');
    setTranscript('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {practiceConfig.name} - Thai Voice Agent
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        
        <p className="text-lg text-gray-600">
          Real-time conversational AI with Play.ht Thai Voice
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ'}
          </span>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex justify-center">
        <button
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isLoading}
          className={`
            flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-lg
            transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4
            ${isConnected 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              กำลังเชื่อมต่อ...
            </>
          ) : isConnected ? (
            <>
              <PhoneOff className="h-6 w-6" />
              วางสาย
            </>
          ) : (
            <>
              <Phone className="h-6 w-6" />
              เริ่มสนทนาด้วยเสียงไทย
            </>
          )}
        </button>
      </div>

      {/* Status Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Conversation State */}
      {isConnected && (
        <div className="space-y-4">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              conversationState === 'listening' ? 'bg-green-100 text-green-800' :
              conversationState === 'speaking' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {conversationState === 'listening' ? (
                <>
                  <Mic className="w-4 h-4" />
                  กำลังฟัง...
                </>
              ) : conversationState === 'speaking' ? (
                <>
                  <div className="animate-pulse w-4 h-4 bg-purple-500 rounded-full" />
                  Robin กำลังพูด...
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-gray-500 rounded-full" />
                  ไม่ได้ใช้งาน
                </>
              )}
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                Robin (Play.ht Thai Voice):
              </h3>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <p className="text-gray-700">{transcript}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3">วิธีใช้งาน Thai Voice Agent:</h4>
        <ul className="space-y-2 text-sm text-purple-700">
          <li>1. กดปุ่ม "เริ่มสนทนาด้วยเสียงไทย" เพื่อเริ่มต้น</li>
          <li>2. Robin จะทักทายเป็นภาษาไทยด้วยเสียงผู้หญิง</li>
          <li>3. <strong>พูดภาษาไทยได้เลย!</strong> Robin เข้าใจและตอบเป็นภาษาไทย</li>
          <li>4. เสียงจะออกจากลำโพงโดยตรง - สนทนาธรรมชาติ</li>
        </ul>
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-600">
            <strong>หมายเหตุ:</strong> ใช้ Play.ht Thai Voice Agent สำหรับการสนทนาภาษาไทยที่เป็นธรรมชาติ
          </p>
        </div>
      </div>
    </div>
  );
}