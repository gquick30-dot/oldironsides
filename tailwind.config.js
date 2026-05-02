/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // === BUTTON STATES ===

        // === CHEST BUTTON ===
        chestBtn: "#BF8E46",
        chestBtnOutline: "#BF8E46",

        // SELECTED BUTTON BACKGROUND
        selectedBtnBg: "#32220D",

        // SELECTED BUTTON OUTLINE
        selectedBtnOutline: "#6D5333",

        // NON-SELECTED BUTTON BACKGROUND
        idleBtnBg: "#130E08",

        // NON-SELECTED BUTTON OUTLINE
        idleBtnOutline: "#6D5333",

        // SELECTED BUTTON TEXT
        selectedBtnText: "#E6C07F",

        // NON-SELECTED BUTTON TEXT
        idleBtnText: "#9C9791",

        // === ROAST DISPLAY ===

        // ROAST TITLE
        roastTitle: "#C08C45",

        // STAR EMBLEM
        roastStar: "#C08C45",

        // ROAST SUBTITLE
        roastSubtitle: "#B39871",

        // TASTING NOTES CONTAINER BORDER
        tastingContainer: "#6D5333",

        // TASTING NOTES TEXT
        tastingText: "#B5976D",

        // OLD ORIGINAL COLORS
        ironsideBlack: "#0B0B0B",
        ironsideBlackSoft: "#111111",
        ironsideCharcoal: "#151515",

        ironsideGold: "#C6A15B",
        ironsideGoldBright: "#E0B86D",
        ironsideGoldDark: "#9F7A3E",

        ironsideBronze: "#A68A6D",
        ironsideBronzeDark: "#8C6B4F",

        ironsideWhite: "#F4F1EA",
        ironsideText: "#D8D8D8",
        ironsideMuted: "#9A9A9A",
        ironsideFaint: "#6F6F6F",

        ironsideBorder: "rgba(198,161,91,0.25)",
        ironsideBorderStrong: "rgba(198,161,91,0.6)",
      },

      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        cinzelDecor: ["Cinzel Decorative", "serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        merriweather: ["Merriweather", "serif"],
        playfair: ["Playfair Display", "serif"],
        ebgaramond: ["EB Garamond", "serif"],
      },

      boxShadow: {
        ironsideGlow: "0 0 25px rgba(198,161,91,0.25)",
        ironsideGlowSoft: "0 0 60px rgba(198,161,91,0.15)",
        ironsideCard: "0 10px 40px rgba(0,0,0,0.6)",
      },

      backgroundImage: {
        // HEADLINE gradient (white → gold → bronze)
        ironsideHeadline:
          "linear-gradient(180deg, #F4F1EA 0%, #E8DCC4 35%, #C6A15B 70%, #9F7A3E 100%)",
        // CHEST BUTTON BACKGROUND COLOR
        chestTexture: "url('/chest-color.png')",

        // Subheading bronze gradient
        ironsideBronzeText:
          "linear-gradient(180deg, #E0B86D 0%, #C6A15B 50%, #8C6B4F 100%)",

        // Buttons
        ironsideGoldGradient:
          "linear-gradient(135deg, #E0B86D 0%, #C6A15B 40%, #9F7A3E 100%)",

        // Background overlays
        ironsideDarkFade:
          "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6), rgba(0,0,0,0.9))",

        ironsideRadialGlow:
          "radial-gradient(circle at center, rgba(198,161,91,0.15), rgba(0,0,0,0) 60%)",
      },
    },
  },
  plugins: [],
};
