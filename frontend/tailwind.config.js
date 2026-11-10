/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C5161D',
          'red-dark': '#9E1218',
          'red-light': '#E5383B',
          gold: '#C88A36',
          amber: '#D4AF37',
        },
        metal: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#8A95A5',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E242B',
          850: '#161B22',
          900: '#0F1318',
          950: '#0A0D10',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F4EFEA',
          200: '#E8DFD5',
          300: '#D6C8B7',
          400: '#BAA38D',
          500: '#9E8268',
          600: '#7E634B',
          700: '#5F4835',
          800: '#3F2F22',
          850: '#2A1F16',
          900: '#1C150F',
          950: '#120E0A',
        },
        earth: {
          espresso: '#1A1412',
          timber: '#2B1E16',
          sand: '#EBE5DC',
          linen: '#F6F3EE',
          cream: '#FCFAF6',
          warmgray: '#1E1B18',
          walnut: '#3D2817',
          bronze: '#8C6239',
        },
        hara: {
          red: '#C5161D',
          'red-dark': '#9E1218',
          'red-light': '#E5383B',
          black: '#111111',
          charcoal: '#1F2421',
          'charcoal-light': '#2A302C',
          gray: '#F3F4F6',
          'gray-dark': '#4B5563',
          border: '#E5E7EB',
        }
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '0.8': '0.2rem',
        '18': '4.5rem',
      },
      scale: {
        '108': '1.08',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out both',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', '-apple-system', 'sans-serif'],
        amharic: ['Noto Sans Ethiopic', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
