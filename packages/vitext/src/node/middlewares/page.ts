import chalk from 'chalk';
import * as path from 'path';
import { parse as parseQs } from 'querystring';
import type { ConfigEnv, Connect, Manifest, ViteDevServer } from 'vite';

import { loadExportedPage } from '../route/export';
import { fetchData } from '../route/fetch';
import { resolvePagePath } from '../route/pages';
import { renderToHTML } from '../route/render';
import type { Await, Entries } from '../types';
import { loadPage, resolveCustomComponents } from '../utils';

export async function createPageMiddleware({
  server,
  env,
  entries,
  pagesModuleId,
  template,
  manifest,
}: {
  server: ViteDevServer;
  env: ConfigEnv;
  pagesModuleId: string;
  template: string;
  entries: Entries;
  clearEntries: Entries;
  manifest: Manifest;
}): Promise<Connect.NextHandleFunction> {
  let customComponents: Await<ReturnType<typeof resolveCustomComponents>>;

  return async function pageMiddleware(req, res, next) {
    const [pathname, queryString] = (req.originalUrl || '').split('?')!;
    const page = resolvePagePath(pathname, entries);

    customComponents = await resolveCustomComponents({
      entries,
      server,
    });

    if (!page) {
      return next();
    }

    try {
      let html: string | undefined;
      if (env.mode === 'production') {
        html = await loadExportedPage({
          root: server.config.root!,
          pageName: page.pageEntry.pageName,
          params: page.params,
        });
      }

      if (!html) {
        const transformedTemplate =
          env.mode === 'development'
            ? await server.transformIndexHtml(
                req.url!,
                template,
                req.originalUrl
              )
            : template;

        const pageFile = await loadPage({
          entries,
          server,
          page: page.pageEntry,
        });

        page.query = parseQs(queryString);

        const data = await fetchData({
          req,
          res,
          pageFile,
          page,
          env,
          isExporting: false,
        });

        html = await renderToHTML({
          server,
          entries,
          pageEntry: page.pageEntry,
          pagesModuleId,
          props: data?.props,
          template: transformedTemplate,
          Component: pageFile.default,
          Document: customComponents.Document!,
          App: customComponents.App!,
          manifest
        });
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      server.ssrFixStacktrace(e);
      server.config.logger.error(chalk.red(e));
      next(e);
    }
  };
}
