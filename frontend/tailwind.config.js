/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#ffffff',
          secondary: '#f8f9fc',
        },
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
        },
        accent: {
          primary: '#2872FA',
          secondary: '#64ED80',
        },
        border: '#e5e7eb',
      }
    },
  },
  plugins: [],
}
