'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, CheckCircle, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { getCurrentPractice } from '@/lib/practice-config';

export default function ConversationalVoiceDemo() {
  const practiceConfig = getCurrentPractice();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const isListeningRef = useRef(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play audio chunks sequentially to prevent overlapping
  const playNextAudioChunk = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setIsPlayingAudio(true);
    
    const rawBuffer = audioQueueRef.current.shift()!;
    const pcmData = new Int16Array(rawBuffer);
    
    if (audioContextRef.current) {
      try {
        // Create audio buffer for 24kHz mono audio
        const webAudioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
        const channelData = webAudioBuffer.getChannelData(0);
        
        // Convert PCM to float32
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }
        
        // Play the audio
        const source = audioContextRef.current.createBufferSource();
        source.buffer = webAudioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          isPlayingRef.current = false;
          setIsPlayingAudio(false);
          // Play next chunk if available
          setTimeout(() => playNextAudioChunk(), 10);
          
          // If no more audio chunks, Robin finished speaking
          if (audioQueueRef.current.length === 0) {
            setIsListening(true);
            isListeningRef.current = true;
            console.log('🎤 Robin finished speaking - resuming listening');
          }
        };
        
        source.start();
      } catch (error) {
        console.error('Error playing audio chunk:', error);
        isPlayingRef.current = false;
        setIsPlayingAudio(false);
      }
    }
  }, []);

  // Initialize direct Gemini Live API WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      // Connection to play.ht Thai voice agent
      const playhtApiKey = '9a1ffef880fd4dab94c34d49267812b3';
      const thaiAgentId = 'thai-lady-J0JZKhhZhpgpwebqoE3zQ';
      const wsUrl = `wss://api.play.ht/v2/live?api_key=${playhtApiKey}&agent_id=${thaiAgentId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to Play.ht Thai Voice Agent');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Send Thai beauty clinic configuration to play.ht
        const setupMessage = {
          type: 'setup',
          config: {
            voice: {
              agent_id: thaiAgentId,
              language: 'th',
              voice_style: 'professional'
            },
            system_prompt: `คุณคือ Robin ผู้ช่วยนัดหมายของ ${practiceConfig.name} คลินิกความงาม 

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
        };
        
        wsRef.current?.send(JSON.stringify(setupMessage));
        console.log('🏥 Thai BeautyMed configuration sent to Play.ht');
        
        // Start continuous streaming
        startAudioStreaming();
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Received Play.ht response:', data);
        
        // Handle Play.ht response format
        if (data.type === 'audio') {
          try {
            console.log('🔊 Received audio from Thai Robin');
            const audioData = data.audio_data;
            const rawBuffer = new ArrayBuffer(audioData.length);
            const audioArray = new Uint8Array(rawBuffer);
            for (let i = 0; i < audioData.length; i++) {
              audioArray[i] = audioData.charCodeAt(i);
            }
            
            // Robin is speaking - stop listening
            setIsListening(false);
            isListeningRef.current = false;
            
            audioQueueRef.current.push(rawBuffer);
            playNextAudioChunk();
            
          } catch (error) {
            console.error('Error processing audio:', error);
          }
        }
        
        // Handle text response
        if (data.type === 'text' && data.text) {
          console.log('🗣️ Thai Robin says:', data.text);
          setAgentResponse(data.text);
        }
        
        // Handle turn completion
        if (data.type === 'turn_complete') {
          console.log('🔄 Turn completed - resuming listening');
          setIsListening(true);
          isListeningRef.current = true;
        }
        
        // Handle user transcription if available
        if (data.type === 'transcript' && data.user_text) {
          console.log('👤 USER SAID:', data.user_text);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setIsStreaming(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Play.ht ได้');
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setConnectionStatus('disconnected');
    }
  }, []);

  // Start continuous audio streaming (official pattern)
  const startAudioStreaming = useCallback(async () => {
    if (isStreaming) return;
    
    try {
      console.log('Starting continuous audio streaming...');
      
      // Get microphone stream with official specs
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,    // Official: 16kHz input
          channelCount: 1,      // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      
      // Create audio context for processing (use default for playback compatibility)
      audioContextRef.current = new AudioContext();
      
      // Create source and processor (using ScriptProcessorNode for now)
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      
      // Process audio chunks - only when listening
      processorRef.current.onaudioprocess = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!isListeningRef.current) return; // Don't send audio when Robin is speaking
        
        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
        }
        
        // Send continuous PCM data to Play.ht only when listening
        try {
          const audioMessage = {
            type: 'audio_stream',
            audio_data: btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer))),
            format: 'pcm',
            sample_rate: 16000
          };
          
          wsRef.current.send(JSON.stringify(audioMessage));
          console.log(`🎤 Sent audio chunk to Play.ht: ${audioMessage.audio_data.length} chars`);
        } catch (error) {
          console.error('Error sending audio:', error);
        }
      };
      
      // Connect audio pipeline
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsStreaming(true);
      console.log('✅ Continuous audio streaming started');
      
    } catch (error) {
      console.error('Failed to start audio streaming:', error);
      setError('ไม่สามารถเริ่มการสตรีมเสียงได้');
    }
  }, [isStreaming]);

  // Stop audio streaming
  const stopAudioStreaming = useCallback(() => {
    console.log('Stopping audio streaming...');
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsStreaming(false);
  }, []);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (isConnected) {
      stopConversation();
      return;
    }

    setIsLoading(true);
    setError(null);
    setAgentResponse('');

    try {
      await connectWebSocket();
      setIsLoading(false);
    } catch (error) {
      console.error('Conversation error:', error);
      setError('ไม่สามารถเริ่มการสนทนาได้');
      setIsLoading(false);
    }
  }, [isConnected, connectWebSocket]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    stopAudioStreaming();
    
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlayingAudio(false);
    
    setIsConnected(false);
    setIsStreaming(false);
    setConnectionStatus('disconnected');
  }, [stopAudioStreaming]);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_input',
        text: text
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {practiceConfig.name} - Conversational Voice Agent
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        
        <p className="text-lg text-gray-600">
          Real-time conversational AI with Play.ht Thai Voice Agent
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'เชื่อมต่อแล้ว' : 
             connectionStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 
             'ยังไม่ได้เชื่อมต่อ'}
          </span>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex justify-center">
        <button
          onClick={startConversation}
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
              เริ่มการสนทนาแบบ Real-time
            </>
          )}
        </button>
      </div>

      {/* Streaming Status */}
      {isConnected && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isStreaming ? 'กำลังฟังและพูดแบบ Real-time' : 'ไม่ได้สตรีม'}
            </span>
          </div>
          
          {/* Audio playback indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isPlayingAudio ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isPlayingAudio ? '🔊 Robin กำลังพูด' : '🔇 เงียบ'}
            </span>
          </div>
          
          {/* Listening indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isListening ? '👂 กำลังฟัง' : '⏸️ หยุดฟัง'}
            </span>
          </div>
        </div>
      )}

      {/* Status Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Agent Response Display */}
      {isConnected && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className={`w-3 h-3 ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-purple-500'} rounded-full`}></div>
            Robin (Play.ht Thai Voice Agent):
          </h3>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg min-h-[100px]">
            <p className="text-gray-700">
              {agentResponse || 'พูดคุยกับ Robin ได้เลย... เสียงจะออกจากลำโพงโดยตรง'}
            </p>
          </div>
        </div>
      )}

      {/* Text Input for Testing */}
      {isConnected && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">หรือพิมพ์ข้อความทดสอบ:</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendTextMessage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input.value) {
                  sendTextMessage(input.value);
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              ส่ง
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3">วิธีใช้งาน Conversational Voice Agent:</h4>
        <ul className="space-y-2 text-sm text-purple-700">
          <li>1. เปิด Python server: <code className="bg-purple-100 px-2 py-1 rounded">python python-backend/conversational_agent.py</code></li>
          <li>2. กดปุ่ม "เริ่มการสนทนาแบบ Real-time" เพื่อเชื่อมต่อ</li>
          <li>3. <strong>พูดได้เลย!</strong> ไม่ต้องกดปุ่มอะไร - ระบบจะฟังและตอบแบบ Real-time</li>
          <li>4. เสียงจะออกจากลำโพงโดยตรง - คุยได้เหมือนกับคนจริง</li>
        </ul>
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-600">
            <strong>หมายเหตุ:</strong> ใช้หูฟังเพื่อป้องกัน echo และให้ประสบการณ์การสนทนาที่ดีที่สุด
          </p>
        </div>
      </div>
    </div>
  );
}