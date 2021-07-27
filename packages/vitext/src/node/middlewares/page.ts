import chalk from 'chalk';
import { Worker } from 'jest-worker';
import path from 'path';
import { parse as parseQs } from 'querystring';
import type { Connect, ViteDevServer } from 'vite';

import { fetchData } from '../route/fetch';
import { PageType, resolvePagePath } from '../route/pages';
import { renderToHTML } from '../route/render';
import * as RouteWorker from '../route/worker';
import type { Entries } from '../types';
import { loadPage, resolveCustomComponents } from '../utils';

console.log(global.require)
const routeWorker = new Worker(('../route/worker.ts')) as Worker &
  typeof RouteWorker;
routeWorker.getStdout().pipe(process.stdout);
routeWorker.getStderr().pipe(process.stderr);

export async function createPageMiddleware({
  entries,
  loadModule,
  pagesModuleId,
  template,
  fixStacktrace,
  transformIndexHtml,
}: {
  pagesModuleId: string;
  template: string;
  entries: Entries;
  currentPage: PageType;
  loadModule: ViteDevServer['ssrLoadModule'];
  fixStacktrace: ViteDevServer['ssrFixStacktrace'];
  transformIndexHtml: ViteDevServer['transformIndexHtml'];
}): Promise<Connect.NextHandleFunction> {
  let customComponents = await resolveCustomComponents({
    entries,
    loadModule,
  });
  console.log(routeWorker);

  return async (req, res, next) => {
    const [pathname, queryString] = (req.originalUrl || '').split('?')!;
    const page = resolvePagePath(
      pathname,
      entries.map((page) => page.pageName)
    );

    if (!page) {
      return next();
    }

    try {
      const transformedTemplate = await transformIndexHtml(
        req.url!,
        template,
        req.originalUrl
      );
      const pageFile = await loadPage({ entries, loadModule, page });

      page.query = parseQs(queryString);

      const data = await fetchData({ req, res, pageFile, page });

      const html = await renderToHTML({
        entries,
        page,
        pagesModuleId,
        props: data?.props,
        template: transformedTemplate,
        Component: pageFile.default,
        Document: customComponents.Document!,
        App: customComponents.App!,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      fixStacktrace(e);
      console.log(chalk.red(e));
      next(e);
    }
  };
}
