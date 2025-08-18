'use client';

import { useEffect } from 'react';
import { Bot, Sparkles, Phone, Calendar, Users, Zap, CheckCircle, ArrowRight, Globe, Mic } from 'lucide-react';
import GeminiLiveVoiceDemo from '@/components/GeminiLiveVoiceDemo';
import { getCurrentPractice } from '@/lib/practice-config';

export default function ThaiPage() {
  const practiceConfig = getCurrentPractice();

  useEffect(() => {
    document.title = "BeautyMed Clinic - ผู้ช่วยความงาม AI | Dr. Siriporn Thanakit";
  }, []);

  const colorClasses = {
    gradient: 'from-pink-600 to-purple-600',
    gradientBg: 'bg-gradient-to-r from-pink-600 to-purple-600',
    button: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
    text: 'text-pink-600',
    accent: 'text-purple-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
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
                  BeautyMed Clinic
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">ผู้ช่วยเสียง AI ภาษาไทย</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Globe className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClasses.text}`} />
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">ไทย</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className={`inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium mb-4`}>
            <Zap className="w-4 h-4" />
            การสาธิตแบบโต้ตอบ
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            ผู้ช่วยความงาม AI ของคุณ
            <br />
            <span className={`text-2xl sm:text-4xl bg-gradient-to-r ${colorClasses.gradient} bg-clip-text text-transparent`}>
              Robin พร้อมให้บริการแล้ว
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-2 mb-6">
            สัมผัสประสบการณ์กับ <strong>Robin</strong> ผู้ช่วยความงาม AI ที่พูดภาษาไทยได้คล่องแคล่วและให้บริการนัดหมายตลอด 24 ชั่วโมง 
            สำหรับลูกค้า BeautyMed Clinic ด้วยเสียงผู้หญิงไทยที่อบอุ่นและเป็นมิตร
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className={`flex items-center gap-2 ${colorClasses.accent}`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">คลินิกของ Dr. Siriporn Thanakit</span>
            </div>
            <div className={`flex items-center gap-2 text-purple-700`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">บริการความงาม {practiceConfig.services.length} แบบ</span>
            </div>
            <div className={`flex items-center gap-2 ${colorClasses.accent}`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">เทคโนโลยี AI ขั้นสูง</span>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            ผู้ช่วยเสียงของคุณทำงานอย่างไร
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">1. ลูกค้าโทรมา</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                ลูกค้าโทรมาที่คลินิกและได้รับการต้อนรับจาก Robin ผู้ช่วยความงาม AI 
                ที่จะแนะนำตนเองและอธิบายการรักษาที่มีให้บริการ
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">2. การสนทนา AI</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Robin สามารถสนทนาธรรมชาติ เข้าใจความต้องการของลูกค้า และแนะนำ
                ตัวเลือกการรักษาตามความเชี่ยวชาญของ Dr. Siriporn Thanakit
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">3. จองนัดหมายสำเร็จ</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Robin เก็บข้อมูลลูกค้า ปิดนัดหมาย และยืนยันรายละเอียดทั้งหมด
                อย่างมืออาชีพตามมาตรฐานของคลินิก
              </p>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              การสาธิตสด - ลอง Robin ตอนนี้
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ลองสัมผัสประสบการณ์การสนทนาภาษาไทยกับ Robin ผู้ช่วยความงาม AI 
              ที่พูดไทยได้คล่องและเข้าใจวัฒนธรรมไทยอย่างลึกซึ้ง
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Powered by Play.ht Thai Voice Agent
              </span>
            </div>
          </div>

          {/* Demo Interface */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
            <GeminiLiveVoiceDemo />
          </div>
        </div>

        {/* Available Treatments */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            Robin รู้จักการรักษาทั้งหมดของคุณ
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

        {/* Benefits Section */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            ประโยชน์สำหรับ BeautyMed Clinic
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colorClasses.gradientBg} rounded-xl flex items-center justify-center`}>
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">ประสบการณ์ลูกค้า</h4>
                  <p className="text-sm sm:text-base text-gray-600">เข้าถึงง่าย สะดวกสบาย</p>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>บริการนัดหมายตลอด 24 ชั่วโมง</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>การให้บริการลูกค้าที่สม่ำเสมอและมืออาชีพ</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>คำอธิบายการรักษาและการให้ความรู้แบบละเอียด</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>ลดเวลารอสำหรับการจองนัดหมาย</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center`}>
                  <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">ประสิทธิภาพของคลินิก</h4>
                  <p className="text-sm sm:text-base text-gray-600">การดำเนินงานที่คล่องตัวและการเติบโต</p>
                </div>
              </div>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>ลดภาระงานของพนักงานในการรับโทรศัพท์</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />  
                  <span>เก็บข้อมูลลูกค้าอัตโนมัติ</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />
                  <span>โซลูชันที่ขยายได้สำหรับการเติบโตของคลินิก</span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowRight className={`w-4 h-4 ${colorClasses.text}`} />  
                  <span>การนำเสนอแบรนด์อย่างมืออาชีพ</span>
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
                การใช้งานจริง: หมายเลขโทรศัพท์ของคุณ
              </h3>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                นี่คือการสาธิต ผู้ช่วยเสียงจริงจะติดตั้งบนหมายเลขโทรศัพท์ธุรกิจของคุณโดยตรง
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-6 h-6" />
                  <h4 className="text-xl font-bold">ประสบการณ์การสาธิต (เว็บไซต์นี้)</h4>
                </div>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>การสาธิตแบบโต้ตอบผ่านเว็บเบราว์เซอร์</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>ทดสอบฟังก์ชันเสียงและแชท</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>สัมผัสความสามารถของ Robin</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6" />
                  <h4 className="text-xl font-bold">การใช้งานจริง (คลินิกของคุณ)</h4>
                </div>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>ติดตั้งบนสายโทรศัพท์หลักของคุณ</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>ลูกค้าโทรมาหมายเลขของคุณโดยตรง</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>การจองนัดหมายอัตโนมัติตลอด 24 ชั่วโมง</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Zap className="w-6 h-6" />
                <span>พร้อมติดตั้งบนระบบโทรศัพท์ของคุณ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center gap-3">
            🚀 เทคโนโลยี AI ขั้นสูง
          </h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">เครื่องมือสนทนา AI</h4>
              <p className="text-gray-600 leading-relaxed">
                AI สนทนาระดับองค์กรพร้อมการโต้ตอบด้วยเสียงธรรมชาติและการฝึกอบรมเฉพาะทางด้านความงาม
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">การประมวลผลเสียงแบบเรียลไทม์</h4>
              <p className="text-gray-600 leading-relaxed">
                การรู้จำเสียงพูดและการประมวลผลภาษาธรรมชาติแบบเวลาจริงสำหรับการสนทนาที่ลื่นไหล
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClasses.gradientBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">การปรับแต่งเฉพาะ</h4>
              <p className="text-gray-600 leading-relaxed">
                ปรับแต่งเฉพาะสำหรับ BeautyMed Clinic ตามโปรโตคอลการรักษาและการตั้งค่าของคลินิก Dr. Siriporn Thanakit
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600">
              BeautyMed Clinic ผู้ช่วยเสียง AI - สัมผัสอนาคตของการนัดหมายความงาม
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Dr. Siriporn Thanakit • กรุงเทพมหานคร ประเทศไทย • ขับเคลื่อนด้วยเทคโนโลยี AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}