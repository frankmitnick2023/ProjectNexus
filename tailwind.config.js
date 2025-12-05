/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 这一行至关重要
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}