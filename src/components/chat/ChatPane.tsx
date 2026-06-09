import { useRef, useEffect } from 'react'
import { Message } from './Message'
import { Composer } from './Composer'
import { useChatStore } from '../../stores/chat'
import { useUIStore } from '../../stores/ui'

export function ChatPane() {
  const messages = useChatStore((s) => s.messages)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastNatMessage = useChatStore((s) => s.updateLastNatMessage)
  const startBuild = useUIStore((s) => s.startBuild)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(text: string) {
    addMessage('you', text)
    addMessage('nat', 'Building...')
    startBuild()

    setTimeout(() => {
      updateLastNatMessage('Done. Describe changes to refine it.')
    }, 2800)
  }

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
