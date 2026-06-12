import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'

let db: PGlite | null = null
let initPromise: Promise<PGlite> | null = null

export async function getDB(): Promise<PGlite> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    const instance = new PGlite({
      dataDir: 'idb://not-a-terminal',
      extensions: { vector },
    })

    await instance.exec('CREATE EXTENSION IF NOT EXISTS vector')
    await instance.exec(`
      CREATE TABLE IF NOT EXISTS template_embeddings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        embedding vector(384)
      )
    `)

    // Columns added after v1 — safe on existing IndexedDB databases
    await instance.exec(`
      ALTER TABLE template_embeddings ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';
      ALTER TABLE template_embeddings ADD COLUMN IF NOT EXISTS phrasings TEXT NOT NULL DEFAULT '[]';
    `)

    // HNSW index so searchByVector's <=> scans stay fast at thousands of rows
    await instance.exec(`
      CREATE INDEX IF NOT EXISTS template_embeddings_hnsw
      ON template_embeddings USING hnsw (embedding vector_cosine_ops)
    `)

    // Tracks which category shards have been bulk-loaded (persists in IndexedDB)
    await instance.exec(`
      CREATE TABLE IF NOT EXISTS loaded_shards (
        category TEXT PRIMARY KEY,
        count INT NOT NULL,
        loaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    await instance.exec(`
      CREATE TABLE IF NOT EXISTS action_embeddings (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        action_type TEXT NOT NULL,
        intent_json TEXT NOT NULL,
        embedding vector(384)
      )
    `)

    await instance.exec(`
      CREATE TABLE IF NOT EXISTS section_embeddings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        code TEXT NOT NULL,
        embedding vector(384)
      )
    `)

    await instance.exec(`
      CREATE INDEX IF NOT EXISTS section_embeddings_hnsw
      ON section_embeddings USING hnsw (embedding vector_cosine_ops)
    `)

    db = instance
    return instance
  })()

  return initPromise
}

export interface TemplateRow {
  id: string
  name: string
  description: string
  category: string
  tags: string
  code: string
  similarity: number
}

export async function insertEmbedding(
  id: string,
  name: string,
  description: string,
  category: string,
  tags: string[],
  embedding: number[],
): Promise<void> {
  const pg = await getDB()
  const vecStr = `[${embedding.join(',')}]`
  await pg.query(
    `INSERT INTO template_embeddings (id, name, description, category, tags, embedding)
     VALUES ($1, $2, $3, $4, $5, $6::vector)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       category = EXCLUDED.category,
       tags = EXCLUDED.tags,
       embedding = EXCLUDED.embedding`,
    [id, name, description, category, JSON.stringify(tags), vecStr],
  )
}

export async function searchByVector(queryVec: number[], limit: number = 5): Promise<TemplateRow[]> {
  const pg = await getDB()
  const vecStr = `[${queryVec.join(',')}]`
  const result = await pg.query<TemplateRow>(
    `SELECT id, name, description, category, tags, code,
            1 - (embedding <=> $1::vector) AS similarity
     FROM template_embeddings
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vecStr, limit],
  )
  return result.rows
}

export async function getEmbeddingCount(): Promise<number> {
  const pg = await getDB()
  const result = await pg.query<{ count: string }>('SELECT COUNT(*)::text as count FROM template_embeddings')
  return parseInt(result.rows[0].count, 10)
}

// --- Shard bulk loading (pre-computed vectors — never re-embed at runtime) ---

export interface ShardTemplateRow {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  code: string
  phrasings: string[]
  embedding: Float32Array
}

/** Bulk-insert shard templates with their pre-computed vectors, one transaction. */
export async function bulkInsertTemplates(rows: ShardTemplateRow[]): Promise<void> {
  const pg = await getDB()
  await pg.transaction(async (tx) => {
    for (const r of rows) {
      const vecStr = `[${Array.from(r.embedding).join(',')}]`
      await tx.query(
        `INSERT INTO template_embeddings (id, name, description, category, tags, code, phrasings, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           tags = EXCLUDED.tags,
           code = EXCLUDED.code,
           phrasings = EXCLUDED.phrasings,
           embedding = EXCLUDED.embedding`,
        [r.id, r.name, r.description, r.category, JSON.stringify(r.tags), r.code, JSON.stringify(r.phrasings), vecStr],
      )
    }
  })
}

