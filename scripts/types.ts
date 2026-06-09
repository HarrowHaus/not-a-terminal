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
}

// --- Enrichment output (Claude Haiku) ---

export interface EnrichedTemplate extends CrawledTemplate {
  description: string                  // 2-3 sentence Claude-written description
  phrasings: string[]                  // 8-12 ways a user might ask for this
  category: string                     // one of CATEGORIES
  tags: string[]
  sections: string[]                   // e.g. ['hero', 'features', 'cta']
  fields: TemplateField[]
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'color' | 'toggle' | 'select'
  default: string | boolean
}

// --- Embedding output ---

export interface EmbeddedTemplate extends EnrichedTemplate {
  embedding: number[]                  // 384-dim vector from all-MiniLM-L6-v2
}

// --- Shard output ---

export interface IndexShard {
  category: string
  count: number
  templates: EmbeddedTemplate[]
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
