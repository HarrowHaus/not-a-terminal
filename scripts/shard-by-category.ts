#!/usr/bin/env tsx
/**
 * shard-by-category.ts — Group templates by category and compress each shard.
 *
 * Reads embedded templates, groups by category, outputs one JSON file per
 * category to public/indexes/. Also creates a manifest.json with shard metadata.
 *
 * Usage:
 *   tsx scripts/shard-by-category.ts --test
 *   tsx scripts/shard-by-category.ts --input embedded.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import type { EmbeddedTemplate, IndexShard } from './types.js'
import { CATEGORIES } from './types.js'

// ─── Shard logic ─────────────────────────────────────────────────────

function shardTemplates(templates: EmbeddedTemplate[]): Map<string, IndexShard> {
  const shards = new Map<string, IndexShard>()

  // Initialize empty shards for known categories
  for (const cat of CATEGORIES) {
    shards.set(cat, { category: cat, count: 0, templates: [] })
  }

  // Sort templates into shards
  for (const template of templates) {
    const category = template.category
    let shard = shards.get(category)

    if (!shard) {
      // Unknown category — create it
      shard = { category, count: 0, templates: [] }
      shards.set(category, shard)
    }

    shard.templates.push(template)
    shard.count++
  }

  // Remove empty shards
  for (const [key, shard] of shards) {
    if (shard.count === 0) shards.delete(key)
  }

  return shards
}

interface ManifestEntry {
  category: string
  count: number
  file: string
  sizeBytes: number
  compressedBytes: number
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'embedded.json')
  const outputIdx = args.indexOf('--output-dir')
  const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : join('public', 'indexes')

  mkdirSync(outputDir, { recursive: true })

  let templates: EmbeddedTemplate[]

  if (isTest) {
    console.log('🧪 Running in test mode...')
    const testPath = join('data', 'pipeline', 'embedded.json')
    if (existsSync(testPath)) {
      templates = JSON.parse(readFileSync(testPath, 'utf-8')) as EmbeddedTemplate[]
    } else {
      // Minimal inline test data with mock embeddings
      const mockVec = new Array(384).fill(0).map((_, i) => Math.sin(i) * 0.1)
      templates = [
        {
          id: 'test-1', source: 'test', name: 'Landing A',
          code: '<div>A</div>', originalFormat: 'jsx',
          description: 'Landing page A', phrasings: ['landing a'],
          category: 'landing-page', tags: ['landing'], sections: ['hero'],
          fields: [], embedding: mockVec,
        },
        {
          id: 'test-2', source: 'test', name: 'Landing B',
          code: '<div>B</div>', originalFormat: 'jsx',
          description: 'Landing page B', phrasings: ['landing b'],
          category: 'landing-page', tags: ['landing'], sections: ['hero', 'features'],
          fields: [], embedding: mockVec.map(v => v + 0.01),
        },
        {
          id: 'test-3', source: 'test', name: 'Dashboard A',
          code: '<div>C</div>', originalFormat: 'jsx',
          description: 'Admin dashboard', phrasings: ['dashboard'],
          category: 'dashboard', tags: ['admin'], sections: ['sidebar', 'stats'],
          fields: [], embedding: mockVec.map(v => v + 0.02),
        },
        {
          id: 'test-4', source: 'test', name: 'Portfolio A',
          code: '<div>D</div>', originalFormat: 'jsx',
          description: 'Creative portfolio', phrasings: ['portfolio'],
          category: 'portfolio', tags: ['creative'], sections: ['hero', 'gallery'],
          fields: [], embedding: mockVec.map(v => v + 0.03),
        },
      ]
    }
  } else {
    if (!existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`)
      console.error('Run compute-embeddings.ts first, or use --test')
      process.exit(1)
    }
    templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as EmbeddedTemplate[]
    console.log(`📥 Loaded ${templates.length} embedded templates from ${inputPath}`)
  }

  const shards = shardTemplates(templates)
  const manifest: ManifestEntry[] = []

  console.log(`\n📦 Creating ${shards.size} shards...\n`)

  for (const [category, shard] of shards) {
    const filename = `${category}.json`
    const filepath = join(outputDir, filename)
    const json = JSON.stringify(shard)
    const compressed = gzipSync(Buffer.from(json))

    // Write uncompressed JSON (Vite/server can handle gzip serving)
    writeFileSync(filepath, json)

    // Also write compressed version
    writeFileSync(filepath + '.gz', compressed)

    manifest.push({
      category,
      count: shard.count,
      file: filename,
      sizeBytes: json.length,
      compressedBytes: compressed.length,
    })

    const ratio = ((compressed.length / json.length) * 100).toFixed(1)
    console.log(
      `  ${category}: ${shard.count} templates, ` +
      `${(json.length / 1024).toFixed(1)}KB → ${(compressed.length / 1024).toFixed(1)}KB (${ratio}%)`,
    )
  }

  // Write manifest
  const manifestPath = join(outputDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify({
    version: 1,
    generated: new Date().toISOString(),
    totalTemplates: templates.length,
    shards: manifest,
  }, null, 2))

  console.log(`\n✅ Created ${shards.size} shards with ${templates.length} total templates`)
  console.log(`📄 Manifest: ${manifestPath}`)
  console.log(`📁 Output dir: ${outputDir}`)

  // Summary table
  console.log('\n📊 Summary:')
  const totalSize = manifest.reduce((s, m) => s + m.sizeBytes, 0)
  const totalCompressed = manifest.reduce((s, m) => s + m.compressedBytes, 0)
  console.log(`  Total: ${(totalSize / 1024).toFixed(1)}KB raw, ${(totalCompressed / 1024).toFixed(1)}KB gzipped`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
