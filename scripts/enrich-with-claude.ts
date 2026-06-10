#!/usr/bin/env tsx
/**
 * enrich-with-claude.ts — Batch orchestration for template enrichment.
 *
 * Enrichment is performed by Claude Code spawning the `template-enricher`
 * sub-agent (.claude/agents/template-enricher.md, Sonnet) — NOT by this script
 * calling any API. This script only prepares batches and merges results:
 *
 *   --prepare   Split crawled templates into batch files of 15-20 templates
 *               (data/pipeline/enrich-batches/batch-NNN.json) + manifest.
 *               Claude Code then spawns one template-enricher sub-agent per
 *               batch; each agent Reads its batch file and Writes
 *               batch-NNN.out.json containing a JSON ARRAY of enrichments.
 *               Template code is passed IN FULL — never truncated.
 *
 *   --merge     Validate every batch output against the input manifest and
 *               produce data/pipeline/enriched.json (enrichedBy: 'agent').
 *               Missing/invalid outputs are reported and excluded.
 *
 *   --test      Mock enrichment for pipeline plumbing tests. Writes
 *               data/pipeline/enriched.mock.json with enrichedBy: 'mock'.
 *               Mock output CANNOT enter the production index:
 *               different filename + provenance flag + build-index gate.
 *
 * Usage:
 *   tsx scripts/enrich-with-claude.ts --prepare [--input crawled.json]
 *   tsx scripts/enrich-with-claude.ts --merge
 *   tsx scripts/enrich-with-claude.ts --test [--limit 5]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate, EnrichedTemplate, AgentEnrichment, TemplateField } from './types.js'
import { CATEGORIES } from './types.js'

const BATCH_SIZE = 18                      // user spec: batches of 15-20
const BATCH_DIR = join('data', 'pipeline', 'enrich-batches')
const ENRICHED_PATH = join('data', 'pipeline', 'enriched.json')
const MOCK_PATH = join('data', 'pipeline', 'enriched.mock.json')

// ─── Validation ──────────────────────────────────────────────────────

export function validateAgentEnrichment(obj: unknown): string[] {
  const errors: string[] = []
  const e = obj as Partial<AgentEnrichment>

  if (!e || typeof e !== 'object') return ['not an object']
  if (typeof e.id !== 'string' || !e.id) errors.push('missing id')
  if (typeof e.description !== 'string' || e.description.length < 20) errors.push('description missing/too short')
  if (!Array.isArray(e.phrasings) || e.phrasings.length < 4) errors.push(`phrasings missing or <4 (got ${Array.isArray(e.phrasings) ? e.phrasings.length : 'none'})`)
  if (typeof e.category !== 'string' || !(CATEGORIES as readonly string[]).includes(e.category)) errors.push(`invalid category: ${String(e.category)}`)
  if (!Array.isArray(e.tags)) errors.push('tags not an array')
  if (!Array.isArray(e.sections)) errors.push('sections not an array')
  if (e.fields !== undefined && (typeof e.fields !== 'object' || Array.isArray(e.fields))) errors.push('fields must be an object map')
  return errors
}

/** Convert the agent's fields map into the pipeline's TemplateField[] shape. */
function convertFields(fields: AgentEnrichment['fields'] | undefined): TemplateField[] {
  if (!fields) return []
  const KNOWN_TYPES = new Set(['text', 'color', 'toggle', 'image', 'list', 'select'])
  return Object.entries(fields).slice(0, 12).map(([key, f]) => ({
    key,
    label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^\w/, c => c.toUpperCase()),
    type: (KNOWN_TYPES.has(f.type) ? f.type : 'text') as TemplateField['type'],
    default: String(f.default ?? ''),
    ...(f.selector ? { selector: f.selector } : {}),
  }))
}

// ─── --prepare ───────────────────────────────────────────────────────

