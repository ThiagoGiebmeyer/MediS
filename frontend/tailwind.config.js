/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    darkMode: "media",
    theme: {
        extend: {
            fontFamily: {
                geist: ['GeistRegular'],
                geistSemiBold: ['GeistSemiBold'],
                geistBold: ['GeistBold'],
            },
            colors: {
                primary: {
                    a0: "#38e0a8",
                    a10: "#5ce4b1",
                    a20: "#77e8bb",
                    a30: "#8eecc4",
                    a40: "#a3efce",
                    a50: "#b6f3d8",
                },
                surface: {
                    a0: "#000000",
                    a10: "#1e1e1e",
                    a20: "#353535",
                    a30: "#4e4e4e",
                    a40: "#696969",
                    a50: "#858585",
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