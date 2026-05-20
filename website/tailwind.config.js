/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f0',
          100: '#faefd8',
          500: '#c8962d',
          600: '#b07a1e',
          700: '#8f6016',
          800: '#6e4a10',
          900: '#4d330a',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: []
};
