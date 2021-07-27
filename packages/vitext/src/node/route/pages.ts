import * as path from 'path';
import type { ParsedUrlQuery } from 'querystring';
import { Manifest } from 'vite';

export const DYNAMIC_PAGE = new RegExp('\\[(\\w+)\\]', 'g');
const publicPaths = ['/favicon.ico', '/__vite_ping'];

export type PageType = ReturnType<typeof resolvePagePath> & {};

export function resolvePagePath(pagePath: string, keys: string[]) {
  if (publicPaths.includes(pagePath)) {
    return;
  }

  const pagesMap = keys.map((page) => {
    const route = getRouteRegex(page);

    return {
      page,
      route,
      matcher: getRouteMatcher(route),
      params: {} as ReturnType<ReturnType<typeof getRouteMatcher>>,
      query: {} as ParsedUrlQuery,
    };
  });

  let page = pagesMap.find((p) => p.route.re.test(pagePath));

  if (!page) return;
  if (!Object.keys(page.route.groups).length) return page;

  page.params = page.matcher(pagePath);

  return page;
}

export function getEntries(
  pageManifest: string[],
  mode: string,
  manifest: Manifest
) {
  const prefix = mode === 'development' ? './pages' : 'pages';

  let entries: {
    absolutePagePath: string;
    pageName: string;
  }[] = [];
  pageManifest.forEach((page) => {
    if (/pages\/api\//.test(page)) return;

    const pageWithoutBase = page.slice(prefix.length, page.length - 1);
    let pageName = '/' + pageWithoutBase.match(/\/(.+)\.(js|jsx|ts|tsx)$/)![1];

    if (pageName.endsWith('/index')) {
      pageName = pageName.replace(/\/index$/, '/');
    }

    entries.push({
      absolutePagePath:
        mode === 'development'
          ? page
          : path.join('dist', manifest[page].file),
      pageName: pageName,
    });
  });
  return entries;
}

export interface Group {
  pos: number;
  repeat: boolean;
  optional: boolean;
}

// this isn't importing the escape-string-regex module
// to reduce bytes
function escapeRegex(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}

function parseParameter(param: string) {
  const optional = param.startsWith('[') && param.endsWith(']');
  if (optional) {
    param = param.slice(1, -1);
  }
  const repeat = param.startsWith('...');
  if (repeat) {
    param = param.slice(3);
  }
  return { key: param, repeat, optional };
}

// from next.js
export function getRouteRegex(normalizedRoute: string): {
  re: RegExp;
  namedRegex?: string;
  routeKeys?: { [named: string]: string };
  groups: { [groupName: string]: Group };
} {
  const segments = (normalizedRoute.replace(/\/$/, '') || '/')
    .slice(1)
    .split('/');
  const groups: { [groupName: string]: Group } = {};
  let groupIndex = 1;
  const parameterizedRoute = segments
    .map((segment) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
        groups[key] = { pos: groupIndex++, repeat, optional };
        return repeat ? (optional ? '(?:/(.+?))?' : '/(.+?)') : '/([^/]+?)';
      } else {
        return `/${escapeRegex(segment)}`;
      }
    })
    .join('');

  let routeKeyCharCode = 97;
  let routeKeyCharLength = 1;

  // builds a minimal routeKey using only a-z and minimal number of characters
  const getSafeRouteKey = () => {
    let routeKey = '';

    for (let i = 0; i < routeKeyCharLength; i++) {
      routeKey += String.fromCharCode(routeKeyCharCode);
      routeKeyCharCode++;

      if (routeKeyCharCode > 122) {
        routeKeyCharLength++;
        routeKeyCharCode = 97;
      }
    }
    return routeKey;
  };

  const routeKeys: { [named: string]: string } = {};

  let namedParameterizedRoute = segments
    .map((segment) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
        // replace any non-word characters since they can break
        // the named regex
        let cleanedKey = key.replace(/\W/g, '');
        let invalidKey = false;

        // check if the key is still invalid and fallback to using a known
        // safe key
        if (cleanedKey.length === 0 || cleanedKey.length > 30) {
          invalidKey = true;
        }
        if (!isNaN(parseInt(cleanedKey.substr(0, 1)))) {
          invalidKey = true;
        }

        if (invalidKey) {
          cleanedKey = getSafeRouteKey();
        }

        routeKeys[cleanedKey] = key;
        return repeat
          ? optional
            ? `(?:/(?<${cleanedKey}>.+?))?`
            : `/(?<${cleanedKey}>.+?)`
          : `/(?<${cleanedKey}>[^/]+?)`;
      } else {
        return `/${escapeRegex(segment)}`;
      }
    })
    .join('');

  return {
    re: new RegExp(`^${parameterizedRoute}(?:/)?$`),
    groups,
    routeKeys,
    namedRegex: `^${namedParameterizedRoute}(?:/)?$`,
  };
}

export function getRouteMatcher(routeRegex: ReturnType<typeof getRouteRegex>) {
  const { re, groups } = routeRegex;
  return (pathname: string | null | undefined) => {
    const routeMatch = re.exec(pathname!);
    if (!routeMatch) {
      return {};
    }

    const decode = (param: string) => {
      try {
        return decodeURIComponent(param);
      } catch (_) {
        throw new Error('failed to decode param');
      }
    };
    const params: { [paramName: string]: string | string[] } = {};

    Object.keys(groups).forEach((slugName: string) => {
      const g = groups[slugName];
      const m = routeMatch[g.pos];
      if (m !== undefined) {
        params[slugName] = ~m.indexOf('/')
          ? m.split('/').map((entry) => decode(entry))
          : g.repeat
          ? [decode(m)]
          : decode(m);
      }
    });
    return params;
  };
}
