import chalk from 'chalk';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import type { Plugin, ResolvedConfig } from 'vite';

import { createPageMiddleware } from './middlewares/page';
import { getEntries, PageType } from './route/pages';
import { Entries } from './types';
import { removeImportQuery, resolveHackImport } from './utils';

const modulePrefix = '/@vitext/';

const appEntryId = modulePrefix + 'index.js';
const pagesModuleId = modulePrefix + 'pages/';
const currentPageModuleId = modulePrefix + 'current-page';

const readFile = promisify(fs.readFile);

export default function pluginFactory(): Plugin {
  let resolvedConfig: ResolvedConfig;
  let currentPage: PageType = {} as any;

  let entries: Entries;
  let clearEntries: Entries;

  return {
    name: 'vitext',
    config: () => ({
      ssr: {
        external: ['prop-types', 'react-helmet-async', 'vitext/document'],
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['vitext'],
      },
      esbuild: {
        legalComments: 'inline',
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
    async configureServer({
      middlewares,
      ssrLoadModule,
      transformIndexHtml,
      config,
    }) {
      const start = performance.now();
      resolvedConfig = config;

      const pageManifest = await glob.default('./pages/**/*.+(js|jsx|ts|tsx)', {
        cwd: config.root,
      });

      entries = getEntries(pageManifest);
      clearEntries = entries.filter(
        (page) => page.pageName !== '_document' && page.pageName !== '_app'
      );

      const template = await readFile(
        path.resolve(config.root, 'index.html'),
        'utf-8'
      );

      middlewares.use(
        createPageMiddleware({
          entries,
          pagesModuleId,
          template,
          transformIndexHtml,
          currentPage,
          loadModule: ssrLoadModule,
        })
      );
      console.log(
        chalk.greenBright(`started in ${((performance.now() - start) / 1000).toFixed(3)}s`)
      );
    },
    resolveId(id) {
      if (id.startsWith('.' + modulePrefix)) id = id.slice(1);

      if (id === appEntryId) return id;

      if (id.startsWith(pagesModuleId)) {
        return id;
      }

      return id.startsWith(modulePrefix) ? id : undefined;
    },

    async load(id) {
      if (id === currentPageModuleId) {
        id =
          pagesModuleId + (currentPage!.page !== '/' ? currentPage!.page : '');
      }

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
        return `export { App as default } from "${path.resolve(
          process.env.NODE_ENV === 'test'
            ? path.resolve(__dirname, '../..')
            : __dirname,
          './app.mjs'
        )}"`;
      }

      id = resolveHackImport(id);

      if (id.startsWith(pagesModuleId)) {
        // strip ?import
        id = removeImportQuery(id);

        let plainPageName =
          id.slice(pagesModuleId.length) + (id === pagesModuleId ? '/' : '');
        if (!plainPageName.startsWith('/')) {
          plainPageName = '/' + plainPageName;
        }
        const page = clearEntries.find(
          ({ pageName }) => pageName === plainPageName
        );
        if (!page) {
          return;
        }

        const absolutePagePath = path.resolve(
          resolvedConfig.root,
          page!.absolutePagePath
        );

        return `export { default } from "${absolutePagePath}"`;
      }
    },
  };
}

export function createVitextPlugin(): Plugin {
  return pluginFactory();
}
