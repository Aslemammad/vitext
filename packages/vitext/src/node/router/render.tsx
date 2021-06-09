import ReactDOMServer from 'react-dom/server';
import ssrPrepass from 'react-ssr-prepass';

import Document from '../components/_document';
import type { PageFileType } from '../types';
import { getEntries, PageType } from './pages';

export async function render({
  page,
  loadModule,
  entries,
  template,
}: {
  page: PageType;
  loadModule: (url: string) => Promise<Record<string, any>>;
  entries: ReturnType<typeof getEntries>;
  template: string;
}): Promise<string> {
  const absolutePagePath = entries.find((p) => p.pageName === page!.pagePath)!
    .absolutePagePath;

  const { default: PageComponent } = (await loadModule(
    absolutePagePath
  )) as PageFileType;

  const { helmetContext, App } = Document.renderDocument(Document, {
    PageComponent,
  });

  ssrPrepass(App); // Suspense support
  const componentHtml = ReactDOMServer.renderToString(App);

  const headHtml = `
     ${helmetContext.helmet.title.toString()}
     ${helmetContext.helmet.meta.toString()}
     ${helmetContext.helmet.link.toString()}
     ${helmetContext.helmet.noscript.toString()}
     ${helmetContext.helmet.script.toString()}
     ${helmetContext.helmet.style.toString()}`;

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