export async function isShardLoaded(category: string): Promise<boolean> {
  const pg = await getDB()
  const result = await pg.query<{ count: number }>(
    'SELECT count FROM loaded_shards WHERE category = $1', [category],
  )
  return result.rows.length > 0
}

export async function markShardLoaded(category: string, count: number): Promise<void> {
  const pg = await getDB()
  await pg.query(
    `INSERT INTO loaded_shards (category, count) VALUES ($1, $2)
     ON CONFLICT (category) DO UPDATE SET count = EXCLUDED.count, loaded_at = now()`,
    [category, count],
  )
}

export interface SectionShardRow {
  id: string
  name: string
  description: string
  category: string   // section-type
  code: string
  embedding: Float32Array
}

/** Bulk-insert section shard rows with pre-computed vectors, one transaction. */
export async function bulkInsertSections(rows: SectionShardRow[]): Promise<void> {
  const pg = await getDB()
  await pg.transaction(async (tx) => {
    for (const r of rows) {
      const vecStr = `[${Array.from(r.embedding).join(',')}]`
      await tx.query(
        `INSERT INTO section_embeddings (id, name, description, category, code, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           code = EXCLUDED.code,
           embedding = EXCLUDED.embedding`,
        [r.id, r.name, r.description, r.category, r.code, vecStr],
      )
    }
  })
}

// --- Action embeddings ---

export interface ActionRow {
  id: string
  description: string
  action_type: string
  intent_json: string
  similarity: number
}

export async function insertActionEmbedding(
  id: string,
  description: string,
  actionType: string,
  intentJson: string,
  embedding: number[],
): Promise<void> {
  const pg = await getDB()
  const vecStr = `[${embedding.join(',')}]`
  await pg.query(
    `INSERT INTO action_embeddings (id, description, action_type, intent_json, embedding)
     VALUES ($1, $2, $3, $4, $5::vector)
     ON CONFLICT (id) DO UPDATE SET
       description = EXCLUDED.description,
       action_type = EXCLUDED.action_type,
       intent_json = EXCLUDED.intent_json,
       embedding = EXCLUDED.embedding`,
    [id, description, actionType, intentJson, vecStr],
  )
}

export async function searchActionsByVector(queryVec: number[], limit: number = 3): Promise<ActionRow[]> {
  const pg = await getDB()
  const vecStr = `[${queryVec.join(',')}]`
  const result = await pg.query<ActionRow>(
    `SELECT id, description, action_type, intent_json,
            1 - (embedding <=> $1::vector) AS similarity
     FROM action_embeddings
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vecStr, limit],
  )
  return result.rows
}

export async function getActionCount(): Promise<number> {
  const pg = await getDB()
  const result = await pg.query<{ count: string }>('SELECT COUNT(*)::text as count FROM action_embeddings')
  return parseInt(result.rows[0].count, 10)
}

// --- Section embeddings ---

export interface SectionRow {
  id: string
  name: string
  description: string
  category: string
  code: string
  similarity: number
}

export async function insertSectionEmbedding(
  id: string,
  name: string,
  description: string,
  category: string,
  code: string,
  embedding: number[],
): Promise<void> {
  const pg = await getDB()
  const vecStr = `[${embedding.join(',')}]`
  await pg.query(
    `INSERT INTO section_embeddings (id, name, description, category, code, embedding)
     VALUES ($1, $2, $3, $4, $5, $6::vector)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       category = EXCLUDED.category,
       code = EXCLUDED.code,
       embedding = EXCLUDED.embedding`,
    [id, name, description, category, code, vecStr],
  )
}

export async function searchSectionsByVector(queryVec: number[], limit: number = 3): Promise<SectionRow[]> {
  const pg = await getDB()
  const vecStr = `[${queryVec.join(',')}]`
  const result = await pg.query<SectionRow>(
    `SELECT id, name, description, category, code,
            1 - (embedding <=> $1::vector) AS similarity
     FROM section_embeddings
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vecStr, limit],
  )
  return result.rows
}

export async function getSectionCount(): Promise<number> {
  const pg = await getDB()
  const result = await pg.query<{ count: string }>('SELECT COUNT(*)::text as count FROM section_embeddings')
  return parseInt(result.rows[0].count, 10)
}
