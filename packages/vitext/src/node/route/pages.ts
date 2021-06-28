export const DYNAMIC_PAGE = new RegExp('\\[(\\w+)\\]', 'g');

function isSpecialPage(pagePath: string) {
  return /\/_(document|app)$/.test(pagePath);
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
      }

      test = test.replace(DYNAMIC_PAGE, () => '([^/]+)');
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

  /**
   * First, try to find an exact match.
   */
  let page = pagesMap.find((p) => pagePath === p.pagePath);

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
