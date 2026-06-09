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
    `SELECT id, name, description, category, tags,
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
