import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
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
  const absolutePagePath = entries.find(
    (p) => p.pageName === page!.pagePath
  )!.absolutePagePath;

  const { default: PageComponent } = (await loadModule(
    absolutePagePath
  )) as PageFileType;

  const componentHtml = ReactDOMServer.renderToString(<PageComponent />);

  const html = template.replace('<!--vitext-->', componentHtml);
  return html;

  // const Component = page.default
  // const App = getPage('/_app', context).default
  // // const Document = getPage("/_document", context).default;
  //
  // const renderPage = options => {
  //   const EnhancedApp = options.enhanceApp ? options.enhanceApp(App) : App
  //
  //   const html = ReactDOMServer.renderToString(
  //     <RouterProvider
  //       initialUrl={event.request.url}
  //       initialPagePath={page.pagePath}
  //     >
  //       <AppProvider
  //         Component={Component}
  //         App={EnhancedApp}
  //         pageProps={props}
  //         context={context}
  //       />
  //     </RouterProvider>
  //   )
  //
  //   return { html }
  // }
  //
  // const docProps = await Document.getEdgeProps({
  //   page,
  //   props,
  //   context,
  //   event,
  //   buildManifest,
  //   renderPage,
  // })
  //
  // const helmet = Helmet.renderStatic()
  //
  // const html = Document.renderDocument(Document, {
  //   helmet,
  //   currentPage: getFlattenedCurrentPage(page),
  //   page,
  //   props,
  //   context,
  //   buildManifest,
  //   ...docProps,
  // })
  //
}
