import { useState } from 'react'

interface ComposerProps {
  onSubmit: (text: string) => void
}

const MONO = { fontVariationSettings: '"MONO" 1, "CASL" 0' } as const

export function Composer({ onSubmit }: ComposerProps) {
  const [text, setText] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (trimmed.length < 2) return
    onSubmit(trimmed)
    setText('')
  }

  return (
    <div className="p-3 border-t border-border bg-bg2">
      <textarea
        className="w-full p-2.5 border border-border bg-surface text-ink font-recursive text-[13px] leading-[1.6] resize-none outline-none min-h-[52px] focus:border-ink transition-colors placeholder:text-ink4"
        style={{ ...MONO, fontWeight: 400 }}
        placeholder="describe what you want to build..."
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <div className="flex justify-between items-center mt-1.5">
        <span className="font-recursive text-[9px] text-ink4" style={MONO}>
          enter to build
        </span>
        <button
          className="px-4 py-1.5 border border-ink bg-ink text-surface font-recursive text-[10px] uppercase tracking-[0.05em] cursor-pointer hover:bg-coral hover:border-coral transition-all"
          style={{ ...MONO, fontWeight: 650 }}
          onClick={submit}
        >
          build
        </button>
      </div>
    </div>
  )
}
