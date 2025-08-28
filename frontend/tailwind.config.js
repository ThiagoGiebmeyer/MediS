/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/react-native-tailwindcss/**/*.js',
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        geist: ['GeistRegular'],
        geistSemiBold: ['GeistSemiBold'],
        geistBold: ['GeistBold'],
      },
      colors: {
        primary: {
          a0: "#ff4400",
          a10: "#ff5f28",
          a20: "#ff7743",
          a30: "#ff8c5d",
          a40: "#ffa077",
          a50: "#ffb491",
        },
        surface: {
          a0: "#121212",
          a10: "#282828",
          a20: "#3f3f3f",
          a30: "#575757",
          a40: "#717171",
          a50: "#8b8b8b",
        },
        tonal: {
          a0: "#101a15",
          a10: "#262f2a",
          a20: "#3d4541",
          a30: "#565d59",
          a40: "#6f7672",
          a50: "#8a908d",
        },
      },
    },
  },
  plugins: [],
}