/** @type {iaport('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
