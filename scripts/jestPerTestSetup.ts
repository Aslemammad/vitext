import fs from 'fs-extra';
import * as http from 'http';
import * as path from 'path';
import { resolve, dirname } from 'path';
import { ConsoleMessage, Page } from 'playwright-chromium';
import slash from 'slash';
import { ViteDevServer, UserConfig, build } from 'vite';

import { createServer } from '../packages/vitext/src/node/server';
import { resolveInlineConfig } from '../packages/vitext/src/node/utils';

// injected by the test env
declare global {
  namespace NodeJS {
    interface Global {
      page?: Page;
      viteTestUrl?: string;
    }
  }
}

const isBuildTest = !!process.env.VITE_TEST_BUILD;

let server: ViteDevServer | http.Server;
let tempDir: string;
let err: Error;

const logs = ((global as any).browserLogs = []);
const onConsole = (msg: ConsoleMessage) => {
  // @ts-ignore
  logs.push(msg.text());
};

beforeAll(async () => {
  const page = global.page;
  if (!page) {
    return;
  }
  try {
    page.on('console', onConsole);

    const testPath = expect.getState().testPath;
    const testName = slash(testPath).match(/playground\/([\w-]+)\//)?.[1];

    // if this is a test placed under playground/xxx/__tests__
    // start a vite server in that directory.
    if (testName) {
      const playgroundRoot = resolve(__dirname, '../packages/playground');
      const srcDir = resolve(playgroundRoot, testName);
      tempDir = resolve(__dirname, '../temp', testName);
      await fs.copy(srcDir, tempDir, {
        dereference: true,
        filter(file) {
          file = slash(file);
          return (
            !file.includes('__tests__') &&
            !file.includes('node_modules') &&
            !file.match(/dist(\/|$)/)
          );
        },
      });

      modifyPackageName(path.resolve(tempDir, './package.json'));

      const options: UserConfig & { root: string } = {
        root: tempDir,
        logLevel: 'error',
        server: {
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100,
          },
        },
        build: {
          // skip transpilation and dynamic import polyfills during tests to
          // make it faster
          target: 'esnext',
        },
      };
      process.env.VITE_INLINE = 'inline-serve';
      process.env['NODE_ENV'] = 'development';
      if (isBuildTest) {
        process.env['NODE_ENV'] = 'production';
        const config = await resolveInlineConfig(
          { ...options, mode: 'production' },
          'build'
        );
        await build(config);
      }
      server = await createServer({
        ...options,
        mode: isBuildTest ? 'production' : 'development',
      });
      server = await server.listen();

      const base = server.config.base === '/' ? '' : server.config.base;
      const url =
        (global.viteTestUrl = `http://localhost:${server.config.server.port}${base}`);
      await page.goto(url);
    }
  } catch (e) {
    // jest doesn't exit if our setup has error here
    // https://github.com/facebook/jest/issues/2713
    err = e;
    console.log(err);
  }
}, 30000);

afterAll(async () => {
  global.page && global.page.off('console', onConsole);
  if (server) {
    await server.close();
  }
  if (err) {
    throw err;
  }
});

function modifyPackageName(path: string) {
  const data: string = fs.readFileSync(path, 'utf-8');
  const parsedData = JSON.parse(data);
  parsedData.name = parsedData.name + '-test';
  fs.writeFileSync(path, JSON.stringify(parsedData), 'utf-8');
}