function prepare(inputPath: string): void {
  if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath} — run crawl-templates.ts first`)
    process.exit(1)
  }
  const templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as CrawledTemplate[]
  mkdirSync(BATCH_DIR, { recursive: true })

  const batches: Array<{ file: string; outFile: string; count: number; ids: string[] }> = []

  for (let i = 0; i < templates.length; i += BATCH_SIZE) {
    const batch = templates.slice(i, i + BATCH_SIZE)
    const n = String(batches.length + 1).padStart(3, '0')
    const file = join(BATCH_DIR, `batch-${n}.json`)
    const outFile = join(BATCH_DIR, `batch-${n}.out.json`)

    // Full template payload — code is NEVER truncated
    writeFileSync(file, JSON.stringify(batch.map(t => ({
      id: t.id,
      source: t.source,
      name: t.name,
      license: t.license,
      sourceUrl: t.sourceUrl,
      originalFormat: t.originalFormat,
      code: t.code,
    })), null, 2))

    batches.push({ file, outFile, count: batch.length, ids: batch.map(t => t.id) })
  }

  const manifest = {
    generated: new Date().toISOString(),
    input: inputPath,
    totalTemplates: templates.length,
    batchSize: BATCH_SIZE,
    batches,
  }
  writeFileSync(join(BATCH_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  console.log(`✅ Prepared ${batches.length} batches (${templates.length} templates, ${BATCH_SIZE}/batch)`)
  console.log(`📁 ${BATCH_DIR}/`)
  console.log('\nNext step — Claude Code spawns one template-enricher sub-agent per batch:')
  console.log('  For each batch-NNN.json: agent Reads it and Writes batch-NNN.out.json')
  console.log('  (a JSON array, one enrichment object per template, echoing each "id").')
  console.log('Then run: tsx scripts/enrich-with-claude.ts --merge')
}

// ─── --merge ─────────────────────────────────────────────────────────

function merge(): void {
  const manifestPath = join(BATCH_DIR, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error('No batch manifest — run --prepare first')
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
    input: string
    batches: Array<{ file: string; outFile: string; ids: string[] }>
  }
  const crawled = JSON.parse(readFileSync(manifest.input, 'utf-8')) as CrawledTemplate[]
  const byId = new Map(crawled.map(t => [t.id, t]))

  const enriched: EnrichedTemplate[] = []
  const problems: string[] = []
  let missingBatches = 0

  for (const batch of manifest.batches) {
    if (!existsSync(batch.outFile)) {
      missingBatches++
      problems.push(`MISSING OUTPUT: ${batch.outFile} (${batch.ids.length} templates not enriched)`)
      continue
    }

    let outputs: unknown
    try {
      outputs = JSON.parse(readFileSync(batch.outFile, 'utf-8'))
    } catch (err) {
      problems.push(`PARSE ERROR: ${batch.outFile}: ${(err as Error).message}`)
      continue
    }
    if (!Array.isArray(outputs)) {
      problems.push(`NOT AN ARRAY: ${batch.outFile}`)
      continue
    }

    const outById = new Map<string, AgentEnrichment>()
    for (const o of outputs) {
      const errs = validateAgentEnrichment(o)
      const id = (o as AgentEnrichment)?.id
      if (errs.length > 0) {
        problems.push(`INVALID (${batch.outFile} :: ${id ?? '?'}): ${errs.join('; ')}`)
        continue
      }
      outById.set(id, o as AgentEnrichment)
    }

    for (const id of batch.ids) {
      const crawledTemplate = byId.get(id)
      const out = outById.get(id)
      if (!crawledTemplate) { problems.push(`UNKNOWN ID in manifest: ${id}`); continue }
      if (!out) { problems.push(`NO ENRICHMENT for ${id} in ${batch.outFile}`); continue }

      enriched.push({
        ...crawledTemplate,                              // carries license + sourceUrl through
        description: out.description,
        phrasings: out.phrasings.slice(0, 12),
        category: out.category,
        tags: out.tags.slice(0, 10),
        sections: out.sections,
        fields: convertFields(out.fields),
        enrichedBy: 'agent',
      })
    }
  }

  writeFileSync(ENRICHED_PATH, JSON.stringify(enriched, null, 2))

  console.log(`✅ Merged ${enriched.length}/${crawled.length} enriched templates → ${ENRICHED_PATH}`)
  if (problems.length > 0) {
    console.log(`\n⚠ ${problems.length} problems (${missingBatches} missing batch outputs):`)
    for (const p of problems.slice(0, 30)) console.log(`  - ${p}`)
    if (problems.length > 30) console.log(`  ... and ${problems.length - 30} more`)
    writeFileSync(join(BATCH_DIR, 'merge-problems.json'), JSON.stringify(problems, null, 2))
  }
  if (enriched.length === 0) process.exit(1)
}

// ─── --test (mock — can never reach production) ──────────────────────

function mockEnrich(template: CrawledTemplate): EnrichedTemplate {
  const nameWords = template.name.toLowerCase().split(/\s+/)
  const code = template.code
  const isDashboard = /aside|sidebar/i.test(code)
  const isPortfolio = /bg-black|portfolio|designer/i.test(code)

  let category = 'landing-page'
  if (isDashboard) category = 'dashboard'
  if (isPortfolio) category = 'portfolio'

  const sections: string[] = []
  if (/<nav/i.test(code)) sections.push('nav')
  if (/py-(2[0-9]|3[0-9])/.test(code)) sections.push('hero')
  if (/grid-cols/.test(code)) sections.push('features')
  if (/<footer/i.test(code)) sections.push('footer')

  return {
    ...template,
    description: `[MOCK] A ${template.name.toLowerCase()} template with ${sections.join(', ') || 'content'} sections. Mock enrichment for pipeline testing only.`,
    phrasings: [
      `build a ${nameWords.join(' ')}`,
      `I need a ${nameWords.join(' ')}`,
      `create a ${nameWords.join(' ')} website`,
      `${nameWords.join(' ')} template`,
      `modern ${nameWords.join(' ')}`,
      `${category} for my business`,
    ],
    category,
    tags: [...nameWords, category, 'tailwind'],
    sections,
    fields: [
      { key: 'businessName', label: 'Name', type: 'text', default: template.name },
      { key: 'primaryColor', label: 'Color', type: 'color', default: 'blue' },
    ],
    enrichedBy: 'mock',
  }
}

function runTest(inputPath: string, limit: number): void {
  let templates: CrawledTemplate[]
  if (existsSync(inputPath)) {
    templates = (JSON.parse(readFileSync(inputPath, 'utf-8')) as CrawledTemplate[]).slice(0, limit)
  } else {
    console.error(`Input not found: ${inputPath} — run crawl first (or --test after a crawl)`)
    process.exit(1)
  }

  const results = templates.map(mockEnrich)
  writeFileSync(MOCK_PATH, JSON.stringify(results, null, 2))

  // Schema self-check: every mock entry must satisfy the EnrichedTemplate contract
  let schemaOk = true
  for (const r of results) {
    const issues: string[] = []
    if (r.enrichedBy !== 'mock') issues.push('enrichedBy must be "mock"')
    if (!('license' in r)) issues.push('license missing')
    if (!r.description) issues.push('description missing')
    if (!Array.isArray(r.phrasings) || r.phrasings.length < 4) issues.push('phrasings <4')
    if (!(CATEGORIES as readonly string[]).includes(r.category)) issues.push(`bad category ${r.category}`)
    if (!Array.isArray(r.fields) || r.fields.some(f => !f.key || !f.type)) issues.push('bad fields')
    if (issues.length) { schemaOk = false; console.log(`  ✗ ${r.id}: ${issues.join('; ')}`) }
    else console.log(`  ✓ ${r.id} (${r.category}, ${r.phrasings.length} phrasings, license: ${r.license ?? 'null'})`)
  }

  console.log(`\n🧪 Mock-enriched ${results.length} templates → ${MOCK_PATH}`)
  console.log(`   Schema check: ${schemaOk ? '✅ all entries valid' : '❌ FAILURES above'}`)
  console.log('   NOTE: mock output is quarantined — enrichedBy:"mock" + separate file;')
  console.log('   build-index.ts refuses mock entries in production builds.')
  if (!schemaOk) process.exit(1)
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'crawled.json')
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity

  mkdirSync(join('data', 'pipeline'), { recursive: true })

  if (args.includes('--prepare')) return prepare(inputPath)
  if (args.includes('--merge')) return merge()
  if (args.includes('--test')) return runTest(inputPath, Number.isFinite(limit) ? limit : 5)

  console.log('Usage:')
  console.log('  tsx scripts/enrich-with-claude.ts --prepare [--input crawled.json]')
  console.log('  tsx scripts/enrich-with-claude.ts --merge')
  console.log('  tsx scripts/enrich-with-claude.ts --test [--limit 5]')
  console.log('\nEnrichment itself is performed by Claude Code spawning the')
  console.log('template-enricher sub-agent per batch — this script never calls an API.')
}

main()
