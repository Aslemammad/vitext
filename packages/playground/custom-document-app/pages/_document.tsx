import { Helmet } from 'react-helmet-async';
import { Document as BaseDocument, Main, Script } from 'vitext/document';

export class Document extends BaseDocument {
  render() {
    return (
      <>
        <Helmet>
          <meta name="description" content="This is written in Document" />
        </Helmet>
        <Main />
        <Script />
      </>
    );
  }
}
