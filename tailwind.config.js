/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  // daisyui: {
  //   themes: ["light", "dark"],
  // },
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

    // For the "layouts" directory
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("daisyui")],
};
