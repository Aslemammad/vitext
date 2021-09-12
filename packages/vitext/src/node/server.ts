import express from 'express';
import * as fs from 'fs';
import path from 'path';
import Vite, { Manifest } from 'vite';
import { createPageRender } from 'vite-plugin-ssr';

import { getEntries } from './route/pages';
import { getEntryPoints, resolveInlineConfig } from './utils';

export async function createServer(
  options: (Vite.InlineConfig | Vite.UserConfig) & { root: string }
) {
  const config = await resolveInlineConfig(
    { ...options, server: { ...options.server, middlewareMode: true } },
    'serve'
  );
  const app = express();

  const server = await Vite.createServer(config as Vite.InlineConfig);

  app.use(server.middlewares);

  const renderPage = createPageRender({
    viteDevServer: server,
    isProduction: options.mode === 'production',
    root: options.root,
    base: options.base,
  });

  const manifest: Manifest = {};
  const manifestPath = path.join(
    config.root!,
    config.build!.outDir!,
    'manifest.json'
  );

  Object.assign(
    manifest,
    config.mode === 'production'
      ? JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))
      : {}
  );
  const entryPoints =
    config.mode === 'development'
      ? await getEntryPoints(config)
      : Object.keys(manifest).filter((key) => key.startsWith('pages/'));

  const entries = getEntries(entryPoints, config.mode, manifest);

  const clearEntries = entries.filter(
    (page) =>
      !(
        page.pageName.includes('_document') ||
        page.pageName.includes('_default') ||
        page.pageName.includes('_app')
      )
  );
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    const pageContext = {
      url,
      entries: clearEntries,
    };
    const result = await renderPage(pageContext);
    if (result.nothingRendered) return next();
    res.statusCode = result.statusCode;

    res.end(result.renderResult);
  });
  app.listen(3000);

  return server;
}
