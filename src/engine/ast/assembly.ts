import type { TransformIntent } from './types'
import { parseJSX, generate } from './parse'
import { replaceText, swapColor, changeLayout, swapIcon, toggleDarkMode } from './theme-swapper'
import { removeSection, addSection, reorderSection } from './section-ops'

export function applyTransforms(code: string, intents: TransformIntent[]): string {
  const ast = parseJSX(code)

  for (const intent of intents) {
    switch (intent.type) {
      case 'replace-text':
        replaceText(ast, intent.target, intent.value)
        break
      case 'swap-color':
        swapColor(ast, intent.from, intent.to)
        break
      case 'remove-section':
        removeSection(ast, intent.key)
        break
      case 'add-section':
        addSection(ast, intent.position, intent.anchor, intent.jsx)
        break
      case 'reorder-section':
        reorderSection(ast, intent.key, intent.direction)
        break
      case 'change-layout':
        changeLayout(ast, intent.target, intent.add, intent.remove)
        break
      case 'swap-icon':
        swapIcon(ast, intent.from, intent.to)
        break
      case 'dark-mode':
        toggleDarkMode(ast, intent.enable)
        break
    }
  }

  return generate(ast).code
}

export type { TransformIntent } from './types'
