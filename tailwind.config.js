/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'calvo': {
          light: '#BEBDDF',
          mid: '#8B8DC0',
          primary: '#6B6EA0',
          dark: '#262262',
          deep: '#1E1E52',
          white: '#EEEEF5',
        }
      }
    },
  },
  plugins: [],
}
