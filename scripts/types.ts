/**
 * Pipeline types — shared across all build-time scripts.
 *
 * Data flows: crawl → enrich → embed → shard → public/indexes/
 */

// --- Crawl output ---

export interface CrawledTemplate {
  id: string
  source: string                       // library name (hyperui, preline, shadcn, etc.)
  name: string
  code: string                         // raw JSX or converted JSX
  originalFormat: 'jsx' | 'tsx' | 'html'
  sourceUrl?: string
  license: string | null               // SPDX id from GitHub API / registry repo (null = unknown → rejected at gate)
}

/** Licenses allowed to ship in the index. Checked in build-index.ts. */
export const ALLOWED_LICENSES = [
  'MIT', 'Apache-2.0', 'ISC',
  'BSD-2-Clause', 'BSD-3-Clause', '0BSD',
] as const

export function isAllowedLicense(license: string | null | undefined): boolean {
  if (!license) return false
  return (ALLOWED_LICENSES as readonly string[]).includes(license)
}

// --- Enrichment output (template-enricher sub-agent, Sonnet) ---

export interface EnrichedTemplate extends CrawledTemplate {
  description: string                  // 2-3 sentence agent-written description
  phrasings: string[]                  // 8-12 ways a user might ask for this
  category: string                     // one of CATEGORIES
  tags: string[]
  sections: string[]                   // e.g. ['hero', 'features', 'cta']
  fields: TemplateField[]
  enrichedBy: 'agent' | 'mock'         // provenance — 'mock' may NEVER enter a production index
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'color' | 'toggle' | 'image' | 'list' | 'select'
  default: string | boolean
  selector?: string                    // CSS selector / section ref from the enricher
}

/**
 * Raw output of the template-enricher sub-agent: one object per template,
 * returned as a JSON array per batch. `id` must echo the input template id
 * so merge can realign outputs with inputs.
 */
export interface AgentEnrichment {
  id: string
  description: string
  phrasings: string[]
  category: string
  tags: string[]
  sections: string[]
  fields: Record<string, { default: string; selector?: string; type: string }>
}

// --- Embedding output ---

export interface EmbeddedTemplate extends EnrichedTemplate {
  embedding: number[]                  // 384-dim vector from all-MiniLM-L6-v2
}

// --- Shard output ---

/**
 * Template as stored in a shard JSON: the 384-dim embedding is a
 * base64-encoded Float32Array (little-endian), NOT a raw float array —
 * raw JSON floats are ~4x larger on disk.
 */
export interface ShardedTemplate extends Omit<EmbeddedTemplate, 'embedding'> {
  embedding: string                    // base64(Float32Array(384) bytes)
}

export interface IndexShard {
  category: string
  count: number
  templates: ShardedTemplate[]
}

export function encodeEmbedding(vec: number[]): string {
  return Buffer.from(new Float32Array(vec).buffer).toString('base64')
}

// --- Action index ---

export interface ActionIndexEntry {
  id: string
  description: string
  phrasings: string[]
  actionType: string
  target: string
  properties: Record<string, string | string[]>
  embedding: number[]
}

// --- Section index ---

export interface SectionIndexEntry {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  code: string
  embedding: number[]
}

// --- Constants ---

export const CATEGORIES = [
  'landing-page', 'dashboard', 'blog', 'portfolio', 'saas',
  'ecommerce', 'restaurant', 'docs', 'api', 'admin',
  'creative-agency', 'photography', 'freelancer', 'event',
  'personal', 'fitness', 'medical', 'education', 'wedding',
  'music', 'real-estate',
] as const

export type Category = (typeof CATEGORIES)[number]

export const SECTION_TYPES = [
  'hero', 'pricing', 'testimonials', 'features', 'cta',
  'faq', 'footer', 'contact', 'team', 'stats',
  'newsletter', 'gallery', 'about', 'header', 'nav',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]
