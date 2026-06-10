#!/usr/bin/env tsx
/**
 * build-index.ts — Orchestrates the template pipeline with shipping gates.
 *
 * GATES (enforced here):
 *   1. LICENSE — only MIT / Apache-2.0 / ISC / BSD ship. Everything else is
 *      rejected and logged to data/pipeline/rejected.json.
 *   2. PROVENANCE — only enrichedBy:'agent' templates may enter the
 *      production index. Mock enrichment (--test) is quarantined to
 *      data/pipeline/test-indexes/ and can never reach public/indexes/.
 *
 * Real pipeline is TWO stages, because enrichment is performed by Claude Code
 * spawning template-enricher sub-agents (not by a script):
 *
 *   Stage 1:  tsx scripts/build-index.ts [--source X | --all]
 *             → crawl → license gate → enrich --prepare → STOP
 *             (Claude Code then runs one sub-agent per batch file)
 *
 *   Stage 2:  tsx scripts/build-index.ts --from-enriched
 *             → enrich --merge → gates → embed → shard → public/indexes/
 *
 * Test pipeline (one shot, fully mocked, quarantined):
 *             tsx scripts/build-index.ts --test
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate, EnrichedTemplate } from './types.js'
import { isAllowedLicense, ALLOWED_LICENSES } from './types.js'

const PIPELINE = join('data', 'pipeline')
const REJECTED_PATH = join(PIPELINE, 'rejected.json')
const TEST_INDEX_DIR = join(PIPELINE, 'test-indexes')
const PROD_INDEX_DIR = join('public', 'indexes')

interface Rejection {
  id: string
  source: string
  license: string | null
  reason: string
}

function run(cmd: string, description: string): void {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`▶ ${description}`)
  console.log(`  ${cmd}`)
  console.log('═'.repeat(60))
  execSync(cmd, { stdio: 'inherit', env: { ...process.env }, cwd: process.cwd() })
}

function appendRejections(newOnes: Rejection[]): void {
  let existing: Rejection[] = []
  if (existsSync(REJECTED_PATH)) {
    try { existing = JSON.parse(readFileSync(REJECTED_PATH, 'utf-8')) as Rejection[] } catch { /* fresh file */ }
  }
  const merged = [...existing.filter(e => !newOnes.some(n => n.id === e.id)), ...newOnes]
  writeFileSync(REJECTED_PATH, JSON.stringify(merged, null, 2))
}

/** LICENSE GATE — filter to permissive licenses only; log the rest. */
function licenseGate<T extends CrawledTemplate>(templates: T[], stage: string): T[] {
  const kept: T[] = []
  const rejected: Rejection[] = []

  for (const t of templates) {
    if (isAllowedLicense(t.license)) {
      kept.push(t)
    } else {
      rejected.push({
        id: t.id,
        source: t.source,
        license: t.license,
        reason: t.license
          ? `license "${t.license}" not in allowed set [${ALLOWED_LICENSES.join(', ')}]`
          : 'license unknown (null) — cannot verify permissive licensing',
      })
    }
  }

  if (rejected.length > 0) {
    appendRejections(rejected)
    console.log(`\n🚫 LICENSE GATE (${stage}): rejected ${rejected.length}/${templates.length} → ${REJECTED_PATH}`)
    const bySource = new Map<string, number>()
    for (const r of rejected) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1)
    for (const [s, n] of bySource) console.log(`   ${s}: ${n}`)
  } else {
    console.log(`\n✅ LICENSE GATE (${stage}): all ${templates.length} templates pass`)
  }
  return kept
}

/** PROVENANCE GATE — production indexes accept agent enrichment only. */
function provenanceGate(templates: EnrichedTemplate[]): EnrichedTemplate[] {
  const kept = templates.filter(t => t.enrichedBy === 'agent')
  const mocks = templates.length - kept.length
  if (mocks > 0) {
    console.error(`\n🚫 PROVENANCE GATE: ${mocks} mock-enriched templates BLOCKED from production index`)
    appendRejections(templates.filter(t => t.enrichedBy !== 'agent').map(t => ({
      id: t.id, source: t.source, license: t.license,
      reason: `enrichedBy "${t.enrichedBy}" — only 'agent' enrichment may ship`,
    })))
  }
  return kept
}

// ─── Stages ──────────────────────────────────────────────────────────

function stageTest(): void {
  // Fully mocked plumbing test — everything quarantined away from public/indexes/
  mkdirSync(TEST_INDEX_DIR, { recursive: true })
  run('npx tsx scripts/crawl-templates.ts --test', 'TEST 1/4: Crawl (inline data)')
  run('npx tsx scripts/enrich-with-claude.ts --test', 'TEST 2/4: Mock enrichment (quarantined)')
  run(`npx tsx scripts/compute-embeddings.ts --test --input ${join(PIPELINE, 'enriched.mock.json')} --output ${join(PIPELINE, 'embedded.mock.json')}`,
    'TEST 3/4: Mock embeddings')
  run(`npx tsx scripts/shard-by-category.ts --test --input ${join(PIPELINE, 'embedded.mock.json')} --output-dir ${TEST_INDEX_DIR}`,
    'TEST 4/4: Shard (→ test-indexes/, NOT public/)')
  console.log(`\n✅ Test pipeline complete — output quarantined in ${TEST_INDEX_DIR}`)
  console.log('   public/indexes/ untouched. Mock data cannot ship.')
}

