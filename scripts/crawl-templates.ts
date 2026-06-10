#!/usr/bin/env tsx
/**
 * crawl-templates.ts — Crawl template sources and extract JSX.
 *
 * Source types:
 *   1. shadcn-style registries (registry.json / index.json + per-item JSON)
 *   2. Raw GitHub repos (HyperUI, Preline, Flowbite, TailGrids, Mamba, Meraki, ...)
 *   3. GitHub topic search for industry verticals (restaurant, dental, wedding, ...)
 *   HTML sources are auto-converted to JSX.
 *
 * Every template carries `license` (SPDX id) and `sourceUrl` — the license gate
 * in build-index.ts rejects anything that is not MIT/Apache-2.0/ISC/BSD.
 *
 * GitHub API calls authenticate with process.env.GITHUB_TOKEN when set
 * (unauthenticated = 60 req/hour and WILL fail mid-crawl; authenticated = 5,000/hour).
 *
 * Usage:
 *   tsx scripts/crawl-templates.ts --check-auth      # verify GITHUB_TOKEN works
 *   tsx scripts/crawl-templates.ts --test            # inline test data
 *   tsx scripts/crawl-templates.ts --source animate-ui
 *   tsx scripts/crawl-templates.ts --all
 *   tsx scripts/crawl-templates.ts --source X --output path.json
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate } from './types.js'

// ─── GitHub auth ─────────────────────────────────────────────────────

let warnedNoToken = false

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'not-a-terminal-crawler',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  } else if (!warnedNoToken) {
    warnedNoToken = true
    console.warn('⚠️  GITHUB_TOKEN not set — unauthenticated GitHub API = 60 req/hour. Full crawls WILL fail. Set GITHUB_TOKEN.')
  }
  return headers
}

async function checkAuth(): Promise<void> {
  const res = await fetch('https://api.github.com/rate_limit', { headers: ghHeaders() })
  const data = await res.json() as { rate: { limit: number; remaining: number; reset: number } }
  const authed = data.rate.limit >= 5000
  console.log(`GitHub API auth: ${authed ? '✅ authenticated' : '❌ UNAUTHENTICATED'}`)
  console.log(`  limit: ${data.rate.limit}/hour, remaining: ${data.rate.remaining}, resets ${new Date(data.rate.reset * 1000).toISOString()}`)
  if (!authed) process.exitCode = 1
}

// ─── Repo metadata (license + default branch), cached ────────────────

interface RepoInfo { license: string | null; defaultBranch: string }
const repoInfoCache = new Map<string, RepoInfo | null>()

async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo | null> {
  const key = `${owner}/${repo}`
  if (repoInfoCache.has(key)) return repoInfoCache.get(key)!

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { license?: { spdx_id?: string } | null; default_branch?: string }
    const spdx = data.license?.spdx_id
    const info: RepoInfo = {
      license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
      defaultBranch: data.default_branch ?? 'main',
    }
    repoInfoCache.set(key, info)
    return info
  } catch (err) {
    console.warn(`  ⚠ Could not fetch repo info for ${key}: ${(err as Error).message}`)
    repoInfoCache.set(key, null)
    return null
  }
}

// ─── HTML → JSX converter ────────────────────────────────────────────

export function htmlToJsx(html: string): string {
  let jsx = html

  jsx = jsx.replace(/\bclass=/g, 'className=')
  jsx = jsx.replace(/\bfor=/g, 'htmlFor=')
  jsx = jsx.replace(/\btabindex=/g, 'tabIndex=')
  jsx = jsx.replace(/\breadonly\b/g, 'readOnly')
  jsx = jsx.replace(/\bautocomplete=/g, 'autoComplete=')

  // Self-close void elements
  jsx = jsx.replace(/<(br|hr|img|input|meta|link|area|col|embed|source|track|wbr)(\s[^>]*)?\s*>/gi,
    (_, tag, attrs) => `<${tag}${attrs || ''} />`)

  // Inline style strings → JSX objects (basic cases)
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styleStr: string) => {
    const pairs = styleStr.split(';').filter(Boolean).map(pair => {
      const [prop, ...valParts] = pair.split(':')
      const val = valParts.join(':').trim()
      const camelProp = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      return `${camelProp}: '${val}'`
    })
    return `style={{ ${pairs.join(', ')} }}`
  })

  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}')

  jsx = jsx.replace(/\bonclick=/gi, 'onClick=')
  jsx = jsx.replace(/\bonchange=/gi, 'onChange=')
  jsx = jsx.replace(/\bonsubmit=/gi, 'onSubmit=')
  jsx = jsx.replace(/\bonfocus=/gi, 'onFocus=')
  jsx = jsx.replace(/\bonblur=/gi, 'onBlur=')

  return jsx
}

function wrapHtmlAsComponent(jsx: string, filename: string): string {
  const compName = filename
    .split('/').pop()!
    .replace(/\.[^.]+$/, '')
    .replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase())
    .replace(/[^A-Za-z0-9]/g, '') || 'Component'

  return `export default function ${compName}() {\n  return (\n    ${jsx}\n  )\n}`
}

function titleCase(raw: string): string {
  return raw.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

// ─── Generic shadcn-style registry crawler ───────────────────────────

interface RegistryConfig {
  /** Source id used in template ids. */
  name: string
  /** Registry index: registry.json ({items:[...]}) or index.json (bare array). */
  indexUrl: string
  /** Candidate per-item URLs, tried in order, when content is not inline. */
  itemUrls?: Array<(name: string) => string>
  /** Resolve files[].path against this base when items carry paths but no content. */
  rawBase?: string
  /** GitHub repo for license lookup. */
  repo?: { owner: string; repo: string }
  /** Fallback SPDX id when no repo is known (from the locked source inventory). */
  declaredLicense?: string
  /** Item names to skip (e.g. the registry's own meta entry). */
  skipNames?: RegExp
}

