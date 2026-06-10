#!/usr/bin/env tsx
/**
 * compile-gate.ts — Every template must compile before it can enter the index.
 *
 * Runs each template's code through esbuild's TSX transform (the same compiler
 * family the runtime preview uses). Especially critical for HTML→JSX
 * conversions, which can produce malformed JSX. Failures are rejected and
 * logged to data/pipeline/rejected.json with the esbuild error message.
 * No template ships that doesn't compile.
 *
 * Usage:
 *   tsx scripts/compile-gate.ts --input crawled.json --output compiled.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { transform } from 'esbuild'
import type { CrawledTemplate } from './types.js'

const REJECTED_PATH = join('data', 'pipeline', 'rejected.json')

interface Rejection {
  id: string
  source: string
  license: string | null
  reason: string
}

function appendRejections(newOnes: Rejection[]): void {
  let existing: Rejection[] = []
  if (existsSync(REJECTED_PATH)) {
    try { existing = JSON.parse(readFileSync(REJECTED_PATH, 'utf-8')) as Rejection[] } catch { /* fresh file */ }
  }
  const merged = [...existing.filter(e => !newOnes.some(n => n.id === e.id)), ...newOnes]
  writeFileSync(REJECTED_PATH, JSON.stringify(merged, null, 2))
}

export async function compileCheck(code: string): Promise<string | null> {
  try {
    await transform(code, {
      loader: 'tsx',
      jsx: 'automatic',
      logLevel: 'silent',
    })
    return null
  } catch (err) {
    const e = err as { errors?: Array<{ text: string; location?: { line: number; column: number } }> }
    if (e.errors && e.errors.length > 0) {
      const first = e.errors[0]
      const loc = first.location ? ` (line ${first.location.line}:${first.location.column})` : ''
      return `${first.text}${loc}`
    }
    return (err as Error).message
  }
}

async function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'crawled.json')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('data', 'pipeline', 'compiled.json')

  if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    process.exit(1)
  }
  mkdirSync(join('data', 'pipeline'), { recursive: true })

  const templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as CrawledTemplate[]
  console.log(`🔧 Compile gate: checking ${templates.length} templates (esbuild tsx transform)`)

  const passed: CrawledTemplate[] = []
  const rejections: Rejection[] = []

  for (const t of templates) {
    const error = await compileCheck(t.code)
    if (error === null) {
      passed.push(t)
    } else {
      rejections.push({
        id: t.id,
        source: t.source,
        license: t.license,
        reason: `compile error: ${error}`,
      })
    }
  }

  if (rejections.length > 0) {
    appendRejections(rejections)
    console.log(`\n🚫 COMPILE GATE: rejected ${rejections.length}/${templates.length} → ${REJECTED_PATH}`)
    const bySource = new Map<string, number>()
    for (const r of rejections) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1)
    for (const [s, n] of bySource) console.log(`   ${s}: ${n}`)
    for (const r of rejections.slice(0, 8)) console.log(`   - ${r.id}: ${r.reason.slice(0, 110)}`)
    if (rejections.length > 8) console.log(`   ... and ${rejections.length - 8} more`)
  } else {
    console.log(`✅ COMPILE GATE: all ${templates.length} templates compile`)
  }

  writeFileSync(outputPath, JSON.stringify(passed, null, 2))
  console.log(`📄 ${passed.length} compiling templates → ${outputPath}`)

  if (passed.length === 0) process.exit(1)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
