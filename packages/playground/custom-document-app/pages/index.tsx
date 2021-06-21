import React from 'react';
import { Helmet } from 'react-helmet-async';

const IndexPage = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <>
      <Helmet>
        <title>Hello World</title>
      </Helmet>
      <div id="test">IndexPage 2</div>
      <div id="hydration-test">
        {isMounted ? 'hydrated' : 'server-rendered'}
      </div>
    </>
  );
};

export default IndexPage;
