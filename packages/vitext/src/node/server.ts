import {
  createServer as createViteServer,
  UserConfig,
} from 'vite';

import {resolveInlineConfig} from './utils'
export async function createServer(options: UserConfig & { root: string }) {
  const config = await resolveInlineConfig(options, 'serve')

  return createViteServer(config)
}
