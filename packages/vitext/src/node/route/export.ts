import { Mutex, MutexInterface } from 'async-mutex';
import chalk from 'chalk';
import isEqual from 'deep-equal';
import * as fs from 'fs';
import { mkdirp } from 'fs-extra';
import * as path from 'path';
import { ParsedUrlQuery } from 'querystring';
import { Manifest, ViteDevServer } from 'vite';

import { AppType } from '../components/_app';
import { DocumentType } from '../components/_document';
import type { Entries, GetPathsResult, GetPropsResult } from '../types';
import { loadPage } from '../utils';
import { fetchPaths, fetchProps } from './fetch';
import { getRouteMatcher } from './pages';
import { renderToHTML } from './render';

type Params = ReturnType<ReturnType<typeof getRouteMatcher>>;

const cache: Map<string, Params[]> = new Map();

export async function loadExportedPage({
  root,
  pageName,
  params,
}: {
  root: string;
  pageName: string;
  params: Params;
}) {
  const manifestJSON: Params[] = cache.get(pageName) || [];
  try {
    const id = manifestJSON.findIndex((p) =>
      isEqual(params, p, { strict: false })
    );

    if (id === -1) return;

    const htmlAddress = path.join(root, 'dist/out', pageName, `${id}.html`);

    await fs.promises.access(htmlAddress);
    return await fs.promises.readFile(htmlAddress, 'utf-8');
  } catch {
    return;
  }
}
export async function exportPage({
  server,
  entries,
  page,
  template,
  pagesModuleId,
  Document,
  App,
  manifest,
}: {
  server: ViteDevServer;
  entries: Entries;
  page: Entries[number];
  template: string;
  pagesModuleId: string;
  Document: DocumentType;
  App: AppType;
  manifest: Manifest;
}) {
  const mutex = new Mutex();
  try {
    const {
      default: Component,
      getPaths,
      getProps,
    } = await loadPage({ server, entries, page });

    if (!getPaths && getProps) {
      return;
    }

    if (getPaths && !getProps) {
      throw new Error('[vitext] Page contains `getPaths`, but not `getProps`');
    }

    let paths: GetPathsResult<any>['paths'] | undefined;
    if (getPaths && getProps) {
      paths = (await fetchPaths({ getPaths: getPaths })).paths;
    }

    const resultsArray: (
      | Promise<GetPropsResult<ParsedUrlQuery>>
      | GetPropsResult<ParsedUrlQuery>
    )[] = paths
      ? paths.map(({ params }) =>
          fetchProps({ getProps: getProps!, params, isExporting: true })
        )
      : [{ props: {} }];

    const dir = path.join(server.config.root!, 'dist/out', page.pageName);

    const exportManifest = resultsArray.map(async (resultPromise, index) => {
      const result = await resultPromise;
      const params = paths ? paths[index].params : undefined;

      return {
        params,
        html: await renderToHTML({
          server,
          entries,
          template,
          pagesModuleId,
          Component,
          Document,
          App,
          pageEntry: page,
          props: result.props,
          manifest,
        }),
      };
    });
    const manifestAddress = path.join(dir, 'manifest.json');

    await mkdirp(path.dirname(manifestAddress));
    await fs.promises.writeFile(manifestAddress, JSON.stringify([]));

    exportManifest.forEach(async (filePromise, id) => {
      let release: MutexInterface.Releaser | undefined;
      try {
        const file = await filePromise;
        const htmlFile = path.join(dir, `${id}.html`);

        await fs.promises.writeFile(htmlFile, file.html);

        release = await mutex.acquire();
        const manifestFileContent = await fs.promises.readFile(
          manifestAddress,
          'utf-8'
        );

        const manifestJSON: any[] = JSON.parse(manifestFileContent);

        manifestJSON.push(file.params);

        await fs.promises.writeFile(
          manifestAddress,
          JSON.stringify(manifestJSON)
        );
        cache.set(page.pageName, manifestJSON);
      } catch (error) {
        server.config.logger.error(
          chalk.red(`[vitext] writing to file failed. error:\n`),
          error
        );

        server.config.logger.error(
          chalk.red(
            `exporting ${page.pageName} failed. error:\n${
              error.stack || error.message
            }`
          ),
          {
            timestamp: true,
          }
        );
      } finally {
        if (release) release();
      }
    });
    server.config.logger.info(
      chalk.green(`${page.pageName} exported successfully`),
      {
        timestamp: true,
      }
    );
  } catch (error) {
    server.config.logger.error(
      chalk.red(
        `exporting ${page.pageName} failed. error:\n${
          error.stack || error.message
        }`
      ),
      {
        timestamp: true,
      }
    );
  }
}
