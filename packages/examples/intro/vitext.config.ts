import { UserConfig } from 'vite';
import WindiCSS from 'vite-plugin-windicss';

import pkg from './package.json';

export default {
  plugins: [
    WindiCSS({
      scan: {
        include: ['index.html'],
        dirs: ['pages', 'components'],
      },
    }).map((p) => ({ ...p, enforce: 'pre' })),
  ],
  optimizeDeps: {
    include: Object.keys(pkg.dependencies).filter((id) => id !== 'vitext') as [

    ],
  },
} as UserConfig;
