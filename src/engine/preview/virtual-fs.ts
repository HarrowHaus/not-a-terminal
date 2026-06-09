import type { Plugin } from 'esbuild-wasm'

export function virtualFsPlugin(files: Record<string, string>): Plugin {
  return {
    name: 'virtual-fs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') {
          return { path: args.path, namespace: 'virtual' }
        }

        if (args.path.startsWith('.') || args.path.startsWith('/')) {
          const resolved = resolvePath(args.importer, args.path)
          const found = resolveWithExtensions(files, resolved)
          if (found) return { path: found, namespace: 'virtual' }
        }

        return { external: true }
      })

      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        const contents = files[args.path]
        if (contents === undefined) {
          return { errors: [{ text: `File not found: ${args.path}` }] }
        }
        return { contents, loader: getLoader(args.path) }
      })
    },
  }
}

function resolvePath(importer: string, relative: string): string {
  if (relative.startsWith('/')) return relative
  const dir = importer.split('/').slice(0, -1).join('/')
  const parts = (dir + '/' + relative).split('/')
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '..') resolved.pop()
    else if (part !== '.' && part !== '') resolved.push(part)
  }
  return '/' + resolved.join('/')
}

function resolveWithExtensions(files: Record<string, string>, path: string): string | null {
  if (files[path] !== undefined) return path
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    if (files[path + ext] !== undefined) return path + ext
  }
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    if (files[path + '/index' + ext] !== undefined) return path + '/index' + ext
  }
  return null
}

function getLoader(path: string): 'tsx' | 'ts' | 'jsx' | 'js' | 'css' {
  if (path.endsWith('.tsx')) return 'tsx'
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.jsx')) return 'jsx'
  if (path.endsWith('.css')) return 'css'
  return 'js'
}
