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
  isExporting,
}: {
  env: ConfigEnv;
  req?: Connect.IncomingMessage;
  res?: ServerResponse;
  pageFile: PageFileType;
  page: PageType;
  isExporting: boolean;
}) {
  const query = querystring.parse(req?.originalUrl);

  let params: querystring.ParsedUrlQuery | undefined = page.params;

  // non-dynamic pages should not have getPaths
  if (
    env.mode === 'development' &&
    'getPaths' in pageFile &&
    page.pageEntry.pageName.includes('[')
  ) {
    const { paths } = await fetchPaths({ getPaths: pageFile.getPaths! });

    params = paths.find((p) =>
      isEqual(page.params, p.params, { strict: false })
    )?.params;
  }

  if ('getProps' in pageFile) {
    const getPropsResult = await fetchProps({
      req,
      res,
      query,
      params,
      getProps: pageFile.getProps!,
      isExporting,
    });

    if (!isExporting && getPropsResult.notFound) {
      res!.statusCode = 404;
      return;
    }

    if (getPropsResult.revalidate) {
      // TODO
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
  isExporting,
}: {
  req?: Connect.IncomingMessage;
  res?: ServerResponse;
  query?: querystring.ParsedUrlQuery;
  getProps: GetProps;
  params?: querystring.ParsedUrlQuery;
  isExporting: boolean;
}) {
  return getProps({ req, res, query: query || {}, params, isExporting });
}

export function fetchPaths({ getPaths }: { getPaths: GetPaths }) {
  return getPaths();
}
