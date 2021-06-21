import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Script } from 'vitext/document';

const IndexPage = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  console.log(Script);
  return (
    <>
      <Helmet>
        <title>Hello World</title>
      </Helmet>
      <div id="test">IndexPage</div>
      <div id="hydration-test">
        {isMounted ? 'hydrated' : 'server-rendered'}
      </div>
    </>
  );
};

export default IndexPage;
