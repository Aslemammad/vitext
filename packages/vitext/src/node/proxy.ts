import * as http from 'http'
import httpProxy from 'http-proxy'
import chalk from 'chalk'
import { Connect, HttpProxy, ResolvedConfig } from 'vite'
import { isObject } from './utils'

const HMR_HEADER = 'vite-hmr'
export interface ProxyOptions extends HttpProxy.ServerOptions {
  /**
   * rewrite path
   */
  rewrite?: (path: string) => string
  /**
   * configure the proxy server (e.g. listen to events)
   */
  configure?: (proxy: HttpProxy.Server, options: ProxyOptions) => void
  /**
   * webpack-dev-server style bypass function
   */
  bypass?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    options: ProxyOptions
  ) => void | null | undefined | false | string
}

export function proxyMiddleware(
  httpServer: http.Server | null,
  config: ResolvedConfig
): Connect.NextHandleFunction {
  const options = config.server.proxy!

  // lazy require only when proxy is used
  const proxies: Record<string, [HttpProxy.Server, ProxyOptions]> = {}

  Object.keys(options).forEach((context) => {
    let opts = options[context]
    if (typeof opts === 'string') {
      opts = { target: opts, changeOrigin: true } as ProxyOptions
    }
    const proxy = httpProxy.createProxyServer(opts) as HttpProxy.Server

    proxy.on('error', (err) => {
      config.logger.error(`${chalk.red(`http proxy error:`)}\n${err.stack}`, {
        timestamp: true
      })
    })

    if (opts.configure) {
      opts.configure(proxy, opts)
    }
    // clone before saving because http-proxy mutates the options
    proxies[context] = [proxy, { ...opts }]
  })

  if (httpServer) {
    httpServer.on('upgrade', (req, socket, head) => {
      const url = req.url!
      for (const context in proxies) {
        if (url.startsWith(context)) {
          const [proxy, opts] = proxies[context]
          if (
            (opts.ws || opts.target?.toString().startsWith('ws:')) &&
            req.headers['sec-websocket-protocol'] !== HMR_HEADER
          ) {
            if (opts.rewrite) {
              req.url = opts.rewrite(url)
            }
            proxy.ws(req, socket, head)
          }
        }
      }
    })
  }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteProxyMiddleware(req, res, next) {
    const url = req.url!
    for (const context in proxies) {
      if (
        (context.startsWith('^') && new RegExp(context).test(url)) ||
        url.startsWith(context)
      ) {
        const [proxy, opts] = proxies[context]
        const options: HttpProxy.ServerOptions = {}

        if (opts.bypass) {
          const bypassResult = opts.bypass(req, res, opts)
          if (typeof bypassResult === 'string') {
            req.url = bypassResult
            return next()
          } else if (isObject(bypassResult)) {
            Object.assign(options, bypassResult)
            return next()
          } else if (bypassResult === false) {
            return res.end(404)
          }
        }

        if (opts.rewrite) {
          req.url = opts.rewrite(req.url!)
        }
        proxy.web(req, res, options)
        return
      }
    }
    next()
  }
}