interface RegistryItem {
  name: string
  type?: string
  files?: Array<{ path?: string; content?: string; type?: string }>
}

/** Item types that are actual UI we want; skips hooks/libs/themes/styles. */
const WANTED_ITEM_TYPE = /registry:(ui|component|block|page)/

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'not-a-terminal-crawler' } })
    if (!res.ok) return null
    const text = await res.text()
    if (text.trimStart().startsWith('<')) return null   // HTML 404 page served as 200
    return JSON.parse(text)
  } catch {
    return null
  }
}

function joinItemFiles(files: Array<{ path?: string; content?: string }>): string {
  const withContent = files.filter(f => f.content && f.content.length > 0)
  if (withContent.length === 0) return ''
  if (withContent.length === 1) return withContent[0].content!
  return withContent
    .map(f => `// --- file: ${f.path ?? 'unknown'} ---\n${f.content}`)
    .join('\n\n')
}

async function crawlRegistry(cfg: RegistryConfig): Promise<CrawledTemplate[]> {
  const results: CrawledTemplate[] = []

  console.log(`  Fetching registry index: ${cfg.indexUrl}`)
  const raw = await fetchJson(cfg.indexUrl)
  if (!raw) {
    console.warn(`  ⚠ ${cfg.name}: registry index unavailable (404/HTML/parse error) — skipping source`)
    return results
  }

  const items: RegistryItem[] = Array.isArray(raw)
    ? raw as RegistryItem[]
    : ((raw as { items?: RegistryItem[] }).items ?? [])

  console.log(`  Found ${items.length} registry items`)

  // License: prefer live repo lookup, fall back to declared
  let license: string | null = cfg.declaredLicense ?? null
  if (cfg.repo) {
    const info = await fetchRepoInfo(cfg.repo.owner, cfg.repo.repo)
    if (info?.license) license = info.license
  }

  let skippedType = 0
  let noContent = 0

  for (const item of items) {     // full registry — no cap
    if (!item.name) continue
    if (cfg.skipNames?.test(item.name)) continue
    if (item.type && !WANTED_ITEM_TYPE.test(item.type)) { skippedType++; continue }

    // 1) inline content in the index itself (e.g. SmoothUI)
    let code = item.files ? joinItemFiles(item.files) : ''
    let itemSourceUrl = cfg.indexUrl

    // 2) per-item JSON fetch
    if (!code && cfg.itemUrls) {
      for (const makeUrl of cfg.itemUrls) {
        const url = makeUrl(item.name)
        const itemJson = await fetchJson(url) as { files?: Array<{ path?: string; content?: string }> } | null
        if (itemJson?.files) {
          code = joinItemFiles(itemJson.files)
          if (code) { itemSourceUrl = url; break }
        }
      }
    }

    // 3) resolve file paths against a raw base (e.g. neobrutalism repo)
    if (!code && cfg.rawBase && item.files) {
      const parts: Array<{ path?: string; content?: string }> = []
      for (const f of item.files) {
        if (!f.path) continue
        try {
          const res = await fetch(cfg.rawBase + f.path, { headers: { 'User-Agent': 'not-a-terminal-crawler' } })
          if (res.ok) parts.push({ path: f.path, content: await res.text() })
        } catch { /* skip file */ }
      }
      code = joinItemFiles(parts)
      if (code) itemSourceUrl = cfg.rawBase + (item.files[0]?.path ?? '')
    }

    if (code.length < 50) { noContent++; continue }

    results.push({
      id: `${cfg.name}-${item.name}`,
      source: cfg.name,
      name: titleCase(item.name),
      code,
      originalFormat: 'tsx',
      sourceUrl: itemSourceUrl,
      license,
    })
  }

  if (skippedType > 0) console.log(`  (skipped ${skippedType} non-UI items: hooks/libs/themes)`)
  if (noContent > 0) console.log(`  (skipped ${noContent} items with no resolvable content)`)
  return results
}

