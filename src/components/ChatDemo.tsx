/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, MessageCircle, Bot, User, Loader2, Calendar, Clock, Phone } from 'lucide-react';
import { getCurrentPractice } from '@/lib/practice-config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string) => {
  // Convert **bold** to <strong>bold</strong>
  const boldText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>italic</em>
  const italicText = boldText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert line breaks to <br>
  const withLineBreaks = italicText.replace(/\n/g, '<br>');
  
  return withLineBreaks;
};

export default function ChatDemo() {
  // Get current practice configuration
  const practiceConfig = getCurrentPractice();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: practiceConfig.chat.initialMessage,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Only scroll if the user is near the bottom of the chat
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    // Only auto-scroll for new messages, not when the component first mounts
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleTryThisClick = (text: string) => {
    setInput(text);
    // Focus the textarea without scrolling to it
    if (textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.slice(-10), // Send last 10 messages for context
          practiceId: practiceConfig.id // Send practice ID for configuration
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Debug information to verify correct practice
      console.log(`🔍 Chat API Response Debug:`, {
        expectedPractice: practiceConfig.id,
        receivedPractice: data.practiceId,
        receivedDoctor: data.doctor,
        expectedDoctor: practiceConfig.doctor,
        debug: data.debug,
        isCorrectPractice: data.practiceId === practiceConfig.id
      });
      
      // Validation warning if practice mismatch
      if (data.practiceId !== practiceConfig.id) {
        console.error(`❌ PRACTICE MISMATCH! Expected: ${practiceConfig.id}, Received: ${data.practiceId}`);
        console.error(`❌ Expected Doctor: ${practiceConfig.doctor}, Received: ${data.doctor}`);
        setError(`Critical Error: Practice mismatch detected. Expected ${practiceConfig.name}, got ${data.practice}`);
        return;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
      console.error('Error sending message:', {
        message: errorMsg,
        status: error?.status,
        response: error?.response?.data,
        stack: error?.stack
      });
      setError(`Failed to get response: ${errorMsg}`);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or call our clinic directly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: practiceConfig.chat.initialMessage,
        timestamp: new Date()
      }
    ]);
    setError(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 py-6 sm:py-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${colorClasses.gradientBg} rounded-full mb-3 sm:mb-4`}>
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${colorClasses.gradient} bg-clip-text text-transparent`}>
            {practiceConfig.name}
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Chat with {practiceConfig.chat.assistantName}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-4">
            Experience our AI {practiceConfig.type} assistant for appointment scheduling and treatment information. 
            {practiceConfig.chat.assistantName} knows all about {practiceConfig.doctor}'s professional {practiceConfig.type} services.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Chat Header */}
          <div className={`${colorClasses.gradientBg} text-white p-4 sm:p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold">{practiceConfig.chat.assistantName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">{practiceConfig.chat.assistantName} - {practiceConfig.branding.tagline}</h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-100">
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                    <span>Online & Ready to Help</span>
                  </div>
                </div>
              </div>
              <button
                onClick={resetChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="h-[400px] sm:h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 ${colorClasses.gradientBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] sm:max-w-[80%] ${
                  message.role === 'user' 
                    ? `${colorClasses.gradientBg} text-white` 
                    : 'bg-gray-100 text-gray-900'
                } rounded-2xl px-4 py-3`}>
                  <div 
                    className="text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  />
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className={`w-8 h-8 ${colorClasses.gradientBg} rounded-full flex items-center justify-center`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">{practiceConfig.chat.assistantName} is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4 sm:p-6">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${practiceConfig.chat.assistantName}...`}
                className="flex-1 min-h-[44px] max-h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base text-gray-900 placeholder-gray-500 bg-white"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`${colorClasses.button} disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg flex items-center gap-2`}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/30 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-700" />
            Try These Questions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              `What ${practiceConfig.type} services do you offer?`,
              `What are your hours?`,
              `Can I schedule an appointment?`,
              `Do you accept insurance?`,
              `What should I expect during my first visit?`,
              `How do I prepare for my appointment?`
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => handleTryThisClick(question)}
                className="text-left p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md text-sm text-gray-800 hover:text-gray-900 font-medium hover:border-gray-300"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center text-sm text-gray-600 bg-white/40 rounded-xl p-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Call for immediate assistance</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Book online 24/7</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This is a demonstration of {practiceConfig.name}'s AI assistant capabilities
          </p>
        </div>
      </div>
    </div>
  );
} 