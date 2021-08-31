import Vite from 'vite';

import { resolveInlineConfig } from './utils';

export async function createServer(
  options: (Vite.InlineConfig | Vite.UserConfig) & { root: string }
) {
  const config = await resolveInlineConfig(options, 'serve');

  return Vite.createServer(config as Vite.InlineConfig);
}
