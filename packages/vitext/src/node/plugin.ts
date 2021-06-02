import pluginFactory from './'
import { Plugin } from 'vite'
import { OutputAsset, OutputChunk } from 'rollup'

const hashRE = /\.(\w+)\.js$/
const staticInjectMarkerRE = /\b(const _hoisted_\d+ = \/\*#__PURE__\*\/createStaticVNode)\("(.*)", (\d+)\)/g
const staticStripRE = /__VP_STATIC_START__.*?__VP_STATIC_END__/g
const staticRestoreRE = /__VP_STATIC_(START|END)__/g

const isPageChunk = (
  chunk: OutputAsset | OutputChunk
): chunk is OutputChunk & { facadeModuleId: string } =>
  !!(
    chunk.type === 'chunk' &&
    chunk.isEntry &&
    chunk.facadeModuleId &&
    chunk.facadeModuleId.endsWith('.md')
  )

export function createVitextPlugin(): Plugin[] {
  return [pluginFactory()]
}
