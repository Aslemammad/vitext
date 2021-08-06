// @ts-check
import resolve from '@rollup/plugin-node-resolve';
import glob from 'fast-glob';
import * as fs from 'fs';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

import * as pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const extensions = ['.js', '.ts', '.tsx'];

const { root } = path.parse(process.cwd());

function external(id) {
  if (pkg.peerDependencies[id] || pkg.dependencies[id]) return true;
  return (
    id.startsWith('/@vitext') || (!id.startsWith('.') && !id.startsWith(root))
  );
}

function getEsbuild(inputDir, target) {
  return esbuild({
    minify: isProduction,
    sourceMap: !isProduction ? 'inline' : false,
    target,
    inject: [path.resolve(__dirname, 'react-shim.js')],
    experimentalBundling: true,
    external,
  });
}

function createDeclarationConfig(inputDir, inputFile, output) {
  return {
    input: path.resolve(inputDir, inputFile),
    output: {
      file: output,
      format: 'esm',
    },
    external,
    plugins: [dts()],
  };
}
function createESMConfig(inputDir, inputFile, output) {
  return {
    input: path.resolve(inputDir, inputFile),
    output: {
      file: output,
      format: 'esm',
      exports: 'named',
      paths: (id) => id,
    },
    external,
    plugins: [resolve({ extensions }), getEsbuild(inputDir, 'es2020')],
  };
}

function createCommonJSConfig(inputDir, inputFile, output) {
  return {
    input: path.resolve(inputDir, inputFile),
    output: { file: output, format: 'cjs', exports: 'named' },
    external,
    plugins: [resolve({ extensions }), getEsbuild(inputDir, 'node12')],
  };
}


function createInternalConfig(declaration) {
  if (declaration) {
    return [
      // createDeclarationConfig('src/client', 'main.tsx', 'client/main.d.ts'),
    ];
  }
  return [
    createESMConfig('src/client', 'main.tsx', 'dist/client/main.js'),
    // createCommonJSConfig(
    //   'src/node/route',
    //   'worker.ts',
    //   'internal/node/route/worker.js'
    // ),
  ];
}

function createComponentsConfig(declaration) {
  if (declaration) {
    return [
      createDeclarationConfig(
        'src/node/components',
        '_document.tsx',
        'document.d.ts'
      ),
      createDeclarationConfig('src/node/components', '_app.tsx', 'app.d.ts'),
      createDeclarationConfig('src/node/components', 'Head.tsx', 'head.d.ts'),
    ];
  }
  return [
    createCommonJSConfig('src/node/components', '_document.tsx', 'document.js'),
    // createCommonJSConfig('src/node/components', '_app.tsx', 'app.js'),
    createCommonJSConfig('src/node/components', '_app.tsx', 'app.node.js'),
    createESMConfig('src/node/components', '_app.tsx', 'app.js'),
    createESMConfig('src/node/components', 'Head.tsx', 'head.js'),
  ];
}

function createReactConfig(declaration) {
  if (declaration) {
    return [];
  }
  return [
    createESMConfig('src/react/', 'index.tsx', 'react.js'),
    createCommonJSConfig('src/react/', 'index.tsx', 'react.node.js'),
  ];
}

function createDynamicConfig(declaration) {
  if (declaration) {
    return [
      createDeclarationConfig('src/react/', 'dynamic.tsx', 'dynamic.d.ts'),
    ];
  }
  return [
    createESMConfig('src/react/', 'dynamic.tsx', 'dynamic.js'),
    // createCommonJSConfig('src/react/dynamic.tsx', 'index.tsx', 'dynamic.node.js'),
  ];
}

const config = {
  components: createComponentsConfig,
  internal: createInternalConfig,
  react: createReactConfig,
  dynamic: createDynamicConfig,
};

const filesToDelete = [
  'dynamic.*',
  'react.*',
  'head.*',
  'document.*',
  'core',
  'details.json',
  'app.*',
  'cli.*',
  'dist/**/*',
];

export default async function (args) {
  let c = Object.keys(args).find((key) => key.startsWith('config-'));
  let d = Object.keys(args).find((key) => key.startsWith('config-declaration'));

  if (c === 'config-delete') {
    const files = await glob(filesToDelete);
    await Promise.all(
      files.map(async (file) => {
        await fs.promises.unlink(file);
        console.log('deleted:', file);
      })
    );
    process.exit(0);
  }

  if (c) {
    c = c.slice('config-'.length);
    const configs = config[c](d);
    if (configs.length) {
      return configs;
    }
    process.exit(0);
  }
}
