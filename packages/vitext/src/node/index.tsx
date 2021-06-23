import * as glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

import type { AppType } from './components/_app';
import type { DocumentType } from './components/_document';
import { getEntries, resolvePagePath } from './router/pages';
import { render } from './router/render';
import { resolveCustomComponents } from './utils';

const modulePrefix = '/@vitext/';
/*
 * This is a public API that users use in their index.html.
 * Changing this would introduce breaking change for users.
 */
const appEntryId = modulePrefix + 'index.js';

/**
 * This is a private prefix an users should not use them
 */
const pagesModuleId = modulePrefix + 'pages/';
const currentPageModuleId = modulePrefix + 'current-page';

export default function pluginFactory(): Plugin {
  let resolvedConfig: ResolvedConfig;
  let currentPage: ReturnType<typeof resolvePagePath>;
  let customComponents: {
    Document: DocumentType;
    App: AppType;
  };
  let entries: ReturnType<typeof getEntries>;
  let clearEntries: ReturnType<typeof getEntries>;

  return {
    name: 'vitext',
    config: () => ({
      ssr: {
        external: ['prop-types', 'react-helmet-async', 'vitext/document'],
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          // 'react-helmet-async',
          // 'prop-types',
        ],
        exclude: ['vitext'],
      },
      esbuild: {
        jsxInject: `import * as React from 'react'`,
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
    }),
    configureServer({
      middlewares,
      ssrLoadModule,
      transformIndexHtml,
      config,
    }) {
      resolvedConfig = config;
      const pageManifest = glob.sync('./pages/**/*.+(js|jsx|ts|tsx)', {
        cwd: config.root,
      });

      entries = getEntries(pageManifest);
      clearEntries = entries.filter(
        (page) => page.pageName !== '_document' && page.pageName !== '_app'
      );

      const template = fs.readFileSync(
        path.resolve(config.root, 'index.html'),
        'utf-8'
      );
      middlewares.use(async (req, res, next) => {
        const page = resolvePagePath(
          req.originalUrl!,
          clearEntries.map((page) => page.pageName)
        );

        if (!page) {
          return next();
        }

        if (!customComponents) {
          const [{ default: Document }, { default: App }] =
            await resolveCustomComponents({
              entries,
              loadModule: ssrLoadModule,
            });
          customComponents = { Document, App } as typeof customComponents;
        }

        currentPage = page;

        const transformedTemplate = await transformIndexHtml(
          req.originalUrl!,
          template
        );
        let html;
        html = await render({
          entries: clearEntries,
          loadModule: ssrLoadModule,
          page,
          template: transformedTemplate,
          pagesModuleId,
          Document: customComponents.Document,
          App: customComponents.App,
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    },
    resolveId(id) {
      if (id.startsWith('.' + modulePrefix)) id = id.slice(1);

      if (id === appEntryId) return id;

      if (id === currentPageModuleId) {
        return (
          pagesModuleId + (currentPage!.page !== '/' ? currentPage!.page : '')
        );
      }

      if (id.startsWith(pagesModuleId)) {
        return id;
      }

      return id.startsWith(modulePrefix) ? id : undefined;
    },

    async load(id) {
      if (id === appEntryId) return `import "vitext/client/main.js";`;

      if (id.startsWith(modulePrefix + '_app')) {
        const page = entries.find(({ pageName }) => pageName === '/_app');
        if (page) {
          const absolutePagePath = path.resolve(
            resolvedConfig.root,
            page!.absolutePagePath
          );
          return `export { default } from "${absolutePagePath}"`;
        }
        // TODO: test for this case
        return `export { App as default } from "${path.resolve(
          __dirname,
          './app.mjs'
        )}"`;
      }

      if (id.startsWith(pagesModuleId)) {
        const plainPageName =
          id.slice(pagesModuleId.length) + (id === pagesModuleId ? '/' : '');
        const page = clearEntries.find(
          ({ pageName }) => pageName === plainPageName
        );

        const absolutePagePath = path.resolve(
          resolvedConfig.root,
          page!.absolutePagePath
        );

        return `export { default } from "${absolutePagePath}"`;
      }
    },
  };
}
