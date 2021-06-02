import type { PageLoaded, UseStaticData, Theme } from './clientTypes';
export declare let useTheme: () => Theme;
export declare let usePagePaths: () => string[];
export declare let usePageModule: (path: string) => Promise<PageModule> | undefined;
export declare let useStaticData: UseStaticData;
interface PageModule {
    ['default']: PageLoaded;
}
export {};
//# sourceMappingURL=state.d.ts.map