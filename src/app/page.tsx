'use client';

import { useState, useEffect } from 'react';
import { Mic, MessageCircle, Bot, Sparkles, Phone, Calendar, Users, Zap, CheckCircle, ArrowRight, Clock, Shield } from 'lucide-react';
import VoiceDemo from '@/components/VoiceDemo';
import ThaiPage from '@/components/ThaiPage';
import ChatDemo from '@/components/ChatDemo';
import { getCurrentPractice } from '@/lib/practice-config';

export default function Home() {
  // Get current practice configuration
  const practiceConfig = getCurrentPractice();
  
  // Debug log
  console.log('🏥 Current practice:', practiceConfig.id, 'Port:', typeof window !== 'undefined' ? window.location.port : 'server-side');
  
  // If BeautyMed, show Thai page
  if (practiceConfig.id === 'beautymed') {
    return <ThaiPage />;
  }
  
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');

  // Set dynamic document title based on practice
  useEffect(() => {
    if (practiceConfig.id === 'spinealign') {
      document.title = "SpineAlign Center - AI Wellness Assistant | Dr. Sherra Conde";
    } else if (practiceConfig.id === 'beautymed') {
      document.title = "BeautyMed Clinic - AI Beauty Assistant | Dr. Siriporn Thanakit";
    } else {
      document.title = "Smith Chiropractic - AI Assistant | Dr. John Smith";
    }
  }, [practiceConfig.id]);

  // Dynamic color classes based on practice
  const colorClasses = practiceConfig.branding.primaryColor === 'emerald' 
    ? {
        gradient: 'from-emerald-600 to-green-600',
        gradientBg: 'bg-gradient-to-r from-emerald-600 to-green-600',
        button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
        text: 'text-emerald-600',
        accent: 'text-green-700'
      }
    : practiceConfig.branding.primaryColor === 'pink'
    ? {
        gradient: 'from-pink-600 to-purple-600',
        gradientBg: 'bg-gradient-to-r from-pink-600 to-purple-600',
        button: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
        text: 'text-pink-600',
        accent: 'text-purple-700'
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClasses.gradientBg} rounded-xl flex items-center justify-center`}>
                <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${colorClasses.gradient} bg-clip-text text-transparent`}>
                  {practiceConfig.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">AI Voice Agent Demo</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClasses.text}`} />
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Live Demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className={`inline-flex items-center gap-2 ${practiceConfig.branding.primaryColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} px-4 py-2 rounded-full text-sm font-medium mb-4`}>
            <Zap className="w-4 h-4" />
            Interactive Demo Presentation
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Meet Robin: Your AI 
            <br />
            <span className={`text-2xl sm:text-4xl bg-gradient-to-r ${colorClasses.gradient} bg-clip-text text-transparent`}>
              Appointment Assistant
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-2 mb-6">
            Experience how <strong>Robin</strong> handles patient calls with human-like conversations, schedules appointments instantly, 
            and answers questions about {practiceConfig.name} services - completely automated, 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className={`flex items-center gap-2 ${colorClasses.accent}`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">24/7 Phone Coverage</span>
            </div>
            <div className={`flex items-center gap-2 ${practiceConfig.branding.primaryColor === 'emerald' ? 'text-emerald-700' : 'text-indigo-700'}`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Instant Appointment Booking</span>
            </div>
            <div className={`flex items-center gap-2 ${colorClasses.accent}`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Human-Like Conversations</span>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            How Your Voice Agent Works
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">1. Patient Calls</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Patients call your practice and are greeted by Robin, who introduces herself as your AI {practiceConfig.type} 
                assistant and explains the available treatments.
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 ${practiceConfig.branding.primaryColor === 'emerald' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">2. AI Conversation</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Robin conducts natural conversations, understanding patient needs and guiding them through 
                treatment options with {practiceConfig.doctor}'s expertise built-in.
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">3. Appointment Booked</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Robin collects patient information, schedules appointments, and confirms all details 
                professionally while maintaining your practice's high standards.
              </p>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Live Demo - Try Robin Now
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Click below to experience exactly what your patients will hear when they call {practiceConfig.name}. 
              Robin knows about all {practiceConfig.services.length} of your {practiceConfig.type} services and {practiceConfig.doctor}'s expertise.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 sm:p-2 border border-white/20 w-full max-w-md sm:max-w-none sm:w-auto">
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex-1 sm:flex-none justify-center ${
                    activeTab === 'voice'
                      ? `${colorClasses.gradientBg} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Voice Demo</span>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex-1 sm:flex-none justify-center ${
                    activeTab === 'chat'
                      ? `${practiceConfig.branding.primaryColor === 'emerald' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Chat Demo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Demo Interface */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
            {activeTab === 'voice' ? <VoiceDemo /> : <ChatDemo />}
          </div>
        </div>

        {/* Available Treatments */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            Robin Knows All Your Treatments
          </h3>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {practiceConfig.services.map((service, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 ${colorClasses.gradientBg} rounded-full`}></div>
                  <h4 className="font-semibold text-gray-900 text-sm">{service.name}</h4>
                </div>
                <p className="text-xs text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits for Practice */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            Benefits for {practiceConfig.name}
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colorClasses.gradientBg} rounded-xl flex items-center justify-center`}>
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">Patient Experience</h4>
                  <p className="text-sm sm:text-base text-gray-600">Enhanced accessibility & convenience</p>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>24/7 availability for appointment scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>Consistent, professional patient interactions</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>Detailed treatment explanations & education</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>Reduced wait times for appointment booking</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${practiceConfig.branding.primaryColor === 'emerald' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} rounded-xl flex items-center justify-center`}>
                  <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">Practice Efficiency</h4>
                  <p className="text-sm sm:text-base text-gray-600">Streamlined operations & growth</p>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>Reduced staff workload for phone scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />  
                  <span>Automated patient information collection</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>Scalable solution for practice growth</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />  
                  <span>Professional brand representation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Real Implementation Section */}
        <div className="mb-8 sm:mb-12">
          <div className={`${colorClasses.gradientBg} rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white`}>
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                <Phone className="w-8 h-8" />
                Real Implementation: Your Phone Number
              </h3>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                This is a demonstration. The actual voice agent will be installed directly on your 
                business phone number.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              {/* Demo Experience */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-6 h-6" />
                  <h4 className="text-xl font-bold">Demo Experience (This Website)</h4>
                </div>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Interactive demo via web browser</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Test voice and chat functionality</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Experience Robin's capabilities</span>
                  </li>
                </ul>
              </div>

              {/* Live Implementation */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6" />
                  <h4 className="text-xl font-bold">Live Implementation (Your Practice)</h4>
                </div>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Installed on your main phone line</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Patients call your phone number directly</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>24/7 automated appointment booking</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Zap className="w-6 h-6" />
                <span>Ready to install on your phone system</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced AI Technology Stack */}
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center gap-3">
            🚀 Advanced AI Technology Stack
          </h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">AI Conversation Engine</h4>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade conversational AI with natural voice interaction and healthcare-specific training
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Real-time Voice Processing</h4>
              <p className="text-gray-600 leading-relaxed">
                Low-latency speech recognition and natural language processing for seamless conversations
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Custom Integration</h4>
              <p className="text-gray-600 leading-relaxed">
                Tailored specifically for {practiceConfig.name} with {practiceConfig.doctor}'s treatment protocols and practice preferences
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CTA Section - Free Discovery Call */}
      <section className={`${colorClasses.gradientBg} py-12 sm:py-16`}>
        <div className="max-w-4xl mx-auto text-center text-white px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Install Robin at {practiceConfig.name}?
            </h2>
            <p className="text-xl sm:text-2xl mb-2 text-white/95">
              You've seen how Robin handles patient calls perfectly
            </p>
            <p className="text-lg text-white/80 mb-8">
              Let's get this AI assistant working on your practice's phone line within 48 hours
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-lg">Implementation Guarantee</span>
            </div>
            <p className="text-white/90">
              "Your AI assistant will be live and taking patient calls within 48 hours, or you don't pay a penny."
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="https://calendly.com/pierre-bjorlin"
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Calendar className="w-6 h-6" />
              Free Discovery Call
            </a>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                15-minute call
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                No commitment required
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Custom setup for {practiceConfig.name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600">
              {practiceConfig.name} AI Voice Agent Demo - Experience the Future of {practiceConfig.type.charAt(0).toUpperCase() + practiceConfig.type.slice(1)} Scheduling
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              {practiceConfig.doctor} • Powered by AI Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