function stageOne(crawlArgs: string): void {
  run(`npx tsx scripts/crawl-templates.ts ${crawlArgs}`, 'Stage 1a: Crawl templates')

  const crawledPath = join(PIPELINE, 'crawled.json')
  if (!existsSync(crawledPath)) {
    console.error('❌ Crawl produced no output')
    process.exit(1)
  }

  // COMPILE GATE — nothing that doesn't compile goes any further
  const compiledPath = join(PIPELINE, 'compiled.json')
  run(`npx tsx scripts/compile-gate.ts --input ${crawledPath} --output ${compiledPath}`, 'Stage 1b: Compile gate (esbuild)')

  // LICENSE GATE — before enrichment, don't spend agent tokens on unshippable templates
  const compiled = JSON.parse(readFileSync(compiledPath, 'utf-8')) as CrawledTemplate[]
  const licensed = licenseGate(compiled, 'pre-enrichment')
  const licensedPath = join(PIPELINE, 'crawled.licensed.json')
  writeFileSync(licensedPath, JSON.stringify(licensed, null, 2))
  console.log(`📄 ${licensed.length} licensed templates → ${licensedPath}`)

  if (licensed.length === 0) {
    console.error('❌ Nothing passed the license gate')
    process.exit(1)
  }

  // DEDUPE = PRUNE — duplicates are archived, never enriched, never shipped
  const dedupedPath = join(PIPELINE, 'deduped.json')
  run(`npx tsx scripts/dedupe-templates.ts --input ${licensedPath} --output ${dedupedPath}`, 'Stage 1c: Dedupe (cosine > 0.92)')

  run(`npx tsx scripts/enrich-with-claude.ts --prepare --input ${dedupedPath}`, 'Stage 1d: Prepare enrichment batches')

  console.log(`\n${'═'.repeat(60)}`)
  console.log('⏸  STAGE 1 COMPLETE — enrichment handoff')
  console.log('═'.repeat(60))
  console.log('Claude Code now spawns one template-enricher sub-agent per batch in')
  console.log('data/pipeline/enrich-batches/ (agent Reads batch-NNN.json, Writes batch-NNN.out.json).')
  console.log('When all batches have outputs, resume with:')
  console.log('  npx tsx scripts/build-index.ts --from-enriched')
}

function stageTwo(): void {
  run('npx tsx scripts/enrich-with-claude.ts --merge', 'Stage 2a: Merge batch outputs')

  const enrichedPath = join(PIPELINE, 'enriched.json')
  const enrichedRaw = JSON.parse(readFileSync(enrichedPath, 'utf-8')) as EnrichedTemplate[]

  // Both gates, belt and braces, immediately before anything can ship
  const agentOnly = provenanceGate(enrichedRaw)
  const shippable = licenseGate(agentOnly, 'pre-ship')

  if (shippable.length === 0) {
    console.error('❌ Nothing shippable after gates')
    process.exit(1)
  }
  const gatedPath = join(PIPELINE, 'enriched.gated.json')
  writeFileSync(gatedPath, JSON.stringify(shippable, null, 2))
  console.log(`📄 ${shippable.length} shippable templates → ${gatedPath}`)

  run(`npx tsx scripts/compute-embeddings.ts --input ${gatedPath}`, 'Stage 2b: Compute embeddings')
  run(`npx tsx scripts/shard-by-category.ts --input ${join(PIPELINE, 'embedded.json')} --output-dir ${PROD_INDEX_DIR}`,
    'Stage 2c: Shard by category → public/indexes/')

  // RETRIEVAL SELF-TEST — every template must be findable by its own phrasings.
  // >5% template failure rate exits 1, which fails the build right here.
  run(`npx tsx scripts/validate-index.ts --dir ${PROD_INDEX_DIR}`, 'Stage 2d: Retrieval self-test (blocking)')

  console.log(`\n✅ Production index built and validated: ${PROD_INDEX_DIR}`)
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)
  mkdirSync(PIPELINE, { recursive: true })
  mkdirSync(PROD_INDEX_DIR, { recursive: true })

  const startTime = Date.now()
  console.log('\n🚀 NOT A TERMINAL — Build Pipeline')
  console.log(`   Time: ${new Date().toISOString()}`)

  if (args.includes('--test')) {
    stageTest()
  } else if (args.includes('--from-enriched')) {
    stageTwo()
  } else {
    const sourceIdx = args.indexOf('--source')
    const crawlArgs = sourceIdx >= 0 ? `--source ${args[sourceIdx + 1]}` : '--all'
    stageOne(crawlArgs)
  }

  console.log(`\n⏱  ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
}

main()
