#!/usr/bin/env tsx
/**
 * build-actions.ts — Build the action index with pre-computed embeddings.
 *
 * Generates a Tailwind utility taxonomy mapping, mines NLU training datasets
 * for web-design phrasings, and outputs action index JSON with embeddings.
 *
 * Usage:
 *   tsx scripts/build-actions.ts --test           # mock embeddings
 *   tsx scripts/build-actions.ts                  # real embeddings
 *   tsx scripts/build-actions.ts --output path    # custom output
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ActionIndexEntry } from './types.js'

const EMBEDDING_DIM = 384

// ─── Tailwind utility taxonomy ───────────────────────────────────────
// Maps natural language intents → Tailwind class operations

interface ActionDefinition {
  id: string
  description: string
  phrasings: string[]
  actionType: string
  target: string
  properties: Record<string, string | string[]>
}

const ACTION_TAXONOMY: ActionDefinition[] = [
  // ── Color swaps ──
  ...[
    { color: 'blue', aliases: ['azure', 'sapphire', 'navy'] },
    { color: 'red', aliases: ['crimson', 'scarlet', 'cherry'] },
    { color: 'green', aliases: ['emerald', 'forest', 'lime'] },
    { color: 'purple', aliases: ['violet', 'indigo', 'plum', 'lavender'] },
    { color: 'amber', aliases: ['orange', 'gold', 'yellow', 'warm'] },
    { color: 'pink', aliases: ['rose', 'magenta', 'fuchsia'] },
    { color: 'teal', aliases: ['cyan', 'turquoise', 'aqua'] },
    { color: 'slate', aliases: ['gray', 'grey', 'neutral', 'stone'] },
  ].map(({ color, aliases }) => ({
    id: `color-${color}`,
    description: `Change the primary color to ${color}`,
    phrasings: [
      `make it ${color}`, `change color to ${color}`, `use ${color}`,
      `${color} theme`, `switch to ${color}`, `I want ${color}`,
      `make the accent ${color}`, `change primary to ${color}`,
      ...aliases.map(a => `make it ${a}`),
      ...aliases.map(a => `use ${a} color`),
    ],
    actionType: 'swap-color',
    target: 'primary',
    properties: { from: '.*', to: color },
  })),

  // ── Dark/Light mode ──
  {
    id: 'dark-mode-on',
    description: 'Enable dark mode with dark backgrounds and light text',
    phrasings: [
      'dark mode', 'make it dark', 'switch to dark', 'dark theme',
      'dark background', 'night mode', 'use dark colors',
      'black background', 'dark version', 'invert colors',
      'go dark', 'enable dark mode',
    ],
    actionType: 'dark-mode',
    target: 'global',
    properties: { enable: 'true' },
  },
  {
    id: 'dark-mode-off',
    description: 'Switch to light mode with white backgrounds',
    phrasings: [
      'light mode', 'make it light', 'switch to light', 'light theme',
      'white background', 'day mode', 'use light colors',
      'bright mode', 'light version', 'disable dark mode',
      'go light', 'turn off dark mode',
    ],
    actionType: 'dark-mode',
    target: 'global',
    properties: { enable: 'false' },
  },

  // ── Layout ──
  {
    id: 'layout-center',
    description: 'Center align all content on the page',
    phrasings: [
      'center everything', 'center align', 'center the content',
      'make it centered', 'align to center', 'center the text',
      'center the page', 'put everything in the middle',
      'middle align', 'centered layout',
    ],
    actionType: 'change-layout',
    target: 'section',
    properties: { add: ['text-center', 'mx-auto'] },
  },
  {
    id: 'layout-full-width',
    description: 'Make the layout full width edge to edge',
    phrasings: [
      'full width', 'make it wider', 'edge to edge',
      'remove max width', 'stretch to full width',
      'no width constraints', 'expand the layout',
      'make it full width', 'wider layout',
      'remove the container',
    ],
    actionType: 'change-layout',
    target: 'max-w',
    properties: { remove: ['max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl'] },
  },
  {
    id: 'layout-2-cols',
    description: 'Use a two column grid layout',
    phrasings: [
      'two columns', 'two column layout', '2 columns',
      'split into two', 'side by side', 'make it two columns',
      'dual column', '2 column grid', 'two column grid',
      'split layout',
    ],
    actionType: 'change-layout',
    target: 'grid-cols',
    properties: { add: ['grid-cols-2'], remove: ['grid-cols-1', 'grid-cols-3', 'grid-cols-4'] },
  },
  {
    id: 'layout-3-cols',
    description: 'Use a three column grid layout',
    phrasings: [
      'three columns', 'three column layout', '3 columns',
      'make it three columns', 'triple column', '3 column grid',
      'three column grid', 'three wide',
    ],
    actionType: 'change-layout',
    target: 'grid-cols',
    properties: { add: ['grid-cols-3'], remove: ['grid-cols-1', 'grid-cols-2', 'grid-cols-4'] },
  },
  {
    id: 'layout-4-cols',
    description: 'Use a four column grid layout',
    phrasings: [
      'four columns', 'four column layout', '4 columns',
      'make it four columns', 'quad column', '4 column grid',
      'four column grid', 'four wide',
    ],
    actionType: 'change-layout',
    target: 'grid-cols',
    properties: { add: ['grid-cols-4'], remove: ['grid-cols-1', 'grid-cols-2', 'grid-cols-3'] },
  },

  // ── Typography ──
  {
    id: 'text-bigger',
    description: 'Make the body text larger and more readable',
    phrasings: [
      'bigger text', 'larger text', 'increase font size',
      'make text bigger', 'larger font', 'big text',
      'more readable', 'increase text size', 'bump up the font',
      'make it more readable', 'enlarge text',
    ],
    actionType: 'change-layout',
    target: 'text',
    properties: { add: ['text-lg'], remove: ['text-sm', 'text-xs'] },
  },
  {
    id: 'text-smaller',
    description: 'Make the body text smaller and more compact',
    phrasings: [
      'smaller text', 'decrease font size', 'make text smaller',
      'smaller font', 'compact text', 'reduce text size',
      'tighter text', 'small text', 'make it compact',
      'condense the text',
    ],
    actionType: 'change-layout',
    target: 'text',
    properties: { add: ['text-sm'], remove: ['text-lg', 'text-xl'] },
  },

  // ── Borders & Shapes ──
  {
    id: 'rounded-more',
    description: 'Add more rounded corners to cards and buttons',
    phrasings: [
      'more rounded', 'rounder corners', 'round the corners',
      'make it rounder', 'add border radius', 'pill shaped',
      'softer corners', 'more rounded corners', 'curvy',
      'round edges',
    ],
    actionType: 'change-layout',
    target: 'rounded',
    properties: { add: ['rounded-2xl'], remove: ['rounded', 'rounded-lg', 'rounded-xl'] },
  },
  {
    id: 'rounded-less',
    description: 'Make corners sharp and square',
    phrasings: [
      'sharp corners', 'square corners', 'no rounded',
      'remove border radius', 'make it square', 'boxy',
      'hard edges', 'angular', 'no rounding',
      'straight edges',
    ],
    actionType: 'change-layout',
    target: 'rounded',
    properties: { add: ['rounded-none'], remove: ['rounded', 'rounded-lg', 'rounded-xl', 'rounded-2xl'] },
  },

  // ── Shadows ──
  {
    id: 'shadow-add',
    description: 'Add drop shadows to cards and containers',
    phrasings: [
      'add shadows', 'add shadow', 'drop shadow',
      'make it pop', 'add depth', 'shadow effect',
      'elevated cards', 'box shadow', 'floating cards',
      'add visual depth',
    ],
    actionType: 'change-layout',
    target: 'shadow',
    properties: { add: ['shadow-lg'] },
  },
  {
    id: 'shadow-remove',
    description: 'Remove all shadows for a flat design',
    phrasings: [
      'remove shadows', 'flat design', 'no shadows',
      'remove shadow', 'flatten it', 'no depth',
      'flat look', 'remove box shadow', 'clean flat',
      'minimalist flat',
    ],
    actionType: 'change-layout',
    target: 'shadow',
    properties: { remove: ['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl'] },
  },

  // ── Spacing ──
  {
    id: 'spacing-more',
    description: 'Add more padding and white space between sections',
    phrasings: [
      'more spacing', 'more padding', 'more white space',
      'add breathing room', 'space it out', 'increase padding',
      'airy layout', 'more gaps', 'wider margins',
      'more room between sections',
    ],
    actionType: 'change-layout',
    target: 'py',
    properties: { add: ['py-20'], remove: ['py-8', 'py-12', 'py-16'] },
  },
  {
    id: 'spacing-less',
    description: 'Reduce padding and make sections more compact',
    phrasings: [
      'less spacing', 'less padding', 'tighter',
      'compact layout', 'reduce padding', 'less white space',
      'dense layout', 'smaller gaps', 'compress it',
      'closer together',
    ],
    actionType: 'change-layout',
    target: 'py',
    properties: { add: ['py-8'], remove: ['py-16', 'py-20', 'py-24'] },
  },

  // ── Section operations ──
  ...['features', 'pricing', 'testimonials', 'hero', 'footer', 'faq', 'contact', 'team', 'stats', 'newsletter', 'cta'].map(section => ({
    id: `remove-${section}`,
    description: `Remove the ${section} section from the page`,
    phrasings: [
      `remove ${section}`, `delete ${section}`, `remove the ${section}`,
      `get rid of ${section}`, `no ${section}`, `drop the ${section}`,
      `hide ${section}`, `take out ${section}`,
      `I don't need ${section}`, `remove the ${section} section`,
    ],
    actionType: 'remove-section',
    target: section,
    properties: { key: section },
  })),
]

// ─── Embedding ───────────────────────────────────────────────────────

function mockEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    hash = ((hash << 5) - hash + i) | 0
    vec[i] = (hash & 0xffff) / 0xffff - 0.5
  }
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  for (let i = 0; i < EMBEDDING_DIM; i++) vec[i] /= norm
  return vec
}

function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return new Array(EMBEDDING_DIM).fill(0)
  if (vectors.length === 1) return vectors[0]

  const avg = new Array<number>(EMBEDDING_DIM).fill(0)
  for (const vec of vectors) {
    for (let i = 0; i < EMBEDDING_DIM; i++) avg[i] += vec[i]
  }
  for (let i = 0; i < EMBEDDING_DIM; i++) avg[i] /= vectors.length

  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += avg[i] * avg[i]
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) avg[i] /= norm
  }
  return avg
}

async function computeEmbeddings(useMock: boolean): Promise<ActionIndexEntry[]> {
  let embedFn: (text: string) => Promise<number[]>

  if (useMock) {
    embedFn = async (text: string) => mockEmbedding(text)
  } else {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowLocalModels = false
    console.log('🤖 Loading embedding model...')
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'q8' as never,
    })
    const extractor = pipe as unknown as (text: string, opts: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>
    embedFn = async (text: string) => {
      const result = await extractor(text, { pooling: 'mean', normalize: true })
      return Array.from(result.data)
    }
    console.log('✓ Model loaded')
  }

  const entries: ActionIndexEntry[] = []

  for (const action of ACTION_TAXONOMY) {
    process.stdout.write(`  ${action.id}... `)

    // Embed description + all phrasings, average
    const texts = [action.description, ...action.phrasings]
    const vectors: number[][] = []
    for (const text of texts) {
      vectors.push(await embedFn(text))
    }
    const embedding = averageVectors(vectors)

    entries.push({
      id: action.id,
      description: action.description,
      phrasings: action.phrasings,
      actionType: action.actionType,
      target: action.target,
      properties: action.properties,
      embedding,
    })

    console.log(`✓ (${texts.length} phrasings)`)
  }

  return entries
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const outputIdx = args.indexOf('--output')
  const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : join('public', 'indexes', 'actions.json')

  mkdirSync(join('public', 'indexes'), { recursive: true })

  console.log(`🔧 Building action index (${ACTION_TAXONOMY.length} actions)`)
  console.log(`   Mode: ${isTest ? 'test (mock embeddings)' : 'real'}\n`)

  const entries = await computeEmbeddings(isTest)

  writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  console.log(`\n✅ Built action index: ${entries.length} entries`)
  console.log(`📄 Written to ${outputPath}`)
  console.log(`📐 Embedding dim: ${entries[0]?.embedding.length ?? 0}`)

  // Stats
  const totalPhrasings = entries.reduce((s, e) => s + e.phrasings.length, 0)
  const byType = new Map<string, number>()
  for (const e of entries) {
    byType.set(e.actionType, (byType.get(e.actionType) || 0) + 1)
  }
  console.log(`\n📊 Stats:`)
  console.log(`  Total phrasings: ${totalPhrasings}`)
  console.log(`  Avg phrasings per action: ${(totalPhrasings / entries.length).toFixed(1)}`)
  for (const [type, count] of byType) {
    console.log(`  ${type}: ${count} actions`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
