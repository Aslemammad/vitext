import {
  createServer as createViteServer,
  resolveConfig,
  UserConfig,
  defineConfig,
} from 'vite';

import { createVitextPlugin } from './plugin';

export async function createServer(root: string, options?: UserConfig) {
  const config = await resolveConfig(
    options ? { root, ...options } : { root },
    'serve'
  );

  return createViteServer({
    root: config.root,
    base: config.base,
    server: config.server,
    build: config.build,
    plugins: [createVitextPlugin()],
  });
}
