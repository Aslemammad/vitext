/// <reference types="react" />
import type { PagesLoaded } from '../clientTypes';
/**
 * dynamic import don't work in ssr
 * to work around that, in ssr, we pass all the data needed by App
 * with this ctx
 * so the App can render the page data directly
 * instead of render the loading state
 */
export declare const dataCacheCtx: import("react").Context<PagesLoaded>;
export declare const setDataCacheCtx: import("react").Context<import("react").Dispatch<import("react").SetStateAction<PagesLoaded>>>;
//# sourceMappingURL=ctx.d.ts.map