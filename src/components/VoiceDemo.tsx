/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-assign-module-variable */
/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { getCurrentPractice } from '@/lib/practice-config';

export default function VoiceDemo() {
  // Get current practice configuration
  const practiceConfig = getCurrentPractice();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState<'listening' | 'speaking'>('listening');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [agentResponse, setAgentResponse] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const AGENT_ID = practiceConfig.agentId; // Dynamic Agent ID
  const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk_29f875e0d646b51f7e608506ecca4d88dd66d9b7be6c809c'; // ElevenLabs API key

  const startConversation = useCallback(async () => {
    if (isConnected) {
      stopConversation();
      return;
    }

    setIsLoading(true);
    setError(null);
    setUserTranscript('');
    setAgentResponse('');

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // First test if API key is valid
      console.log('🔑 Testing API key...');
      console.log('🔑 API Key being used:', API_KEY.substring(0, 20) + '...');
      console.log('🔑 Full API Key:', API_KEY);
      
      const testResponse = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': API_KEY,
          'Accept': 'application/json',
        },
      });

      console.log('🔑 API key test response status:', testResponse.status);
      console.log('🔑 API key test response headers:', [...testResponse.headers.entries()]);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('❌ API key test failed:', testResponse.status, testResponse.statusText, errorText);
        throw new Error(`Invalid API key: ${testResponse.status} - ${errorText}`);
      }
      
      const userData = await testResponse.json();
      console.log('✅ API key is valid. User:', userData.first_name || userData.user_id);
      console.log('✅ Full user data:', userData);

      // Get signed URL for secure WebSocket connection
      console.log('🔗 Requesting signed URL from ElevenLabs...');
      console.log('🔗 Agent ID:', AGENT_ID);
      console.log(`🔗 Using ${practiceConfig.name} configuration`);
      console.log('🔗 Request URL:', `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`, {
        method: 'GET',
        headers: {
          'xi-api-key': API_KEY,
          'Accept': 'application/json',
        },
      });

      console.log('🔗 Signed URL response status:', response.status);
      console.log('🔗 Signed URL response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get signed URL:', response.status, response.statusText, errorText);
        console.error('❌ Full response body:', errorText);
        
        if (response.status === 404) {
          throw new Error(`Agent not found: ${AGENT_ID} - ${errorText}`);
        } else if (response.status === 401) {
          throw new Error(`API key authentication failed - ${errorText}`);
        } else {
          throw new Error(`Failed to get signed URL: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Got signed URL from ElevenLabs:', data.signed_url.substring(0, 50) + '...');
      console.log('✅ Full signed URL data:', data);
      const { signed_url } = data;

      // Connect to ElevenLabs WebSocket with signed URL
      console.log('🔌 Connecting to WebSocket:', signed_url.substring(0, 80) + '...');
      const ws = new WebSocket(signed_url);

      ws.onopen = () => {
        console.log(`✅ Connected to ElevenLabs ConvAI for ${practiceConfig.name}`);
        setIsConnected(true);
        setIsLoading(false);
        
        // Start audio capture immediately (no overrides allowed)
        startAudioCapture(stream);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'conversation_initiation_metadata':
              console.log('📅 Conversation initiated:', data.conversation_initiation_metadata_event);
              break;
              
            case 'user_transcript':
              const transcript = data.user_transcription_event.user_transcript;
              console.log('👤 User said:', transcript);
              setUserTranscript(transcript);
              break;
              
            case 'agent_response':
              const response = data.agent_response_event.agent_response;
              console.log('🤖 Agent response:', response);
              setAgentResponse(response);
              setAgentMode('speaking');
              break;
              
            case 'audio':
              const audioData = data.audio_event.audio_base_64;
              console.log('🔊 Received audio chunk, size:', audioData.length);
              setAgentMode('speaking');
              playAudioResponse(audioData);
              break;
              
            case 'interruption':
              console.log('⏸️ Conversation interrupted:', data.interruption_event);
              setAgentMode('listening');
              break;
              
            case 'ping':
              // Respond to ping to keep connection alive
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'pong',
                    event_id: data.ping_event.event_id
                  }));
                }
              }, data.ping_event.ping_ms || 0);
              break;
              
            case 'internal_tentative_agent_response':
              // Agent is thinking/processing
              setAgentMode('speaking');
              break;
              
            default:
              console.log('📨 Received unknown message type:', data.type);
          }
        } catch (e) {
          console.error('❌ Error parsing message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        
        // Specific error messages based on close codes
        if (event.code === 1006) {
          setError('Connection lost unexpectedly - check internet connection');
        } else if (event.code === 1002) {
          setError('Protocol error - agent may be misconfigured');
        } else if (event.code === 1008) {
          setError('Authentication failed - check API key');
        } else if (event.code === 4000) {
          setError('Agent not found - check agent ID');
        } else if (event.code === 4001) {
          setError('Invalid API key');
        } else if (!event.wasClean && event.code !== 1000) {
          setError(`Connection error (${event.code}): ${event.reason || 'Unknown error'}`);
        }
        
        setIsConnected(false);
        setAgentMode('listening');
        setIsLoading(false);
        stopAudioCapture();
      };

      ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        setError('Connection error - please try again');
        setIsConnected(false);
        setIsLoading(false);
        stopAudioCapture();
      };

      socketRef.current = ws;

    } catch (error: any) {
      console.error('❌ Error starting conversation:', error);
      setError(error.message || 'Failed to start conversation');
      setIsLoading(false);
      
      // Clean up stream if connection failed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isConnected, AGENT_ID, practiceConfig.name]);

  const stopConversation = useCallback(() => {
    console.log('🛑 Stopping conversation...');
    
    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Stop audio capture
    stopAudioCapture();
    
    // Reset states
    setIsConnected(false);
    setIsLoading(false);
    setAgentMode('listening');
    setUserTranscript('');
    setAgentResponse('');
    setError(null);
  }, []);

  const startAudioCapture = (stream: MediaStream) => {
    try {
      console.log('🎤 Starting audio capture...');
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Create media stream source
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create script processor for audio data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert float32 to int16
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          // Convert to base64
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
          
          // Send audio data to ElevenLabs
          socketRef.current.send(JSON.stringify({
            type: 'audio',
            audio_event: {
              audio_base_64: audioBase64
            }
          }));
        }
      };
      
      // Connect audio nodes
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('✅ Audio capture started successfully');
      
    } catch (error) {
      console.error('❌ Error starting audio capture:', error);
      setError('Microphone access failed');
    }
  };

  const stopAudioCapture = () => {
    console.log('🎤 Stopping audio capture...');
    
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const playAudioResponse = (audioBase64: string) => {
    try {
      // Add to queue for sequential playback
      audioQueueRef.current.push(audioBase64);
      
      // Start playback if not already playing
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setAgentMode('listening');
      return;
    }
    
    isPlayingRef.current = true;
    const audioBase64 = audioQueueRef.current.shift()!;
    
    try {
      console.log('🎵 Processing audio chunk, base64 length:', audioBase64.length);
      
      // Decode base64 to array buffer
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('🎵 Decoded to bytes, length:', bytes.length);
      
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🎵 Created new AudioContext, sample rate:', audioContextRef.current.sampleRate);
      }
      
      // First try: Check if this is actually a WAV/MP3 file by trying decodeAudioData
      try {
        console.log('🎵 Attempting decodeAudioData first...');
        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer.slice());
        console.log('✅ Successfully decoded as compressed audio!');
        
        // Create and play audio source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          setTimeout(playNextAudio, 100);
        };
        
        source.start(0);
        console.log('🔊 Successfully played compressed audio chunk');
        return;
        
      } catch (decodeError: any) {
        console.log('🎵 DecodeAudioData failed, trying PCM approach...', decodeError.message);
      }
      
      // Second try: Treat as raw PCM data
      console.log('🎵 Treating as raw PCM data...');
      
      // Convert bytes to 16-bit PCM samples
      const samples = new Int16Array(bytes.buffer);
      console.log('🎵 PCM samples length:', samples.length, 'first few values:', Array.from(samples.slice(0, 5)));
      
      // ElevenLabs ConversationAI uses 16000 Hz sample rate (as shown in conversation_initiated event)
      const sampleRate = 16000;
      console.log('🎵 FIXED SAMPLE RATE - Using ElevenLabs standard:', sampleRate, 'Hz (from agent_output_audio_format)');
      
      const numChannels = 1; // Mono audio
      const frameCount = samples.length;
      
      console.log('🎵 Using sample rate:', sampleRate, 'channels:', numChannels, 'frames:', frameCount);
      
      if (frameCount === 0) {
        console.warn('⚠️ No audio frames to play');
        setTimeout(playNextAudio, 100);
        return;
      }
      
      // Create AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(numChannels, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert 16-bit PCM to float32 for AudioBuffer
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
      }
      
      console.log('🎵 Audio buffer created, duration:', audioBuffer.duration, 'seconds');
      
      // Create and play audio source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('🎵 Audio chunk finished playing');
        setTimeout(playNextAudio, 100);
      };
      
      source.start(0);
      console.log('🔊 Successfully started PCM audio playback');
      
    } catch (error: any) {
      console.error('❌ Error processing audio:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      // Continue with next audio in queue
      setTimeout(playNextAudio, 100);
    }
  };

  // Dynamic color classes based on practice
  const colorClasses = practiceConfig.branding.primaryColor === 'emerald' 
    ? {
        gradient: 'from-emerald-600 to-green-600',
        gradientBg: 'bg-gradient-to-r from-emerald-600 to-green-600',
        button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
        text: 'text-emerald-600',
        accent: 'text-green-700'
      }
    : {
        gradient: 'from-blue-600 to-indigo-600',
        gradientBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        text: 'text-blue-600',
        accent: 'text-indigo-700'
      };

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center justify-center w-20 h-20 ${colorClasses.gradientBg} rounded-full mb-4`}>
          <Phone className="w-10 h-10 text-white" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${colorClasses.gradient} bg-clip-text text-transparent`}>
          Call {practiceConfig.name}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
          Experience how patients will interact with your AI {practiceConfig.type} assistant. 
          Click "Start Call" to begin a live conversation with Robin about scheduling treatments with {practiceConfig.doctor}.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        </div>
      )}

      {/* Main Interface */}
      <div className="max-w-2xl mx-auto">
        {/* Connection Status */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
            isConnected 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">
              {isConnected ? `Connected to ${practiceConfig.name}` : 'Ready to Connect'}
            </span>
          </div>
        </div>

        {/* Call Button */}
        <div className="text-center mb-8">
          <button
            onClick={startConversation}
            disabled={isLoading}
            className={`relative inline-flex items-center gap-4 px-8 py-6 ${colorClasses.button} text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : isConnected ? (
              <>
                <PhoneOff className="w-6 h-6" />
                <span>End Call</span>
              </>
            ) : (
              <>
                <Phone className="w-6 h-6" />
                <span>Start Call</span>
              </>
            )}
          </button>
        </div>

        {/* Live Conversation Display */}
        {isConnected && (
          <div className="space-y-6">
            {/* Agent Mode Indicator */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${
                agentMode === 'listening' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {agentMode === 'listening' ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {agentMode === 'listening' ? 'Listening...' : 'Robin is speaking'}
                </span>
              </div>
            </div>

            {/* Conversation Display */}
            <div className="space-y-4">
              {userTranscript && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">You</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-900 font-medium">{userTranscript}</p>
                    </div>
                  </div>
                </div>
              )}

              {agentResponse && (
                <div className={`${practiceConfig.branding.primaryColor === 'emerald' ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'} border rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${colorClasses.gradientBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <div className="flex-1">
                      <p className={`${practiceConfig.branding.primaryColor === 'emerald' ? 'text-emerald-900' : 'text-indigo-900'} font-medium`}>{agentResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Services Preview */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Robin Knows About These Services
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {practiceConfig.services.map((service, index) => (
              <div key={index} className="bg-white/70 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className={`w-4 h-4 ${colorClasses.text}`} />
                  <h4 className="font-medium text-gray-900 text-sm">{service.name}</h4>
                </div>
                <p className="text-xs text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How to Test:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Click "Start Call" and allow microphone access</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Speak naturally - ask about services or try to book an appointment</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Robin will respond with voice and text about {practiceConfig.doctor}'s {practiceConfig.type} services</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
