import { Options } from '.'
import { build, Loader } from 'esbuild'
import fs from 'fs'
import path from 'path'
import {
  PluginContext,
  Plugin,
  LoadResult,
  TransformResult,
  TransformPluginContext,
} from 'rollup'

export const bundle = async (
  id: string,
  pluginContext: PluginContext,
  plugins: Plugin[],
  loaders: {
    [ext: string]: string
  },
  target: string | string[],
  options: Options
) => {
  const transform = async (inputCode: string, id: string) => {
    let code: string | undefined
    let map: any
    for (const plugin of plugins) {
      if (plugin.transform && plugin.name !== 'esbuild') {
        const transformed = (await plugin.transform.call(
          pluginContext as TransformPluginContext,
          inputCode,
          id
        )) as TransformResult
        if (transformed == null) continue
        if (typeof transformed === 'string') {
          code = transformed
        } else if (typeof transformed === 'object') {
          if (transformed.code !== null) {
            code = transformed.code
          }
          if (transformed.map !== null) {
            map = transformed.map
          }
        }
      }
    }
    return { code, map }
  }

  const result = await build({
    entryPoints: [id],
    format: 'esm',
    target,
    bundle: true,
    write: false,
    sourcemap: options.sourceMap || false,
    outdir: 'dist',
    platform: 'node',
    legalComments: 'inline',
    inject: options.inject || [],
    plugins: [
      {
        name: 'rollup',
        setup: (build) => {
          build.onResolve({ filter: /.+/ }, async (args) => {
            const resolved = await pluginContext.resolve(
              args.path,
              args.importer
            )
            if (resolved == null) return
            return {
              external:
                resolved.external === 'absolute' ? true : resolved.external,
              path: resolved.id,
            }
          })

          build.onLoad({ filter: /.+/ }, async (args) => {
            const loader = loaders[path.extname(args.path)] as
              | Loader
              | undefined

            let contents: string | undefined
            for (const plugin of plugins) {
              if (plugin.load && plugin.name !== 'esbuild') {
                const loaded = (await plugin.load.call(
                  pluginContext,
                  args.path
                )) as LoadResult
                if (loaded == null) {
                  continue
                } else if (typeof loaded === 'string') {
                  contents = loaded
                  break
                } else if (loaded && loaded.code) {
                  contents = loaded.code
                }
              }
            }

            if (contents == null) {
              contents = await fs.promises.readFile(args.path, 'utf8')
            }

            const transformed = await transform(contents, args.path)
            if (transformed.code) {
              let code = transformed.code
              if (transformed.map) {
                const map = Buffer.from(
                  typeof transformed.map === 'string'
                    ? transformed.map
                    : JSON.stringify(transformed.map)
                ).toString('base64')
                code += `\n//# sourceMappingURL=data:application/json;base64,${map}`
              }
              return {
                contents: code,
              }
            }
            return {
              contents,
              loader: loader || 'js',
            }
          })
        },
      },
    ],
  })

  return {
    code: result.outputFiles.find((file) => file.path.endsWith('.js'))?.text,
    map: result.outputFiles.find((file) => file.path.endsWith('.map'))?.text,
  }
}
