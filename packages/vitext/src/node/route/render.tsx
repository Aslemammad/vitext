import * as path from 'path';
import * as React from 'react';
import ReactDOMServer from 'react-dom/server.js';
import { Manifest, ModuleNode, ViteDevServer } from 'vite';

import Loadable from '../../react/loadable';
import type { AppType } from '../components/_app';
import type { DocumentType } from '../components/_document';
import { Entries, GetPropsResult } from '../types';

function collectCss(
  mod: ModuleNode | undefined,
  preloadUrls: Set<string>,
  visitedModules: Set<string>
): void {
  if (!mod) return;
  if (!mod.url) return;
  if (visitedModules.has(mod.url)) return;
  visitedModules.add(mod.url);

  if (mod.url.endsWith('.css')) {
    preloadUrls.add(mod.url);
  }
  mod.importedModules.forEach((dep) => {
    collectCss(dep, preloadUrls, visitedModules);
  });
}

function setToCss(preloadUrls: Set<string>) {
  return [...preloadUrls]
    .map((url) => `<link rel="stylesheet" type="text/css" href="${url}">`)
    .join('\n');
}

export async function renderToHTML({
  entries,
  server,
  pageEntry,
  props,
  template,
  pagesModuleId,
  Component,
  Document,
  App,
  manifest,
}: {
  entries: Entries;
  server: ViteDevServer;
  pageEntry: Entries[number];
  props: GetPropsResult<unknown>['props'];
  template: string;
  pagesModuleId: string;
  Component: React.ComponentType<any>;
  Document: DocumentType;
  App: AppType;
  manifest: Manifest;
}): Promise<string> {
  const WrappedPage = () => <App Component={Component} props={props} />;

  const { helmetContext, Page } = Document.renderDocument(Document, {
    props,
    Component: WrappedPage,
    pageClientPath:
      pagesModuleId + (pageEntry.pageName !== '/' ? pageEntry.pageName : ''),
  });

  await Loadable.preloadAll();
  const componentHTML = ReactDOMServer.renderToString(Page);

  const preloadUrls = new Set<string>();
  const visitedModules = new Set<string>();
  const file = path.join(server.config.root, pageEntry.absolutePagePath);
  const appEntry = entries.find((entry) => entry.pageName.includes('_app'));
  const appFile = appEntry?.absolutePagePath;

  if (Object.entries(manifest || {}).length) {
    if (appEntry) {
      manifest[appEntry.manifestAddress!].css?.forEach((css) =>
        preloadUrls.add(path.join(server.config.root, 'dist', css))
      );
    }

    manifest[pageEntry.manifestAddress!].css?.forEach((css) =>
      preloadUrls.add(path.join(server.config.root, 'dist', css))
    );
  }

  if (server.config.mode === 'development') {
    if (appFile) {
      collectCss(
        await server.moduleGraph.getModuleByUrl(appFile),
        preloadUrls,
        visitedModules
      );
    }
    collectCss(
      await server.moduleGraph.getModuleByUrl(file),
      preloadUrls,
      visitedModules
    );
  }

  const stylesString = setToCss(preloadUrls);

  const headHtml = `
     ${helmetContext.helmet.title.toString()}
     ${helmetContext.helmet.meta.toString()}
     ${helmetContext.helmet.link.toString()}
     ${helmetContext.helmet.noscript.toString()}
     ${helmetContext.helmet.script.toString()}
     ${helmetContext.helmet.style.toString()}
     ${stylesString}
     `;

  const html = template
    .replace('<!--vitext-->', componentHTML)
    .replace('</head>', headHtml + '</head>')
    .replace('<html', '<html ' + helmetContext.helmet.htmlAttributes.toString())
    .replace(
      '<body',
      '<body ' + helmetContext.helmet.bodyAttributes.toString()
    );

  return html;
}
