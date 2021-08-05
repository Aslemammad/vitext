import '/@windicss/windi.css'
import '../styles/main.css'
import Layout from '../components/Layout';

export default function App({
  Component,
  props,
}: {
  Component: React.ComponentType<any>;
  props: React.PropsWithChildren<any>;
}) {
  return (
    <Layout>
      <Component {...props} />
    </Layout>
  );
}
