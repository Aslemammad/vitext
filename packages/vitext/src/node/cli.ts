import chalk from 'chalk';
import minimist from 'minimist';
import path from 'path';
import { createLogger } from 'vite';

import { createServer } from './server';

const argv: any = minimist(process.argv.slice(2));

console.log(
  chalk.cyan(
    `vitext v${require(path.resolve(__dirname, 'package.json')).version}`
  )
);

console.log(chalk.cyan(`vite v${require('vite/package.json').version}`));

const command = argv._[0];
const root = argv._[command ? 1 : 0];
if (root) {
  argv.root = root;
}
(async () => {
  switch (command) {
    case null:
    case 'dev':
      try {
        const server = await createServer(root);
        server.listen();
      } catch (error) {
        console.error(chalk.red(`failed to start server. error:\n`), error);
        process.exit(1);
      }

      break;
    case 'build':
      break;
    case 'serve':
      break;
    default:
      console.log(chalk.red(`unknown command "${command}".`));
      process.exit(1);
  }
})();
