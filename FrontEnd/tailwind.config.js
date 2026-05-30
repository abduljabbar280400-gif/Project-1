/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FCDEC0',  // lightest cream
          100: '#FCDEC0',
          200: '#E5B299',  // soft peach
          300: '#E5B299',
          400: '#B4846C',  // warm tan
          500: '#B4846C',  // primary
          600: '#7D5A50',  // deep brown
          700: '#6a4a42',
          800: '#57392e',
          900: '#3e2820',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
