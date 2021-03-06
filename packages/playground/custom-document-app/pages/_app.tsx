import { Head } from 'vitext/head';

export default function App({
  Component,
  props,
}: {
  Component: React.ComponentType<any>;
  props: React.PropsWithChildren<any>;
}) {
  return (
    <>
      <Head>
        <meta name="description" content="Test" />
      </Head>
      <Component {...props} />
    </>
  );
}
