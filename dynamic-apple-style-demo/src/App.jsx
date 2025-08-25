import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import * as THREE from 'three'

function App() {
  const [activeProduct, setActiveProduct] = useState(0)
  const heroRef = useRef(null)
  const productRef = useRef(null)
  const threeContainerRef = useRef(null)

  // Product data
  const products = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      description: 'The ultimate iPhone experience',
      color: '#000000'
    },
    {
      id: 2,
      name: 'MacBook Air',
      description: 'Powerful. Portable. Pocketable.',
      color: '#f5f5f7'
    },
    {
      id: 3,
      name: 'Apple Watch Ultra',
      description: 'The most rugged and capable Apple Watch',
      color: '#1d1d1f'
    }
  ]

  // Initialize Three.js scene
  useEffect(() => {
    if (!threeContainerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    threeContainerRef.current.appendChild(renderer.domElement)

    // Create floating objects
    const objects = []
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        transparent: true,
        opacity: 0.6
      })
      const cube = new THREE.Mesh(geometry, material)
      
      cube.position.x = (Math.random() - 0.5) * 20
      cube.position.y = (Math.random() - 0.5) * 20
      cube.position.z = (Math.random() - 0.5) * 20
      
      cube.rotation.x = Math.random() * Math.PI
      cube.rotation.y = Math.random() * Math.PI
      
      scene.add(cube)
      objects.push(cube)
    }

    camera.position.z = 5

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      objects.forEach((obj, index) => {
        obj.rotation.x += 0.005 * (index % 2 === 0 ? 1 : -1)
        obj.rotation.y += 0.005 * (index % 2 === 0 ? -1 : 1)
        
        // Floating motion
        obj.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01
      })
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      threeContainerRef.current.removeChild(renderer.domElement)
    }
  }, [])

  // GSAP animations
  useEffect(() => {
    // Hero section animations
    gsap.from('.hero-title', {
      duration: 1.5,
      y: 50,
      opacity: 0,
      ease: 'power3.out'
    })

    gsap.from('.hero-subtitle', {
      duration: 1.5,
      y: 30,
      opacity: 0,
      delay: 0.3,
      ease: 'power3.out'
    })

    gsap.from('.hero-button', {
      duration: 1.5,
      y: 30,
      opacity: 0,
      delay: 0.6,
      ease: 'power3.out'
    })

    // Product cards animation
    gsap.from('.product-card', {
      duration: 1,
      x: -100,
      opacity: 0,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.products-section',
        start: 'top 80%'
      }
    })

    // Floating elements
    gsap.to('.floating-element', {
      y: -20,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
      stagger: 0.5
    })
  }, [])

  const handleProductClick = (index) => {
    setActiveProduct(index)
    
    // Animate product card
    gsap.to(`.product-card-${index}`, {
      scale: 1.05,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    })
  }

  return (
    <div className="min-h-screen bg-apple-gray">
      {/* Three.js background */}
      <div ref={threeContainerRef} className="fixed inset-0 z-0" />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 z-10" />
        
        {/* Floating elements */}
        <div className="floating-element absolute top-20 left-10 w-20 h-20 bg-apple-blue/20 rounded-full blur-xl" />
        <div className="floating-element absolute top-40 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="floating-element absolute bottom-20 left-1/4 w-24 h-24 bg-black/10 rounded-full blur-xl" />
        
        <div className="relative z-20 text-center px-4">
          <motion.h1 
            className="hero-title text-6xl md:text-8xl font-bold text-apple-dark mb-6 font-sf-pro"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5 }}
          >
            Innovation
            <br />
            <span className="text-apple-blue">Redefined</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle text-xl md:text-2xl text-apple-dark/70 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >
            Experience the future of technology with stunning animations and immersive interactions
          </motion.p>
          
          <motion.button 
            className="hero-button bg-apple-blue text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-apple-blue/90 transition-all duration-300 transform hover:scale-105"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Products
          </motion.button>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-apple-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="products-section relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-apple-dark mb-4 font-sf-pro">
              Revolutionary Products
            </h2>
            <p className="text-xl text-apple-dark/70 max-w-2xl mx-auto">
              Discover our latest innovations designed to transform your digital experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                className={`product-card product-card-${index} bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer`}
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: index * 0.2 }}
                viewport={{ once: true }}
                onClick={() => handleProductClick(index)}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div 
                  className="w-full h-48 rounded-xl mb-6 flex items-center justify-center"
                  style={{ backgroundColor: product.color }}
                >
                  <div className="text-white text-6xl font-bold">
                    {product.name.split(' ').map(word => word[0]).join('')}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-apple-dark mb-2">{product.name}</h3>
                <p className="text-apple-dark/70 mb-4">{product.description}</p>
                
                <motion.button
                  className="w-full bg-apple-blue text-white py-3 rounded-lg font-medium hover:bg-apple-blue/90 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section ref={productRef} className="py-20 px-4 bg-apple-dark">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-8 font-sf-pro"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Interactive Experience
          </motion.h2>
          
          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p className="text-white/80 text-lg mb-6">
              Move your cursor around to see the magic happen
            </p>
            
            <motion.div 
              className="w-32 h-32 bg-gradient-to-r from-apple-blue to-purple-500 rounded-full mx-auto"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{
                scale: 1.2,
                rotate: 360,
                transition: { duration: 0.5 }
              }}
            />
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default App
