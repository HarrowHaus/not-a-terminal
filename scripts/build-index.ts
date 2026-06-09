#!/usr/bin/env tsx
/**
 * build-index.ts — Orchestrates the full template pipeline.
 *
 * Runs: crawl → enrich → embed → shard → public/indexes/
 *
 * Usage:
 *   tsx scripts/build-index.ts --test      # full pipeline with test/mock data
 *   tsx scripts/build-index.ts --all       # full pipeline with real sources
 *   tsx scripts/build-index.ts --source X  # single source through full pipeline
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

function run(cmd: string, description: string): void {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`▶ ${description}`)
  console.log(`  ${cmd}`)
  console.log('═'.repeat(60))

  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: process.cwd(),
    })
  } catch (err) {
    console.error(`\n❌ Failed: ${description}`)
    throw err
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const sourceIdx = args.indexOf('--source')
  const sourceName = sourceIdx >= 0 ? args[sourceIdx + 1] : null

  // Ensure directories exist
  mkdirSync(join('data', 'pipeline'), { recursive: true })
  mkdirSync(join('public', 'indexes'), { recursive: true })

  const startTime = Date.now()

  console.log('\n🚀 NOT A TERMINAL — Build Pipeline')
  console.log(`   Mode: ${isTest ? 'TEST' : sourceName ? `source: ${sourceName}` : 'ALL'}`)
  console.log(`   Time: ${new Date().toISOString()}\n`)

  const crawledPath = join('data', 'pipeline', 'crawled.json')
  const enrichedPath = join('data', 'pipeline', 'enriched.json')
  const embeddedPath = join('data', 'pipeline', 'embedded.json')

  if (isTest) {
    // ── Step 1: Crawl (test mode) ──
    run('npx tsx scripts/crawl-templates.ts --test', 'Step 1/4: Crawl templates (test)')

    // ── Step 2: Enrich (test/mock mode) ──
    run('npx tsx scripts/enrich-with-claude.ts --test', 'Step 2/4: Enrich with Claude (mock)')

    // ── Step 3: Compute embeddings (test/mock mode) ──
    run('npx tsx scripts/compute-embeddings.ts --test', 'Step 3/4: Compute embeddings (mock)')

    // ── Step 4: Shard by category ──
    run('npx tsx scripts/shard-by-category.ts --test', 'Step 4/4: Shard by category')
  } else {
    // ── Step 1: Crawl ──
    const crawlArgs = sourceName ? `--source ${sourceName}` : '--all'
    run(`npx tsx scripts/crawl-templates.ts ${crawlArgs}`, 'Step 1/4: Crawl templates')

    if (!existsSync(crawledPath)) {
      console.error('❌ Crawl produced no output')
      process.exit(1)
    }

    // ── Step 2: Enrich ──
    const enrichArgs = process.env.ANTHROPIC_API_KEY
      ? `--input ${crawledPath}`
      : `--input ${crawledPath} --dry-run`

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('\n⚠️  No ANTHROPIC_API_KEY — using mock enrichment (--dry-run)')
    }
    run(`npx tsx scripts/enrich-with-claude.ts ${enrichArgs}`, 'Step 2/4: Enrich with Claude')

    // ── Step 3: Embed ──
    run(`npx tsx scripts/compute-embeddings.ts --input ${enrichedPath}`, 'Step 3/4: Compute embeddings')

    // ── Step 4: Shard ──
    run(`npx tsx scripts/shard-by-category.ts --input ${embeddedPath}`, 'Step 4/4: Shard by category')
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`✅ Pipeline complete in ${elapsed}s`)
  console.log(`📁 Output: public/indexes/`)
  console.log('═'.repeat(60))
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
