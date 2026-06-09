interface MessageProps {
  sender: 'you' | 'nat'
  text: string
}

export function Message({ sender, text }: MessageProps) {
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
        className={`font-recursive text-[13px] leading-[1.7] py-2.5 px-3 border ${
          isUser ? 'border-ink bg-ink text-bg' : 'border-border bg-surface'
        }`}
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 400 }}
      >
        {text}
      </div>
    </div>
  )
}
