#!/usr/bin/env tsx
/**
 * validate-index.ts — Retrieval self-test for the built index.
 *
 * For every template in every shard: search the index using each of the
 * template's own phrasings (real all-MiniLM-L6-v2 embeddings, cosine against
 * the decoded build-time vectors). A template FAILS if any of its own
 * phrasings does not retrieve it in the top 3.
 *
 * Runs at the end of every pipeline build (build-index.ts stage 2).
 * A template-level failure rate above 5% blocks the build (exit 1) and
 * prints the failing templates.
 *
 * Usage:
 *   tsx scripts/validate-index.ts [--dir public/indexes] [--top 3] [--max-fail 0.05]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { IndexShard } from './types.js'

const DEFAULT_TOP_K = 3
const DEFAULT_MAX_FAIL_RATE = 0.05

// ─── Embedding ───────────────────────────────────────────────────────

type Extractor = (text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>
let extractor: Extractor | null = null

async function embed(text: string): Promise<Float32Array> {
  if (!extractor) {
    console.log('🤖 Loading all-MiniLM-L6-v2...')
    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowLocalModels = false
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' as never })
    extractor = pipe as unknown as Extractor
    console.log('✓ Model loaded\n')
  }
  const result = await extractor(text, { pooling: 'mean', normalize: true })
  return result.data
}

function decodeEmbedding(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64')
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot   // both normalized
}

// ─── Main ────────────────────────────────────────────────────────────

interface IndexedTemplate {
  id: string
  name: string
  category: string
  phrasings: string[]
  vector: Float32Array
}

interface PhrasingFailure {
  templateId: string
  phrasing: string
  rank: number          // where the template actually landed (1-based; >topK or -1 = not found in shown window)
  beatenBy: string[]    // ids that outranked it
}

async function main() {
  const args = process.argv.slice(2)
  const dirIdx = args.indexOf('--dir')
  const dir = dirIdx >= 0 ? args[dirIdx + 1] : join('public', 'indexes')
  const topIdx = args.indexOf('--top')
  const topK = topIdx >= 0 ? parseInt(args[topIdx + 1], 10) : DEFAULT_TOP_K
  const maxFailIdx = args.indexOf('--max-fail')
  const maxFailRate = maxFailIdx >= 0 ? parseFloat(args[maxFailIdx + 1]) : DEFAULT_MAX_FAIL_RATE

  const manifestPath = join(dir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error(`No manifest at ${manifestPath} — build the index first`)
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { shards: Array<{ file: string }> }

  // Load every shard into one in-memory index (validation must be global —
  // a phrasing competes against ALL templates, not just its own category)
  const all: IndexedTemplate[] = []
  for (const shard of manifest.shards) {
    const data = JSON.parse(readFileSync(join(dir, shard.file), 'utf-8')) as IndexShard
    for (const t of data.templates) {
      all.push({
        id: t.id,
        name: t.name,
        category: t.category,
        phrasings: t.phrasings ?? [],
        vector: decodeEmbedding(t.embedding as unknown as string),
      })
    }
  }

  const totalPhrasings = all.reduce((s, t) => s + t.phrasings.length, 0)
  console.log(`🔎 Retrieval self-test: ${all.length} templates, ${totalPhrasings} phrasings, top-${topK} window`)

  const failures: PhrasingFailure[] = []
  let phrasingsTested = 0

  for (const template of all) {
    for (const phrasing of template.phrasings) {
      const qv = await embed(phrasing)
      const ranked = all
        .map(t => ({ id: t.id, sim: cosine(qv, t.vector) }))
        .sort((a, b) => b.sim - a.sim)

      const rank = ranked.findIndex(r => r.id === template.id) + 1
      phrasingsTested++

      if (rank === 0 || rank > topK) {
        failures.push({
          templateId: template.id,
          phrasing,
          rank: rank === 0 ? -1 : rank,
          beatenBy: ranked.slice(0, topK).map(r => r.id),
        })
      }
    }
    process.stdout.write(`\r  tested ${phrasingsTested}/${totalPhrasings} phrasings...`)
  }
  console.log('')

  const failingTemplates = [...new Set(failures.map(f => f.templateId))]
  const templateFailRate = all.length > 0 ? failingTemplates.length / all.length : 0
  const phrasingFailRate = phrasingsTested > 0 ? failures.length / phrasingsTested : 0

  console.log(`\n📊 Results:`)
  console.log(`  Phrasings: ${phrasingsTested - failures.length}/${phrasingsTested} retrieved their template in top-${topK} (${((1 - phrasingFailRate) * 100).toFixed(1)}% pass)`)
  console.log(`  Templates: ${all.length - failingTemplates.length}/${all.length} fully self-retrievable (${((1 - templateFailRate) * 100).toFixed(1)}% pass)`)

  if (failures.length > 0) {
    console.log(`\n⚠ ${failures.length} failing phrasings across ${failingTemplates.length} templates:`)
    for (const f of failures.slice(0, 20)) {
      console.log(`  - ${f.templateId} :: "${f.phrasing}" → rank ${f.rank}, beaten by [${f.beatenBy.join(', ')}]`)
    }
    if (failures.length > 20) console.log(`  ... and ${failures.length - 20} more`)
  }

  const reportPath = join('data', 'pipeline', 'validation-report.json')
  writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    templates: all.length,
    phrasings: phrasingsTested,
    topK,
    phrasingFailRate,
    templateFailRate,
    failingTemplates,
    failures,
  }, null, 2))
  console.log(`📄 Report → ${reportPath}`)

  if (templateFailRate > maxFailRate) {
    console.error(`\n❌ BUILD BLOCKED: template failure rate ${(templateFailRate * 100).toFixed(1)}% exceeds ${(maxFailRate * 100).toFixed(0)}%`)
    console.error('Failing templates:')
    for (const id of failingTemplates) console.error(`  - ${id}`)
    process.exit(1)
  }

  console.log(`\n✅ Index validation passed (${(templateFailRate * 100).toFixed(1)}% ≤ ${(maxFailRate * 100).toFixed(0)}% threshold)`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
