/* tslint:disable */
import React from 'react';

declare namespace LoadableExport {
  interface LoadingComponentProps {
    isLoading: boolean;
    pastDelay: boolean;
    timedOut: boolean;
    error: any;
    retry: () => void;
  }
  interface CommonOptions {
    /**
     * React component displayed after delay until loader() succeeds. Also responsible for displaying errors.
     *
     * If you don't want to render anything you can pass a function that returns null
     * (this is considered a valid React component).
     */
    loading: React.ComponentType<LoadingComponentProps>;
    /**
     * Defaults to 200, in milliseconds.
     *
     * Only show the loading component if the loader() has taken this long to succeed or error.
     */
    delay?: number | false | null | undefined;
    /**
     * Disabled by default.
     *
     * After the specified time in milliseconds passes, the component's `timedOut` prop will be set to true.
     */
    timeout?: number | false | null | undefined;

    /**
     * Optional array of module paths that `Loadable.Capture`'s `report` function will be applied on during
     * server-side rendering. This helps the server know which modules were imported/used during SSR.
     * ```ts
     * Loadable({
     *   loader: () => import('./my-component'),
     *   modules: ['./my-component'],
     * });
     * ```
     */
    modules?: string[] | undefined;

    /**
     * An optional function which returns an array of Webpack module ids which you can get
     * with require.resolveWeak. This is used by the client (inside `Loadable.preloadReady`) to
     * guarantee each webpack module is preloaded before the first client render.
     * ```ts
     * Loadable({
     *  loader: () => import('./Foo'),
     *  webpack: () => [require.resolveWeak('./Foo')],
     * });
     * ```
     */
    webpack?: (() => Array<string | number>) | undefined;
  }
  interface ILoadable {
    <P extends React.PropsWithChildren<any>>(opts: any): React.ComponentType<P>;
    Map<P extends React.PropsWithChildren<any>>(
      opts: any
    ): React.ComponentType<P>;
    preloadAll(): Promise<any>;
    preloadReady(): Promise<any>;
  }
}

// eslint-disable-next-line no-redeclare
declare const LoadableExport: LoadableExport.ILoadable;

export = LoadableExport;
