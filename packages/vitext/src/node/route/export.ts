import { ViteDevServer } from 'vite';

import { AppType } from '../components/_app';
import { DocumentType } from '../components/_document';
import type { Entries } from '../types';
import { loadPage } from '../utils';
import { fetchPaths, fetchProps } from './fetch';
import { renderToHTML } from './render';

export async function exportPage({
  entries,
  page,
  template,
  pagesModuleId,
  Document,
  App,
  loadModule,
}: {
  entries: Entries;
  page: Entries[number];
  template: string;
  pagesModuleId: string;
  Document: DocumentType;
  App: AppType;
  loadModule: ViteDevServer['ssrLoadModule'];
}) {
  const {
    default: Component,
    getPaths,
    getProps,
  } = await loadPage({ entries, loadModule, page });


  if (!getPaths) {
    return;
  }

  if (!getProps) {
    throw new Error('Page contains `getPaths`, but not `getProps`');
  }

  const { paths } = await fetchPaths({ getPaths: getPaths });

  const paramsArray =await Promise.all(paths.map(({ params }) =>
    fetchProps({ getProps, params })
  ));

  const htmls = paramsArray.map(
    async (params) =>
      await renderToHTML({
        template,
        pagesModuleId,
        Component,
        Document,
        App,
        pageName: page.pageName,
        props: params.props,
      })
  );

  htmls.forEach(async (string) => {
    console.log(await string)
  })

  return htmls;
}

