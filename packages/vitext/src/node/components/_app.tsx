import React from 'react';

export function App({
  Component,
  props,
}: {
  Component: React.ComponentType;
  props: React.PropsWithChildren<any>;
}) {
  return <Component {...props} />;
}
export type AppType = typeof App;
