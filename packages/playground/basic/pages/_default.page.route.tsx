import type { PageContextBuiltIn } from 'vite-plugin-ssr/types';

type RouteValue = Function;

type PageRouteExports = {
  default: RouteValue;
  iKnowThePerformanceRisksOfAsyncRouteFunctions?: boolean;
} & Record<string, unknown>;

type PageRoutes = {
  pageId: string;
  pageRouteFile?: {
    filePath: string;
    fileExports: PageRouteExports;
    routeValue: RouteValue;
  };
  filesystemRoute: string;
}[];

type ContextType = {
  url: string;
  _isPageContextRequest: boolean;
  _allPageFiles: {
    '.page': [object, object];
    '.page.route': [object];
    '.page.server': [object];
    '.page.client': [object];
  };
  _allPageIds: string[];
  _pageRoutes: PageRoutes;
  _isPreRendering: boolean;
};

export function _onBeforeRoute(
  pageContext: ContextType & {
    entries: {
      absolutePagePath: string;
      pageName: string;
      manifestAddress?: string;
    }[];
  } & Record<string, unknown>
) {
  console.log(pageContext);

  const compatibleEntries: PageRoutes = pageContext.entries.map((page) => ({
    pageId: '/pages' + page.pageName,
    filesystemRoute: page.pageName,
    // pageRouteFile:{h},
  }));

  console.log(compatibleEntries)

  return { pageContext: { _pageRoutes: compatibleEntries } };
  // const { Page } = pageContext;
  // const pageContent = ReactDOMServer.renderToString(
  //   <PageFrameworkWrapper pageContext={pageContext}>
  //     <PageWrapper>
  //       <Page />
  //     </PageWrapper>
  //   </PageFrameworkWrapper>
  // );
  //
  // return html`<!DOCTYPE html>
  //   <html>
  //     <head>
  //       <title>${title}</title>
  //       ${!description
  //         ? ""
  //         : html`<meta name="description" content="${description}" />`}
  //       ${html.dangerouslySkipEscape(head || "")}
  //     </head>
  //     <body>
  //       <div id="page-view">${html.dangerouslySkipEscape(pageContent)}</div>
  //     </body>
  //   </html>`;
}
