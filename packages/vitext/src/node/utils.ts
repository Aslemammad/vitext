// Copied from flareact
import React from 'react';

import { App as BaseApp, AppType } from './components/_app';
import { Document as BaseDocument, DocumentType } from './components/_document';
import { DYNAMIC_PAGE, getEntries } from './router/pages';

export function extractDynamicParams(source: string, path: string) {
  let test: RegExp | string = source;
  let parts = [];
  let params: Record<string, string> = {};

  for (const match of source.matchAll(/\[(\w+)\]/g)) {
    parts.push(match[1]);

    test = test.replace(DYNAMIC_PAGE, () => '([\\w_-]+)');
  }

  test = new RegExp(test, 'g');

  const matches = path.matchAll(test);

  for (const match of matches) {
    parts.forEach((part, idx) => (params[part] = match[idx + 1]));
  }

  return params;
}

// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE

const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

export function htmlEscapeJsonString(str: string) {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}

type ComponentFileType = { default: AppType | DocumentType } & Record<
  string,
  any
>;
type PromisedComponentFileType = Promise<ComponentFileType> | ComponentFileType;
export function resolveCustomComponents({
  entries,
  loadModule,
}: {
  entries: ReturnType<typeof getEntries>;
  loadModule: (url: string) => Promise<Record<string, any>>;
}) {
  const customApp = entries.find((page) => page.pageName === '/_app');
  const customDocument = entries.find((page) => page.pageName === '/_document');

  let AppFile: PromisedComponentFileType = { default: BaseApp };
  if (customApp) {
    AppFile = loadModule(
      customApp!.absolutePagePath
    ) as PromisedComponentFileType;
  }

  let DocumentFile: PromisedComponentFileType = { default: BaseDocument };
  if (customDocument) {
    DocumentFile = loadModule(
      customDocument!.absolutePagePath
    ) as PromisedComponentFileType;
  }

  return Promise.all([DocumentFile, AppFile] as const);
}
