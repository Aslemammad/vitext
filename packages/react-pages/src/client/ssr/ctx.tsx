import { createContext } from 'react'
import type { PagesLoaded } from '../../../clientTypes'

/**
 * dynamic import don't work in ssr
 * to work around that, in ssr, we pass all the data needed by App
 * with this ctx
 * so the App can render the page data directly
 * instead of render the loading state
 */
export const dataCacheCtx = createContext<PagesLoaded>({})
export const setDataCacheCtx = createContext<
  React.Dispatch<React.SetStateAction<PagesLoaded>>
>(() => {
  throw new Error(`setDataCacheCtx not found`)
})
