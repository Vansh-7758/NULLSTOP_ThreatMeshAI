import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1B1931',
        card: 'rgba(27,25,49,0.75)',
        border: 'rgba(233,188,185,0.25)',
        accent: '#ED9E58',
        warning: '#F0A500',
        danger: '#E84040',
        'text-primary': '#FFFFFF',
        'text-secondary': '#CBD5E1',
        navy: '#1B1931',
        plum: '#44174E',
        magenta: '#662249',
        rose: '#F43F5E',
        amber: '#ED9E58',
        blush: '#E9BCB9',
        // User Custom Palette Tokens
        'jet-black': '#333745',
        'eggshell': '#EEEBD3',
        'pacific-cyan': '#508991',
        'cherry-blossom': '#F4A5AE',
        'blush-rose': '#E55381',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
