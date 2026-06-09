import type { SearchResult } from './types'
import type { Template } from '../../data/templates/types'
import { insertEmbedding, searchByVector, getEmbeddingCount } from './db'

let worker: Worker | null = null
let workerReady: Promise<void> | null = null
const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
let onProgress: ((msg: string) => void) | null = null

function getWorker(): Worker {
  if (worker) return worker

  worker = new Worker(new URL('./embedding.worker.ts', import.meta.url), { type: 'module' })

  let resolveReady: () => void
  let rejectReady: (e: Error) => void

  workerReady = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })

  const timeout = setTimeout(() => rejectReady(new Error('Embedding model load timeout')), 120_000)

  worker.onmessage = (e: MessageEvent) => {
    const { type, id } = e.data

    if (type === 'ready') {
      clearTimeout(timeout)
      resolveReady()
      return
    }
    if (type === 'progress') {
      onProgress?.(e.data.message)
      return
    }
    if (type === 'error' && id === 'init') {
      clearTimeout(timeout)
      rejectReady(new Error(e.data.error))
      return
    }

    const p = pending.get(id)
    if (!p) return
    pending.delete(id)

    if (type === 'error') {
      p.reject(new Error(e.data.error))
    } else if (type === 'embedded') {
      p.resolve(e.data.vector)
    } else if (type === 'embedded-batch') {
      p.resolve(e.data.vectors)
    }
  }

  return worker
}

export async function embed(text: string): Promise<number[]> {
  getWorker()
  await workerReady

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    worker!.postMessage({ type: 'embed', id, text })
  })
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  getWorker()
  await workerReady

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    worker!.postMessage({ type: 'embed-batch', id, texts })
  })
}

let indexed = false

export async function indexTemplates(templates: Template[]): Promise<void> {
  if (indexed) return

  const count = await getEmbeddingCount()
  if (count >= templates.length) {
    indexed = true
    return
  }

  onProgress?.('Embedding templates...')
  const descriptions = templates.map((t) => t.description)
  const vectors = await embedBatch(descriptions)

  onProgress?.('Storing in index...')
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i]
    await insertEmbedding(t.id, t.name, t.description, t.category, t.tags, vectors[i])
  }

  indexed = true
}

export async function search(query: string, limit: number = 5): Promise<SearchResult[]> {
  const queryVec = await embed(query)
  const rows = await searchByVector(queryVec, limit)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    tags: JSON.parse(r.tags) as string[],
    similarity: r.similarity,
  }))
}

export function setProgressCallback(cb: (msg: string) => void): void {
  onProgress = cb
}
