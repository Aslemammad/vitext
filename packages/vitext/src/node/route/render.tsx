import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import ssrPrepass from 'react-ssr-prepass';

import type { AppType } from '../components/_app';
import type { DocumentType } from '../components/_document';
import { getEntries, PageType } from './pages';

export async function renderToHTML({
  page,
  props,
  template,
  pagesModuleId,
  Component,
  Document,
  App,
}: {
  page: PageType;
  props: Record<string, unknown>;
  entries: ReturnType<typeof getEntries>;
  template: string;
  pagesModuleId: string;
  Component: React.ComponentType<any>;
  Document: DocumentType;
  App: AppType;
}): Promise<string> {
  const WrappedPage = () => <App Component={Component} props={props} />;

  const { helmetContext, Page } = Document.renderDocument(Document, {
    props,
    Component: WrappedPage,
    pageClientPath: pagesModuleId + (page.page !== '/' ? page.page : ''),
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
