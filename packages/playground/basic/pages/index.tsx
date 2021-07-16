import { useEffect, useState, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import dynamic from 'vitext/dynamic';

const timeout = (n: number) => new Promise((r) => setTimeout(r, n));

const DynamicComponent = dynamic(async () => {
  // await timeout(500);
  return (await import('../components/Component')).default;
});

const DynamicComponentNoServer = dynamic(
  async () => {
    // await timeout(500);
    return (await import('../components/Component')).default;
  },
  { server: false }
);
const Component = lazy(async () => {
  // await timeout(500);
  return import('../components/Component');
});

const IndexPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    timeout(200).then(() => setIsMounted(true));
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
      <div id="dynamic-server-test">
        <DynamicComponent fallback={'loading'} />
      </div>
      <div id="dynamic-no-server-test">
        <DynamicComponentNoServer fallback={'loading'} />
      </div>

      <div id="suspense-test">
        <Suspense fallback="loading">
          <Component />
        </Suspense>
      </div>
    </>
  );
};

export default IndexPage;
