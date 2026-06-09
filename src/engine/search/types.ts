import type { TransformIntent } from '../ast/types'

export interface SearchResult {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  similarity: number
}

export interface ActionResult {
  id: string
  description: string
  actionType: string
  intent: TransformIntent
  similarity: number
}

export interface SectionResult {
  id: string
  name: string
  description: string
  category: string
  code: string
  similarity: number
}

export interface ActionEntry {
  id: string
  description: string
  actionType: string
  intent: TransformIntent
}

export interface SectionEntry {
  id: string
  name: string
  description: string
  category: string
  code: string
}
