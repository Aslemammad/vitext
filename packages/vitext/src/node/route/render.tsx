import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import Loadable from '../../react/loadable'
import type { AppType } from '../components/_app';
import type { DocumentType } from '../components/_document';
import { GetPropsResult } from '../types';


export async function renderToHTML({
  pageName,
  props,
  template,
  pagesModuleId,
  Component,
  Document,
  App,
}: {
  pageName: string;
  props: GetPropsResult<unknown>['props'];
  template: string;
  pagesModuleId: string;
  Component: React.ComponentType<any>;
  Document: DocumentType;
  App: AppType;
}): Promise<string> {
  console.trace(props)
  const WrappedPage = () => <App Component={Component} props={props} />;

  const { helmetContext, Page } = Document.renderDocument(Document, {
    props,
    Component: WrappedPage,
    pageClientPath: pagesModuleId + (pageName !== '/' ? pageName : ''),
  });

  await Loadable.preloadAll()
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
