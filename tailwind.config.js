/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          50: 'aliceblue',
          100: 'lightblue',
          500: 'dodgerblue',
          600: 'royalblue',
          700: 'mediumblue',
        },
      },
    },
  },
  plugins: [],
};
