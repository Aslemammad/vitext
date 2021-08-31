import * as path from 'path';
import {
  GetManualChunk,
  GetModuleInfo,
  OutputAsset,
  OutputBundle,
} from 'rollup';
import type { Plugin} from 'vite';

import { cssLangRE, directRequestRE, getEntryPoints } from './utils';

export function build(): Plugin {
  return {
    name: 'vitext:build',
    apply: 'build',
    enforce: 'post',
    config: async (config) => {
      const pages = await getEntryPoints(config);
      const entries: Record<string, string> = {};
      pages.forEach(
        (p) =>
          (entries[p.substr(0, p.lastIndexOf('.')).replace('./', '')] =
            path.join(config.root!, p))
      );

      return {
        mode: 'production',
        optimizeDeps: {
          keepNames: undefined,
        },
        build: {
          outDir: path.join(config.root!, 'dist'),
          manifest: true,
          brotliSize: true,
          ssr: true,
          minify: true,
          rollupOptions: {
            input: entries,
            preserveEntrySignatures: 'allow-extension',
            output: {
              format: 'es',
              exports: 'named',
              manualChunks: createMoveToVendorChunkFn(),
            },
          },
          polyfillDynamicImport: false,
        },
      };
    },
  };
}

const assetsBundle: OutputBundle = {};

export function getAssets(): Plugin {
  return {
    name: 'vitext:get-assets',
    apply: 'build',
    enforce: 'pre',
    generateBundle(_, bundle) {
      const wipAssets: {
        [fileName: string]: OutputAsset;
      } = {};

      for (const file in bundle) {
        if (bundle[file].type === 'asset') {
          const asset = bundle[file] as OutputAsset;
          const source = asset.source.toString();
          wipAssets[asset.name!] = wipAssets[asset.name!] || asset;
          // inlined css (export ...) are the referenced files, but with incorrect source
          if (source.startsWith('export ')) {
            wipAssets[asset.name!].fileName = asset.fileName;
          } else {
            // plain css files source is correct
            wipAssets[asset.name!].source = asset.source;
          }
        }
      }
      for (const file in wipAssets) {
        const asset = wipAssets[file];
        assetsBundle[asset.fileName] = asset;
      }
    },
  };
}

export function writeAssets(): Plugin {
  return {
    name: 'vitext:write-assets',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      Object.assign(bundle, assetsBundle);
    },
  };
}

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request) && !directRequestRE.test(request);

function createMoveToVendorChunkFn(): GetManualChunk {
  const cache = new Map<string, boolean>();
  const dynamicImportsCache = new Set<string>();

  return (id, { getModuleInfo }) => {
    const moduleInfo = getModuleInfo(id);

    moduleInfo?.dynamicallyImportedIds.forEach((id) =>
      dynamicImportsCache.add(id)
    );

    if (dynamicImportsCache.has(id)) {
      return path.basename(id, path.extname(id));
    }

    if (
      id.includes('node_modules') &&
      !isCSSRequest(id) &&
      staticImportedByEntry(id, getModuleInfo, cache)
    ) {
      return 'vendor';
    }
  };
}

function staticImportedByEntry(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importStack: string[] = []
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean;
  }
  if (importStack.includes(id)) {
    // circular deps!
    cache.set(id, false);
    return false;
  }
  const mod = getModuleInfo(id);
  if (!mod) {
    cache.set(id, false);
    return false;
  }

  if (mod.isEntry) {
    cache.set(id, true);
    return true;
  }
  const someImporterIs = mod.importers.some((importer) =>
    staticImportedByEntry(
      importer,
      getModuleInfo,
      cache,
      importStack.concat(id)
    )
  );
  cache.set(id, someImporterIs);
  return someImporterIs;
}
