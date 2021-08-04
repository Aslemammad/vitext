import { init, parse } from 'es-module-lexer';
import { Loader, transform } from 'esbuild';
import * as fs from 'fs';
import MagicString from 'magic-string';
import * as path from 'path';
import type {
  ConfigEnv,
  Manifest,
  Plugin,
  ResolvedConfig,
  UserConfig,
  ViteDevServer,
} from 'vite';

import { build, getAssets, writeAssets } from './build';
import { createPageMiddleware } from './middlewares/page';
import { exportPage } from './route/export';
import { getEntries, PageType } from './route/pages';
import { Entries } from './types';
import {
  getEntryPoints,
  removeImportQuery,
  resolveCustomComponents,
  resolveHackImport,
} from './utils';

const modulePrefix = '/@vitext/';

const appEntryId = modulePrefix + 'index.js';
const pagesModuleId = modulePrefix + 'pages/';
const currentPageModuleId = modulePrefix + 'current-page';

export default function pluginFactory(): Plugin {
  let resolvedConfig: ResolvedConfig | UserConfig;
  let currentPage: PageType = {} as PageType;
  let manifest: Manifest = {};
  let resolvedEnv: ConfigEnv;

  let server: ViteDevServer;
  let entries: Entries;
  let clearEntries: Entries;

  init;

  return {
    name: 'vitext',
    async config(userConfig, env) {
      resolvedEnv = env;
      if (env.command !== 'build') {
        const manifestPath = path.join(
          userConfig.root!,
          userConfig.build!.outDir!,
          'manifest.json'
        );

        Object.assign(
          manifest,
          env.mode === 'production' && env.command === 'serve'
            ? JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))
            : {}
        );
        const entryPoints =
          env.mode === 'development'
            ? await getEntryPoints(userConfig)
            : Object.keys(manifest).filter((key) => key.startsWith('pages/'));

        entries = getEntries(entryPoints, env.mode, manifest);

        clearEntries = entries.filter(
          (page) =>
            !(
              page.pageName.includes('_document') ||
              page.pageName.includes('_app')
            )
        );
      }

      if (env.command === 'build') {
        resolvedConfig = userConfig;
      }

      return {
        ssr: {
          target: 'webworker',
          external: [
            'prop-types',
            'react-helmet-async',
            'vitext/document',
            'use-subscription',
            'vitext/react.node',
            'vitext/app.node',
          ],
        },
        css: { postcss: null },
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'use-subscription',
            'vitext/react',
            'vitext/document',
            'vitext/app',
            'vitext/head',
            'vitext/react',
            'vitext/react.node',
            'react-helmet-async',
          ],
        },
        esbuild: {
          legalComments: 'inline',
          jsxInject: `import * as React from 'react'`,
        },
        build: {
          base: undefined,
        },
      };
    },
    configResolved(config) {
      resolvedConfig = config;
    },
    async configureServer(_server) {
      server = _server;

      const template = await fs.promises.readFile(
        path.join(server.config.root, 'index.html'),
        'utf-8'
      );

      const pageMiddleware = await createPageMiddleware({
        server,
        entries,
        clearEntries,
        pagesModuleId,
        template,
        manifest,
        env: resolvedEnv,
      });

      return async () => {
        server.middlewares.use(pageMiddleware);
        let customComponents = await resolveCustomComponents({
          entries,
          server,
        });

        if (resolvedEnv.mode === 'production') {
          clearEntries.forEach((entry) =>
            exportPage({
              manifest,
              server,
              entries,
              template,
              pagesModuleId,
              page: entry,
              App: customComponents.App,
              Document: customComponents.Document,
            })
          );
        }
      };
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
          pagesModuleId +
          (currentPage.pageEntry.pageName !== '/'
            ? currentPage.pageEntry.pageName
            : '');
      }

      if (id === appEntryId) return `import "vitext/internal/client/main.js";`;

      if (id.startsWith(modulePrefix + '_app')) {
        const page = entries.find(({ pageName }) => pageName === '/_app');
        if (page) {
          const absolutePagePath = path.resolve(
            resolvedConfig.root!,
            page!.absolutePagePath
          );
          return `export { default } from "${absolutePagePath}"`;
        }
        return `export { App as default } from "${path.resolve(
          process.env.VITEXT_TEST
            ? path.resolve(__dirname, '../..')
            : __dirname,
          './app.js'
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
          resolvedConfig.root!,
          page!.absolutePagePath
        );

        return `export { default } from "${absolutePagePath}"`;
      }
    },
  };
}

export function dependencyInjector(): Plugin {
  return {
    name: 'vitext:dependency-injector',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id.includes('react.js') && importer?.includes('vitext/react.js')) {
        return 'react';
      } else if (id.includes('react.js')) {
        return 'vitext/react';
      }
    },
    async transform(code, id, ssr) {
      if (!ssr) {
        return;
      }
      const [file] = id.split('?');
      if (!file.endsWith('js')) return;
      id = file;

      let ext = path.extname(id).slice(1);
      if (ext === 'mjs' || ext === 'cjs') ext = 'js';

      await init;
      const source = (
        await transform(code, { loader: ext as Loader, jsx: 'transform' })
      ).code;

      const imports = parse(source)[0];
      const s = new MagicString(source);
      for (let index = 0; index < imports.length; index++) {
        const { s: start, e: end } = imports[index];
        const url = source.slice(start, end);

        s.overwrite(start, end, url === 'react' ? 'vitext/react.node' : url);
      }

      return {
        code: s.toString(),
      };
    },
  };
}
export function createVitextPlugin(): Plugin[] {
  return [
    pluginFactory(),
    dependencyInjector(),
    build(),
    getAssets(),
    writeAssets(),
  ];
}
