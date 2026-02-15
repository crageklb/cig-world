/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'punta-cana': {
          sand: '#F4E4C1',
          ocean: '#0077BE',
          'ocean-deep': '#004E7C',
          sunset: '#FF6B35',
          palm: '#2D5016',
        }
      }
    },
  },
  plugins: [],
}
