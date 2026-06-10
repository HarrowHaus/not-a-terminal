import { useRef, useEffect, useCallback } from 'react'
import { Message } from './Message'
import { Composer } from './Composer'
import { useChatStore } from '../../stores/chat'
import type { ChatOption } from '../../stores/chat'
import { useUIStore } from '../../stores/ui'
import { useTemplateStore } from '../../stores/template'
import { useEditorStore } from '../../stores/editor'
import { route } from '../../engine/router'
import type { RouteResult } from '../../engine/router'
import type { SearchResult } from '../../engine/search/types'
import { indexTemplates, setProgressCallback } from '../../engine/search/retrieval'
import { indexActions } from '../../engine/search/action-search'
import { indexSections } from '../../engine/search/section-search'
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
  const updateField = useTemplateStore((s) => s.updateField)
  const selectedId = useTemplateStore((s) => s.selectedId)
  const showEditor = useEditorStore((s) => s.showEditor)
  const editorFiles = useEditorStore((s) => s.files)
  const setFile = useEditorStore((s) => s.setFile)
  const setFiles = useEditorStore((s) => s.setFiles)
  const toggleEditor = useEditorStore((s) => s.toggleEditor)
  const msgsRef = useRef<HTMLDivElement>(null)

  // Full SearchResults behind the last "did you mean" options (id → result)
  const suggestionCache = useRef(new Map<string, SearchResult>())

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

  /** Render a template: starters go through the form flow, shard templates through the editor. */
  const openTemplate = useCallback(
    (id: string, code: string) => {
      const starter = templates.find((t) => t.id === id)
      if (starter) {
        selectTemplate(id)
        setPreviewMode('preview')
        return
      }
      // Shard-loaded template — render its code via the editor surface
      setFiles({ '/App.tsx': code })
      if (!useEditorStore.getState().showEditor) toggleEditor()
      setPreviewMode('preview')
    },
    [selectTemplate, setPreviewMode, setFiles, toggleEditor],
  )

  const applyRouteResult = useCallback(
    (result: RouteResult) => {
      switch (result.kind) {
        case 'composition': {
          setFiles({ '/App.tsx': result.code })
          if (!useEditorStore.getState().showEditor) toggleEditor()
          setPreviewMode('preview')
          const names = result.sections.map((s) => `${s.name} (${(s.similarity * 100).toFixed(0)}%)`).join(', ')
          updateLastNatMessage(`Composed ${result.sections.length} sections: ${names}. Switch to CODE to refine.`)
          return
        }

        case 'modifications': {
          const lines: string[] = []
          for (const c of result.clauses) {
            if (c.kind === 'action') {
              lines.push(`"${c.clause}" → ${c.description} (${(c.similarity * 100).toFixed(0)}%)`)
              if (c.intent.type === 'swap-color') {
                const active = templates.find((t) => t.id === useTemplateStore.getState().selectedId)
                const colorField = active?.fields.find((f) => f.type === 'color')
                if (colorField) updateField(colorField.key, c.intent.to)
              }
            } else if (c.kind === 'section') {
              lines.push(`"${c.clause}" → add ${c.name} (${(c.similarity * 100).toFixed(0)}%)`)
              if (showEditor) {
                const activeCode = editorFiles['/App.tsx'] ?? ''
                const insertIdx = activeCode.lastIndexOf('</div>')
                if (insertIdx > -1) {
                  setFile('/App.tsx', activeCode.slice(0, insertIdx) + '\n' + c.code + '\n      ' + activeCode.slice(insertIdx))
                }
              }
            } else {
              lines.push(`"${c.clause}" → no close match`)
            }
          }
          setPreviewMode('preview')
          updateLastNatMessage(lines.join('\n'))
          return
        }

        case 'template': {
          openTemplate(result.match.id, result.match.code)
          updateLastNatMessage(
            `Found "${result.match.name}" (${(result.match.similarity * 100).toFixed(0)}% match). Customize it with the form or switch to code.`,
          )
          return
        }

        case 'suggestions': {
          suggestionCache.current = new Map(result.options.map((o) => [o.id, o]))
          setPreviewMode('gallery')
          updateLastNatMessage(
            'Close, but not sure which one. Did you mean:',
            result.options.map((o) => ({ id: o.id, name: o.name, similarity: o.similarity })),
          )
          return
        }

        case 'gallery': {
          setPreviewMode('gallery')
          updateLastNatMessage('No close match. Browse the gallery to pick a starting point.')
          return
        }
      }
    },
    [setFiles, toggleEditor, setPreviewMode, updateLastNatMessage, updateField, showEditor, editorFiles, setFile, openTemplate],
  )

  const handleSubmit = useCallback(
    async (text: string) => {
      addMessage('you', text)
      addMessage('nat', 'Searching...')
      startBuild()   // BuildingState renders MorphText while the engine works

      try {
        await initAllIndexes()
        const result = await route(text, { templateSelected: !!selectedId })
        applyRouteResult(result)
      } catch (err) {
        console.error('Router error:', err)
        setPreviewMode('gallery')
        updateLastNatMessage('Search is warming up. Browse templates while it loads.')
      }
    },
    [addMessage, updateLastNatMessage, startBuild, setPreviewMode, selectedId, applyRouteResult],
  )

  const handleSelectOption = useCallback(
    (option: ChatOption) => {
      const full = suggestionCache.current.get(option.id)
      addMessage('you', option.name)
      addMessage('nat', `Loading "${option.name}"...`)
      openTemplate(option.id, full?.code ?? '')
      updateLastNatMessage(`Here's "${option.name}". Customize it with the form or switch to code.`)
    },
    [addMessage, updateLastNatMessage, openTemplate],
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
          <Message
            key={msg.id}
            sender={msg.sender}
            text={msg.text}
            options={msg.options}
            onSelectOption={handleSelectOption}
          />
        ))}
      </div>

      <Composer onSubmit={handleSubmit} />
    </>
  )
}
