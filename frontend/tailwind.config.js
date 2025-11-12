/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: "#1b120d",
        surface: "#3c2a20",
        primary: "#d5cea4",
        secondary: "#e5e5cb",
      },
    },
  },
  plugins: [],
};