// ─── GitHub repo crawler ─────────────────────────────────────────────

async function crawlGitHubRepo(
  repoOwner: string,
  repoName: string,
  sourceName: string,
  pathFilter: (path: string) => boolean,
  format: 'jsx' | 'tsx' | 'html' = 'tsx',
): Promise<CrawledTemplate[]> {
  const results: CrawledTemplate[] = []

  try {
    const info = await fetchRepoInfo(repoOwner, repoName)
    const branch = info?.defaultBranch ?? 'main'
    const license = info?.license ?? null

    console.log(`  Fetching tree: ${repoOwner}/${repoName}@${branch} (license: ${license ?? 'UNKNOWN'})`)
    const treeRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`,
      { headers: ghHeaders() },
    )
    if (!treeRes.ok) throw new Error(`GitHub API ${treeRes.status}`)
    const data = await treeRes.json() as { tree: Array<{ path: string; type: string }> }

    const files = data.tree.filter(f => f.type === 'blob' && pathFilter(f.path))
    console.log(`  Found ${files.length} matching files`)

    for (const file of files) {     // full repo — no cap
      try {
        const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${file.path}`
        const fileRes = await fetch(rawUrl)
        if (!fileRes.ok) continue
        let code = await fileRes.text()

        if (format === 'html') {
          code = wrapHtmlAsComponent(htmlToJsx(code), file.path)
        }

        const name = titleCase(file.path.split('/').pop()!.replace(/\.(tsx?|jsx?|html?)$/i, ''))

        if (code.length > 50) {
          results.push({
            id: `${sourceName}-${file.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`,
            source: sourceName,
            name,
            code,
            originalFormat: format,
            sourceUrl: `https://github.com/${repoOwner}/${repoName}/blob/${branch}/${file.path}`,
            license,
          })
        }
      } catch { /* skip file */ }
    }
  } catch (err) {
    console.error(`  Error crawling ${sourceName}:`, (err as Error).message)
  }

  return results
}

