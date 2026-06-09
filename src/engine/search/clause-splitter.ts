/**
 * Split multi-clause user input into individual action/section requests.
 *
 * Examples:
 *   "make the header blue and add pricing"
 *   → ["make the header blue", "add pricing"]
 *
 *   "change colors to red, add testimonials, remove the footer"
 *   → ["change colors to red", "add testimonials", "remove the footer"]
 *
 *   "enable dark mode but keep the pricing section"
 *   → ["enable dark mode", "keep the pricing section"]
 */

const SPLIT_PATTERN = /\s*(?:,\s*(?:and\s+)?|\s+and\s+|\s+but\s+|\s+then\s+|\s*;\s*)\s*/i

// Phrases that should NOT be split on "and" (compound nouns / proper names)
const COMPOUND_PHRASES = [
  'black and white',
  'drag and drop',
  'search and replace',
  'terms and conditions',
  'pros and cons',
  'bread and butter',
  'salt and pepper',
  'table and vine',
]

export function splitClauses(input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []

  // Protect compound phrases by replacing "and" with a placeholder
  let protected_ = trimmed
  const restorations: Array<{ placeholder: string; original: string }> = []

  for (const phrase of COMPOUND_PHRASES) {
    const regex = new RegExp(phrase.replace(/ /g, '\\s+'), 'gi')
    const match = protected_.match(regex)
    if (match) {
      for (const m of match) {
        const placeholder = `__COMPOUND_${restorations.length}__`
        restorations.push({ placeholder, original: m })
        protected_ = protected_.replace(m, placeholder)
      }
    }
  }

  // Split on conjunctions and punctuation
  const parts = protected_.split(SPLIT_PATTERN)

  // Restore compound phrases and clean up
  const clauses = parts
    .map((part) => {
      let restored = part
      for (const { placeholder, original } of restorations) {
        restored = restored.replace(placeholder, original)
      }
      return restored.trim()
    })
    .filter((clause) => clause.length >= 3)

  return clauses.length > 0 ? clauses : [trimmed]
}
