import dynamic from 'vitext/dynamic';
import Head from 'vitext/head';
import * as React from 'react';

import Component from '../components/Component';

const timeout = (n: number) => new Promise((r) => setTimeout(r, n));

const DynamicComponent = dynamic(async () => {
  return (await import('../components/Component')).default;
});

const DynamicComponentNoServer = dynamic(
  async () => {
    return (await import('../components/Component')).default;
  },
  { server: false }
);
const LazyComponent = React.lazy(async () => {
  return import('../components/Component');
});

const IndexPage = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    timeout(200).then(() => setIsMounted(true));
  }, []);

  return (
    <>
      <Head>
        <title>Hello World</title>
      </Head>
      <div id="test">IndexPage</div>
      <div id="hmr-test-page">IndexPage</div>
      <div id="hydration-test">
        {isMounted ? 'hydrated' : 'server-rendered'}
      </div>
      <div id="hmr-test-component">
        <Component />
      </div>
      <div id="dynamic-server-test">
        <DynamicComponent fallback="loading" />
      </div>
      <div id="dynamic-no-server-test">
        <DynamicComponentNoServer fallback="loading" />
      </div>
      <div id="suspense-test">
        <React.Suspense fallback="loading">
          <LazyComponent />
        </React.Suspense>
      </div>
      <div id="suspense-test">{count}</div>
      <button onClick={() => setCount((prevCount) => prevCount + 1)}>
        increase
      </button>
    </>
  );
};

export default IndexPage;
