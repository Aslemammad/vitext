// @ts-check
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import MagicString from 'magic-string';
import path from 'path';
import dts from 'rollup-plugin-dts';

import * as pkg from './package.json';

const externalDeps = [
  '/@vitext/_app',
  'react',
  'react/index',
  'react-dom',
  'react-dom/server',
  'react-dom/server.js',
  'react-helmet-async',
  'use-subscription',
];

function external(id) {
  if (externalDeps.includes(id)) return true;
  if (pkg.peerDependencies[id] || pkg.dependencies[id]) return true;
  return id.startsWith('/@vitext') || !id.startsWith('.');
}
/**
 * @type { import('rollup').RollupOptions }
 */
const sharedNodeOptions = {
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: `node/[name].mjs`,
    chunkFileNames: 'node/chunks/dep-[hash].mjs',
    // exports: 'named',
    exports: 'auto',
    format: 'esm',
    externalLiveBindings: false,
    freeze: false,
    sourcemap: false
  },
  external,
  onwarn(warning, warn) {
    // node-resolve complains a lot about this but seems to still work?
    if (warning.message.includes('Package subpath')) {
      return;
    }
    // we use the eval('require') trick to deal with optional deps
    if (warning.message.includes('Use of eval')) {
      return;
    }
    if (warning.message.includes('Circular dependency')) {
      return;
    }
    warn(warning);
  },
};

const requireInject = `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);\n
`;

/**
 * @type { () => import('rollup').Plugin }
 */
function createRequire() {
  return {
    name: 'createRequire',
    transform(code) {
      if (code.includes('require')) {
        const s = new MagicString(code);
        s.prepend(requireInject);
        return { code: s.toString(), map: s.generateMap() };
      }
      return;
    },
  };
}

/**
 *
 * @param {boolean} isProduction
 * @returns {import('rollup').RollupOptions}
 */
const createNodeConfig = (isProduction) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const nodeConfig = {
    ...sharedNodeOptions,
    preserveEntrySignatures: 'allow-extension',
    input: {
      cli: path.resolve(__dirname, 'src/node/cli.ts'),
    },
    external: [
      'fsevents',
      ...externalDeps,
      ...Object.keys(require('./package.json').dependencies),
      ...Object.keys(require('./package.json').peerDependencies),
      ...(isProduction
        ? []
        : Object.keys(require('./package.json').devDependencies)),
    ],
    plugins: [
      typescript({
        target: 'es2019',
        include: ['src/node/**/*.ts', 'src/node/**/*.tsx'],
        esModuleInterop: true,
        tsconfig: path.resolve(__dirname, 'src/node/tsconfig.json'),
        sourceMap: false,
      }),
      nodeResolve({ preferBuiltins: true }),
      // Some deps have try...catch require of optional deps, but rollup will
      // generate code that force require them upfront for side effects.
      // Shim them with eval() so rollup can skip these calls.
      commonjs({
        // requireReturnsDefault: true,
        extensions: ['.js'],
        // Optional peer deps of ws. Native deps that are mostly for performance.
        // Since ws is not that perf critical for us, just ignore these deps.
        ignore: ['bufferutil', 'utf-8-validate'],
        // esmExternals:false
      }),
      json(),
      createRequire(),
    ],
  };

  return nodeConfig;
};

/**
 *
 * @param {boolean} isProduction
 * @param {boolean} types
 * @returns {import('rollup').RollupOptions}
 */
const createFilesConfig = (isProduction, types) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const filesConfig = {
    input: {
      app: path.resolve(__dirname, 'src/node/components/_app.tsx'),
      document: path.resolve(__dirname, 'src/node/components/_document.tsx'),
      head: path.resolve(__dirname, 'src/node/components/Head.tsx'),
      dynamic: path.resolve(__dirname, 'src/react/dynamic.tsx'),
    },
    plugins: [
      // @ts-ignore
      types
        ? {}
        : typescript({
            target: 'es2018',
            types: ['vite/client'],
            jsx: 'react',
            sourceMap: false,
            module: 'es2020',
          }),
      // @ts-ignore
      types ? dts() : {},
    ],
    external,
    output: {
      dir: path.resolve(__dirname),

      format: 'esm',
      sourcemap: false,
    },
  };
  return filesConfig;
};

/**
 *
 * @param {boolean} isProduction
 * @param {boolean} cjs
 * @returns {import('rollup').RollupOptions}
 */
const createReactConfig = (isProduction, cjs) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const filesConfig = {
    input: {
      [cjs ? 'react.node' : 'react']: path.resolve(
        __dirname,
        'src/react/index.tsx'
      ),
    },
    plugins: [
      // @ts-ignore
      cjs
        ? typescript({
            target: 'es2018',
            types: ['vite/client'],
            jsx: 'react',
            sourceMap: false,
            module: 'commonjs',
          })
        : typescript({
            target: 'es2018',
            types: ['vite/client'],
            jsx: 'react',
            sourceMap: false,
            module: 'es2020',
          }),
      // @ts-ignore
    ],
    external,
    output: {
      dir: path.resolve(__dirname),
      entryFileNames: `[name].${cjs ? 'cjs' : 'js'}`,
      format: cjs ? 'cjs' : 'esm',
      sourcemap: false,
    },
  };

  return filesConfig;
};

const createClientConfig = (isProduction) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const clientConfig = {
    input: path.resolve(__dirname, 'src/client/main.tsx'),
    plugins: [
      typescript({
        target: 'es2018',
        types: ['vite/client'],
        jsx: 'react',
        sourceMap: false,
      }),
    ],
    external,
    output: {
      file: path.resolve(__dirname, 'dist/client/main.js'),
      format: 'esm',
      sourcemap: false,
    },
  };

  return clientConfig;
};

export default (commandLineArgs) => {
  const isDev = commandLineArgs.watch;
  const isProduction = !isDev;

  return [
    createNodeConfig(isProduction),
    createFilesConfig(isProduction, false),
    createFilesConfig(isProduction, true),
    createClientConfig(isProduction),
    createReactConfig(isProduction, false),
    createReactConfig(isProduction, true),
  ];
};
