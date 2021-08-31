import React from 'react';
// @ts-ignore
import Helmet from 'react-helmet-async/lib/index.js';

type DocumentProps = {
  Component: React.ComponentType<any>;
  pageClientPath: string;
  props: any; // fetched data
};
const DocumentContext = React.createContext<DocumentProps>(null as any);

export class Document extends React.Component {
  static renderDocument(
    DocumentComponent: typeof Document,
    props: DocumentProps
  ) {
    const helmetContext = {} as { helmet: Helmet.HelmetData };
    return {
      Page: (
        <DocumentContext.Provider value={props}>
          <Helmet.HelmetProvider context={helmetContext}>
            <DocumentComponent {...props} />
          </Helmet.HelmetProvider>
        </DocumentContext.Provider>
      ),
      helmetContext,
    };
  }

  render() {
    return (
      <>
        <Main />
        <Script />
      </>
    );
  }
}

export type DocumentType = typeof Document;

export function Main() {
  const { Component } = React.useContext(DocumentContext);
  return <Component />;
}

export function Script() {
  const { pageClientPath, props } = React.useContext(DocumentContext);

  return (
    <Helmet.Helmet>
      <script id="__DATA" type="application/json">
        {JSON.stringify({
          pageClientPath,
          props: {
            [pageClientPath]: props,
          },
        })}
      </script>
    </Helmet.Helmet>
  );
}
