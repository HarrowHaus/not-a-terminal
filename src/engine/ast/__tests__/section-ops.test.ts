import { describe, it, expect } from 'vitest'
import { parseJSX, generate } from '../parse'
import { removeSection, addSection, reorderSection } from '../section-ops'

function transform(code: string, fn: (ast: ReturnType<typeof parseJSX>) => boolean): { code: string; result: boolean } {
  const ast = parseJSX(code)
  const result = fn(ast)
  return { code: generate(ast).code, result }
}

const TEMPLATE = `export default function App() {
  return (
    <div>
      <nav>Nav</nav>
      {/* section:hero */}
      <section className="hero">
        <h1>Hero Title</h1>
      </section>
      {/* end:hero */}
      {/* section:features */}
      <section className="features">
        <h2>Features</h2>
      </section>
      {/* end:features */}
      <footer>Footer</footer>
    </div>
  )
}`

describe('removeSection', () => {
  it('removes section between markers', () => {
    const { code, result } = transform(TEMPLATE, ast => removeSection(ast, 'hero'))
    expect(result).toBe(true)
    expect(code).not.toContain('Hero Title')
    expect(code).toContain('Nav')
    expect(code).toContain('Features')
    expect(code).toContain('Footer')
  })

  it('returns false for nonexistent section', () => {
    const { result } = transform(TEMPLATE, ast => removeSection(ast, 'nonexistent'))
    expect(result).toBe(false)
  })

  it('preserves other sections when removing one', () => {
    const { code } = transform(TEMPLATE, ast => removeSection(ast, 'features'))
    expect(code).toContain('Hero Title')
    expect(code).not.toContain('Features')
  })
})

describe('addSection', () => {
  it('adds JSX before a section', () => {
    const newJsx = '<section className="banner"><p>Banner</p></section>'
    const { code, result } = transform(TEMPLATE, ast => addSection(ast, 'before', 'hero', newJsx))
    expect(result).toBe(true)
    expect(code).toContain('Banner')
    const bannerIdx = code.indexOf('Banner')
    const heroIdx = code.indexOf('Hero Title')
    expect(bannerIdx).toBeLessThan(heroIdx)
  })

  it('adds JSX after a section', () => {
    const newJsx = '<section className="cta"><p>Call to Action</p></section>'
    const { code, result } = transform(TEMPLATE, ast => addSection(ast, 'after', 'hero', newJsx))
    expect(result).toBe(true)
    expect(code).toContain('Call to Action')
    const heroIdx = code.indexOf('Hero Title')
    const ctaIdx = code.indexOf('Call to Action')
    const featuresIdx = code.indexOf('Features')
    expect(ctaIdx).toBeGreaterThan(heroIdx)
    expect(ctaIdx).toBeLessThan(featuresIdx)
  })

  it('returns false for nonexistent anchor', () => {
    const { result } = transform(TEMPLATE, ast => addSection(ast, 'after', 'nonexistent', '<div>New</div>'))
    expect(result).toBe(false)
  })
})

describe('reorderSection', () => {
  it('moves section down', () => {
    const { code, result } = transform(TEMPLATE, ast => reorderSection(ast, 'hero', 'down'))
    expect(result).toBe(true)
    const featuresIdx = code.indexOf('Features')
    const heroIdx = code.indexOf('Hero Title')
    expect(featuresIdx).toBeLessThan(heroIdx)
  })

  it('moves section up', () => {
    const { code, result } = transform(TEMPLATE, ast => reorderSection(ast, 'features', 'up'))
    expect(result).toBe(true)
    const featuresIdx = code.indexOf('Features')
    const heroIdx = code.indexOf('Hero Title')
    expect(featuresIdx).toBeLessThan(heroIdx)
  })

  it('returns false when already at boundary', () => {
    const { result } = transform(TEMPLATE, ast => reorderSection(ast, 'hero', 'up'))
    expect(result).toBe(false)
  })

  it('preserves non-section content after reorder', () => {
    const { code } = transform(TEMPLATE, ast => reorderSection(ast, 'hero', 'down'))
    expect(code).toContain('Nav')
    expect(code).toContain('Footer')
  })
})
