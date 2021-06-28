import chalk from 'chalk';
import type { Connect, ViteDevServer } from 'vite';

import type { AppType } from '../components/_app';
import type { DocumentType } from '../components/_document';
import { fetchData } from '../route/fetch';
import { PageType, resolvePagePath } from '../route/pages';
import { renderToHTML } from '../route/render';
import type { Entries, PageFileType } from '../types';
import { resolveCustomComponents } from '../utils';

export function createPageMiddleware({
  entries,
  loadModule,
  pagesModuleId,
  template,
  transformIndexHtml,
  currentPage,
}: {
  pagesModuleId: string;
  template: string;
  entries: Entries;
  currentPage: PageType;
  loadModule: ViteDevServer['ssrLoadModule'];
  transformIndexHtml: ViteDevServer['transformIndexHtml'];
}): Connect.NextHandleFunction {
  // custom components cache
  let customComponents: {
    Document: DocumentType | null;
    App: AppType | null;
  } = { Document: null, App: null };

  // load custom components concurrently
  const customComponentsPromise = resolveCustomComponents({
    entries,
    loadModule,
  });

  return async (req, res, next) => {
    const page = resolvePagePath(
      req.originalUrl!,
      entries.map((page) => page.pageName)
    );

    if (!page) {
      return next();
    }

    try {
      if (!(customComponents.Document && customComponents.App)) {
        const [{ default: Document }, { default: App }] =
          await customComponentsPromise;

        customComponents = { Document, App } as typeof customComponents;
      }

      Object.assign(currentPage, page);

      const transformedTemplate = await transformIndexHtml(
        req.url!,
        template,
        req.originalUrl
      );

      const absolutePagePath = entries.find(
        (p) => p.pageName === page.pagePath
      )!.absolutePagePath;

      const pageFile = (await loadModule(absolutePagePath)) as PageFileType;

      const data = await fetchData({ req, res, pageFile });

      const html = await renderToHTML({
        entries,
        page,
        props: data?.props,
        pagesModuleId,
        loadModule,
        template: transformedTemplate,
        Component: pageFile.default,
        Document: customComponents.Document!,
        App: customComponents.App!,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      console.error(chalk.red(e));
    }
  };
}
