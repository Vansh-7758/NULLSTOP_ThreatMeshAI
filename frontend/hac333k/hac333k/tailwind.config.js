/** @type {import('tailwindcss').Config} */
// Tailwind v4 uses CSS-first @theme config in index.css
// This file only needed for content paths in v4
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
