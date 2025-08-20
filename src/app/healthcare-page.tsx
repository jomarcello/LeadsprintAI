'use client';

import { getCurrentPractice } from '@/lib/practice-config';
import ChatDemo from '@/components/ChatDemo';
import VoiceDemo from '@/components/VoiceDemo';
import { Calendar, Phone, MapPin, Clock, Star, CheckCircle } from 'lucide-react';

export default function HealthcarePage() {
  const practice = getCurrentPractice();
  
  return (
    <div className={practice.template.backgroundGradient}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{practice.name}</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-gray-900 font-medium">Home</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium">About</a>
              <a href="#services" className="text-gray-700 hover:text-gray-900 font-medium">Services</a>
              <a href="#demos" className="text-gray-700 hover:text-gray-900 font-medium">AI Assistant</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {practice.template.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {practice.template.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className={practice.template.buttonStyling}>
                <Calendar className="w-5 h-5 mr-2" />
                {practice.template.ctaText}
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {practice.template.aboutTitle}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {practice.template.aboutText}
              </p>
              
              {/* Doctor Info */}
              <div className={practice.template.cardStyling}>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {practice.doctor.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{practice.doctor}</h3>
                    <p className="text-gray-600">{practice.branding.focus}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{practice.location}</span>
                </div>
              </div>
            </div>
            
            <div className={practice.template.cardStyling}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Expert {practice.type} care</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Modern treatment techniques</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Personalized treatment plans</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>AI-powered appointment scheduling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {practice.template.servicesTitle}
            </h2>
            <p className="text-xl text-gray-600">{practice.branding.tagline}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {practice.services.map((service, index) => (
              <div key={index} className={practice.template.cardStyling}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  {service.duration && (
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Demos */}
      <section id="demos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Assistant Demo
            </h2>
            <p className="text-xl text-gray-600">
              Experience our advanced AI-powered appointment scheduling system
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chat Demo */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                💬 Chat Assistant
              </h3>
              <ChatDemo />
            </div>
            
            {/* Voice Demo */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                🎤 Voice Assistant
              </h3>
              <VoiceDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {practice.template.contactTitle}
            </h2>
            <p className="text-xl text-gray-600">
              Ready to experience {practice.branding.focus}?
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div className={practice.template.cardStyling}>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{practice.location}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Call for appointments</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Monday - Friday: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
            
            <div className={practice.template.cardStyling}>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <button className={practice.template.buttonStyling + " w-full"}>
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Online
                </button>
                <button className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-lg transition-all duration-300">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Clinic
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">{practice.name}</h3>
            <p className="text-gray-400 mb-4">{practice.branding.tagline}</p>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
              <span>© 2025 {practice.name}</span>
              <span>•</span>
              <span>{practice.doctor}</span>
              <span>•</span>
              <span>{practice.location}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}