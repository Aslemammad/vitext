import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';


const timeout = (n: number) => new Promise((r) => setTimeout(r, n));

const IndexPage = () => {

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    timeout(100).then(() => setIsMounted(true)) 
  }, []);

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
