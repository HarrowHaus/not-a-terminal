import { PaneToggle } from './PaneToggle'
import { useUIStore } from '../../stores/ui'

export function Header() {
  const setShowDocs = useUIStore((s) => s.setShowDocs)

  return (
    <header className="flex items-center justify-between px-4 h-11 bg-bg2 border-b border-border">
      <div className="flex items-baseline gap-0.5">
        <span
          className="font-recursive text-xs text-ink3"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 420 }}
        >
          not a{' '}
        </span>
        <span
          className="font-recursive text-xs"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 620 }}
        >
          terminal
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-green animate-glow inline-block align-middle ml-0.5" />
      </div>

      <PaneToggle />

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowDocs(true)}
          className="font-recursive text-[10px] text-ink3 hover:text-coral transition-colors"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          docs
        </button>
        <span
          className="font-recursive text-[10px] text-ink4 hidden md:inline"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          <b className="text-green font-semibold">free</b> &middot; no account
        </span>
      </div>
    </header>
  )
}
