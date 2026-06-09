import { describe, it, expect } from 'vitest'
import { applyTransforms } from '../assembly'

const TEMPLATE = `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center px-8 py-4">
        <span className="text-xl font-bold text-blue-600">MyApp</span>
      </nav>
      {/* section:hero */}
      <section className="px-8 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900">Build something amazing</h1>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg">Get Started</button>
      </section>
      {/* end:hero */}
      {/* section:features */}
      <section className="px-8 py-16 bg-gray-50">
        <h2 className="text-2xl font-bold">Features</h2>
      </section>
      {/* end:features */}
      <footer className="px-8 py-8 text-center text-gray-400">MyApp</footer>
    </div>
  )
}`

describe('applyTransforms', () => {
  it('applies text replacement', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'replace-text', target: 'MyApp', value: 'SuperApp' },
    ])
    expect(result).toContain('SuperApp')
    expect(result).not.toContain('MyApp')
  })

  it('applies color swap', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'swap-color', from: 'blue', to: 'emerald' },
    ])
    expect(result).toContain('bg-emerald-600')
    expect(result).toContain('text-emerald-600')
    expect(result).not.toContain('blue-600')
  })

  it('applies section removal', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'remove-section', key: 'features' },
    ])
    expect(result).not.toContain('Features')
    expect(result).toContain('Build something amazing')
  })

  it('applies multiple transforms in sequence', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'replace-text', target: 'MyApp', value: 'LaunchPad' },
      { type: 'swap-color', from: 'blue', to: 'violet' },
      { type: 'remove-section', key: 'features' },
    ])
    expect(result).toContain('LaunchPad')
    expect(result).toContain('bg-violet-600')
    expect(result).not.toContain('Features')
    expect(result).not.toContain('MyApp')
    expect(result).not.toContain('blue')
  })

  it('applies dark mode toggle', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'dark-mode', enable: true },
    ])
    expect(result).toContain('dark:bg-gray-900')
    expect(result).toContain('bg-white')
  })

  it('applies layout changes', () => {
    const code = `export default function App() {
  return <div className="grid grid-cols-3 gap-6">Items</div>
}`
    const result = applyTransforms(code, [
      { type: 'change-layout', target: 'grid-cols-3', add: ['grid-cols-4'], remove: ['grid-cols-3'] },
    ])
    expect(result).toContain('grid-cols-4')
    expect(result).not.toContain('grid-cols-3')
  })

  it('applies icon swap', () => {
    const code = `import { Star } from 'lucide-react'
export default function App() {
  return <Star className="w-4 h-4" />
}`
    const result = applyTransforms(code, [
      { type: 'swap-icon', from: 'Star', to: 'Heart' },
    ])
    expect(result).toContain('Heart')
    expect(result).not.toContain('Star')
  })

  it('applies section addition', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'add-section', position: 'after', anchor: 'hero', jsx: '<section><p>New Section</p></section>' },
    ])
    expect(result).toContain('New Section')
    const heroIdx = result.indexOf('Build something amazing')
    const newIdx = result.indexOf('New Section')
    const featuresIdx = result.indexOf('Features')
    expect(newIdx).toBeGreaterThan(heroIdx)
    expect(newIdx).toBeLessThan(featuresIdx)
  })

  it('applies section reorder', () => {
    const result = applyTransforms(TEMPLATE, [
      { type: 'reorder-section', key: 'hero', direction: 'down' },
    ])
    const featuresIdx = result.indexOf('Features')
    const heroIdx = result.indexOf('Build something amazing')
    expect(featuresIdx).toBeLessThan(heroIdx)
  })

  it('works with real template code', () => {
    const landingTemplate = `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-blue-600">Starter</span>
      </nav>
      {/* section:features */}
      <section className="px-8 py-16 bg-gray-50">
        <h2 className="text-2xl font-bold text-center mb-12">Why choose us</h2>
      </section>
      {/* end:features */}
      <footer className="px-8 py-8 text-center text-sm text-gray-400">Starter</footer>
    </div>
  )
}`
    const result = applyTransforms(landingTemplate, [
      { type: 'replace-text', target: 'Starter', value: 'Acme' },
      { type: 'swap-color', from: 'blue', to: 'emerald' },
      { type: 'remove-section', key: 'features' },
    ])
    expect(result).toContain('Acme')
    expect(result).toContain('text-emerald-600')
    expect(result).not.toContain('Why choose us')
    expect(result).not.toContain('Starter')
    expect(result).not.toContain('blue')
  })
})
