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
