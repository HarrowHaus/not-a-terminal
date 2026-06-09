export function TypingIndicator() {
  return (
    <div className="max-w-[90%] self-start">
      <div
        className="font-recursive text-[8px] uppercase tracking-[0.1em] text-green mb-1"
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 650 }}
      >
        nat
      </div>
      <div className="border border-border bg-surface py-3 px-3 flex gap-1.5 items-center">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-ink4 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
