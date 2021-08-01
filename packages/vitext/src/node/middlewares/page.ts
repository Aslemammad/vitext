import chalk from 'chalk';
import { parse as parseQs } from 'querystring';
import type {
  ConfigEnv,
  Connect,
  Manifest,
  ResolvedConfig,
  ViteDevServer,
} from 'vite';

import { exportPage, loadExportedPage } from '../route/export';
import { fetchData } from '../route/fetch';
import { PageType, resolvePagePath } from '../route/pages';
import { renderToHTML } from '../route/render';
import type { Entries } from '../types';
import { loadPage, resolveCustomComponents } from '../utils';

export async function createPageMiddleware({
  config,
  env,
  entries,
  clearEntries,
  loadModule,
  pagesModuleId,
  template,
  fixStacktrace,
  transformIndexHtml,
  manifest,
}: {
  config: ResolvedConfig;
  env: ConfigEnv;
  pagesModuleId: string;
  template: string;
  entries: Entries;
  clearEntries: Entries;
  currentPage: PageType;
  loadModule: ViteDevServer['ssrLoadModule'];
  fixStacktrace: ViteDevServer['ssrFixStacktrace'];
  transformIndexHtml: ViteDevServer['transformIndexHtml'];
  manifest: Manifest;
}): Promise<Connect.NextHandleFunction> {
  let customComponents = await resolveCustomComponents({
    entries,
    loadModule,
  });

  if (env.mode === 'production') {
    clearEntries.forEach((entry) =>
      exportPage({
        config,
        entries,
        loadModule,
        template,
        pagesModuleId,
        page: entry,
        App: customComponents.App,
        Document: customComponents.Document,
      })
    );
  }

  return async (req, res, next) => {
    const [pathname, queryString] = (req.originalUrl || '').split('?')!;
    const page = resolvePagePath(pathname, entries);

    if (!page) {
      return next();
    }

    try {
      let html: string | undefined;
      if (env.mode === 'production') {
        html = await loadExportedPage({
          root: config.root!,
          pageName: page.pageEntry.pageName,
          params: page.params,
        });
      }

      if (!html) {
        const transformedTemplate =
          env.mode === 'development'
            ? await transformIndexHtml(req.url!, template, req.originalUrl)
            : template;

        const pageFile = await loadPage({
          entries,
          loadModule,
          page: page.pageEntry,
          root: config.root!
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
          pageName: page.pageEntry.pageName,
          pagesModuleId,
          props: data?.props,
          template: transformedTemplate,
          Component: pageFile.default,
          Document: customComponents.Document!,
          App: customComponents.App!,
        });
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      fixStacktrace(e);
      config.logger.error(chalk.red(e));
      next(e);
    }
  };
}
