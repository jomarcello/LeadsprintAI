/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // CRITICAL: Force all healthcare dynamic classes
    'from-emerald-600', 'to-green-600', 'from-emerald-700', 'to-green-700',
    'from-pink-600', 'to-purple-600', 'from-pink-700', 'to-purple-700', 
    'from-blue-600', 'to-indigo-600', 'from-blue-700', 'to-indigo-700',
    'text-emerald-600', 'text-pink-600', 'text-blue-600', 
    'text-green-700', 'text-purple-700', 'text-indigo-700',
    'bg-emerald-600', 'bg-pink-600', 'bg-blue-600',
    'hover:from-emerald-700', 'hover:to-green-700',
    'hover:from-pink-700', 'hover:to-purple-700',
    'hover:from-blue-700', 'hover:to-indigo-700',
    // Background gradients - FORCE GENERATION
    'bg-gradient-to-r', 'bg-gradient-to-br', 'bg-gradient-to-l', 'bg-gradient-to-t', 'bg-gradient-to-b',
    'from-blue-50', 'via-indigo-50', 'to-blue-100',
    'from-blue-100', 'via-indigo-100', 'to-purple-100',
    // Shadows and borders
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'border', 'border-gray-100', 'border-gray-200', 'border-gray-300',
    // Spacing - CRITICAL for layout
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'px-10', 'px-12',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'py-10', 'py-12',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8', 'mx-auto',
    'mt-2', 'mt-4', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
    'mb-2', 'mb-4', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
    // Colors - ALL variants
    'text-white', 'text-black', 'text-gray-50', 'text-gray-100', 'text-gray-200',
    'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 
    'text-gray-700', 'text-gray-800', 'text-gray-900',
    'bg-white', 'bg-black', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-600', 'bg-indigo-700',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    // Hover states
    'hover:bg-blue-700', 'hover:bg-indigo-700', 'hover:bg-green-700',
    'hover:shadow-lg', 'hover:shadow-xl', 'hover:scale-105', 'hover:scale-110',
    // Layout - FORCE GRID CLASSES
    'flex', 'inline-flex', 'items-center', 'items-start', 'items-end',
    'justify-center', 'justify-start', 'justify-end', 'justify-between',
    'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-6', 'space-x-8',
    'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8',
    'w-4', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-full',
    'h-4', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-48', 'h-full',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
    'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl',
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'sm:grid-cols-2', 'md:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-10', 'gap-12',
    // Typography - FORCE ALL SIZES
    'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold',
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
    'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
    // Animations
    'transition-all', 'transition-colors', 'transition-transform', 'transition-shadow',
    'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 'duration-500',
    'ease-in', 'ease-out', 'ease-in-out',
    'animate-pulse', 'animate-bounce', 'animate-spin',
    'transform', 'scale-100', 'scale-105', 'scale-110', 'scale-95',
    'translate-x-0', 'translate-y-0', '-translate-y-1', 'translate-y-1',
    // States
    'cursor-pointer', 'cursor-default',
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    'invisible', 'visible',
    'overflow-hidden', 'overflow-auto', 'overflow-scroll',
    // Focus states
    'focus:outline-none', 'focus:ring-1', 'focus:ring-2', 'focus:ring-4',
    'focus:ring-blue-500', 'focus:ring-indigo-500', 'focus:ring-green-500',
    'focus:ring-offset-1', 'focus:ring-offset-2',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        healthcare: {
          primary: '#0066cc',
          secondary: '#004499',
          accent: '#0080ff',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'healthcare': '0 4px 6px -1px rgba(0, 102, 204, 0.1), 0 2px 4px -1px rgba(0, 102, 204, 0.06)',
      },
    },
  },
  plugins: [],
}