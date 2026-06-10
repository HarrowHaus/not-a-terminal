#!/usr/bin/env tsx
/**
 * dedupe-templates.ts — DEDUPE = PRUNE. Runs before enrichment.
 *
 * Embeds every crawled template locally (all-MiniLM-L6-v2, free), clusters at
 * cosine > 0.92, and keeps ONE representative per cluster. Preference order:
 *   1. allowed license over unknown/restricted
 *   2. React-native (tsx/jsx) over converted HTML
 *   3. most complete code (longest)
 *
 * Duplicates are archived to data/pipeline/duplicates.json with their cluster
 * representative and similarity — they are never enriched and never shipped.
 *
 * Usage:
 *   tsx scripts/dedupe-templates.ts --input compiled.json --output deduped.json
 *   tsx scripts/dedupe-templates.ts --input X --output Y --threshold 0.92
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate } from './types.js'
import { isAllowedLicense } from './types.js'

const DUPLICATES_PATH = join('data', 'pipeline', 'duplicates.json')
const DEFAULT_THRESHOLD = 0.92

// ─── Local embedding (all-MiniLM-L6-v2, q8) ──────────────────────────

type Extractor = (text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>
let extractor: Extractor | null = null

async function getExtractor(): Promise<Extractor> {
  if (extractor) return extractor
  console.log('🤖 Loading all-MiniLM-L6-v2 (local, free)...')
  const { pipeline, env } = await import('@huggingface/transformers')
  env.allowLocalModels = false
  const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' as never })
  extractor = pipe as unknown as Extractor
  console.log('✓ Model loaded')
  return extractor
}

/**
 * Embed the dedupe signature of a template: name + head of code.
 * (The model truncates long inputs anyway; near-duplicates from the same
 * library have near-identical openings, which is what we need to catch.)
 */
async function embedTemplate(t: CrawledTemplate): Promise<Float32Array> {
  const ext = await getExtractor()
  const signature = `${t.name}\n${t.code.slice(0, 2000)}`
  const result = await ext(signature, { pooling: 'mean', normalize: true })
  return result.data
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot   // vectors are normalized
}

// ─── Representative scoring ──────────────────────────────────────────

function repScore(t: CrawledTemplate): number {
  let score = 0
  if (isAllowedLicense(t.license)) score += 1_000_000          // best license first
  if (t.originalFormat !== 'html') score += 100_000            // React-native over converted HTML
  score += Math.min(t.code.length, 99_999)                     // most complete code as tiebreak
  return score
}

// ─── Clustering (greedy, representative-linked) ──────────────────────

interface DuplicateRecord {
  id: string
  source: string
  license: string | null
  keptAs: string          // id of the cluster representative that shipped instead
  similarity: number
}

async function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'compiled.json')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('data', 'pipeline', 'deduped.json')
  const thresholdIdx = args.indexOf('--threshold')
  const threshold = thresholdIdx >= 0 ? parseFloat(args[thresholdIdx + 1]) : DEFAULT_THRESHOLD

  if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    process.exit(1)
  }
  mkdirSync(join('data', 'pipeline'), { recursive: true })

  const templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as CrawledTemplate[]
  console.log(`🔍 Dedupe: ${templates.length} templates, cosine threshold ${threshold}`)

  // Embed all
  const vectors: Float32Array[] = []
  for (let i = 0; i < templates.length; i++) {
    vectors.push(await embedTemplate(templates[i]))
    if ((i + 1) % 50 === 0) console.log(`  embedded ${i + 1}/${templates.length}`)
  }

  // Sort indices so the best representative candidates come first; then each
  // template joins the first existing cluster whose representative is within
  // the threshold, else founds its own cluster. Representative = cluster founder
  // (the highest-scoring member, thanks to the sort).
  const order = templates.map((_, i) => i).sort((a, b) => repScore(templates[b]) - repScore(templates[a]))

  interface Cluster { repIdx: number; members: Array<{ idx: number; similarity: number }> }
  const clusters: Cluster[] = []

  for (const idx of order) {
    let placed = false
    for (const cluster of clusters) {
      const sim = cosine(vectors[idx], vectors[cluster.repIdx])
      if (sim > threshold) {
        cluster.members.push({ idx, similarity: sim })
        placed = true
        break
      }
    }
    if (!placed) clusters.push({ repIdx: idx, members: [] })
  }

  const kept: CrawledTemplate[] = []
  const duplicates: DuplicateRecord[] = []

  for (const cluster of clusters) {
    kept.push(templates[cluster.repIdx])
    for (const m of cluster.members) {
      duplicates.push({
        id: templates[m.idx].id,
        source: templates[m.idx].source,
        license: templates[m.idx].license,
        keptAs: templates[cluster.repIdx].id,
        similarity: Math.round(m.similarity * 10000) / 10000,
      })
    }
  }

  // Keep input order for the survivors (stable output)
  const keptIds = new Set(kept.map(t => t.id))
  const keptOrdered = templates.filter(t => keptIds.has(t.id))

  writeFileSync(outputPath, JSON.stringify(keptOrdered, null, 2))
  writeFileSync(DUPLICATES_PATH, JSON.stringify(duplicates, null, 2))

  console.log(`\n✅ DEDUPE: ${keptOrdered.length} distinct templates kept, ${duplicates.length} duplicates pruned`)
  console.log(`📄 kept → ${outputPath}`)
  console.log(`📦 duplicates archived → ${DUPLICATES_PATH} (never enriched, never shipped)`)
  if (duplicates.length > 0) {
    for (const d of duplicates.slice(0, 8)) console.log(`   - ${d.id} ≈ ${d.keptAs} (${d.similarity})`)
    if (duplicates.length > 8) console.log(`   ... and ${duplicates.length - 8} more`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
