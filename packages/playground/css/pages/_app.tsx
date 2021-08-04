import '../styles/main.css'

export default function App({
  Component,
  props,
}: {
  Component: React.ComponentType<any>;
  props: React.PropsWithChildren<any>;
}) {
  return (
      <Component {...props} />
  );
}
