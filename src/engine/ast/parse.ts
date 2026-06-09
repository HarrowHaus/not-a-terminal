import { parse } from '@babel/parser'
import type { File } from '@babel/types'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'

// ESM/CJS interop — babel packages export CJS; bundler may wrap as { default }
const traverse = (typeof _traverse === 'function'
  ? _traverse
  : (_traverse as unknown as { default: typeof _traverse }).default) as typeof _traverse

const generate = (typeof _generate === 'function'
  ? _generate
  : (_generate as unknown as { default: typeof _generate }).default) as typeof _generate

function parseJSX(code: string): File {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })
}

export { parseJSX, traverse, generate }
