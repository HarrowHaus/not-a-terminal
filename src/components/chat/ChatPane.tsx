import { useRef, useEffect, useCallback } from 'react'
import { Message } from './Message'
import { Composer } from './Composer'
import { useChatStore } from '../../stores/chat'
import { useUIStore } from '../../stores/ui'
import { useTemplateStore } from '../../stores/template'
import { search, indexTemplates, setProgressCallback } from '../../engine/search/retrieval'
import { templates } from '../../data/templates'

export function ChatPane() {
  const messages = useChatStore((s) => s.messages)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastNatMessage = useChatStore((s) => s.updateLastNatMessage)
  const startBuild = useUIStore((s) => s.startBuild)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)
  const selectTemplate = useTemplateStore((s) => s.selectTemplate)
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
    indexTemplates(templates).catch(() => {})
  }, [updateLastNatMessage])

  const handleSubmit = useCallback(
    async (text: string) => {
      addMessage('you', text)
      addMessage('nat', 'Searching templates...')
      startBuild()

      try {
        await indexTemplates(templates)
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
    [addMessage, updateLastNatMessage, startBuild, setPreviewMode, selectTemplate],
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
