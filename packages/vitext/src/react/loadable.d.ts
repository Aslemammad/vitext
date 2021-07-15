/* tslint:disable */
import React from 'react';

declare namespace LoadableExport {
  interface ILoadable {
    <P extends React.PropsWithChildren<any>>(opts: any): React.ComponentType<P>;
    Map<P extends React.PropsWithChildren<any>>(opts: any): React.ComponentType<P>;
    preloadAll(): Promise<any>;
    preloadReady(): Promise<any>;
  }
}

// eslint-disable-next-line no-redeclare
declare const LoadableExport: LoadableExport.ILoadable;

export = LoadableExport;
