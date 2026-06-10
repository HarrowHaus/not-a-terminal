import type { ChatOption } from '../../stores/chat'

interface MessageProps {
  sender: 'you' | 'nat'
  text: string
  options?: ChatOption[]
  onSelectOption?: (option: ChatOption) => void
}

export function Message({ sender, text, options, onSelectOption }: MessageProps) {
  const isUser = sender === 'you'

  return (
    <div className={`max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}>
      <div
        className={`font-recursive text-[8px] uppercase tracking-[0.1em] mb-1 ${
          isUser ? 'text-ink4 text-right' : 'text-green'
        }`}
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 650 }}
      >
        {sender}
      </div>
      <div
        className={`font-recursive text-[13px] leading-[1.7] py-2.5 px-3 border whitespace-pre-line ${
          isUser ? 'border-ink bg-ink text-bg' : 'border-border bg-surface'
        }`}
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 400 }}
      >
        {text}
        {options && options.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2.5">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectOption?.(opt)}
                className="text-left font-recursive text-[12px] px-2.5 py-1.5 border border-border bg-bg2 hover:border-coral hover:text-coral transition-colors"
                style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 450 }}
              >
                {opt.name}{' '}
                <span className="text-ink4 text-[10px]">({(opt.similarity * 100).toFixed(0)}%)</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
