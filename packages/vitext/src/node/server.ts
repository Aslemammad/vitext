import * as fs from 'fs-extra';
import * as path from 'path';
import {
  createServer as createViteServer,
  resolveConfig,
  UserConfig,
} from 'vite';

import { createVitextPlugin } from './plugin';

const returnConfigFiles = (root: string) =>
  ['vitext.config.js', 'vitext.config.ts'].map((file) =>
    path.resolve(root, file)
  );

export async function createServer(options: UserConfig & { root: string }) {
  let configFile: string =
    returnConfigFiles(options.root).find((file) => fs.existsSync(file)) ||
    './vitext.config.js';

  const config = await resolveConfig({ ...options, configFile }, 'serve');

  return createViteServer({
    ...config,
    assetsInclude: options.assetsInclude,
    configFile: configFile,
    root: config.root,
    server: config.server,
    build: config.build,
    base: config.base,
    plugins: [...createVitextPlugin(), ...config.plugins],
  });
}
