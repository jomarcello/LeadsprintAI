'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, CheckCircle, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { getCurrentPractice } from '@/lib/practice-config';

export default function GeminiLiveVoiceDemo() {
  const practiceConfig = getCurrentPractice();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      wsRef.current = new WebSocket('ws://localhost:8765');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected to Gemini Live API');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Send start conversation message after a small delay to ensure connection is ready
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'start_conversation'
            }));
          }
        }, 100);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'audio') {
          // Play audio response from Gemini
          playAudioResponse(data.data);
        } else if (data.type === 'text') {
          // Display text response
          setAgentResponse(data.text);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setIsConnected(false);
        
        // Disable auto-reconnect to prevent infinite loops
        // if (event.code !== 1000 && event.code !== 1001) {
        //   setTimeout(() => {
        //     if (connectionStatus === 'disconnected') {
        //       console.log('Attempting to reconnect...');
        //       connectWebSocket();
        //     }
        //   }, 3000);
        // }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Gemini ได้');
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setConnectionStatus('disconnected');
    }
  }, []);

  // Simple audio playback - play each chunk directly using Web Audio API
  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      // Don't play multiple chunks simultaneously
      if (isSpeaking) {
        return;
      }
      
      setIsSpeaking(true);
      
      // Convert base64 to binary data
      const audioData = atob(base64Audio);
      const audioBuffer = new ArrayBuffer(audioData.length);
      const audioArray = new Uint8Array(audioBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Decode and play audio
      const decodedAudio = await audioContextRef.current.decodeAudioData(audioBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
      };
      
      source.start();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      streamRef.current = stream;
      
      // Use PCM format for better compatibility with Gemini
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToGemini(audioBlob);
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('Recording error:', error);
      setError('ไม่สามารถเริ่มบันทึกเสียงได้');
    }
  }, []);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  // Send audio to Gemini Live API
  const sendAudioToGemini = useCallback(async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('ไม่ได้เชื่อมต่อกับเซิร์ฟเวอร์');
      return;
    }

    try {
      // Convert audio blob to base64
      const audioBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      // Send audio data to Python backend with size check
      if (base64Audio.length > 1024 * 1024) { // 1MB limit
        setError('ไฟล์เสียงใหญ่เกินไป');
        return;
      }
      
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: base64Audio,
        format: 'webm',
        size: audioBuffer.byteLength
      }));
      
    } catch (error) {
      console.error('Error sending audio:', error);
      setError('ไม่สามารถส่งเสียงได้');
    }
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
    
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setConnectionStatus('disconnected');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  const getPrimaryColorClasses = () => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500',
      emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 focus:ring-pink-500'
    };
    return colorMap[practiceConfig.branding.primaryColor as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {practiceConfig.name} - Gemini Live Voice Assistant
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        
        <p className="text-lg text-gray-600">
          Real-time Thai voice conversation with Gemini 2.5 Flash + Zephyr Voice
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
              : `bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500`
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
              เริ่มการสนทนา Gemini Live
            </>
          )}
        </button>
      </div>

      {/* Recording Controls */}
      {isConnected && (
        <div className="flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSpeaking}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-lg font-semibold
              transition-all duration-200 focus:outline-none focus:ring-4
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 animate-pulse' 
                : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
              }
              ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? (
              <>
                <MicOff className="h-5 w-5" />
                หยุดบันทึก (กำลังส่ง...)
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                กดค้างเพื่อพูด
              </>
            )}
          </button>
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
            <div className={`w-3 h-3 ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-purple-500'} rounded-full`}></div>
            Robin (Gemini Live + Zephyr) ตอบว่า:
          </h3>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg min-h-[100px]">
            <p className="text-gray-700">
              {agentResponse || 'กำลังรอการตอบ...'}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3">วิธีใช้งาน Gemini Live:</h4>
        <ul className="space-y-2 text-sm text-purple-700">
          <li>1. เปิด Python server ก่อน: <code className="bg-purple-100 px-2 py-1 rounded">python python-backend/gemini_live_server.py</code></li>
          <li>2. กดปุ่ม "เริ่มการสนทนา Gemini Live" เพื่อเชื่อมต่อ</li>
          <li>3. กดปุ่ม "กดค้างเพื่อพูด" และพูดภาษาไทย</li>
          <li>4. ระบบจะประมวลผลและตอบกลับด้วยเสียง Zephyr แบบ real-time</li>
        </ul>
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-600">
            <strong>หมายเหตุ:</strong> ต้องติดตั้ง Python dependencies ก่อน: <code>pip install google-genai websockets pyaudio</code>
          </p>
        </div>
      </div>
    </div>
  );
}