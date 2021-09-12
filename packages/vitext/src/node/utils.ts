// Copied from flareact
import reactRefresh from '@vitejs/plugin-react-refresh';
import glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import Vite from 'vite';
import pluginSSR from 'vite-plugin-ssr/plugin';
import { App as BaseApp, AppType } from 'vitext/app.js';
import { Document as BaseDocument, DocumentType } from 'vitext/document.js';

import { createVitextPlugin } from './plugin';
import { DYNAMIC_PAGE, getEntries } from './route/pages';
import { Entries, PageFileType } from './types';

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export interface Hostname {
  // undefined sets the default behaviour of server.listen
  host: string | undefined;
  // resolve to localhost when possible
  name: string;
}

export function resolveHostname(
  optionsHost: string | boolean | undefined
): Hostname {
  let host: string | undefined;
  if (
    optionsHost === undefined ||
    optionsHost === false ||
    optionsHost === 'localhost'
  ) {
    // Use a secure default
    host = '127.0.0.1';
  } else if (optionsHost === true) {
    // If passed --host in the CLI without arguments
    host = undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
  } else {
    host = optionsHost;
  }

  // Set host name to localhost when possible, unless the user explicitly asked for '127.0.0.1'
  const name =
    (optionsHost !== '127.0.0.1' && host === '127.0.0.1') ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === undefined
      ? 'localhost'
      : host;

  return { host, name };
}
export function extractDynamicParams(source: string, path: string) {
  let test: RegExp | string = source;
  const parts = [];
  const params: Record<string, string> = {};

  for (const match of source.matchAll(/\[(\w+)\]/g)) {
    parts.push(match[1]);

    test = test.replace(DYNAMIC_PAGE, () => '([\\w_-]+)');
  }

  test = new RegExp(test, 'g');

  const matches = path.matchAll(test);

  for (const match of matches) {
    parts.forEach((part, idx) => (params[part] = match[idx + 1]));
  }

  return params;
}

// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE

const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

export function htmlEscapeJsonString(str: string) {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}

const importQueryRE = /(\?|&)import=?(?:&|$)/;
const trailingSeparatorRE = /[\?&]$/;

export function removeImportQuery(url: string): string {
  return url.replace(importQueryRE, '$1').replace(trailingSeparatorRE, '');
}

type ComponentFileType = { default: AppType | DocumentType } & Record<
  string,
  any
>;

type PromisedComponentFileType = Promise<ComponentFileType> | ComponentFileType;

export async function resolveCustomComponents({
  entries,
  server,
}: {
  entries: ReturnType<typeof getEntries>;
  server: Vite.ViteDevServer;
}) {
  const customApp = entries.find((page) => page.pageName === '/_app');
  const customDocument = entries.find((page) => page.pageName === '/_document');

  let AppFile: PromisedComponentFileType = { default: BaseApp };
  if (customApp) {
    AppFile = server.ssrLoadModule(
      customApp!.absolutePagePath
    ) as PromisedComponentFileType;
  }

  let DocumentFile: PromisedComponentFileType = { default: BaseDocument };
  if (customDocument) {
    DocumentFile = server.ssrLoadModule(
      customDocument!.absolutePagePath
    ) as PromisedComponentFileType;
  }

  const [{ default: Document }, { default: App }] = await Promise.all([
    DocumentFile,
    AppFile,
  ]);
  return { Document, App } as {
    Document: typeof BaseDocument;
    App: typeof BaseApp;
  };
}

/*
 * /@fs/..../@vitext/hack-import/...js to /@vitext/hack-import/...
 */
export function resolveHackImport(id: string) {
  const str = '/@vitext/hack-import';
  const portionIndex = id.search(str);
  const strLength = str.length;
  if (portionIndex < 0) return id;
  return id.slice(portionIndex + strLength, id.length - 3);
}

export async function getEntryPoints(
  config: Vite.UserConfig | Vite.ViteDevServer['config']
) {
  return await glob('./pages/**/*.+(js|jsx|ts|tsx)', {
    cwd: config.root,
  });
}

const returnConfigFiles = (root: string) =>
  ['vitext.config.js', 'vitext.config.ts'].map((file) =>
    path.resolve(root, file)
  );

export async function resolveInlineConfig(
  options: Vite.InlineConfig & Vite.UserConfig & { root: string },
  command: 'build' | 'serve'
): Promise<Vite.InlineConfig | Vite.ResolvedConfig> {
  const configFile: string =
    returnConfigFiles(options.root).find((file) => fs.existsSync(file)) ||
    './vitext.config.js';

  const config = await Vite.resolveConfig({ ...options, configFile }, command);

  if (command === 'build') {
    // @ts-ignore vite#issues#4016#4096
    config.plugins = config.plugins.filter(
      (p) => p.name !== 'vite:import-analysis'
    );
  }

  return {
    ...config,
    assetsInclude: options.assetsInclude,
    configFile: configFile,
    plugins: [
      {
        ...reactRefresh({
          exclude: [/vitext\/dynamic\.js/, /vitext\/app\.js/],
        }),
        enforce: 'post',
      },
      pluginSSR(),
      // ...createVitextPlugin(),
      ...config.plugins,
    ],
  };
}

export async function loadPage({
  server,
  entries,
  page,
}: {
  server: Vite.ViteDevServer;
  entries: Entries;
  page: Entries[number];
}) {
  const absolutePagePath = entries.find(
    (p) => p.pageName === page.pageName
  )!.absolutePagePath;

  return server.ssrLoadModule(
    path.join(server.config.root || '', absolutePagePath)
  ) as Promise<PageFileType>;
}

export const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
export const jsLangs = `\\.(js|ts|jsx|tsx)($|\\?)`;
export const jsLangsRE = new RegExp(jsLangs);
export const cssLangRE = new RegExp(cssLangs);
export const cssModuleRE = new RegExp(`\\.module${cssLangs}`);
export const directRequestRE = /(\?|&)direct\b/;
export const commonjsProxyRE = /\?commonjs-proxy/;
