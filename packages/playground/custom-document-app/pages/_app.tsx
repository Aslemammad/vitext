import { Head } from 'vitext/Head';

const App = ({
  Component,
  props,
}: {
  Component: React.ComponentType<any>;
  props: React.PropsWithChildren<any>;
}) => {
  return (
    <>
      <Head>
        <meta name="description" content="Test" />
      </Head>
      <Component {...props} />
    </>
  );
};
export default App;
