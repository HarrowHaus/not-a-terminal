#!/usr/bin/env tsx
/**
 * crawl-templates.ts — Crawl template sources and extract JSX.
 *
 * Handles three source types:
 *   1. shadcn registries (JSON API: registry.directory, 21st.dev)
 *   2. Raw GitHub repos (HyperUI, Preline, Flowbite, TailGrids, Mamba, Meraki, Tailwind-Kit)
 *   3. HTML sources (auto-converted to JSX)
 *
 * Usage:
 *   tsx scripts/crawl-templates.ts --test           # inline test data
 *   tsx scripts/crawl-templates.ts --source hyperui  # single source
 *   tsx scripts/crawl-templates.ts --all             # all sources
 *   tsx scripts/crawl-templates.ts --output path.json
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate } from './types.js'

// ─── HTML → JSX converter ────────────────────────────────────────────

export function htmlToJsx(html: string): string {
  let jsx = html

  // class → className
  jsx = jsx.replace(/\bclass=/g, 'className=')

  // for → htmlFor
  jsx = jsx.replace(/\bfor=/g, 'htmlFor=')

  // tabindex → tabIndex
  jsx = jsx.replace(/\btabindex=/g, 'tabIndex=')

  // readonly → readOnly
  jsx = jsx.replace(/\breadonly\b/g, 'readOnly')

  // autocomplete → autoComplete
  jsx = jsx.replace(/\bautocomplete=/g, 'autoComplete=')

  // Self-close void elements: <br>, <hr>, <img ...>, <input ...>, <meta ...>, <link ...>
  jsx = jsx.replace(/<(br|hr|img|input|meta|link|area|col|embed|source|track|wbr)(\s[^>]*)?\s*>/gi,
    (_, tag, attrs) => `<${tag}${attrs || ''} />`)

  // Convert inline style strings to JSX objects (basic cases)
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styleStr: string) => {
    const pairs = styleStr.split(';').filter(Boolean).map(pair => {
      const [prop, ...valParts] = pair.split(':')
      const val = valParts.join(':').trim()
      // Convert kebab-case to camelCase
      const camelProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      // Quote the value
      return `${camelProp}: '${val}'`
    })
    return `style={{ ${pairs.join(', ')} }}`
  })

  // Remove HTML comments or convert to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}')

  // onclick → onClick (and other event handlers)
  jsx = jsx.replace(/\bonclick=/gi, 'onClick=')
  jsx = jsx.replace(/\bonchange=/gi, 'onChange=')
  jsx = jsx.replace(/\bonsubmit=/gi, 'onSubmit=')
  jsx = jsx.replace(/\bonfocus=/gi, 'onFocus=')
  jsx = jsx.replace(/\bonblur=/gi, 'onBlur=')

  return jsx
}

// ─── Source handlers ─────────────────────────────────────────────────

interface SourceHandler {
  name: string
  crawl(): Promise<CrawledTemplate[]>
}

/** Crawl a shadcn-compatible registry via JSON API */
async function crawlShadcnRegistry(
  registryName: string,
  apiUrl: string,
  componentUrlFn: (item: { name: string }) => string,
): Promise<CrawledTemplate[]> {
  const results: CrawledTemplate[] = []

  try {
    console.log(`  Fetching registry: ${apiUrl}`)
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as Array<{ name: string; description?: string; files?: Array<{ content?: string; path?: string }> }>

    const items = Array.isArray(data) ? data : []
    console.log(`  Found ${items.length} components`)

    for (const item of items.slice(0, 200)) {
      // Try to get component code from files array or fetch individually
      let code = ''

      if (item.files && item.files.length > 0 && item.files[0].content) {
        code = item.files[0].content
      } else {
        try {
          const componentUrl = componentUrlFn(item)
          const compRes = await fetch(componentUrl)
          if (compRes.ok) {
            const compData = await compRes.json() as { files?: Array<{ content?: string }> }
            code = compData.files?.[0]?.content ?? ''
          }
        } catch {
          // Skip components we can't fetch
        }
      }

      if (code.length > 50) {
        results.push({
          id: `${registryName}-${item.name}`,
          source: registryName,
          name: item.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          code,
          originalFormat: 'tsx',
          sourceUrl: componentUrlFn(item),
        })
      }
    }
  } catch (err) {
    console.error(`  Error crawling ${registryName}:`, (err as Error).message)
  }

  return results
}

