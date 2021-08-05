import {
  createServer as createViteServer,
  InlineConfig,
  UserConfig,
} from 'vite';

import { resolveInlineConfig } from './utils';

export async function createServer(
  options: (InlineConfig | UserConfig) & { root: string }
) {
  const config = await resolveInlineConfig(options, 'serve');

  return createViteServer(config as InlineConfig);
}
