import { useRef, useEffect, useCallback } from 'react'
import { Message } from './Message'
import { Composer } from './Composer'
import { useChatStore } from '../../stores/chat'
import { useUIStore } from '../../stores/ui'
import { useTemplateStore } from '../../stores/template'
import { useEditorStore } from '../../stores/editor'
import { search, indexTemplates, setProgressCallback } from '../../engine/search/retrieval'
import { indexActions, searchAction } from '../../engine/search/action-search'
import { indexSections, searchSection } from '../../engine/search/section-search'
import { splitClauses } from '../../engine/search/clause-splitter'
import { templates } from '../../data/templates'
import { actions } from '../../data/actions'
import { sections } from '../../data/sections'

async function initAllIndexes() {
  await indexTemplates(templates)
  await indexActions(actions)
  await indexSections(sections)
}

export function ChatPane() {
  const messages = useChatStore((s) => s.messages)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastNatMessage = useChatStore((s) => s.updateLastNatMessage)
  const startBuild = useUIStore((s) => s.startBuild)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)
  const selectTemplate = useTemplateStore((s) => s.selectTemplate)
  const selectedId = useTemplateStore((s) => s.selectedId)
  const showEditor = useEditorStore((s) => s.showEditor)
  const editorFiles = useEditorStore((s) => s.files)
  const setFile = useEditorStore((s) => s.setFile)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    setProgressCallback((msg) => {
      updateLastNatMessage(msg)
    })
    initAllIndexes().catch(() => {})
  }, [updateLastNatMessage])

  const handleSubmit = useCallback(
    async (text: string) => {
      addMessage('you', text)
      addMessage('nat', 'Searching...')
      startBuild()

      try {
        await initAllIndexes()

        // If a template is selected, search actions + sections (modification mode)
        if (selectedId) {
          const clauses = splitClauses(text)
          const responses: string[] = []

          for (const clause of clauses) {
            // Search all indexes for this clause
            const [actionResults, sectionResults] = await Promise.all([
              searchAction(clause, 1),
              searchSection(clause, 1),
            ])

            const bestAction = actionResults[0]
            const bestSection = sectionResults[0]

            // Intent boost: "add/insert" prefers sections, "remove/change/make" prefers actions
            const addIntent = /\b(add|insert|include|put\s+in|need\s+a|want\s+a|with\s+a)\b/i.test(clause)
            const modifyIntent = /\b(remove|delete|change|make|switch|turn|enable|disable|set)\b/i.test(clause)

            const actionSim = bestAction ? bestAction.similarity + (modifyIntent ? 0.1 : 0) : 0
            const sectionSim = bestSection ? bestSection.similarity + (addIntent ? 0.1 : 0) : 0

            // Pick whichever index has the higher boosted similarity
            if (bestAction && bestSection) {
              if (actionSim >= sectionSim && actionSim > 0.4) {
                responses.push(`"${clause}" → ${bestAction.description} (${(bestAction.similarity * 100).toFixed(0)}%)`)

                // If in editor mode, we could apply the transform — log for now
                console.log('[action]', clause, bestAction.intent)
              } else if (sectionSim > 0.4) {
                responses.push(`"${clause}" → add ${bestSection.name} (${(bestSection.similarity * 100).toFixed(0)}%)`)

                // If in editor mode, append section code
                if (showEditor) {
                  const activeCode = editorFiles['/App.tsx'] ?? ''
                  const insertIdx = activeCode.lastIndexOf('</div>')
                  if (insertIdx > -1) {
                    const newCode = activeCode.slice(0, insertIdx) + '\n' + bestSection.code + '\n      ' + activeCode.slice(insertIdx)
                    setFile('/App.tsx', newCode)
                  }
                }

                console.log('[section]', clause, bestSection.name)
              } else {
                responses.push(`"${clause}" → no close match`)
              }
            } else if (bestAction && actionSim > 0.4) {
              responses.push(`"${clause}" → ${bestAction.description} (${(bestAction.similarity * 100).toFixed(0)}%)`)
              console.log('[action]', clause, bestAction.intent)
            } else if (bestSection && sectionSim > 0.4) {
              responses.push(`"${clause}" → add ${bestSection.name} (${(bestSection.similarity * 100).toFixed(0)}%)`)
              console.log('[section]', clause, bestSection.name)
            } else {
              responses.push(`"${clause}" → no close match`)
            }
          }

          setPreviewMode('preview')
          updateLastNatMessage(responses.join('\n'))
          return
        }

        // No template selected — search template index
        const results = await search(text, 3)

        if (results.length > 0 && results[0].similarity > 0.3) {
          const best = results[0]
          selectTemplate(best.id)
          setPreviewMode('preview')
          updateLastNatMessage(
            `Found "${best.name}" (${(best.similarity * 100).toFixed(0)}% match). Customize it with the form or switch to code.`,
          )
        } else {
          setPreviewMode('gallery')
          updateLastNatMessage('No close match. Browse the gallery to pick a template.')
        }
      } catch (err) {
        console.error('Search error:', err)
        setPreviewMode('gallery')
        updateLastNatMessage('Search is warming up. Browse templates while it loads.')
      }
    },
    [addMessage, updateLastNatMessage, startBuild, setPreviewMode, selectTemplate, selectedId, showEditor, editorFiles, setFile],
  )

  return (
    <>
      <div
        className="px-3.5 py-2.5 border-b border-border flex justify-between font-recursive text-[9px] font-medium text-ink4 uppercase tracking-[0.1em]"
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
      >
        <span>conversation</span>
        <span>nat &middot; local</span>
      </div>

      <div
        ref={msgsRef}
        className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4"
      >
        {messages.map((msg) => (
          <Message key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
      </div>

      <Composer onSubmit={handleSubmit} />
    </>
  )
}
