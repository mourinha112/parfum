import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fdf8e6",
          100: "#faefc3",
          200: "#f4df88",
          300: "#eccc51",
          400: "#e5b800",
          500: "#d4af37",
          600: "#b8912b",
          700: "#8f6f1f",
          800: "#6b5317",
          900: "#4a3a10",
        },
        night: {
          900: "#050505",
          800: "#0a0a0a",
          700: "#121212",
          600: "#1a1a1a",
          500: "#222222",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 30px rgba(212, 175, 55, 0.25)",
        "gold-lg": "0 0 60px rgba(212, 175, 55, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
