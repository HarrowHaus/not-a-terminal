/**
 * Compositor: assembles multiple section JSX blocks into a complete page.
 *
 * Takes a list of section descriptions (like "hero + features + pricing + footer"),
 * searches the section index for each, and composes them into a single App component.
 */

import { searchSection } from './section-search'

export interface CompositorResult {
  code: string
  sections: Array<{
    name: string
    category: string
    similarity: number
  }>
}

/**
 * Compose a page from a list of section queries.
 * Each query is searched against the section index, and the best match is included.
 */
export async function composePage(sectionQueries: string[]): Promise<CompositorResult> {
  const matched: Array<{ name: string; category: string; similarity: number; code: string }> = []

  for (const query of sectionQueries) {
    const results = await searchSection(query, 1)
    if (results.length > 0 && results[0].similarity > 0.3) {
      const best = results[0]
      matched.push({
        name: best.name,
        category: best.category,
        similarity: best.similarity,
        code: best.code,
      })
    }
  }

  const sectionBlocks = matched.map((s) => `      ${s.code}`).join('\n')

  const code = `export default function App() {
  return (
    <div className="min-h-screen bg-white">
${sectionBlocks}
    </div>
  )
}`

  return {
    code,
    sections: matched.map((s) => ({
      name: s.name,
      category: s.category,
      similarity: s.similarity,
    })),
  }
}

/**
 * Parse a compositional request like "hero + features + pricing + footer"
 * into individual section queries.
 */
export function parseCompositionRequest(input: string): string[] | null {
  // Match patterns like "hero + pricing + footer" or "hero, pricing, footer"
  const plusParts = input.split(/\s*\+\s*/)
  if (plusParts.length >= 2) {
    return plusParts.map((p) => p.trim()).filter((p) => p.length > 0)
  }

  // Check if it looks like a composition (mentions multiple section types)
  const sectionKeywords = ['hero', 'header', 'nav', 'features', 'pricing', 'testimonials', 'faq',
    'newsletter', 'contact', 'team', 'stats', 'cta', 'footer', 'about', 'gallery']
  const lower = input.toLowerCase()
  const matched = sectionKeywords.filter((k) => lower.includes(k))

  if (matched.length >= 3) {
    return matched
  }

  return null
}
