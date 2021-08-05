import { UserConfig } from 'vite';
import WindiCSS from 'vite-plugin-windicss';

import pkg from './package.json';

export default {
  plugins: [
    WindiCSS()
  ],
  optimizeDeps: {
    include: Object.keys(pkg.dependencies).filter((id) => id !== 'vitext') as [

    ],
  },
} as UserConfig;
