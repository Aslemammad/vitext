import isEqual from 'deep-equal';
import type { ServerResponse } from 'http';
import * as querystring from 'querystring';
import type { ConfigEnv, Connect } from 'vite';

import type { GetPaths, GetProps, PageFileType } from '../types';
import type { PageType } from './pages';

export async function fetchData({
  env,
  req,
  res,
  pageFile,
  page,
  isGenerating,
}: {
  env: ConfigEnv;
  req?: Connect.IncomingMessage;
  res?: ServerResponse;
  pageFile: PageFileType;
  page: PageType;
  isGenerating: boolean;
}) {
  const query = querystring.parse(req?.originalUrl!);

  let params: querystring.ParsedUrlQuery | undefined;

  // non-dynamic pages should not have getPaths
  if (
    env.mode === 'development' &&
    'getPaths' in pageFile &&
    page.pageEntry.pageName.includes('[')
  ) {
    const { paths } = await fetchPaths({ getPaths: pageFile.getPaths! });

    console.log(paths)
    params = paths.find((p) =>
      isEqual(page.params, p.params, { strict: false })
    )?.params;
  }

  if ('getProps' in pageFile) {
    let getPropsResult = await fetchProps({
      req,
      res,
      query,
      params,
      getProps: pageFile.getProps!,
    });
    if (!isGenerating && getPropsResult.notFound) {
      res!.statusCode = 404;
      return;
    }
    if (getPropsResult.revalidate) {
    }
    return getPropsResult;
  }
  return;
}

export function fetchProps({
  req,
  res,
  query,
  getProps,
  params,
}: {
  req?: Connect.IncomingMessage;
  res?: ServerResponse;
  query?: querystring.ParsedUrlQuery;
  getProps: GetProps;
  params?: querystring.ParsedUrlQuery;
}) {
  return getProps({ req, res, query: query || {}, params });
}

export function fetchPaths({ getPaths }: { getPaths: GetPaths }) {
  return getPaths();
}
