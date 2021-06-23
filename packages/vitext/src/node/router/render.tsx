import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import ssrPrepass from 'react-ssr-prepass';

import type { AppType } from '../components/_app';
import type { DocumentType } from '../components/_document';
import type { PageFileType } from '../types';
import { getEntries, PageType } from './pages';

export async function render({
  page,
  loadModule,
  entries,
  template,
  pagesModuleId,
  Document,
  App,
}: {
  page: PageType;
  loadModule: (url: string) => Promise<Record<string, any>>;
  entries: ReturnType<typeof getEntries>;
  template: string;
  pagesModuleId: string;
  Document: DocumentType;
  App: AppType;
}): Promise<string> {
  const absolutePagePath = entries.find(
    (p) => p.pageName === page!.pagePath
  )!.absolutePagePath;

  const { default: PageComponent } = (await loadModule(
    absolutePagePath
  )) as PageFileType;

  const WrappedPage = () => <App Component={PageComponent} props={{}} />;

  const { helmetContext, Page } = Document.renderDocument(Document, {
    Component: WrappedPage,
    pageClientPath: pagesModuleId + (page!.page !== '/' ? page!.page : ''),
  });

  await ssrPrepass(Page); // Suspense support

  const componentHtml = ReactDOMServer.renderToString(Page);

  const headHtml = `
     ${helmetContext.helmet.title.toString()}
     ${helmetContext.helmet.meta.toString()}
     ${helmetContext.helmet.link.toString()}
     ${helmetContext.helmet.noscript.toString()}
     ${helmetContext.helmet.script.toString()}
     ${helmetContext.helmet.style.toString()}
     `;

  const html = template
    .replace('<!--vitext-->', componentHtml)
    .replace('</head>', headHtml + '</head>')
    .replace('<html', '<html ' + helmetContext.helmet.htmlAttributes.toString())
    .replace(
      '<body',
      '<body ' + helmetContext.helmet.bodyAttributes.toString()
    );

  return html;
}