/** Crawl a raw GitHub repo by fetching the file tree and downloading JSX/TSX/HTML files */
async function crawlGitHubRepo(
  repoOwner: string,
  repoName: string,
  sourceName: string,
  pathFilter: (path: string) => boolean,
  format: 'jsx' | 'tsx' | 'html' = 'tsx',
): Promise<CrawledTemplate[]> {
  const results: CrawledTemplate[] = []

  try {
    console.log(`  Fetching tree: ${repoOwner}/${repoName}`)
    const treeRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/main?recursive=1`,
      { headers: { 'Accept': 'application/vnd.github.v3+json' } },
    )

    if (!treeRes.ok) {
      // Try 'master' branch
      const masterRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/master?recursive=1`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } },
      )
      if (!masterRes.ok) throw new Error(`GitHub API ${treeRes.status}`)
      const data = await masterRes.json() as { tree: Array<{ path: string; type: string }> }
      return processTree(data.tree)
    }

    const data = await treeRes.json() as { tree: Array<{ path: string; type: string }> }
    return processTree(data.tree)

    async function processTree(tree: Array<{ path: string; type: string }>) {
      const files = tree.filter(f => f.type === 'blob' && pathFilter(f.path))
      console.log(`  Found ${files.length} matching files`)

      for (const file of files.slice(0, 100)) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${file.path}`
          const fileRes = await fetch(rawUrl)
          if (!fileRes.ok) continue
          let code = await fileRes.text()

          if (format === 'html') {
            code = wrapHtmlAsComponent(htmlToJsx(code), file.path)
          }

          const name = file.path
            .split('/').pop()!
            .replace(/\.(tsx?|jsx?|html?)$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())

          if (code.length > 50) {
            results.push({
              id: `${sourceName}-${name.toLowerCase().replace(/\s+/g, '-')}`,
              source: sourceName,
              name,
              code,
              originalFormat: format,
              sourceUrl: `https://github.com/${repoOwner}/${repoName}/blob/main/${file.path}`,
            })
          }
        } catch {
          // Skip files we can't fetch
        }
      }

      return results
    }
  } catch (err) {
    console.error(`  Error crawling ${sourceName}:`, (err as Error).message)
  }

  return results
}

/** Wrap raw HTML/JSX in an App component */
function wrapHtmlAsComponent(jsx: string, filename: string): string {
  const compName = filename
    .split('/').pop()!
    .replace(/\.[^.]+$/, '')
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase())

  return `export default function ${compName}() {\n  return (\n    ${jsx}\n  )\n}`
}

// ─── Source definitions ──────────────────────────────────────────────

const SOURCES: Record<string, SourceHandler> = {
  'shadcn': {
    name: 'shadcn',
    crawl: () => crawlShadcnRegistry(
      'shadcn',
      'https://ui.shadcn.com/registry/index.json',
      item => `https://ui.shadcn.com/registry/styles/default/${item.name}.json`,
    ),
  },

  'hyperui': {
    name: 'hyperui',
    crawl: () => crawlGitHubRepo(
      'markmead', 'hyperui', 'hyperui',
      path => /^src\/components\/.*\.tsx$/.test(path),
      'tsx',
    ),
  },

  'mamba-ui': {
    name: 'mamba-ui',
    crawl: () => crawlGitHubRepo(
      'Mamba-UI', 'mamba-ui', 'mamba-ui',
      path => /^components\/.*\.(html|tsx|jsx)$/.test(path),
      'html',
    ),
  },

  'meraki-ui': {
    name: 'meraki-ui',
    crawl: () => crawlGitHubRepo(
      'merakiui', 'merakiui', 'meraki-ui',
      path => /^components\/.*\.(html|tsx|jsx)$/.test(path),
      'html',
    ),
  },

  'tailwind-kit': {
    name: 'tailwind-kit',
    crawl: () => crawlGitHubRepo(
      'Charlie85270', 'tail-kit', 'tailwind-kit',
      path => /^components\/.*\.(tsx|jsx)$/.test(path),
      'tsx',
    ),
  },

  'preline': {
    name: 'preline',
    crawl: () => crawlGitHubRepo(
      'htmlstreamofficial', 'preline', 'preline',
      path => /\.(html|tsx|jsx)$/.test(path) && !path.includes('node_modules'),
      'html',
    ),
  },

  'flowbite': {
    name: 'flowbite',
    crawl: () => crawlGitHubRepo(
      'themesberg', 'flowbite', 'flowbite',
      path => /^content\/.*\.(html|md)$/.test(path),
      'html',
    ),
  },

  'tailgrids': {
    name: 'tailgrids',
    crawl: () => crawlGitHubRepo(
      'TailGrids', 'tailgrids', 'tailgrids',
      path => /\.(html|tsx|jsx)$/.test(path) && path.includes('src'),
      'html',
    ),
  },
}

