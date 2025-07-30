/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // map each color key to a CSS var that Tailwind will resolve
        primary: "rgb(var(--color-primary)   / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        accent: "rgb(var(--color-accent)    / <alpha-value>)",
        neutral: "rgb(var(--color-neutral)   / <alpha-value>)",
        "neutral-content": "rgb(var(--color-neutral-content) / <alpha-value>)",
        "base-100": "rgb(var(--color-base-100)  / <alpha-value>)",
        "base-200": "rgb(var(--color-base-200)  / <alpha-value>)",
        "base-content": "rgb(var(--color-base-content)/ <alpha-value>)",
        info: "rgb(var(--color-info)      / <alpha-value>)",
        success: "rgb(var(--color-success)   / <alpha-value>)",
        warning: "rgb(var(--color-warning)   / <alpha-value>)",
        error: "rgb(var(--color-error)     / <alpha-value>)",
      },
    },
  },
};
