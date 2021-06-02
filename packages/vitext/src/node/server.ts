import {
  createServer as createViteServer,
  resolveConfig,
  ServerOptions,
} from 'vite'
import { createVitextPlugin } from './plugin'

export async function createServer(root: string = process.cwd()) {
  const config = await resolveConfig({ root }, 'serve')

  return createViteServer({
    root,
    base: config.base,
    server: config.server,
    plugins: createVitextPlugin(),
  })
}
