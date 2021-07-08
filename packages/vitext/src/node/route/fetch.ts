import isEqual from 'deep-equal';
import type { ServerResponse } from 'http';
import * as querystring from 'querystring';
import type { Connect } from 'vite';

import type { GetPaths, GetProps, PageFileType } from '../types';
import type { PageType } from './pages';

export async function fetchData({
  req,
  res,
  pageFile,
  page,
}: {
  req: Connect.IncomingMessage;
  res: ServerResponse;
  pageFile: PageFileType;
  page: PageType;
}): Promise<{ props?: any } | undefined> {
  const query = querystring.parse(req.originalUrl!);
  // let getPropsResult: GetPropsResult<any>;

  let params: querystring.ParsedUrlQuery | undefined;

  if ('getPaths' in pageFile) {
    const { paths } = await fetchPaths({ getPaths: pageFile.getPaths });

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
      getProps: pageFile.getProps,
    });
    if (getPropsResult.notFound) {
      res.statusCode = 404;
      return;
    }
    if (getPropsResult.revalidate) {
    }
    return getPropsResult;
  }
  return;
}

async function fetchProps({
  req,
  res,
  query,
  getProps,
  params,
}: {
  req: Connect.IncomingMessage;
  res: ServerResponse;
  query: querystring.ParsedUrlQuery;
  getProps: GetProps;
  params?: querystring.ParsedUrlQuery;
}) {
  return await getProps({ req, res, query, params });
}

async function fetchPaths({ getPaths }: { getPaths: GetPaths }) {
  return await getPaths();
}
