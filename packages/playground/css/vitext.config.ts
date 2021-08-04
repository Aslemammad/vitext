// vite.config.js
import { UserConfig } from 'vite';
import WindiCSS from 'vite-plugin-windicss';

export default {
  plugins: [
    {
      ...WindiCSS({
        scan: {
          include: ['**/*.{jsx,tsx}'],
          exclude: ['node_modules', '.git'],
        },
      }),
      enforce: 'pre',
    },
  ],
} as UserConfig;
