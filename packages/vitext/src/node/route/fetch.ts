import type { ServerResponse } from 'http';
import * as querystring from 'querystring';
import type { Connect } from 'vite';

import type { GetProps, PageFileType } from '../types';

export async function fetchData({
  req,
  res,
  pageFile,
}: {
  req: Connect.IncomingMessage;
  res: ServerResponse;
  pageFile: PageFileType;
}): Promise<{ props?: any } | undefined> {
  const query = querystring.parse(req.originalUrl!);
  // let getPropsResult: GetPropsResult<any>;

  if ('getProps' in pageFile && !('getPaths' in pageFile)) {
    let getPropsResult = await fetchProps({
      req,
      res,
      query,
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
}: {
  req: Connect.IncomingMessage;
  res: ServerResponse;
  query: querystring.ParsedUrlQuery;
  getProps: GetProps;
}) {
  return await getProps({ req, res, query });
}
