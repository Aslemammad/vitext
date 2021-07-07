export const DYNAMIC_PAGE = new RegExp('\\[(\\w+)\\]', 'g');

function isSpecialPage(pagePath: string) {
  return /\/_(document|app)$/.test(pagePath);
}

function isSameRoute(a: string, b: string) {
  return b.endsWith('/')
    ? a.endsWith('/')
      ? a === b
      : a + '/' === b
    : a.endsWith('/')
    ? a === b + '/'
    : a === b;
}
export type PageType = ReturnType<typeof resolvePagePath> & {};

export function resolvePagePath(pagePath: string, keys: string[]) {


  const pagesMap = keys.map((page) => {
    let test = page;
    let parts = [];

    const isDynamic = DYNAMIC_PAGE.test(page);

    if (isDynamic) {
      for (const match of page.matchAll(/\[(\w+)\]/g)) {
        parts.push(match[1]);
        console.log(page.matchAll(/\[(\w+)\]/g))
      }

      test = test.replace(DYNAMIC_PAGE, () => '([^/]+)');
      console.log(test)
    }

    test = test
      .replace('/', '\\/')
      .replace(/^\./, '')
      .replace(/\.(js|jsx|ts|tsx)$/, '');

    return {
      page,
      pagePath: page.replace(/^\./, '').replace(/\.(js|jsx|ts|tsx)$/, ''),
      parts,
      test: new RegExp('^' + test + '$', isDynamic ? 'g' : ''),
      params: {},
    };
  });

  console.log(pagePath,keys,pagesMap)
  /**
   * First, try to find an exact match.
   */
  // let page = pagesMap.find((p) => pagePath === p.pagePath );
  let page = pagesMap.find((p) => pagePath === p.pagePath || isSameRoute(pagePath, p.pagePath));

  /**
   * If there's no exact match and the user is requesting a special page,
   * we need to return null as to not accidentally match a dynamic page below.
   */
  if (!page && isSpecialPage(pagePath)) {
    return null;
  }

  if (!page) {
    /**
     * Sort pages to include those with `index` in the name first, because
     * we need those to get matched more greedily than their dynamic counterparts.
     */
    pagesMap.sort((a) => (a.page.includes('index') ? -1 : 1));

    page = pagesMap.find((p) => p.test.test(pagePath));
  }

  /**
   * If an exact match couldn't be found, try giving it another shot with /index at
   * the end. This helps discover dynamic nested index pages.
   */
  if (!page) {
    page = pagesMap.find((p) => p.test.test(pagePath + '/index'));
  }

  if (!page) return null;
  if (!page.parts.length) return page;

  let params: { [k in string]: string } = {};

  page.test.lastIndex = 0;

  const matches = pagePath.matchAll(page.test);

  for (const match of matches) {
    page.parts.forEach((part, idx) => (params[part] = match[idx + 1]));
  }

  page.params = params;

  return page;
}

export function getEntries(pageManifest: string[]) {
  let entries: {
    absolutePagePath: string;
    pageName: string;
  }[] = [];

  pageManifest.forEach((page) => {
    if (/pages\/api\//.test(page)) return;

    const pageWithoutBase = page.slice('./pages'.length, page.length - 1);
    let pageName = '/' + pageWithoutBase.match(/\/(.+)\.(js|jsx|ts|tsx)$/)![1];

    if (pageName.endsWith('/index')) {
      pageName = pageName.replace(/\/index$/, '/');
    }

    entries.push({
      absolutePagePath: page,
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
  return str.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}

function parseParameter(param: string) {
  const optional = param.startsWith("[") && param.endsWith("]");
  if (optional) {
    param = param.slice(1, -1);
  }
  const repeat = param.startsWith("...");
  if (repeat) {
    param = param.slice(3);
  }
  return { key: param, repeat, optional };
}

// from next.js
export function getRouteRegex(
  normalizedRoute: string
): {
  re: RegExp;
  namedRegex?: string;
  routeKeys?: { [named: string]: string };
  groups: { [groupName: string]: Group };
} {
  const segments = (normalizedRoute.replace(/\/$/, "") || "/")
    .slice(1)
    .split("/");
  const groups: { [groupName: string]: Group } = {};
  let groupIndex = 1;
  const parameterizedRoute = segments
    .map((segment) => {
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const { key, optional, repeat } = parseParameter(segment.slice(1, -1));
        groups[key] = { pos: groupIndex++, repeat, optional };
        return repeat ? (optional ? "(?:/(.+?))?" : "/(.+?)") : "/([^/]+?)";
      } else {
        return `/${escapeRegex(segment)}`;
      }
    })
    .join("");

    let routeKeyCharCode = 97;
    let routeKeyCharLength = 1;

    // builds a minimal routeKey using only a-z and minimal number of characters
    const getSafeRouteKey = () => {
      let routeKey = "";

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
        if (segment.startsWith("[") && segment.endsWith("]")) {
          const { key, optional, repeat } = parseParameter(
            segment.slice(1, -1)
          );
          // replace any non-word characters since they can break
          // the named regex
          let cleanedKey = key.replace(/\W/g, "");
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
      .join("");

    return {
      re: new RegExp(`^${parameterizedRoute}(?:/)?$`),
      groups,
      routeKeys,
      namedRegex: `^${namedParameterizedRoute}(?:/)?$`
    };
}

export function getRouteMatcher(routeRegex: ReturnType<typeof getRouteRegex>) {
  const { re, groups } = routeRegex;
  return (pathname: string | null | undefined) => {
    const routeMatch = re.exec(pathname!);
    if (!routeMatch) {
      return false;
    }

    const decode = (param: string) => {
      try {
        return decodeURIComponent(param);
      } catch (_) {
        throw new Error("failed to decode param");
      }
    };
    const params: { [paramName: string]: string | string[] } = {};

    Object.keys(groups).forEach((slugName: string) => {
      const g = groups[slugName];
      const m = routeMatch[g.pos];
      if (m !== undefined) {
        params[slugName] = ~m.indexOf("/")
          ? m.split("/").map((entry) => decode(entry))
          : g.repeat
          ? [decode(m)]
          : decode(m);
      }
    });
    return params;
  };
}
