// @ts-check
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import MagicString from 'magic-string';
import path from 'path';

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
    sourcemap: true,
  },
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
      ...Object.keys(require('./package.json').dependencies),
      ...Object.keys(require('./package.json').peerDependencies),
      ...(isProduction
        ? []
        : Object.keys(require('./package.json').devDependencies)),
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        target: 'es2019',
        include: ['src/node/**/*.ts', 'src/node/**/*.tsx'],
        esModuleInterop: true,
        tsconfig: path.resolve(__dirname, 'src/node/tsconfig.json'),
      }),
      // Some deps have try...catch require of optional deps, but rollup will
      // generate code that force require them upfront for side effects.
      // Shim them with eval() so rollup can skip these calls.
      commonjs({
        requireReturnsDefault: false,
        extensions: ['.js'],
        // Optional peer deps of ws. Native deps that are mostly for performance.
        // Since ws is not that perf critical for us, just ignore these deps.
        ignore: ['bufferutil', 'utf-8-validate'],
      }),
      json(),
      createRequire(),
    ],
  };

  return nodeConfig;
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
export default (commandLineArgs) => {
  const isDev = commandLineArgs.watch;
  const isProduction = !isDev;

  return [createNodeConfig(isProduction)];
};
