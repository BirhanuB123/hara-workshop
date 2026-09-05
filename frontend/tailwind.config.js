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
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
