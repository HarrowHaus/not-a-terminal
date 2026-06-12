#!/usr/bin/env tsx
/**
 * scope-and-reshard.ts — Re-scope the enriched index by granularity, prune
 * twins within each index, and re-shard both. Uses the embeddings already on
 * disk (data/pipeline/embedded.json) — no re-crawl, no re-enrich, no agent tokens.
 *
 * 1. CLASSIFY each enriched template as 'page' or 'component'.
 *    The enricher labeled ~all of these component-registry items with a
 *    page-category (600/762 = "saas"), and component-library source files run
 *    long, so the literal "page-category OR 100+ lines" rule misfires. The
 *    reliable signal for these sources is the PRIMITIVE NAME — a "calendar" or
 *    "carousel" is a component at any length. So: primitive-name ⇒ component;
 *    otherwise multi-section/substantial ⇒ page.
 * 2. Components get a section-type tag (hero, pricing, ... overlay).
 * 3. PRUNE twins within each index separately (cosine > 0.92 on the index
 *    embeddings = avg(phrasings + description), which directly targets the
 *    cannibalization the self-test measures). Keep one representative per
 *    cluster (best license → React-native → most code).
 * 4. RE-SHARD: pages → public/indexes/templates/{category}, components →
 *    public/indexes/sections/{section-type}. Gzipped, base64 Float32 vectors.
 *
 * Then run: tsx scripts/validate-index.ts --dir public/indexes/templates
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import type { EmbeddedTemplate } from './types.js'
import { encodeEmbedding, isAllowedLicense } from './types.js'

const PIPELINE = join('data', 'pipeline')
const INPUT = join(PIPELINE, 'embedded.json')
const TEMPLATES_DIR = join('public', 'indexes', 'templates')
const SECTIONS_DIR = join('public', 'indexes', 'sections')
const DEDUPE_THRESHOLD = 0.92

// ─── Classification ──────────────────────────────────────────────────

// UI-primitive vocabulary (shadcn/radix + animation libs + coss "p-" prefix).
// A name match means "component" regardless of line count or the enricher's
// (noisy) section count — these registries are component libraries.
const PRIMITIVE = /(^|[-\s])(p-[a-z]|buttons?|btn|inputs?|textarea|otp|cards?|accordion|carousel|modals?|dropdowns?|drop-down|tooltips?|tabs?|badges?|avatars?|sliders?|switch|checkbox|radio|select|combobox|popover|dialog|toast|sonner|alerts?|breadcrumbs?|pagination|menus?|menubar|navbar|navigation-menu|number-field|preview-card|scroll-area|scroller|scroll|collapsible|toggles?|skeleton|spinner|progress|orb|code-block|lightboard|cutout|pixel|gooey|marquee|fields?|calendar|date-picker|drawer|sheet|sidebar|command|chips?|tags?|kbd|separator|divider|labels?|ratings?|stepper|timeline|tree|resizable|hover-card|context-menu|aspect-ratio|empty|item|input-group|gauge|dock|file-tree|kanban|mention|segmented|snippet|spotlight|ticker|tilt|cursor|dots?|grid-pattern|beams?|meteors?|particles?|ripple|waves?|morph|magnetic|parallax|shimmer|glow|blur|reveal|gradient-text|typing|typewriter|counter|numbers?|animated-|spinning|flip|fade|slide-in|tables?|data-table|charts?|forms?|toggle-group|radio-group|input-otp|hover|notifications?|loaders?|loading|icons?|logo-cloud|app-download|toolbar|action-bar|color-picker|qr-code|media-player|video-player|tweet|texture|overlay|dither|heatmap|liquid|svg-shapes|mock-browser|bg-|background)([-\s]|$)/i

function codeLines(code: string): number {
  return code.split('\n').length
}

export function classify(t: EmbeddedTemplate): 'page' | 'component' {
  const name = `${t.name} ${t.id}`.toLowerCase()
  const tags = ` ${(t.tags || []).join(' ').toLowerCase()} `
  if (PRIMITIVE.test(name) || PRIMITIVE.test(tags)) return 'component'
  // Non-primitive name: promote only with genuine multi-section structure
  if ((t.sections || []).length >= 2 || codeLines(t.code) >= 120) return 'page'
  return 'component'
}

// ─── Section-type tagging ────────────────────────────────────────────

const SECTION_TYPES = [
  'hero', 'pricing', 'testimonials', 'navigation', 'footer',
  'form', 'card', 'data-display', 'feedback', 'overlay',
] as const
type SectionType = (typeof SECTION_TYPES)[number]

const SECTION_TYPE_RULES: Array<[RegExp, SectionType]> = [
  [/hero|banner|cta|call.to.action|landing|jumbotron/, 'hero'],
  [/pricing|plan|tier|subscription/, 'pricing'],
  [/testimonial|review|quote|rating|social.proof/, 'testimonials'],
  [/nav|menu|breadcrumb|pagination|tabs|sidebar|navbar|toolbar|dock|command|header|logo/, 'navigation'],
  [/footer/, 'footer'],
  [/form|input|field|textarea|checkbox|radio|select|switch|slider|otp|button|combobox|date|calendar|color-picker|upload/, 'form'],
  [/modal|dialog|popover|tooltip|drawer|sheet|dropdown|overlay|lightbox|hover-card|context-menu|spotlight/, 'overlay'],
  [/toast|alert|sonner|progress|skeleton|spinner|loader|loading|notification|feedback|gauge|empty/, 'feedback'],
  [/table|list|chart|stat|number|counter|data|tree|kanban|timeline|tweet|grid|gallery|media|video|qr|badge|avatar|tag|chip|code-block|snippet|ticker/, 'data-display'],
  [/card|tile|panel|accordion|collapsible|preview/, 'card'],
]

function sectionType(t: EmbeddedTemplate): SectionType {
  const hay = `${t.name} ${t.id} ${(t.tags || []).join(' ')} ${(t.sections || []).join(' ')}`.toLowerCase()
  for (const [re, type] of SECTION_TYPE_RULES) if (re.test(hay)) return type
  return 'card'   // sensible default for an unlabeled visual block
}

// ─── Prune (cosine > 0.92 on index embeddings) ──────────────────────

function cosine(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot   // averaged index vectors are normalized
}

function repScore(t: EmbeddedTemplate): number {
  let score = 0
  if (isAllowedLicense(t.license)) score += 1_000_000
  if (t.originalFormat !== 'html') score += 100_000
  score += Math.min(t.code.length, 99_999)
  return score
}

interface PruneResult { kept: EmbeddedTemplate[]; prunedCount: number }

function prune(templates: EmbeddedTemplate[]): PruneResult {
  const order = templates.map((_, i) => i).sort((a, b) => repScore(templates[b]) - repScore(templates[a]))
  const clusters: Array<{ repIdx: number }> = []
  const pruned = new Set<number>()

  for (const idx of order) {
    let placed = false
    for (const cluster of clusters) {
      if (cosine(templates[idx].embedding, templates[cluster.repIdx].embedding) > DEDUPE_THRESHOLD) {
        pruned.add(idx)
        placed = true
        break
      }
    }
    if (!placed) clusters.push({ repIdx: idx })
  }

  const keptIds = new Set(clusters.map(c => templates[c.repIdx].id))
  return { kept: templates.filter(t => keptIds.has(t.id)), prunedCount: pruned.size }
}

// ─── Sharding ────────────────────────────────────────────────────────

interface ShardEntry {
  id: string; name: string; description: string; category: string
  tags: string[]; code: string; phrasings: string[]
  sectionType?: SectionType
  embedding: string   // base64 Float32Array
}

function shardBy(
  templates: EmbeddedTemplate[],
  keyOf: (t: EmbeddedTemplate) => string,
  outDir: string,
  withSectionType: boolean,
): { shards: number; total: number; files: Array<{ key: string; count: number }> } {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  const groups = new Map<string, EmbeddedTemplate[]>()
  for (const t of templates) {
    const k = keyOf(t)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(t)
  }

  const files: Array<{ key: string; count: number }> = []
  for (const [key, group] of groups) {
    const entries: ShardEntry[] = group.map(t => ({
      id: t.id, name: t.name, description: t.description, category: t.category,
      tags: t.tags, code: t.code, phrasings: t.phrasings,
      ...(withSectionType ? { sectionType: sectionType(t) } : {}),
      embedding: encodeEmbedding(t.embedding),
    }))
    const shard = { category: key, count: entries.length, templates: entries }
    const json = JSON.stringify(shard)
    writeFileSync(join(outDir, `${key}.json`), json)
    writeFileSync(join(outDir, `${key}.json.gz`), gzipSync(Buffer.from(json)))
    files.push({ key, count: entries.length })
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    version: 2,
    totalTemplates: templates.length,
    shards: files.map(f => ({ category: f.key, count: f.count, file: `${f.key}.json` })),
  }, null, 2))

  return { shards: files.length, total: templates.length, files }
}

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(INPUT)) {
    console.error(`Missing ${INPUT} — run the pipeline through embedding first`)
    process.exit(1)
  }
  const all = JSON.parse(readFileSync(INPUT, 'utf-8')) as EmbeddedTemplate[]
  console.log(`📥 ${all.length} enriched+embedded templates\n`)

  // 1. Classify
  const pages: EmbeddedTemplate[] = []
  const components: EmbeddedTemplate[] = []
  for (const t of all) (classify(t) === 'page' ? pages : components).push(t)
  console.log(`① RE-SCOPE → template index (pages): ${pages.length} | section index (components): ${components.length}`)

  // 2. Prune within each index
  const prunedPages = prune(pages)
  const prunedComponents = prune(components)
  console.log(`② PRUNE (cosine > ${DEDUPE_THRESHOLD}):`)
  console.log(`   template index: ${pages.length} → ${prunedPages.kept.length} (${prunedPages.prunedCount} twins pruned)`)
  console.log(`   section index:  ${components.length} → ${prunedComponents.kept.length} (${prunedComponents.prunedCount} twins pruned)`)

  // 3. Re-shard both
  const tpl = shardBy(prunedPages.kept, t => t.category, TEMPLATES_DIR, false)
  const sec = shardBy(prunedComponents.kept, t => sectionType(t), SECTIONS_DIR, true)
  console.log(`③ RE-SHARD:`)
  console.log(`   templates/ → ${tpl.shards} shards, ${tpl.total} templates`)
  console.log(`     ${tpl.files.map(f => `${f.key}:${f.count}`).join(', ')}`)
  console.log(`   sections/  → ${sec.shards} shards, ${sec.total} components`)
  console.log(`     ${sec.files.map(f => `${f.key}:${f.count}`).join(', ')}`)

  // Clear the old flat (blocked) shards so only the re-scoped index remains
  for (const f of ['landing-page', 'dashboard', 'blog', 'portfolio', 'saas', 'ecommerce', 'restaurant', 'docs', 'api', 'admin', 'creative-agency', 'photography', 'freelancer', 'event', 'personal', 'fitness', 'medical', 'education', 'wedding', 'music', 'real-estate']) {
    for (const ext of ['.json', '.json.gz']) {
      const p = join('public', 'indexes', `${f}${ext}`)
      if (existsSync(p)) rmSync(p)
    }
  }
  const flatManifest = join('public', 'indexes', 'manifest.json')
  if (existsSync(flatManifest)) rmSync(flatManifest)

  console.log(`\n✅ Re-scope complete. Next: validate-index.ts --dir ${TEMPLATES_DIR}`)
}

main()
