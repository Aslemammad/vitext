/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';
import React from 'react';

import { getEntries } from './route/pages';

export type Entries = ReturnType<typeof getEntries>;

export type GetPathsResult<P extends ParsedUrlQuery = ParsedUrlQuery> = {
  paths: Array<{ params: P }>;
};

export type GetPaths<P extends ParsedUrlQuery = ParsedUrlQuery> = () =>
  | Promise<GetPathsResult<P>>
  | GetPathsResult<P>;

export type GetPropsContext<Q extends ParsedUrlQuery = ParsedUrlQuery> = {
  req?: IncomingMessage;
  res?: ServerResponse;
  params?: Q;
  query: ParsedUrlQuery;
  isExporting: boolean;
};

type JustProps<P> = { props: P; revalidate?: number | boolean };
type NotFound = { notFound?: true };

export type GetPropsResult<P> = JustProps<P> & NotFound;

export type GetProps<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery
> = (context: GetPropsContext<Q>) => Promise<GetPropsResult<P>>;

export type InferGetPropsType<T> = T extends GetProps<infer P, any>
  ? P
  : T extends (
      context?: GetPropsContext<any>
    ) => Promise<GetPropsResult<infer P>>
  ? P
  : never;

export interface PageFileType {
  default: React.ComponentType<any>;
  getProps?: GetProps;
  getPaths?: GetPaths;
}

export type Await<T> = T extends {
    then(onfulfilled?: (value: infer U) => unknown): unknown;
} ? U : T;
