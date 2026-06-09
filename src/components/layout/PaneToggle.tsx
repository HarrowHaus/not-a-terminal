import { useUIStore } from '../../stores/ui'

const btnBase =
  'px-3 py-1 border-none font-recursive text-[9px] font-semibold uppercase tracking-[0.06em] cursor-pointer'

export function PaneToggle() {
  const activePane = useUIStore((s) => s.activePane)
  const setActivePane = useUIStore((s) => s.setActivePane)

  return (
    <div className="hidden md:hidden max-md:flex border border-border overflow-hidden">
      <button
        className={`${btnBase} ${
          activePane === 'chat' ? 'bg-ink text-surface' : 'bg-transparent text-ink4'
        }`}
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        onClick={() => setActivePane('chat')}
      >
        chat
      </button>
      <button
        className={`${btnBase} ${
          activePane === 'preview' ? 'bg-ink text-surface' : 'bg-transparent text-ink4'
        }`}
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        onClick={() => setActivePane('preview')}
      >
        preview
      </button>
    </div>
  )
}
