#!/usr/bin/env tsx
/**
 * enrich-with-claude.ts — Enrich crawled templates with Claude Haiku.
 *
 * For each template, calls Claude API to generate:
 *   - description (2-3 sentences)
 *   - phrasings (8-12 ways a user might ask for this)
 *   - category, tags, sections list
 *   - customizable fields with defaults
 *
 * Processes in batches of 50 with rate limiting.
 *
 * Usage:
 *   tsx scripts/enrich-with-claude.ts --test              # mock enrichment
 *   tsx scripts/enrich-with-claude.ts --input crawled.json # real enrichment
 *   ANTHROPIC_API_KEY=sk-... tsx scripts/enrich-with-claude.ts --input crawled.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CrawledTemplate, EnrichedTemplate, TemplateField } from './types.js'
import { CATEGORIES } from './types.js'

// ─── Claude API ──────────────────────────────────────────────────────

const ENRICHMENT_PROMPT = `You are analyzing a web template. Given the JSX code below, output JSON with exactly these fields:

{
  "description": "2-3 sentences describing what this template is and who it's for.",
  "phrasings": ["8-12 different ways a user might ask for this template"],
  "category": "one of: ${CATEGORIES.join(', ')}",
  "tags": ["relevant", "tags", "array"],
  "sections": ["hero", "features", "etc — list the sections present"],
  "fields": [
    {"key": "businessName", "label": "Name", "type": "text", "default": "value from template"},
    {"key": "tagline", "label": "Tagline", "type": "text", "default": "value from template"},
    {"key": "primaryColor", "label": "Color", "type": "color", "default": "blue"}
  ]
}

Output ONLY valid JSON. No markdown, no explanation.`

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1024,
      messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API error ${res.status}: ${body}`)
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  return data.content[0]?.text ?? ''
}

async function enrichTemplate(template: CrawledTemplate): Promise<EnrichedTemplate> {
  // Truncate code to first 3000 chars for the API call
  const truncatedCode = template.code.length > 3000
    ? template.code.slice(0, 3000) + '\n// ... (truncated)'
    : template.code

  const response = await callClaude([
    { role: 'user', content: `${ENRICHMENT_PROMPT}\n\nTemplate name: ${template.name}\n\n\`\`\`jsx\n${truncatedCode}\n\`\`\`` },
  ])

  try {
    // Extract JSON from response (handles potential markdown wrapping)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0]) as {
      description: string
      phrasings: string[]
      category: string
      tags: string[]
      sections: string[]
      fields: TemplateField[]
    }

    // Validate category
    const category = CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])
      ? parsed.category
      : 'landing-page'

    return {
      ...template,
      description: parsed.description || `A ${template.name} template.`,
      phrasings: (parsed.phrasings || []).slice(0, 12),
      category,
      tags: parsed.tags || [],
      sections: parsed.sections || [],
      fields: (parsed.fields || []).slice(0, 8),
    }
  } catch {
    console.warn(`  ⚠ Failed to parse enrichment for ${template.id}, using defaults`)
    return {
      ...template,
      description: `A ${template.name} web template from ${template.source}.`,
      phrasings: [`build a ${template.name.toLowerCase()}`, `I need a ${template.name.toLowerCase()}`],
      category: 'landing-page',
      tags: [],
      sections: [],
      fields: [],
    }
  }
}

// ─── Batch processing with rate limiting ─────────────────────────────

async function processBatch(
  templates: CrawledTemplate[],
  batchSize: number = 50,
  delayMs: number = 1000,
): Promise<EnrichedTemplate[]> {
  const results: EnrichedTemplate[] = []

  for (let i = 0; i < templates.length; i += batchSize) {
    const batch = templates.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(templates.length / batchSize)

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} templates)`)

    for (const template of batch) {
      try {
        process.stdout.write(`  Enriching ${template.id}... `)
        const enriched = await enrichTemplate(template)
        results.push(enriched)
        console.log(`✓ (${enriched.phrasings.length} phrasings, category: ${enriched.category})`)
      } catch (err) {
        console.log(`✗ ${(err as Error).message}`)
        // Still include with defaults
        results.push({
          ...template,
          description: `A ${template.name} web template.`,
          phrasings: [`build a ${template.name.toLowerCase()}`],
          category: 'landing-page',
          tags: [],
          sections: [],
          fields: [],
        })
      }
    }

    // Rate limit between batches
    if (i + batchSize < templates.length) {
      console.log(`  ⏳ Rate limit pause (${delayMs}ms)...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

// ─── Mock enrichment for test mode ───────────────────────────────────

function mockEnrich(template: CrawledTemplate): EnrichedTemplate {
  const nameWords = template.name.toLowerCase().split(/\s+/)
  const isHero = template.code.includes('py-24') || template.code.includes('py-32')
  const isDashboard = template.code.includes('aside') || template.code.includes('sidebar')
  const isPortfolio = template.code.includes('bg-black') || template.code.includes('Designer')

  let category = 'landing-page'
  if (isDashboard) category = 'dashboard'
  if (isPortfolio) category = 'portfolio'

  const sections: string[] = []
  if (template.code.includes('nav') || template.code.includes('<nav')) sections.push('nav')
  if (isHero) sections.push('hero')
  if (template.code.includes('features') || template.code.includes('grid-cols-3')) sections.push('features')
  if (template.code.includes('footer')) sections.push('footer')

  return {
    ...template,
    description: `A ${template.name.toLowerCase()} template with ${sections.join(', ')} sections. Built with Tailwind CSS for modern web projects.`,
    phrasings: [
      `build a ${nameWords.join(' ')}`,
      `I need a ${nameWords.join(' ')}`,
      `create a ${nameWords.join(' ')} website`,
      `make me a ${nameWords.join(' ')} page`,
      `${nameWords.join(' ')} template`,
      `${category} with ${sections[0] || 'hero'}`,
      `modern ${nameWords.join(' ')}`,
      `${nameWords.join(' ')} for my business`,
    ],
    category,
    tags: [...nameWords, category, 'tailwind', 'responsive'],
    sections,
    fields: [
      { key: 'businessName', label: 'Name', type: 'text' as const, default: template.name },
      { key: 'primaryColor', label: 'Color', type: 'color' as const, default: 'blue' },
    ],
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const isDryRun = args.includes('--dry-run')
  const inputIdx = args.indexOf('--input')
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : join('data', 'pipeline', 'crawled.json')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('data', 'pipeline', 'enriched.json')

  mkdirSync(join('data', 'pipeline'), { recursive: true })

  let templates: CrawledTemplate[]

  if (isTest) {
    console.log('🧪 Running in test mode with mock enrichment...')
    // Use crawled test data if it exists, otherwise use inline
    const testPath = join('data', 'pipeline', 'crawled.json')
    if (existsSync(testPath)) {
      templates = JSON.parse(readFileSync(testPath, 'utf-8')) as CrawledTemplate[]
    } else {
      // Minimal inline test data
      templates = [
        {
          id: 'test-landing',
          source: 'test',
          name: 'SaaS Landing Page',
          code: '<div className="hero py-24"><h1>Ship faster</h1></div>',
          originalFormat: 'jsx',
        },
        {
          id: 'test-dashboard',
          source: 'test',
          name: 'Admin Dashboard',
          code: '<div className="flex"><aside>Sidebar</aside><main>Content</main></div>',
          originalFormat: 'jsx',
        },
      ]
    }

    const results = templates.map(mockEnrich)

    writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n✅ Mock-enriched ${results.length} templates`)
    console.log(`📄 Written to ${outputPath}`)

    // Show sample
    console.log('\n📋 Sample:')
    const sample = results[0]
    console.log(`  ${sample.name}:`)
    console.log(`  Category: ${sample.category}`)
    console.log(`  Description: ${sample.description}`)
    console.log(`  Phrasings: ${sample.phrasings.length}`)
    console.log(`  Sections: ${sample.sections.join(', ')}`)
    return
  }

  // Real mode
  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    console.error('Run crawl-templates.ts first, or use --test')
    process.exit(1)
  }

  templates = JSON.parse(readFileSync(inputPath, 'utf-8')) as CrawledTemplate[]
  console.log(`📥 Loaded ${templates.length} templates from ${inputPath}`)

  if (isDryRun) {
    console.log('🏜️  Dry run — using mock enrichment')
    const results = templates.map(mockEnrich)
    writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`✅ Mock-enriched ${results.length} templates → ${outputPath}`)
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable required for real enrichment')
    console.error('Use --dry-run for mock enrichment, or --test for test mode')
    process.exit(1)
  }

  const results = await processBatch(templates)

  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\n✅ Enriched ${results.length} templates`)
  console.log(`📄 Written to ${outputPath}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
