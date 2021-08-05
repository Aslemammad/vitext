module.exports = {
  mode: process.env.NODE_ENV === 'production' ? '' : 'jit',
  purge: ['./index.html', './pages/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
