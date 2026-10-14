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
        municipal: {
          50: '#F0F5FF',
          100: '#E0EBFF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E3A8A', // Основной темно-синий гербовый цвет
          800: '#172554',
          900: '#0F172A',
        },
        sos: {
          light: '#FEE2E2',
          DEFAULT: '#EF4444',
          dark: '#B91C1C',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
