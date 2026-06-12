/**
 * shard-loader.ts — Runtime loader for pre-computed category index shards.
 *
 * Shards are built by the pipeline (scripts/) and live in public/indexes/templates/ and public/indexes/sections/
 * as {category}.json + {category}.json.gz. Each template carries its 384-dim
 * embedding as a base64-encoded Float32Array, computed at BUILD time as
 * avg(phrasing embeddings + description embedding).
 *
 * The loader:
 *   - fetches a shard by category (gzip first, plain fallback)
 *   - decodes base64 → Float32Array (NEVER re-embeds at runtime)
 *   - bulk-inserts into PGlite in one transaction
 *   - skips categories that are already loaded (tracked in PGlite, so the
 *     skip survives page reloads via IndexedDB)
 */

import { bulkInsertTemplates, bulkInsertSections, isShardLoaded, markShardLoaded } from './db'
import type { ShardTemplateRow, SectionShardRow } from './db'

interface ShardedTemplateJson {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  code: string
  phrasings: string[]
  embedding: string          // base64(Float32Array bytes, little-endian)
}

interface ShardJson {
  category: string
  count: number
  templates: ShardedTemplateJson[]
}

const EMBEDDING_DIM = 384

/** base64 → Float32Array (no re-embedding, just bytes). */
export function decodeEmbedding(b64: string): Float32Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Float32Array(bytes.buffer)
}

async function fetchShard(category: string): Promise<ShardJson | null> {
  // Prefer the gzipped artifact; fall back to plain JSON
  try {
    const res = await fetch(`/indexes/templates/${category}.json.gz`)
    if (res.ok && res.body && typeof DecompressionStream !== 'undefined') {
      const stream = res.body.pipeThrough(new DecompressionStream('gzip'))
      const text = await new Response(stream).text()
      return JSON.parse(text) as ShardJson
    }
  } catch { /* fall through to plain */ }

  try {
    const res = await fetch(`/indexes/templates/${category}.json`)
    if (!res.ok) return null
    return await res.json() as ShardJson
  } catch {
    return null
  }
}

// In-flight dedup so concurrent searches don't double-load a category
const inFlight = new Map<string, Promise<number>>()

/**
 * Load one category shard into PGlite. Returns the number of templates
 * inserted (0 if already loaded or shard unavailable).
 */
export async function loadCategoryShard(category: string): Promise<number> {
  const existing = inFlight.get(category)
  if (existing) return existing

  const task = (async () => {
    if (await isShardLoaded(category)) return 0

    const shard = await fetchShard(category)
    if (!shard || !Array.isArray(shard.templates)) return 0

    const rows: ShardTemplateRow[] = []
    for (const t of shard.templates) {
      const embedding = decodeEmbedding(t.embedding)
      if (embedding.length !== EMBEDDING_DIM) continue    // corrupt entry — skip, don't poison the index
      rows.push({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags ?? [],
        code: t.code,
        phrasings: t.phrasings ?? [],
        embedding,
      })
    }

    if (rows.length > 0) await bulkInsertTemplates(rows)
    await markShardLoaded(category, rows.length)
    return rows.length
  })()

  inFlight.set(category, task)
  try {
    return await task
  } finally {
    inFlight.delete(category)
  }
}

/** Load several category shards (e.g. ahead of a broad search). */
export async function loadCategoryShards(categories: string[]): Promise<number> {
  const counts = await Promise.all(categories.map(loadCategoryShard))
  return counts.reduce((s, n) => s + n, 0)
}

interface SectionShardJson {
  category: string   // section-type
  count: number
  templates: Array<{
    id: string; name: string; description: string; category: string
    tags: string[]; code: string; phrasings: string[]
    sectionType?: string; embedding: string
  }>
}

async function fetchSectionShard(type: string): Promise<SectionShardJson | null> {
  try {
    const res = await fetch(`/indexes/sections/${type}.json.gz`)
    if (res.ok && res.body && typeof DecompressionStream !== 'undefined') {
      const stream = res.body.pipeThrough(new DecompressionStream('gzip'))
      return JSON.parse(await new Response(stream).text()) as SectionShardJson
    }
  } catch { /* fall through */ }
  try {
    const res = await fetch(`/indexes/sections/${type}.json`)
    if (!res.ok) return null
    return await res.json() as SectionShardJson
  } catch { return null }
}

const sectionInFlight = new Map<string, Promise<number>>()

/** Load one section-type shard into section_embeddings (pre-computed vectors). */
export async function loadSectionShard(type: string): Promise<number> {
  const key = `section:${type}`
  const existing = sectionInFlight.get(key)
  if (existing) return existing
  const task = (async () => {
    if (await isShardLoaded(key)) return 0
    const shard = await fetchSectionShard(type)
    if (!shard || !Array.isArray(shard.templates)) return 0
    const rows: SectionShardRow[] = []
    for (const t of shard.templates) {
      const embedding = decodeEmbedding(t.embedding)
      if (embedding.length !== EMBEDDING_DIM) continue
      rows.push({
        id: t.id, name: t.name, description: t.description,
        category: t.sectionType ?? t.category, code: t.code, embedding,
      })
    }
    if (rows.length > 0) await bulkInsertSections(rows)
    await markShardLoaded(key, rows.length)
    return rows.length
  })()
  sectionInFlight.set(key, task)
  try { return await task } finally { sectionInFlight.delete(key) }
}

/** Load every section-type shard listed in the sections manifest. */
export async function loadAllSectionShards(): Promise<number> {
  let types: string[] = []
  try {
    const res = await fetch('/indexes/sections/manifest.json')
    if (res.ok) {
      const m = await res.json() as { shards?: Array<{ category: string }> }
      types = (m.shards ?? []).map(s => s.category)
    }
  } catch { /* no manifest — nothing to load */ }
  const counts = await Promise.all(types.map(loadSectionShard))
  return counts.reduce((s, n) => s + n, 0)
}
