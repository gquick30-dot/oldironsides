/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ironsideBlack: "#0E0E0E",
        ironsideBronze: "#A68A6D",
        ironsideBronzeDark: "#8C6B4F",
        ironsideWhite: "#EAEAEA",
        ironsideMuted: "#9A9A9A",
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        merriweather: ["Merriweather", "serif"],
        playfair: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
