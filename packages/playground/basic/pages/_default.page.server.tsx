import ReactDOMServer from "react-dom/server";
import React from "react";
import { html } from "vite-plugin-ssr";
import type { PageContextBuiltIn } from "vite-plugin-ssr/types";

export { render };
export { passToClient };

const passToClient = ["urlPathname"] as const;

function render(pageContext: PageContextBuiltIn) {
  return html`<div>hello</div>`
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
