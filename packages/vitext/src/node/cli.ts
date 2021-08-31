import cac from 'cac';
import chalk from 'chalk';
import Vite from 'vite';

import * as utils from './utils';

// eslint-disable-next-line
console.log(chalk.cyan(`vitext v${require('vitext/package.json').version}`));

const cli = cac('vitext');

// global options
interface GlobalCLIOptions {
  '--'?: string[];
  debug?: boolean | string;
  d?: boolean | string;
  filter?: string;
  f?: string;
  config?: string;
  c?: boolean | string;
  root?: string;
  base?: string;
  r?: string;
  mode?: string;
  m?: string;
  logLevel?: Vite.LogLevel;
  l?: Vite.LogLevel;
  clearScreen?: boolean;
}

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions(options: GlobalCLIOptions) {
  const ret = { ...options };
  delete ret['--'];
  delete ret.debug;
  delete ret.d;
  delete ret.filter;
  delete ret.f;
  delete ret.config;
  delete ret.c;
  delete ret.root;
  delete ret.base;
  delete ret.r;
  delete ret.mode;
  delete ret.m;
  delete ret.logLevel;
  delete ret.l;
  delete ret.clearScreen;
  return ret;
}

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('-r, --root <path>', `[string] use specified root directory`)
  .option('--base <path>', `[string] public base path (default: /)`)
  .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
  .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
  .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
  .option('-f, --filter <filter>', `[string] filter debug logs`);

// dev
cli
  .command('[root]') // default command
  .alias('serve')
  .alias('dev')
  .option('--host [host]', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean] use TLS + HTTP/2`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('-m, --mode <mode>', `[string] set env mode`)
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle`
  )
  .action(
    async (
      root: string = process.cwd(),
      options: Vite.ServerOptions & GlobalCLIOptions
    ) => {
      const { createServer } = await import('./server');
      try {
        process.env['NODE_ENV'] = options.mode || 'development';
        const server = await createServer({
          root,
          base: options.base,
          mode: options.mode || 'development',
          configFile: options.config,
          logLevel: options.logLevel,
          clearScreen: options.clearScreen,
          server: cleanOptions(options) as Vite.ServerOptions,
        });
        server.listen();
      } catch (e) {
        Vite.createLogger(options.logLevel).error(
          chalk.red(`error when starting dev server:\n${e.stack}`)
        );
        process.exit(1);
      }
    }
  );

// build
cli
  .command('build [root]')
  .option('--target <target>', `[string] transpile target (default: 'modules')`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .option(
    '--assetsDir <dir>',
    `[string] directory under outDir to place assets in (default: _assets)`
  )
  .option(
    '--assetsInlineLimit <number>',
    `[number] static asset base64 inline threshold in bytes (default: 4096)`
  )
  .option(
    '--ssr [entry]',
    `[string] build specified entry for server-side rendering`
  )
  .option(
    '--sourcemap',
    `[boolean] output source maps for build (default: false)`
  )
  .option(
    '--minify [minifier]',
    `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
      `or specify minifier to use (default: terser)`
  )
  .option('--manifest', `[boolean] emit build manifest json`)
  .option('--ssrManifest', `[boolean] emit ssr manifest json`)
  .option(
    '--emptyOutDir',
    `[boolean] force empty outDir when it's outside of root`
  )
  .option('-m, --mode <mode>', `[string] set env mode`)
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .action(
    async (
      root: string = process.cwd(),
      options: Vite.BuildOptions & GlobalCLIOptions
    ) => {
      const buildOptions = cleanOptions(options) as Vite.BuildOptions;

      process.env['NODE_ENV'] = options.mode || 'production';

      try {
        const config = (await utils.resolveInlineConfig(
          {
            root,
            base: options.base,
            mode: options.mode || 'production',
            configFile: options.config,
            logLevel: options.logLevel,
            clearScreen: options.clearScreen,
            build: buildOptions,
          },
          'build'
        )) as Vite.InlineConfig;
        // await optimizeDeps(config as unknown as ResolvedConfig, true, true);
        await Vite.build(config);
      } catch (e) {
        Vite.createLogger(options.logLevel).error(
          chalk.red(`error during build:\n${e.stack}`)
        );
        process.exit(1);
      }
    }
  );

// optimize
cli
  .command('optimize [root]')
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle`
  )
  .action(
    async (
      root: string = process.cwd(),
      options: { force?: boolean } & GlobalCLIOptions
    ) => {
      try {
        const config = (await utils.resolveInlineConfig(
          {
            root,
            base: options.base,
            logLevel: options.logLevel,
          },
          'build'
        )) as Vite.ResolvedConfig;
        await Vite.optimizeDeps(config, options.force, true);
      } catch (e) {
        Vite.createLogger(options.logLevel).error(
          chalk.red(`error when optimizing deps:\n${e.stack}`)
        );
        process.exit(1);
      }
    }
  );

cli
  .command('preview [root]')
  .alias('start')
  .option('--host [host]', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean] use TLS + HTTP/2`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .action(
    async (
      root: string = process.cwd(),
      options: {
        host?: string;
        port?: number;
        https?: boolean;
        open?: boolean | string;
        strictPort?: boolean;
      } & GlobalCLIOptions
    ) => {
      process.env['NODE_ENV'] = options.mode || 'production';
      const { preview } = await import('./preview');
      try {
        const config = (await utils.resolveInlineConfig(
          {
            root,
            mode: options.mode || 'production',
            base: options.base,
            logLevel: options.logLevel,
            server: {
              open: options.open,
              strictPort: options.strictPort,
              https: options.https,
            },
          },
          'serve'
        )) as Vite.ResolvedConfig;

        await preview(
          config,
          cleanOptions(options) as {
            host?: string;
            port?: number;
          }
        );
      } catch (e) {
        Vite.createLogger(options.logLevel).error(
          chalk.red(`error when starting preview server:\n${e.stack}`)
        );
        process.exit(1);
      }
    }
  );

cli.help();
// eslint-disable-next-line
cli.version(require('vitext/package.json').version);

cli.parse();
