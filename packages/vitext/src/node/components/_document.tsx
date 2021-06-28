import React, { Component, createContext, useContext } from 'react';
import { HelmetProvider, HelmetData, Helmet } from 'react-helmet-async';

// import { htmlEscapeJsonString } from '../utils';

type DocumentProps = {
  Component: React.ComponentType<any>;
  pageClientPath: string;
  props: any; // fetched data
};

const DocumentContext = createContext<DocumentProps>(null as any);

export class Document extends Component {
  static renderDocument(
    DocumentComponent: typeof Document,
    props: DocumentProps
  ) {
    const helmetContext = {} as { helmet: HelmetData };
    return {
      Page: (
        <DocumentContext.Provider value={props}>
          <HelmetProvider context={helmetContext}>
            <DocumentComponent {...props} />
          </HelmetProvider>
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
  const { Component } = useContext(DocumentContext);
  return <Component />;
}

export function Script() {
  const { pageClientPath, props } = useContext(DocumentContext);

  return (
    <Helmet>
      <script id="__DATA" type="application/json">
        {JSON.stringify({
          pageClientPath,
          props: {
            [pageClientPath]: props,
          },
        })}
      </script>
    </Helmet>
  );
}
