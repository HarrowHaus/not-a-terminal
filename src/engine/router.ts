/**
 * router.ts — Orchestrates user input through the three-index engine.
 *
 * One decision tree, no generative AI:
 *   1. Composition request ("hero + pricing + footer")    → compositor
 *   2. Modification clauses (template already selected)    → clause-splitter →
 *      action-search / section-search → caller applies via AST
 *   3. Anything else                                       → template retrieval
 *      (lazily loads category shards inferred from the query, then cosine search)
 *
 * Confidence contract (template retrieval):
 *   similarity > 0.6   → use the match
 *   0.4 – 0.6          → top-3 "did you mean" suggestions
 *   < 0.4              → suggest browsing the gallery
 *
 * The router is pure engine: it reads indexes and returns a RouteResult.
 * Applying the result (stores, preview, AST edits) is the caller's job.
 */

import type { SearchResult } from './search/types'
import type { TransformIntent } from './ast/types'
import { search } from './search/retrieval'
import { searchAction } from './search/action-search'
import { searchSection } from './search/section-search'
import { splitClauses } from './search/clause-splitter'
import { composePage, parseCompositionRequest } from './search/compositor'
import { loadCategoryShards } from './search/shard-loader'

export const HIGH_CONFIDENCE = 0.6
export const LOW_CONFIDENCE = 0.4
const CLAUSE_FLOOR = 0.4
const INTENT_BOOST = 0.1

// ─── Result types ────────────────────────────────────────────────────

export type ClauseRoute =
  | { clause: string; kind: 'action'; description: string; similarity: number; intent: TransformIntent }
  | { clause: string; kind: 'section'; name: string; similarity: number; code: string }
  | { clause: string; kind: 'none' }

export type RouteResult =
  | { kind: 'composition'; code: string; sections: Array<{ name: string; similarity: number }> }
  | { kind: 'modifications'; clauses: ClauseRoute[] }
  | { kind: 'template'; match: SearchResult }
  | { kind: 'suggestions'; options: SearchResult[] }
  | { kind: 'gallery'; best?: SearchResult }

export interface RouteContext {
  /** Is a template currently selected (modification mode)? */
  templateSelected: boolean
}

// ─── Category shard inference (progressive loading, rule 7) ──────────

const CATEGORY_HINTS: Record<string, string[]> = {
  'landing-page': ['landing', 'startup', 'launch', 'homepage', 'home page', 'marketing'],
  'dashboard': ['dashboard', 'admin', 'analytics', 'panel', 'metrics'],
  'blog': ['blog', 'article', 'writing', 'newsletter', 'magazine'],
  'portfolio': ['portfolio', 'showcase', 'work', 'designer', 'creative work'],
  'saas': ['saas', 'software', 'app website', 'product site', 'b2b', 'startup'],
  'ecommerce': ['shop', 'store', 'ecommerce', 'e-commerce', 'sell', 'products', 'cart'],
  'restaurant': ['restaurant', 'cafe', 'café', 'food', 'menu', 'bakery', 'bistro', 'bar', 'diner', 'eatery'],
  'docs': ['docs', 'documentation', 'guide', 'manual'],
  'api': ['api', 'developer', 'reference'],
  'admin': ['admin', 'backoffice', 'back office', 'management'],
  'creative-agency': ['agency', 'studio', 'creative'],
  'photography': ['photo', 'photography', 'photographer', 'gallery'],
  'freelancer': ['freelance', 'freelancer', 'consultant', 'personal brand'],
  'event': ['event', 'conference', 'meetup', 'concert', 'festival'],
  'personal': ['personal', 'about me', 'resume', 'cv'],
  'fitness': ['fitness', 'gym', 'yoga', 'workout', 'trainer'],
  'medical': ['medical', 'doctor', 'clinic', 'dental', 'dentist', 'health'],
  'education': ['education', 'school', 'course', 'learning', 'teacher'],
  'wedding': ['wedding', 'marriage', 'engagement'],
  'music': ['music', 'band', 'musician', 'dj', 'album'],
  'real-estate': ['real estate', 'property', 'realtor', 'housing', 'apartment'],
}

export function inferCategories(input: string): string[] {
  const lower = input.toLowerCase()
  const hits: string[] = []
  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some(h => lower.includes(h))) hits.push(category)
  }
  return hits.slice(0, 3)   // progressive loading — never everything at once
}

// ─── Clause routing (modification mode) ──────────────────────────────

const ADD_INTENT = /\b(add|insert|include|put\s+in|need\s+a|want\s+a|with\s+a)\b/i
const MODIFY_INTENT = /\b(remove|delete|change|make|switch|turn|enable|disable|set)\b/i

async function routeClause(clause: string): Promise<ClauseRoute> {
  const [actionResults, sectionResults] = await Promise.all([
    searchAction(clause, 1),
    searchSection(clause, 1),
  ])

  const bestAction = actionResults[0]
  const bestSection = sectionResults[0]

  const actionSim = bestAction ? bestAction.similarity + (MODIFY_INTENT.test(clause) ? INTENT_BOOST : 0) : 0
  const sectionSim = bestSection ? bestSection.similarity + (ADD_INTENT.test(clause) ? INTENT_BOOST : 0) : 0

  if (bestAction && actionSim >= sectionSim && actionSim > CLAUSE_FLOOR) {
    return {
      clause,
      kind: 'action',
      description: bestAction.description,
      similarity: bestAction.similarity,
      intent: bestAction.intent,
    }
  }
  if (bestSection && sectionSim > CLAUSE_FLOOR) {
    return {
      clause,
      kind: 'section',
      name: bestSection.name,
      similarity: bestSection.similarity,
      code: bestSection.code,
    }
  }
  return { clause, kind: 'none' }
}

// ─── Main route ──────────────────────────────────────────────────────

export async function route(input: string, ctx: RouteContext): Promise<RouteResult> {
  const trimmed = input.trim()

  // 1. Explicit composition ("hero + pricing + footer") wins unconditionally
  const explicitParts = trimmed.split(/\s*\+\s*/)
  const isExplicitComposition = explicitParts.length >= 2 && explicitParts.every(p => p.trim().length > 0)

  if (isExplicitComposition) {
    const result = await composePage(explicitParts.map(p => p.trim()))
    if (result.sections.length > 0) {
      return { kind: 'composition', code: result.code, sections: result.sections }
    }
  }

  // 2. Template selected → modification clauses
  if (ctx.templateSelected) {
    const clauses = splitClauses(trimmed)
    const routed: ClauseRoute[] = []
    for (const clause of clauses) {
      routed.push(await routeClause(clause))
    }
    return { kind: 'modifications', clauses: routed }
  }

  // 3. Implicit composition (≥3 section keywords, no template selected)
  const compositionQueries = parseCompositionRequest(trimmed)
  if (compositionQueries && compositionQueries.length >= 3) {
    const result = await composePage(compositionQueries)
    if (result.sections.length >= 2) {
      return { kind: 'composition', code: result.code, sections: result.sections }
    }
  }

  // 4. Template retrieval — lazily pull in category shards the query hints at
  const categories = inferCategories(trimmed)
  if (categories.length > 0) {
    try { await loadCategoryShards(categories) } catch { /* shards are optional */ }
  }

  const results = await search(trimmed, 3)
  const best = results[0]

  if (best && best.similarity > HIGH_CONFIDENCE) {
    return { kind: 'template', match: best }
  }
  if (best && best.similarity >= LOW_CONFIDENCE) {
    return { kind: 'suggestions', options: results.filter(r => r.similarity >= LOW_CONFIDENCE) }
  }
  return { kind: 'gallery', best }
}