// ─── Test data ───────────────────────────────────────────────────────

function getTestData(): CrawledTemplate[] {
  return [
    {
      id: 'test-hero-1',
      source: 'test',
      name: 'Bold Hero Section',
      originalFormat: 'jsx',
      code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="text-xl font-bold text-blue-600">Acme</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">Contact</a>
        </div>
      </nav>
      <section className="px-8 py-24 max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Ship faster with Acme</h1>
        <p className="text-xl text-gray-500 mb-8">The developer platform for modern teams.</p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700">Get Started Free</button>
      </section>
    </div>
  )
}`,
    },
    {
      id: 'test-dashboard-1',
      source: 'test',
      name: 'Admin Dashboard',
      originalFormat: 'html',
      code: `export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-lg font-bold mb-8">Dashboard</h2>
        <nav className="space-y-2">
          <a href="#" className="block px-4 py-2 rounded bg-gray-800">Overview</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-800">Analytics</a>
          <a href="#" className="block px-4 py-2 rounded hover:bg-gray-800">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-3xl font-bold">12,345</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-3xl font-bold">$45.2K</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Growth</p>
            <p className="text-3xl font-bold">+23%</p>
          </div>
        </div>
      </main>
    </div>
  )
}`,
    },
    {
      id: 'test-portfolio-1',
      source: 'test',
      name: 'Creative Portfolio',
      originalFormat: 'jsx',
      code: `export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="text-2xl font-bold">JD</span>
        <div className="flex gap-8 text-sm text-gray-400">
          <a href="#" className="hover:text-white">Work</a>
          <a href="#" className="hover:text-white">About</a>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </nav>
      <section className="px-8 py-32 max-w-4xl mx-auto">
        <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Designer & Developer</p>
        <h1 className="text-6xl font-bold mb-6">I create digital experiences that matter.</h1>
        <p className="text-xl text-gray-400 max-w-2xl">Crafting beautiful interfaces and building robust applications for startups and brands.</p>
      </section>
    </div>
  )
}`,
    },
  ]
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('data', 'pipeline', 'crawled.json')
  const sourceIdx = args.indexOf('--source')
  const sourceName = sourceIdx >= 0 ? args[sourceIdx + 1] : null
  const isAll = args.includes('--all')

  mkdirSync(join('data', 'pipeline'), { recursive: true })

  let results: CrawledTemplate[] = []

  if (isTest) {
    console.log('🧪 Running in test mode with inline data...')
    results = getTestData()
  } else if (sourceName) {
    const handler = SOURCES[sourceName]
    if (!handler) {
      console.error(`Unknown source: ${sourceName}. Available: ${Object.keys(SOURCES).join(', ')}`)
      process.exit(1)
    }
    console.log(`🔍 Crawling source: ${handler.name}`)
    results = await handler.crawl()
  } else if (isAll) {
    console.log('🔍 Crawling all sources...')
    for (const [key, handler] of Object.entries(SOURCES)) {
      console.log(`\n── ${key} ──`)
      const items = await handler.crawl()
      results.push(...items)
      console.log(`  → ${items.length} templates`)
    }
  } else {
    console.log('Usage:')
    console.log('  tsx scripts/crawl-templates.ts --test')
    console.log('  tsx scripts/crawl-templates.ts --source hyperui')
    console.log('  tsx scripts/crawl-templates.ts --all')
    console.log(`\nAvailable sources: ${Object.keys(SOURCES).join(', ')}`)
    process.exit(0)
  }

  // Deduplicate by id
  const seen = new Set<string>()
  const deduped = results.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  console.log(`\n✅ Crawled ${deduped.length} templates`)
  writeFileSync(outputPath, JSON.stringify(deduped, null, 2))
  console.log(`📄 Written to ${outputPath}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
