import chalk from 'chalk'
import minimist from 'minimist'
import path from 'path'
import { resolveConfig } from 'vite'
import { createServer } from './server'
import { ssrBuild } from './static-site-generation'
const argv: any = minimist(process.argv.slice(2))

console.log(
  chalk.cyan(
    `vitext v${require(path.resolve(__dirname, '../package.json')).version}`
  )
)
console.log(chalk.cyan(`vite v${require('vite/package.json').version}`))

const command = argv._[0]
const root = argv._[command ? 1 : 0]
if (root) {
  argv.root = root
}

;(async () => {
  switch (command) {
    case null:
    case 'dev':
      try {
        const server = await createServer(root)
        server.listen()
      } catch (error) {
        console.error(chalk.red(`failed to start server. error:\n`), error)
        process.exit(1)
      }

      if (false) {
        // user can pass --root or --configFile
        const viteConfig = await resolveConfig(argv, 'build')
        const thisPlugin = viteConfig.plugins.find((plugin) => {
          return plugin.name === 'vitext'
        })
        // @ts-expect-error
        const ssrConfig = thisPlugin?.vitePagesStaticSiteGeneration

        await ssrBuild(viteConfig, ssrConfig, argv).catch((err: any) => {
          console.error(chalk.red(`ssr error:\n`), err)
          process.exit(1)
        })
      }

      break
    case 'build':
      break
    case 'serve':
      break
    default:
      console.log(chalk.red(`unknown command "${command}".`))
      process.exit(1)
  }
})()
