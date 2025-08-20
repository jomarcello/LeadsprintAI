import { practiceConfig } from '@/lib/practice-config'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {practiceConfig.name}
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {practiceConfig.doctor} - {practiceConfig.specialization}
          </p>
          <p className="text-lg text-gray-500">
            📍 {practiceConfig.location}
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to {practiceConfig.name}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              At {practiceConfig.name}, we are committed to providing exceptional healthcare 
              services to our patients. Led by {practiceConfig.doctor}, our experienced team 
              specializes in {practiceConfig.specialization.toLowerCase()} and is dedicated 
              to your health and wellbeing.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Located in the heart of {practiceConfig.location}, we offer comprehensive 
              medical care in a comfortable and professional environment. Our state-of-the-art 
              facility is equipped with the latest medical technology to ensure you receive 
              the best possible care.
            </p>
          </section>

          {/* Services Section */}
          <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Our Services</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏥</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">General Consultation</h3>
                <p className="text-gray-600 text-sm">Comprehensive health assessments and medical advice</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💉</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Preventive Care</h3>
                <p className="text-gray-600 text-sm">Vaccinations, screenings, and health maintenance</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🩺</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Specialized Treatment</h3>
                <p className="text-gray-600 text-sm">Expert care in {practiceConfig.specialization.toLowerCase()}</p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Us</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Get in Touch</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📞</span>
                    <span className="text-gray-600">{practiceConfig.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">✉️</span>
                    <span className="text-gray-600">{practiceConfig.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">🌐</span>
                    <a href={practiceConfig.website} className="text-blue-600 hover:underline">
                      {practiceConfig.website}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📍</span>
                    <span className="text-gray-600">{practiceConfig.location}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Opening Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-gray-500 mb-2">
            © 2024 {practiceConfig.name}. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            🤖 Powered by Leadsprint AI - Healthcare Demo Platform
          </p>
        </footer>
      </div>
    </div>
  )
}