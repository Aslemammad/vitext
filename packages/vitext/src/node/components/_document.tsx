import React, { Component, createContext, useContext } from 'react';
import { HelmetProvider, HelmetData, Helmet } from 'react-helmet-async';

import { htmlEscapeJsonString } from '../utils';

type Props = {
  PageComponent: React.ComponentType<any>;
};

const DocumentContext = createContext<Props>(null as any);

export default class Document extends Component {
  static renderDocument(DocumentComponent: typeof Document, props: Props) {
    const helmetContext = {} as { helmet: HelmetData };
    return {
      App: (
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

export function Main() {
  const { PageComponent } = useContext(DocumentContext);
  return <PageComponent />;
}

export function Script() {
  return (
    <Helmet>
      <script
        id="_DATA"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: htmlEscapeJsonString(JSON.stringify({})),
        }}
      ></script>
    </Helmet>
  );
}
