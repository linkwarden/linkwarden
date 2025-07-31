/** @type {import('tailwindcss').Config} */

const { rawTheme } = require("./lib/colors");

const hexToRgb = (hex) => {
  const [r, g, b] = hex
    .replace(/^#/, "")
    .match(/.{2}/g)
    .map((h) => parseInt(h, 16));
  return `${r} ${g} ${b}`;
};

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.keys(rawTheme.light).map((key) => [
          key,
          `rgb(var(--color-${key}) / <alpha-value>)`,
        ])
      ),
    },
  },
  plugins: [
    ({ addBase }) => {
      addBase({
        ":root": Object.fromEntries(
          Object.entries(rawTheme.light).map(([key, hex]) => [
            `--color-${key}`,
            hexToRgb(hex),
          ])
        ),
      });
    },
  ],
};
