// module.exports = {
//   mode: 'jit',
//   purge: {
//     content: ['./pages/**/*.tsx', './components/**/*.tsx'],
//   },
//   darkMode: 'class',
//   theme: {
//     extend: {
//       colors: {
//         'black': '#181a1b',
//       },
//     },
//
//     fontSize: {
//       '4xs': ['0.375rem'],
//       '3xs': ['0.5rem'],
//       '2xs': ['0.625rem'],
//       xs: ['0.75rem'],
//       sm: ['0.875rem'],
//       base: ['1rem'],
//       lg: ['1.125rem'],
//       xl: ['1.25rem'],
//       '2xl': ['1.5rem'],
//       '3xl': ['1.875rem'],
//       '4xl': ['2.25rem'],
//       '5xl': ['3rem'],
//       '6xl': ['3.75rem'],
//       '7xl': ['4.5rem'],
//       '8xl': ['6rem'],
//       '9xl': ['8rem'],
//       '10xl': ['10rem'],
//     },
//   },
//   // plugins: [require('@tailwindcss/forms')],
// };
//

// tailwind.config.ts
import { defineConfig } from 'windicss/helpers'
// import formsPlugin from 'windicss/plugin/forms'

export default defineConfig({

  mode: 'jit',
  purge: {
    content: ['./pages/**/*.tsx', './components/**/*.tsx'],
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'black': '#181a1b',
      },
    },

    fontSize: {
      '4xs': ['0.375rem'],
      '3xs': ['0.5rem'],
      '2xs': ['0.625rem'],
      xs: ['0.75rem'],
      sm: ['0.875rem'],
      base: ['1rem'],
      lg: ['1.125rem'],
      xl: ['1.25rem'],
      '2xl': ['1.5rem'],
      '3xl': ['1.875rem'],
      '4xl': ['2.25rem'],
      '5xl': ['3rem'],
      '6xl': ['3.75rem'],
      '7xl': ['4.5rem'],
      '8xl': ['6rem'],
      '9xl': ['8rem'],
      '10xl': ['10rem'],
    },
  },

  // darkMode: 'class',
  // safelist: 'p-3 p-4 p-5',
  // theme: {
  //   extend: {
  //     colors: {
  //       teal: {
  //         100: '#096',
  //       },
  //     },
  //   },
  // },
  // plugins: [formsPlugin],
})
