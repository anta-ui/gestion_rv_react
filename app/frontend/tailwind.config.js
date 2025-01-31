/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        deepRed:'#210202',
        marRed:'linear-gradient(to bottom, #210202, #6b0101)',
      }
    },
  },
  plugins: [],
}
