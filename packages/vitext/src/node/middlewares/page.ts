import chalk from 'chalk';
import { parse as parseQs } from 'querystring';
import type { ConfigEnv, Connect, Manifest, ViteDevServer } from 'vite';

import { exportPage } from '../route/export';
import { fetchData } from '../route/fetch';
import { PageType, resolvePagePath } from '../route/pages';
import { renderToHTML } from '../route/render';
import type { Entries } from '../types';
import { loadPage, resolveCustomComponents } from '../utils';

export async function createPageMiddleware({
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
    clearEntries.forEach(async (entry) => {
      // setTimeout(() => exportPage({
      //   entries,
      //   loadModule,
      //   template,
      //   pagesModuleId,
      //   page: entry,
      //   App: customComponents.App,
      //   Document: customComponents.Document,
      // }), 0)
      const htmls = await exportPage({
        entries,
        loadModule,
        template,
        pagesModuleId,
        page: entry,
        App: customComponents.App,
        Document: customComponents.Document,
      });
      // if (!htmls) {
      //   return
      // }
      // console.log(await Promise.all(htmls));
    });
  }

  return async (req, res, next) => {

    const [pathname, queryString] = (req.originalUrl || '').split('?')!;
    const page = resolvePagePath(pathname, entries);

    if (!page) {
      return next();
    }

    try {
      const transformedTemplate =
        env.mode === 'development'
          ? await transformIndexHtml(req.url!, template, req.originalUrl)
          : template;

      const pageFile = await loadPage({
        entries,
        loadModule,
        page: page.pageEntry,
      });

      page.query = parseQs(queryString);

      const data = await fetchData({
        req,
        res,
        pageFile,
        page,
        env,
        isGenerating: false,
      });

      const html = await renderToHTML({
        pageName: page.pageEntry.pageName,
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
