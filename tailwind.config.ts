import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        duskk: {
          900: "#0F0F0F",
          850: "#171717",
          800: "#1E1E1E",
          700: "#2A2A2A",
          600: "#444444",
          500: "#666666",
          400: "#999999",
          300: "#CCCCCC",
          200: "#E5E5E5",
          100: "#F4F4F4",
          50: "#FAFAFA",
          cream: "#FAF8F5",
          gold: "#C5A880",
          goldHover: "#B3956B",
          goldLight: "#F5EFE6",
          champagne: "#E8DFD1",
          rose: "#E8D3C8",
          emerald: "#1B4D3E",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
