import type { ActionEntry, ActionResult } from './types'
import type { TransformIntent } from '../ast/types'
import { embed, embedBatch } from './retrieval'
import { insertActionEmbedding, searchActionsByVector, getActionCount } from './db'

let indexed = false

export async function indexActions(entries: ActionEntry[]): Promise<void> {
  if (indexed) return

  const count = await getActionCount()
  if (count >= entries.length) {
    indexed = true
    return
  }

  const descriptions = entries.map((e) => e.description)
  const vectors = await embedBatch(descriptions)

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    await insertActionEmbedding(
      e.id,
      e.description,
      e.actionType,
      JSON.stringify(e.intent),
      vectors[i],
    )
  }

  indexed = true
}

export async function searchAction(query: string, limit: number = 3): Promise<ActionResult[]> {
  const queryVec = await embed(query)
  const rows = await searchActionsByVector(queryVec, limit)

  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    actionType: r.action_type,
    intent: JSON.parse(r.intent_json) as TransformIntent,
    similarity: r.similarity,
  }))
}
