import type { File, Node } from '@babel/types'
import * as t from '@babel/types'
import { parseJSX, traverse } from './parse'

interface SectionBounds {
  key: string
  startIndex: number
  endIndex: number
}

function getSectionComment(node: Node): string | null {
  if (!t.isJSXExpressionContainer(node)) return null
  if (!t.isJSXEmptyExpression(node.expression)) return null
  const comments = (node.expression as t.JSXEmptyExpression).innerComments ?? []
  for (const c of comments) {
    const text = c.value.trim()
    if (text.startsWith('section:') || text.startsWith('end:')) return text
  }
  return null
}

function findSectionsInChildren(children: Node[]): SectionBounds[] {
  const sections: SectionBounds[] = []
  const openMap = new Map<string, number>()

  for (let i = 0; i < children.length; i++) {
    const comment = getSectionComment(children[i])
    if (!comment) continue
    const startMatch = comment.match(/^section:(.+)$/)
    const endMatch = comment.match(/^end:(.+)$/)
    if (startMatch) {
      openMap.set(startMatch[1], i)
    } else if (endMatch) {
      const startIdx = openMap.get(endMatch[1])
      if (startIdx !== undefined) {
        sections.push({ key: endMatch[1], startIndex: startIdx, endIndex: i })
        openMap.delete(endMatch[1])
      }
    }
  }

  return sections.sort((a, b) => a.startIndex - b.startIndex)
}

export function removeSection(ast: File, key: string): boolean {
  let removed = false
  traverse(ast, {
    JSXElement(path) {
      if (removed) return
      const children = path.node.children
      const sections = findSectionsInChildren(children)
      const section = sections.find(s => s.key === key)
      if (!section) return
      children.splice(section.startIndex, section.endIndex - section.startIndex + 1)
      removed = true
    },
  })
  return removed
}

export function addSection(
  ast: File,
  position: 'before' | 'after',
  anchor: string,
  jsxCode: string,
): boolean {
  const fragmentAst = parseJSX(`const __f = (<>\n${jsxCode}\n</>)`)
  let newNodes: Node[] = []
  traverse(fragmentAst, {
    JSXFragment(path) {
      newNodes = path.node.children.filter(
        child => !t.isJSXText(child) || child.value.trim().length > 0,
      )
      path.stop()
    },
  })
  if (newNodes.length === 0) return false

  let added = false
  traverse(ast, {
    JSXElement(path) {
      if (added) return
      const children = path.node.children
      const sections = findSectionsInChildren(children)
      const anchorSection = sections.find(s => s.key === anchor)
      if (!anchorSection) return
      const insertIndex = position === 'before'
        ? anchorSection.startIndex
        : anchorSection.endIndex + 1
      children.splice(insertIndex, 0, ...newNodes)
      added = true
    },
  })
  return added
}

export function reorderSection(ast: File, key: string, direction: 'up' | 'down'): boolean {
  let reordered = false
  traverse(ast, {
    JSXElement(path) {
      if (reordered) return
      const children = path.node.children
      const sections = findSectionsInChildren(children)
      const idx = sections.findIndex(s => s.key === key)
      if (idx === -1) return
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sections.length) return

      const first = sections[Math.min(idx, swapIdx)]
      const second = sections[Math.max(idx, swapIdx)]
      const rangeA = children.slice(first.startIndex, first.endIndex + 1)
      const rangeB = children.slice(second.startIndex, second.endIndex + 1)
      const between = children.slice(first.endIndex + 1, second.startIndex)
      const before = children.slice(0, first.startIndex)
      const after = children.slice(second.endIndex + 1)

      path.node.children = [...before, ...rangeB, ...between, ...rangeA, ...after]
      reordered = true
    },
  })
  return reordered
}
