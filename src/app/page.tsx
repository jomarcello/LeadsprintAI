'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-coral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Creator Avatar</h1>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Home</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">About</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Projects</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Automation</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">SIGMAPIPS AI</h2>
          <p className="text-xl text-gray-600 mb-8">Portfolio Creator Avatar</p>
        </div>

        {/* Project Details */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-gray-700">Year:</span>
                <span className="ml-2 text-gray-600">2025</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Industry:</span>
                <span className="ml-2 text-gray-600">Beauty</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Client:</span>
                <span className="ml-2 text-gray-600">VisualForms Studio</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Project Duration:</span>
                <span className="ml-2 text-gray-600">3 weeks</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-gradient-to-br from-coral-400 to-pink-400 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-lg font-medium">Featured Project Cover Image</p>
                <p className="text-sm opacity-90 mt-2">3D Abstract Artwork</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Description</h3>
          <p className="text-gray-600 leading-relaxed">
            A visually striking 3D abstract artwork featuring a coral-colored spiral form with smooth, flowing curves and a soft pink gradient background, emphasizing modern digital aesthetics and organic geometry.
          </p>
        </div>

        {/* Problem Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">PROBLEM</h3>
          <p className="text-gray-600 leading-relaxed">
            In the world of digital art, it can be difficult to create abstract compositions that are both visually captivating and harmonious. Many 3D artworks either lack a sense of organic flow or fail to stand out due to uniformity in design approaches.
          </p>
        </div>

        {/* Solution Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">SOLUTION</h3>
          <p className="text-gray-600 leading-relaxed">
            By leveraging advanced 3D modeling techniques and carefully curated color palettes, we created a coral-colored spiral form that embodies both mathematical precision and organic beauty. The smooth, flowing curves create a sense of movement and life, while the soft pink gradient background provides the perfect complementary backdrop.
          </p>
        </div>

        {/* Challenge Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">CHALLENGE</h3>
          <p className="text-gray-600 leading-relaxed">
            The primary challenge was achieving the perfect balance between geometric precision and organic fluidity. The spiral needed to feel both mathematically sound and naturally flowing, requiring extensive experimentation with curve algorithms and surface texturing techniques.
          </p>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">SUMMARY</h3>
          <p className="text-gray-600 leading-relaxed">
            The final artwork successfully merges cutting-edge 3D technology with artistic vision, resulting in a piece that speaks to both technical excellence and emotional resonance. The coral spiral stands as a testament to what's possible when digital tools are wielded with artistic sensitivity and technical expertise.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Contact</h3>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-semibold">Duncan Shen</span>
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Email:</span> duncan@visualforms.studio
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Phone:</span> +1 (555) 123-4567
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm">
              © 2025 Portfolio Creator Avatar. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
