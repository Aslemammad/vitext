import type { ReactNode } from 'react';

declare module '*.module.css';

declare module 'react'  {
  interface SuspenseProps {
    children?: ReactNode | undefined;
    progressive?: boolean;
    server?: boolean;

    /** A fallback react tree to show when a Suspense child (like React.lazy) suspends */
    fallback: NonNullable<ReactNode> | null;
  }
}
