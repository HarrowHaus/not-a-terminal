import type { SectionEntry, SectionResult } from './types'
import { embed, embedBatch } from './retrieval'
import { insertSectionEmbedding, searchSectionsByVector, getSectionCount } from './db'

let indexed = false

export async function indexSections(entries: SectionEntry[]): Promise<void> {
  if (indexed) return

  const count = await getSectionCount()
  if (count >= entries.length) {
    indexed = true
    return
  }

  const descriptions = entries.map((e) => e.description)
  const vectors = await embedBatch(descriptions)

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    await insertSectionEmbedding(
      e.id,
      e.name,
      e.description,
      e.category,
      e.code,
      vectors[i],
    )
  }

  indexed = true
}

export async function searchSection(query: string, limit: number = 3): Promise<SectionResult[]> {
  const queryVec = await embed(query)
  const rows = await searchSectionsByVector(queryVec, limit)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    code: r.code,
    similarity: r.similarity,
  }))
}
