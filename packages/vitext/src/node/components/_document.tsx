import React, { Component, createContext, useContext } from 'react';
import { HelmetProvider, HelmetData, Helmet } from 'react-helmet-async';

// import { htmlEscapeJsonString } from '../utils';

type Props = {
  Component: React.ComponentType<any>;
  pageClientPath: string;
};

const DocumentContext = createContext<Props>(null as any);

export class Document extends Component {
  static renderDocument(DocumentComponent: typeof Document, props: Props) {
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
  const { pageClientPath } = useContext(DocumentContext);

  return (
    <Helmet>
      <script id="__DATA" type="application/json">
        {JSON.stringify({ pageClientPath })}
      </script>
    </Helmet>
  );
}
