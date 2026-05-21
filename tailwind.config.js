/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Reader themes — exposed as semantic tokens via CSS vars set by readerStore
        reader: {
          bg: "rgb(var(--reader-bg) / <alpha-value>)",
          fg: "rgb(var(--reader-fg) / <alpha-value>)",
          muted: "rgb(var(--reader-muted) / <alpha-value>)",
          accent: "rgb(var(--reader-accent) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["System"],
        mono: ["Courier New", "monospace"],
      },
      fontSize: {
        "2xs": "10px",
        "3xs": "8px",
      },
      screens: {
        base: "0px",
      },
    },
  },
  plugins: [],
};
