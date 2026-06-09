import type { File } from '@babel/types'
import * as t from '@babel/types'
import { traverse } from './parse'

const COLOR_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'from', 'to', 'via',
  'outline', 'accent', 'divide', 'decoration',
]

const DARK_PAIRS: [string, string][] = [
  ['bg-white', 'dark:bg-gray-900'],
  ['bg-gray-50', 'dark:bg-gray-800'],
  ['bg-gray-100', 'dark:bg-gray-700'],
  ['text-gray-900', 'dark:text-gray-100'],
  ['text-gray-800', 'dark:text-gray-200'],
  ['text-gray-700', 'dark:text-gray-300'],
  ['text-gray-600', 'dark:text-gray-400'],
  ['text-gray-500', 'dark:text-gray-400'],
  ['text-gray-400', 'dark:text-gray-500'],
  ['border-gray-100', 'dark:border-gray-700'],
  ['border-gray-200', 'dark:border-gray-600'],
  ['divide-gray-100', 'dark:divide-gray-700'],
  ['divide-gray-200', 'dark:divide-gray-600'],
]

export function replaceText(ast: File, target: string, value: string): void {
  traverse(ast, {
    StringLiteral(path) {
      if (path.node.value.includes(target)) {
        path.node.value = path.node.value.replaceAll(target, value)
      }
    },
    JSXText(path) {
      if (path.node.value.includes(target)) {
        path.node.value = path.node.value.replaceAll(target, value)
      }
    },
  })
}

export function swapColor(ast: File, from: string, to: string): void {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const prefixes = COLOR_PREFIXES.join('|')
  const regex = new RegExp(`((?:${prefixes})-)${escaped}(-\\d+)`, 'g')

  traverse(ast, {
    JSXAttribute(path) {
      if (!t.isJSXIdentifier(path.node.name, { name: 'className' })) return
      if (!t.isStringLiteral(path.node.value)) return
      const updated = path.node.value.value.replace(regex, `$1${to}$2`)
      if (updated !== path.node.value.value) {
        path.node.value = t.stringLiteral(updated)
      }
    },
  })
}

export function changeLayout(ast: File, target: string, add: string[] = [], remove: string[] = []): void {
  traverse(ast, {
    JSXAttribute(path) {
      if (!t.isJSXIdentifier(path.node.name, { name: 'className' })) return
      if (!t.isStringLiteral(path.node.value)) return
      const classes = path.node.value.value.split(/\s+/)
      if (!classes.includes(target)) return
      let classList = classes.filter(c => c.length > 0 && !remove.includes(c))
      for (const cls of add) {
        if (!classList.includes(cls)) classList.push(cls)
      }
      path.node.value = t.stringLiteral(classList.join(' '))
    },
  })
}

export function swapIcon(ast: File, from: string, to: string): void {
  traverse(ast, {
    ImportSpecifier(path) {
      if (t.isIdentifier(path.node.imported, { name: from })) {
        path.node.imported = t.identifier(to)
        path.node.local = t.identifier(to)
      }
    },
    JSXIdentifier(path) {
      if (path.node.name === from) {
        path.node.name = to
      }
    },
  })
}

export function toggleDarkMode(ast: File, enable: boolean): void {
  traverse(ast, {
    JSXAttribute(path) {
      if (!t.isJSXIdentifier(path.node.name, { name: 'className' })) return
      if (!t.isStringLiteral(path.node.value)) return
      let classes = path.node.value.value
      if (enable) {
        const classList = classes.split(/\s+/)
        for (const [lightClass, darkClass] of DARK_PAIRS) {
          if (classList.includes(lightClass) && !classList.includes(darkClass)) {
            classes += ' ' + darkClass
          }
        }
      } else {
        classes = classes.split(/\s+/).filter(c => !c.startsWith('dark:')).join(' ')
      }
      if (classes !== path.node.value.value) {
        path.node.value = t.stringLiteral(classes)
      }
    },
  })
}
