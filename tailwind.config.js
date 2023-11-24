/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  daisyui: {
    themes: [
      {
        light: {
          primary: "#0ea5e9",
          secondary: "#22d3ee",
          accent: "#4f46e5",
          neutral: "#6b7280",
          "base-100": "#f5f5f4",
          info: "#a5f3fc",
          success: "#22c55e",
          warning: "#facc15",
          error: "#dc2626",
        },
      },
      {
        dark: {
          primary: "#38bdf8",
          secondary: "#0284c7",
          accent: "#818cf8",
          neutral: "#1f2937",
          "base-100": "#fcfcfc",
          info: "#009ee4",
          success: "#00b17d",
          warning: "#eac700",
          error: "#f1293c",
        },
      },
    ],
  },
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // For the "layouts" directory
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [
    require("daisyui"),
    plugin(({ addVariant }) => {
      addVariant("dark", '&[data-theme="dark"]');
    }),
  ],
};
