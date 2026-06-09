import * as esbuild from 'esbuild-wasm'
import { virtualFsPlugin } from './virtual-fs'

let initialized = false

async function init() {
  if (initialized) return
  await esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.12/esbuild.wasm',
  })
  initialized = true
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data

  if (msg.type === 'compile') {
    try {
      await init()

      const result = await esbuild.build({
        entryPoints: [msg.entry],
        bundle: true,
        format: 'esm',
        jsx: 'automatic',
        jsxImportSource: 'react',
        plugins: [virtualFsPlugin(msg.files)],
        external: [
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        write: false,
        logLevel: 'silent',
      })

      const code = result.outputFiles?.[0]?.text ?? ''
      self.postMessage({ type: 'compiled', id: msg.id, code })
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err)
      self.postMessage({ type: 'error', id: msg.id, error })
    }
  }
}

init().then(() => {
  self.postMessage({ type: 'ready' })
}).catch((err: unknown) => {
  const error = err instanceof Error ? err.message : String(err)
  self.postMessage({ type: 'error', id: 'init', error })
})
