#!/usr/bin/env tsx
/**
 * compute-embeddings.ts — Compute 384-dim embeddings for enriched templates.
 *
 * Runs all-MiniLM-L6-v2 on every description + phrasing, averages
 * phrasing embeddings per template. Outputs 384-dim vectors.
 *
 * Usage:
 *   tsx scripts/compute-embeddings.ts --test                    # deterministic mock
 *   tsx scripts/compute-embeddings.ts --input enriched.json     # real embeddings
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { EnrichedTemplate, EmbeddedTemplate } from './types.js'

const EMBEDDING_DIM = 384

// ─── Embedding via Transformers.js ───────────────────────────────────

let extractor: ((text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>) | null = null

async function loadModel(): Promise<typeof extractor> {
  if (extractor) return extractor

  console.log('🤖 Loading all-MiniLM-L6-v2 model...')
  const { pipeline, env } = await import('@huggingface/transformers')
  env.allowLocalModels = false

  const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    dtype: 'q8' as never,
  })
  extractor = pipe as unknown as typeof extractor
  console.log('✓ Model loaded')
  return extractor
}

async function embed(text: string): Promise<number[]> {
  const ext = await loadModel()
  if (!ext) throw new Error('Model not loaded')
  const result = await ext(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data)
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  for (const text of texts) {
    results.push(await embed(text))
  }
  return results
}

// ─── Vector math ─────────────────────────────────────────────────────

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return new Array(EMBEDDING_DIM).fill(0)
  if (vectors.length === 1) return vectors[0]

  const avg = new Array<number>(EMBEDDING_DIM).fill(0)
  for (const vec of vectors) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      avg[i] += vec[i]
    }
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    avg[i] /= vectors.length
  }

  // Re-normalize
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += avg[i] * avg[i]
  }
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      avg[i] /= norm
    }
  }

  return avg
}

// ─── Mock embeddings for test mode ───────────────────────────────────

function mockEmbedding(text: string): number[] {
  // Deterministic pseudo-embedding based on text hash
  const vec = new Array<number>(EMBEDDING_DIM)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    hash = ((hash << 5) - hash + i) | 0
    vec[i] = (hash & 0xffff) / 0xffff - 0.5
  }
  // Normalize
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  for (let i = 0; i < EMBEDDING_DIM; i++) vec[i] /= norm
  return vec
}

// ─── Process templates ───────────────────────────────────────────────

async function processTemplates(
  templates: EnrichedTemplate[],
  useMock: boolean,
): Promise<EmbeddedTemplate[]> {
  const results: EmbeddedTemplate[] = []

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i]
    process.stdout.write(`  [${i + 1}/${templates.length}] ${t.id}... `)

    // Collect all texts to embed: description + all phrasings
    const texts = [t.description, ...t.phrasings]

    let vectors: number[][]
    if (useMock) {
      vectors = texts.map(mockEmbedding)
    } else {
      vectors = await embedBatch(texts)
    }

    // Average all vectors (description + phrasings) into one
    const embedding = averageVectors(vectors)

    results.push({ ...t, embedding })
    console.log(`✓ (${texts.length} texts averaged)`)
  }

  return results
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'enriched.json')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('data', 'pipeline', 'embedded.json')

  mkdirSync(join('data', 'pipeline'), { recursive: true })

  let templates: EnrichedTemplate[]

  if (isTest) {
    console.log('🧪 Running in test mode with mock embeddings...')
    const testPath = join('data', 'pipeline', 'enriched.json')
    if (existsSync(testPath)) {
      templates = JSON.parse(readFileSync(testPath, 'utf-8')) as EnrichedTemplate[]
    } else {
      // Minimal inline test data
      templates = [
        {
          id: 'test-1', source: 'test', name: 'Landing Page',
          code: '<div>Landing</div>', originalFormat: 'jsx',
          description: 'A clean landing page for SaaS products.',
          phrasings: ['build a landing page', 'SaaS landing', 'startup website'],
          category: 'landing-page', tags: ['saas', 'landing'], sections: ['hero', 'features'],
          fields: [{ key: 'name', label: 'Name', type: 'text', default: 'Acme' }],
        },
        {
          id: 'test-2', source: 'test', name: 'Dashboard',
          code: '<div>Dashboard</div>', originalFormat: 'jsx',
          description: 'An admin dashboard with sidebar navigation.',
          phrasings: ['admin dashboard', 'analytics panel', 'control panel'],
          category: 'dashboard', tags: ['admin', 'dashboard'], sections: ['sidebar', 'stats'],
          fields: [{ key: 'name', label: 'Name', type: 'text', default: 'Admin' }],
        },
      ]
    }

    const results = await processTemplates(templates, true)

    writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n✅ Computed mock embeddings for ${results.length} templates`)
    console.log(`📄 Written to ${outputPath}`)
    console.log(`📐 Embedding dim: ${results[0]?.embedding.length ?? 0}`)
    return
  }

  // Real mode
  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    console.error('Run enrich-with-claude.ts first, or use --test')
    process.exit(1)
  }

  templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as EnrichedTemplate[]
  console.log(`📥 Loaded ${templates.length} enriched templates from ${inputPath}`)

  const results = await processTemplates(templates, false)

  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\n✅ Computed embeddings for ${results.length} templates`)
  console.log(`📄 Written to ${outputPath}`)
  console.log(`📐 Embedding dim: ${results[0]?.embedding.length ?? 0}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
