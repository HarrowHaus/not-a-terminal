import type { TemplateField } from '../../data/templates/types'

const COLOR_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'from', 'to', 'via',
  'outline', 'accent', 'divide', 'decoration',
]

export function applyCustomizations(
  code: string,
  fields: TemplateField[],
  values: Record<string, string | boolean>
): string {
  let result = code

  for (const field of fields) {
    const value = values[field.key]
    if (value === undefined || value === field.default) continue

    if (field.type === 'text' && typeof field.default === 'string' && typeof value === 'string') {
      result = result.replaceAll(field.default as string, value as string)
    } else if (field.type === 'color' && typeof field.default === 'string' && typeof value === 'string') {
      const from = (field.default as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const utils = COLOR_PREFIXES.join('|')
      const regex = new RegExp(`(${utils})-(${from})-(\\d+)`, 'g')
      result = result.replace(regex, `$1-${value}-$3`)
    } else if (field.type === 'toggle' && value === false) {
      const key = field.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(
        `\\{/\\*\\s*section:${key}\\s*\\*/\\}[\\s\\S]*?\\{/\\*\\s*end:${key}\\s*\\*/\\}`,
        'g'
      )
      result = result.replace(regex, '')
    }
  }

  return result
}
