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
  jsLangsRE,
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
  const currentPage: PageType = {} as PageType;
  const manifest: Manifest = {};
  let resolvedEnv: ConfigEnv;

  let server: ViteDevServer;
  let entries: Entries;
  let clearEntries: Entries;

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
            'use-subscription',
            'vitext/react.node.cjs',
            'vitext/app.node',
          ],
        },
        optimizeDeps: {
          include: [
            'react',
            'react/index',
            'react-dom',
            'use-subscription',
            'vitext/react',
            'vitext/document',
            'vitext/app',
            'vitext/head',
            'vitext/dynamic',
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
        const customComponents = await resolveCustomComponents({
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

      if (id.includes(modulePrefix + '_app')) {
        return modulePrefix + '_app'
      }

      return id;
    },

    async load(id) {
      console.log(id)
      if (id === currentPageModuleId) {
        id =
          pagesModuleId +
          (currentPage.pageEntry.pageName !== '/'
            ? currentPage.pageEntry.pageName
            : '');
      }

      if (id === appEntryId) return `import "vitext/dist/client/main.js";`;

      if (id.startsWith(modulePrefix + '_app')) {
        const page = entries.find(({ pageName }) => pageName === '/_app');
        if (page) {
          const absolutePagePath = path.resolve(
            resolvedConfig.root!,
            page!.absolutePagePath
          );
          return `export { default } from "${absolutePagePath}"`;
        }
        return `export { App as default } from "vitext/app"`;
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
    async transform(code, id, ssr) {
      if (!ssr) {
        return code;
      }
      const [file] = id.split('?');
      if (!jsLangsRE.test(id)) return code;
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
        s.overwrite(start, end, url === 'react' ? 'vitext/react.node.cjs' : url);
      }

      return {
        code: s.toString(),
        map: s.generateMap(),
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