// ─── GitHub topic/vertical crawler ───────────────────────────────────

// Deliberate scope caps for vertical repos (whole websites, not component libs).
// These are logged, never silent.
const REPOS_PER_VERTICAL = 8
const FILES_PER_REPO = 40

const VERTICALS = ['restaurant', 'dental', 'wedding', 'fitness', 'portfolio', 'real-estate'] as const

interface SearchRepo {
  full_name: string
  stargazers_count: number
  license?: { spdx_id?: string } | null
  default_branch: string
}

async function crawlGitHubVertical(vertical: string): Promise<CrawledTemplate[]> {
  const results: CrawledTemplate[] = []
  const repos = new Map<string, SearchRepo>()

  // GitHub search allows one license qualifier per query — run one per allowed family
  for (const lic of ['mit', 'apache-2.0']) {
    const q = encodeURIComponent(`${vertical} website template stars:>=10 license:${lic}`)
    const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`
    try {
      const res = await fetch(url, { headers: ghHeaders() })
      if (!res.ok) { console.warn(`  ⚠ search ${vertical}/${lic}: HTTP ${res.status}`); continue }
      const data = await res.json() as { items?: SearchRepo[] }
      for (const r of data.items ?? []) repos.set(r.full_name, r)
    } catch (err) {
      console.warn(`  ⚠ search ${vertical}/${lic}: ${(err as Error).message}`)
    }
  }

  const top = [...repos.values()]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, REPOS_PER_VERTICAL)

  console.log(`  ${vertical}: ${repos.size} candidate repos, crawling top ${top.length} (cap ${REPOS_PER_VERTICAL}/vertical, ${FILES_PER_REPO} files/repo)`)

  for (const repo of top) {
    const [owner, name] = repo.full_name.split('/')
    const spdx = repo.license?.spdx_id
    const license = spdx && spdx !== 'NOASSERTION' ? spdx : null

    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
        { headers: ghHeaders() },
      )
      if (!treeRes.ok) continue
      const data = await treeRes.json() as { tree: Array<{ path: string; type: string }> }

      const files = data.tree
        .filter(f => f.type === 'blob'
          && /\.(tsx|jsx|html)$/i.test(f.path)
          && !/node_modules|\.test\.|\.spec\.|__tests__|\.stories\.|dist\/|build\//.test(f.path))
        .slice(0, FILES_PER_REPO)   // logged cap above

      for (const file of files) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${file.path}`
          const fileRes = await fetch(rawUrl)
          if (!fileRes.ok) continue
          let code = await fileRes.text()
          const isHtml = /\.html?$/i.test(file.path)
          if (isHtml) code = wrapHtmlAsComponent(htmlToJsx(code), file.path)

          if (code.length > 50) {
            results.push({
              id: `vertical-${vertical}-${repo.full_name.replace('/', '-')}-${file.path.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`.slice(0, 120),
              source: `vertical-${vertical}`,
              name: `${titleCase(vertical)}: ${titleCase(file.path.split('/').pop()!.replace(/\.[^.]+$/, ''))}`,
              code,
              originalFormat: isHtml ? 'html' : 'tsx',
              sourceUrl: `https://github.com/${repo.full_name}/blob/${repo.default_branch}/${file.path}`,
              license,
            })
          }
        } catch { /* skip file */ }
      }
    } catch { /* skip repo */ }
  }

  return results
}

// ─── Source definitions ──────────────────────────────────────────────

interface SourceHandler {
  name: string
  crawl(): Promise<CrawledTemplate[]>
}

