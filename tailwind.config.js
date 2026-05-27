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
        // App-chrome themes (Phase 2d) — CSS vars set at runtime by ThemeProvider
        // via vars(). Values are full color strings (hex/rgba), so no /<alpha>.
        app: {
          bg: "var(--app-bg)",
          surface: "var(--app-surface)",
          "surface-2": "var(--app-surface-2)",
          "surface-3": "var(--app-surface-3)",
          border: "var(--app-border)",
          "border-strong": "var(--app-border-strong)",
          text: "var(--app-text)",
          "text-dim": "var(--app-text-dim)",
          "text-muted": "var(--app-text-muted)",
          accent: "var(--app-accent)",
          "accent-dim": "var(--app-accent-dim)",
          "on-accent": "var(--app-on-accent)",
          success: "var(--app-success)",
          warn: "var(--app-warn)",
          danger: "var(--app-danger)",
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
