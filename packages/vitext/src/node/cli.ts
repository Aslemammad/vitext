import chalk from 'chalk';
import minimist from 'minimist';
import path from 'path';
import { build } from 'vite';

import { createServer } from './server';
import { resolveInlineConfig } from './utils';

const argv: any = minimist(process.argv.slice(2));

console.log(
  chalk.cyan(
    `vitext v${require(path.resolve(__dirname, 'package.json')).version}`
  )
);

const command = argv._[0];
const root: string = argv._[command ? 1 : 0] || process.cwd();

(async () => {
  try {
    switch (command) {
      case null:
      case undefined:
      case 'dev': {
        process.env['NODE_ENV'] = 'development';
        const server = await createServer({ root, mode: 'development' });
        server.listen();
        break;
      }
      case 'build': {
        process.env['NODE_ENV'] = 'production';
        const config = await resolveInlineConfig(
          { root, mode: 'production' },
          'build'
        );
        await build(config);
        break;
      }
      case 'start':
      case 'serve': {
        process.env['NODE_ENV'] = 'production';
        const server = await createServer({
          root,
          mode: 'production',
          server: { hmr: false },
        });
        server.listen();
        break;
      }
      default:
        throw new Error(`unknown command "${command}".`);
    }
  } catch (error) {
    console.log(
      chalk.red(`[vitext] failed to run command "${command}". error:\n`),
      error
    );
    console.log(
      chalk.redBright(
        `\n[vitext] visit github.com/aslemammad/vitext/issues for issues`
      )
    );
    process.exit(1);
  }
})();