const SOURCES: Record<string, SourceHandler> = {
  // ── Tier 1/2: shadcn-style registries ──
  'shadcn': {
    name: 'shadcn',
    crawl: () => crawlRegistry({
      name: 'shadcn',
      indexUrl: 'https://ui.shadcn.com/r/index.json',
      itemUrls: [
        n => `https://ui.shadcn.com/r/styles/new-york-v4/${n}.json`,
        n => `https://ui.shadcn.com/r/styles/new-york/${n}.json`,
        n => `https://ui.shadcn.com/r/${n}.json`,
      ],
      repo: { owner: 'shadcn-ui', repo: 'ui' },
    }),
  },
  'animate-ui': {
    name: 'animate-ui',
    crawl: () => crawlRegistry({
      name: 'animate-ui',
      indexUrl: 'https://animate-ui.com/r/registry.json',
      itemUrls: [n => `https://animate-ui.com/r/${n}.json`],
      repo: { owner: 'imskyleen', repo: 'animate-ui' },
      skipNames: /^index$/,
    }),
  },
  'dice-ui': {
    name: 'dice-ui',
    crawl: () => crawlRegistry({
      name: 'dice-ui',
      indexUrl: 'https://www.diceui.com/r/registry.json',
      itemUrls: [n => `https://www.diceui.com/r/${n}.json`],
      repo: { owner: 'sadmann7', repo: 'diceui' },
    }),
  },
  'coss-ui': {
    name: 'coss-ui',
    crawl: () => crawlRegistry({
      name: 'coss-ui',
      indexUrl: 'https://coss.com/ui/r/registry.json',
      itemUrls: [n => `https://coss.com/ui/r/${n}.json`],
      declaredLicense: 'MIT',
    }),
  },
  'cult-ui': {
    name: 'cult-ui',
    crawl: () => crawlRegistry({
      name: 'cult-ui',
      indexUrl: 'https://cult-ui.com/r/registry.json',
      itemUrls: [n => `https://cult-ui.com/r/${n}.json`],
      repo: { owner: 'nolly-studio', repo: 'cult-ui' },
    }),
  },
  'smoothui': {
    name: 'smoothui',
    crawl: () => crawlRegistry({
      name: 'smoothui',
      indexUrl: 'https://smoothui.dev/r/registry.json',   // content is inline
      repo: { owner: 'educlopez', repo: 'smoothui' },
    }),
  },
  '8bitcn': {
    name: '8bitcn',
    crawl: () => crawlRegistry({
      name: '8bitcn',
      indexUrl: 'https://www.8bitcn.com/r/registry.json',
      itemUrls: [n => `https://www.8bitcn.com/r/${n}.json`],
      repo: { owner: 'TheOrcDev', repo: '8bitcn-ui' },
    }),
  },
  'neobrutalism': {
    name: 'neobrutalism',
    crawl: () => crawlRegistry({
      name: 'neobrutalism',
      indexUrl: 'https://raw.githubusercontent.com/ekmas/neobrutalism-components/main/registry.json',
      rawBase: 'https://raw.githubusercontent.com/ekmas/neobrutalism-components/main/',
      repo: { owner: 'ekmas', repo: 'neobrutalism-components' },
    }),
  },
  'magic-ui': {
    name: 'magic-ui',
    crawl: () => crawlRegistry({
      name: 'magic-ui',
      indexUrl: 'https://magicui.design/r/registry.json',
      itemUrls: [n => `https://magicui.design/r/${n}.json`],
      repo: { owner: 'magicuidesign', repo: 'magicui' },     // MIT, 21k stars — Animate UI replacement
    }),
  },
  'kokonut-ui': {
    name: 'kokonut-ui',
    crawl: () => crawlRegistry({
      name: 'kokonut-ui',
      indexUrl: 'https://kokonutui.com/r/registry.json',
      itemUrls: [n => `https://kokonutui.com/r/${n}.json`],
      repo: { owner: 'kokonut-labs', repo: 'kokonutui' },    // MIT
    }),
  },
  '21st-dev': {
    name: '21st-dev',
    crawl: async () => {
      // 21st.dev does not expose a public bulk registry index (per-component
      // URLs only, behind an API). Probed 2026-06: /r/registry.json and
      // /api/registry both 404. Revisit with an API key in Phase 13.
      console.warn('  ⚠ 21st.dev: no public bulk index — skipping (needs API key; revisit Phase 13)')
      return []
    },
  },

  // ── Registries without public index JSON → GitHub repo crawl ──
  'origin-ui': {
    name: 'origin-ui',
    crawl: () => crawlGitHubRepo(
      'origin-space', 'originui', 'origin-ui',
      path => /^registry\/.*\.tsx$/.test(path) && !/demo|example/i.test(path),
      'tsx',
    ),
  },
  'mvpblocks': {
    name: 'mvpblocks',
    crawl: () => crawlGitHubRepo(
      'subhadeeproy3902', 'mvpblocks', 'mvpblocks',
      path => /^src\/components\/.*\.tsx$/.test(path) && !/\/(ui|lib|hooks|utils)\//.test(path),
      'tsx',
    ),
  },
  'ui-neumorphism': {
    name: 'ui-neumorphism',
    crawl: () => crawlGitHubRepo(
      'AKAspanion', 'ui-neumorphism', 'ui-neumorphism',
      path => /^src\/components\/.*\.jsx?$/.test(path) && !/\.test\./.test(path),
      'jsx',
    ),
  },

  // ── Tier 1: raw GitHub repos (existing sources) ──
  'hyperui': {
    name: 'hyperui',
    crawl: () => crawlGitHubRepo(
      'markmead', 'hyperui', 'hyperui',
      path => /^src\/components\/.*\.tsx?$/.test(path),
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

  // ── Industry verticals via GitHub topic search ──
  ...Object.fromEntries(VERTICALS.map(v => [
    `vertical-${v}`,
    { name: `vertical-${v}`, crawl: () => crawlGitHubVertical(v) },
  ])),
}

// ─── Test data ───────────────────────────────────────────────────────

function getTestData(): CrawledTemplate[] {
  const lic = { license: 'MIT', sourceUrl: 'https://example.com/test' }
  return [
    {
      id: 'test-hero-1', source: 'test', name: 'Bold Hero Section', originalFormat: 'jsx', ...lic,
      code: `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="text-xl font-bold text-blue-600">Acme</span>
      </nav>
      <section className="px-8 py-24 max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Ship faster with Acme</h1>
        <p className="text-xl text-gray-500 mb-8">The developer platform for modern teams.</p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium">Get Started Free</button>
      </section>
    </div>
  )
}`,
    },
    {
      id: 'test-dashboard-1', source: 'test', name: 'Admin Dashboard', originalFormat: 'tsx', ...lic,
      code: `export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-lg font-bold mb-8">Dashboard</h2>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-sm text-gray-500">Users</p><p className="text-3xl font-bold">12,345</p></div>
        </div>
      </main>
    </div>
  )
}`,
    },
    {
      id: 'test-portfolio-1', source: 'test', name: 'Creative Portfolio', originalFormat: 'jsx', ...lic,
      code: `export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <section className="px-8 py-32 max-w-4xl mx-auto">
        <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Designer & Developer</p>
        <h1 className="text-6xl font-bold mb-6">I create digital experiences that matter.</h1>
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

  if (args.includes('--check-auth')) {
    await checkAuth()
    return
  }

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
    console.log('  tsx scripts/crawl-templates.ts --check-auth')
    console.log('  tsx scripts/crawl-templates.ts --test')
    console.log('  tsx scripts/crawl-templates.ts --source animate-ui')
    console.log('  tsx scripts/crawl-templates.ts --all')
    console.log(`\nAvailable sources:\n  ${Object.keys(SOURCES).join('\n  ')}`)
    process.exit(0)
  }

  // Deduplicate by id
  const seen = new Set<string>()
  const deduped = results.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  // License coverage report
  const withLicense = deduped.filter(t => t.license).length
  console.log(`\n✅ Crawled ${deduped.length} templates (${withLicense} with license, ${deduped.length - withLicense} unknown)`)
  writeFileSync(outputPath, JSON.stringify(deduped, null, 2))
  console.log(`📄 Written to ${outputPath}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
