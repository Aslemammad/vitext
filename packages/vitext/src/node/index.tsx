import * as glob from 'fast-glob';
import fs from 'fs';
import * as path from 'path';
import type { Plugin } from 'vite';

import {
  defaultFileHandler,
  DefaultPageStrategy,
} from './dynamic-modules/DefaultPageStrategy';
import { PageStrategy } from './dynamic-modules/PageStrategy';
import {
  renderOnePageData,
  renderPageList,
  renderPageListInSSR,
} from './dynamic-modules/pages';
import { resolveTheme } from './dynamic-modules/resolveTheme';
import { getEntries, resolvePagePath } from './router/pages';
import { render } from './router/render';

const modulePrefix = '/@vitext/';
/*
 * This is a public API that users use in their index.html.
 * Changing this would introduce breaking change for users.
 */
const appEntryId = modulePrefix + 'index.js';

/**
 * This is a private prefix an users should not use them
 */
const pagesModuleId = modulePrefix + 'pages';
const themeModuleId = modulePrefix + 'theme';
const ssrDataModuleId = modulePrefix + 'ssrData';

export default function pluginFactory(
  opts: {
    pagesDir?: string;
    pageStrategy?: PageStrategy;
    useHashRouter?: boolean;
    staticSiteGeneration?: {};
  } = {}
): Plugin {
  const { useHashRouter = false, staticSiteGeneration } = opts;

  let isBuild: boolean;
  let pagesDir: string;
  let pageStrategy: PageStrategy;

  return {
    name: 'vitext',
    config: () => ({
      ssr: { external: ['prop-types', 'react-helmet-async'] },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          // 'react-helmet-async',
          // 'prop-types',
        ],
        exclude: ['vitext'],
      },
      define: {
        __HASH_ROUTER__: !!useHashRouter,
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
    }),
    configResolved({ root, plugins, logger, command }) {
      isBuild = command === 'build';
      pagesDir = opts.pagesDir ?? path.resolve(root, 'pages');
      if (opts.pageStrategy) {
        pageStrategy = opts.pageStrategy;
      } else {
        pageStrategy = new DefaultPageStrategy();
      }
    },
    configureServer({
      middlewares,
      ssrLoadModule,
      transformIndexHtml,
      config,
    }) {
      const pageManifest = glob.sync('./pages/**/*.+(js|jsx|ts|tsx)', {
        cwd: config.root,
      });

      const entries = getEntries(pageManifest, config.root);

      const template = fs.readFileSync(
        path.resolve(config.root, 'index.html'),
        'utf-8'
      );
      middlewares.use(async (req, res, next) => {
        const page = resolvePagePath(
          req.originalUrl!,
          entries.map((page) => page.pageName)
        );
        if (!page) {
          return next();
        }
        const transformedTemplate = await transformIndexHtml(
          req.originalUrl!,
          template
        );
        const html = await render({
          entries,
          loadModule: ssrLoadModule,
          page,
          template: transformedTemplate,
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    },
    buildStart() {
      pageStrategy.start(pagesDir);
    },

    resolveId(id) {
      if (id === appEntryId) return id;
      return id.startsWith(modulePrefix) ? id : undefined;
    },

    async load(id) {
      if (id === appEntryId) return `import "vitext/dist/client/main.js";`;

      if (id === pagesModuleId) {
        return renderPageList(await pageStrategy.getPages(), isBuild);
      }

      if (id.startsWith(pagesModuleId + '/')) {
        let pageId = id.slice(pagesModuleId.length);
        if (pageId === '/__index') pageId = '/';
        const pages = await pageStrategy.getPages();
        const page = pages[pageId];
        if (!page) {
          throw Error(`Page not found: ${pageId}`);
        }
        return renderOnePageData(page.data);
      }
      if (id === themeModuleId) {
        return `export { default } from "${await resolveTheme(pagesDir)}";`;
      }
      if (id === ssrDataModuleId) {
        return renderPageListInSSR(await pageStrategy.getPages());
      }
    },
    // @ts-expect-error
    vitePagesStaticSiteGeneration: staticSiteGeneration,
    closeBundle() {
      pageStrategy.close();
    },
  };
}

export { File, FileHandler } from './dynamic-modules/PageStrategy';
export { extractStaticData } from './dynamic-modules/utils';
export { PageStrategy };
export { DefaultPageStrategy, defaultFileHandler };
