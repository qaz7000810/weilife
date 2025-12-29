/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        huninn: ['jf-openhuninn', 'sans-serif'],
        sans: ['jf-openhuninn', 'sans-serif'],  // 如果你想全站預設這個字型
      },
      colors: {
        quiz: {
          500: '#E0E0E0',
        },
      }
    }
  },
  plugins: []
}