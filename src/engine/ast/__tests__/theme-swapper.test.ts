import { describe, it, expect } from 'vitest'
import { parseJSX, generate } from '../parse'
import { replaceText, swapColor, changeLayout, swapIcon, toggleDarkMode } from '../theme-swapper'

function transform(code: string, fn: (ast: ReturnType<typeof parseJSX>) => void): string {
  const ast = parseJSX(code)
  fn(ast)
  return generate(ast).code
}

describe('replaceText', () => {
  it('replaces text in string literals', () => {
    const code = `export default function App() {
  return <div><h1>Hello World</h1></div>
}`
    const result = transform(code, ast => replaceText(ast, 'Hello World', 'Goodbye World'))
    expect(result).toContain('Goodbye World')
    expect(result).not.toContain('Hello World')
  })

  it('replaces text in JSX attribute strings', () => {
    const code = `export default function App() {
  return <img alt="My Logo" />
}`
    const result = transform(code, ast => replaceText(ast, 'My Logo', 'Your Logo'))
    expect(result).toContain('Your Logo')
    expect(result).not.toContain('My Logo')
  })

  it('replaces multiple occurrences', () => {
    const code = `export default function App() {
  return <div><span>Acme</span><p>Acme Inc</p></div>
}`
    const result = transform(code, ast => replaceText(ast, 'Acme', 'Globex'))
    expect(result).toContain('Globex')
    expect(result).toContain('Globex Inc')
    expect(result).not.toContain('Acme')
  })
})

describe('swapColor', () => {
  it('swaps Tailwind color classes in className', () => {
    const code = `export default function App() {
  return <div className="bg-blue-500 text-blue-600">Hello</div>
}`
    const result = transform(code, ast => swapColor(ast, 'blue', 'red'))
    expect(result).toContain('bg-red-500')
    expect(result).toContain('text-red-600')
    expect(result).not.toContain('blue')
  })

  it('handles multiple color prefixes', () => {
    const code = `export default function App() {
  return <div className="bg-emerald-500 border-emerald-200 ring-emerald-300">Hello</div>
}`
    const result = transform(code, ast => swapColor(ast, 'emerald', 'violet'))
    expect(result).toContain('bg-violet-500')
    expect(result).toContain('border-violet-200')
    expect(result).toContain('ring-violet-300')
  })

  it('does not affect non-color classes', () => {
    const code = `export default function App() {
  return <div className="px-4 bg-blue-500 font-bold">Hello</div>
}`
    const result = transform(code, ast => swapColor(ast, 'blue', 'red'))
    expect(result).toContain('px-4')
    expect(result).toContain('font-bold')
    expect(result).toContain('bg-red-500')
  })
})

describe('changeLayout', () => {
  it('adds and removes classes from matching elements', () => {
    const code = `export default function App() {
  return <div className="grid grid-cols-3 gap-6">Items</div>
}`
    const result = transform(code, ast => changeLayout(ast, 'grid-cols-3', ['grid-cols-4'], ['grid-cols-3']))
    expect(result).toContain('grid-cols-4')
    expect(result).not.toContain('grid-cols-3')
    expect(result).toContain('grid')
    expect(result).toContain('gap-6')
  })

  it('only modifies elements matching the target class', () => {
    const code = `export default function App() {
  return (
    <div>
      <div className="grid grid-cols-3">Match</div>
      <div className="flex gap-4">No match</div>
    </div>
  )
}`
    const result = transform(code, ast => changeLayout(ast, 'grid-cols-3', ['grid-cols-2'], ['grid-cols-3']))
    expect(result).toContain('grid-cols-2')
    expect(result).toContain('flex gap-4')
  })
})

describe('swapIcon', () => {
  it('renames JSX element and import', () => {
    const code = `import { Star } from 'lucide-react'
export default function App() {
  return <Star className="w-4 h-4" />
}`
    const result = transform(code, ast => swapIcon(ast, 'Star', 'Heart'))
    expect(result).toContain('Heart')
    expect(result).not.toContain('Star')
  })

  it('renames all occurrences of the icon', () => {
    const code = `import { ArrowRight } from 'lucide-react'
export default function App() {
  return (
    <div>
      <ArrowRight />
      <span>Click</span>
      <ArrowRight size={16} />
    </div>
  )
}`
    const result = transform(code, ast => swapIcon(ast, 'ArrowRight', 'ArrowLeft'))
    expect(result).toContain('ArrowLeft')
    expect(result).not.toContain('ArrowRight')
  })
})

describe('toggleDarkMode', () => {
  it('adds dark: variants when enabling', () => {
    const code = `export default function App() {
  return <div className="bg-white text-gray-900">Hello</div>
}`
    const result = transform(code, ast => toggleDarkMode(ast, true))
    expect(result).toContain('dark:bg-gray-900')
    expect(result).toContain('dark:text-gray-100')
    expect(result).toContain('bg-white')
  })

  it('removes dark: variants when disabling', () => {
    const code = `export default function App() {
  return <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Hello</div>
}`
    const result = transform(code, ast => toggleDarkMode(ast, false))
    expect(result).not.toContain('dark:')
    expect(result).toContain('bg-white')
    expect(result).toContain('text-gray-900')
  })

  it('does not duplicate existing dark: classes', () => {
    const code = `export default function App() {
  return <div className="bg-white dark:bg-gray-900">Hello</div>
}`
    const result = transform(code, ast => toggleDarkMode(ast, true))
    const matches = result.match(/dark:bg-gray-900/g)
    expect(matches).toHaveLength(1)
  })
})
