/*
The MIT License (MIT)

Copyright (c) 2021 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Modified to be compatible with vitext
import * as React from 'react/index';
// eslint-disable-next-line
import Loadable, { CommonOptions } from 'vitext/src/react/loadable';

const isServerSide = typeof window === 'undefined';

export type Loader<P> = () => Promise<P>;

export type LoadableOptions<P> = Omit<CommonOptions, 'loading'> & {
  loader?: Loader<P>;
  loading?: ({
    error,
    isLoading,
    pastDelay,
  }: {
    error?: Error | null;
    isLoading?: boolean;
    pastDelay?: boolean;
    retry?: () => void;
    timedOut?: boolean;
  }) => JSX.Element | null;
};

export type DynamicOptions<P> = LoadableOptions<P>;

export type LoadableFn<P> = (opts: LoadableOptions<P>) => P;

export type LoadableComponent<P> = P;

type Props<P> = P & {
  fallback: string | LoadableOptions<any>['loading'] | JSX.Element;
};
function createDynamicComponent<P>(
  loadableOptions: LoadableOptions<React.ComponentType<P>>,
  opts: { server: boolean }
): React.ComponentType<Props<P>> {
  const loadableFn: LoadableFn<React.ComponentType<P>> = Loadable;
  const ResultComponent: React.ComponentType<any> = loadableFn(loadableOptions);

  // Todo please clean this, that's total trash, to get ready for the release
  const init = (ResultComponent as any).render.init as () => void;
  if (isServerSide && !opts.server) {
    (globalThis as any).ALL_INITIALIZERS = (
      (globalThis as any).ALL_INITIALIZERS as (() => void)[]
    ).filter((func) => func !== init);
  }

  const DynamicComponent: React.ComponentType<Props<P>> = ({
    ...props
  }: P & {
    fallback: string | LoadableOptions<any>['loading'] | JSX.Element;
  }) => {
    loadableOptions.loading =
      typeof props.fallback === 'function'
        ? props.fallback
        : () => <>{props.fallback}</>;

    const Loading = loadableOptions.loading!;
    // This will only be rendered on the server side
    if (isServerSide && !opts.server) {
      return (
        <Loading error={null} isLoading pastDelay={false} timedOut={false} />
      );
    }
    return <ResultComponent {...props} />;
  };

  return DynamicComponent;
}

export default function dynamic<P>(
  loader: Loader<React.ComponentType<P>>,
  opts: { server: boolean } = { server: true }
): React.ComponentType<Props<P>> {
  const loadableOptions: LoadableOptions<React.ComponentType<P>> = {
    delay: 400,
  };

  loadableOptions.loader = loader;

  return createDynamicComponent(loadableOptions, opts);
}
