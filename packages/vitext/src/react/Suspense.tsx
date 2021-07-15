import * as React from 'react';

type Props = {
  progressive?: boolean;
  server?: boolean;
};


export const SuspenseServer: React.ComponentType<React.SuspenseProps & Props> = ({
  fallback,
  }) => {
  return <>{fallback}</>
};

export default SuspenseServer;
