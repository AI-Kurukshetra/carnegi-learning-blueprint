import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-main': '#F0F7FF',
        'brand-blue': '#007AFF',
        'brand-indigo': '#5856D6',
        'bright-cyan': '#32ADE6',
        'vivid-orange': '#FF9500',
        'text-blue-dark': '#001A33',
        'brand-primary': '#007AFF',
        'brand-secondary': '#5856D6',
        'ai-glow': '#32ADE6',
        'status-error': '#E63946',
        'text-main': '#001A33',
      },
      boxShadow: {
        glass: '0 10px 40px -10px rgba(0, 50, 100, 0.1)',
        'glass-lg': '0 18px 48px -16px rgba(0, 40, 110, 0.2)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'mesh-drift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        'mesh-drift': 'mesh-drift 18s ease infinite',
      },
    },
  },
  plugins: [forms, typography],
}
