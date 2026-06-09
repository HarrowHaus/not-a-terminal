import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false

// Transformers.js pipeline overloads are too complex for TS inference
type Extractor = { (text: string, opts: { pooling: string; normalize: boolean }): Promise<{ data: Float32Array }> }
let extractor: Extractor | null = null

async function getExtractor(): Promise<Extractor> {
  if (extractor) return extractor
  self.postMessage({ type: 'progress', message: 'Loading embedding model...' })
  const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' })
  extractor = pipe as unknown as Extractor
  return extractor
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id } = e.data

  try {
    if (type === 'embed') {
      const ext = await getExtractor()
      const output = await ext(e.data.text, { pooling: 'mean', normalize: true })
      const vector = Array.from(output.data)
      self.postMessage({ type: 'embedded', id, vector })
    }

    if (type === 'embed-batch') {
      const ext = await getExtractor()
      const vectors: number[][] = []
      for (const text of e.data.texts as string[]) {
        const output = await ext(text, { pooling: 'mean', normalize: true })
        vectors.push(Array.from(output.data))
      }
      self.postMessage({ type: 'embedded-batch', id, vectors })
    }
  } catch (err) {
    self.postMessage({ type: 'error', id, error: err instanceof Error ? err.message : String(err) })
  }
}

getExtractor()
  .then(() => self.postMessage({ type: 'ready' }))
  .catch((err) =>
    self.postMessage({ type: 'error', id: 'init', error: err instanceof Error ? err.message : String(err) }),
  )
