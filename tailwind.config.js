const tailwindScrollbar = require('tailwind-scrollbar');

module.exports = {
  purge: {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './icons/**/*.{js,ts,jsx,tsx}',
    ],
    safeList: ['bg-gray-300', 'bg-gray-600'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'primary-100': '#3541B0',
        'primary-200': '#2A348D',
        'primary-300': '#252E7B',
        'secondary-100': '#1B2158',
        'secondary-200': '#1B2051',
        'secondary-300': '#151A46',
        'primary-text': '#EBECF7',
        'secondary-text': '#151A46',
        'accent-text': '#A1A3B5',
      },
      gridTemplateRows: {
        14: 'repeat(14, minmax(0, 1fr))',
      },
      zIndex: {
        '-1': '-1',
      },
      cursor: {
        'ew-resize': 'ew-resize',
      },
    },
  },
  variants: {
    scrollbar: ['rounded'],
  },
  plugins: [tailwindScrollbar],
};
