import { Header } from './Header'
import { PaneDivider } from './PaneDivider'
import { LandingContent } from '../preview/LandingContent'
import { useUIStore } from '../../stores/ui'

const MONO_TERMINAL = { fontVariationSettings: '"MONO" 1, "CASL" 0' } as const

export function Shell() {
  const activePane = useUIStore((s) => s.activePane)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Chat pane */}
        <div
          className={`shrink-0 flex flex-col bg-bg w-full md:w-80 lg:w-[370px] ${
            activePane === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Chat header */}
          <div
            className="px-3.5 py-2.5 border-b border-border flex justify-between font-recursive text-[9px] font-medium text-ink4 uppercase tracking-[0.1em]"
            style={MONO_TERMINAL}
          >
            <span>conversation</span>
            <span>nat &middot; local</span>
          </div>

          {/* Pre-seeded messages */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
            {/* User message */}
            <div className="max-w-[90%] self-end">
              <div
                className="font-recursive text-[8px] font-semibold uppercase tracking-[0.1em] text-ink4 text-right mb-1"
                style={{ ...MONO_TERMINAL, fontWeight: 650 }}
              >
                you
              </div>
              <div
                className="font-recursive text-[13px] leading-[1.7] p-2.5 px-3 border border-ink bg-ink text-bg"
                style={{ ...MONO_TERMINAL, fontWeight: 400 }}
              >
                Build a landing page for a free app builder called Not A Terminal
              </div>
            </div>

            {/* Nat message */}
            <div className="max-w-[90%] self-start">
              <div
                className="font-recursive text-[8px] font-semibold uppercase tracking-[0.1em] text-green mb-1"
                style={{ ...MONO_TERMINAL, fontWeight: 650 }}
              >
                nat
              </div>
              <div
                className="font-recursive text-[13px] leading-[1.7] p-2.5 px-3 border border-border bg-surface"
                style={{ ...MONO_TERMINAL, fontWeight: 400 }}
              >
                Here it is. Type anything below to start building your own.
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-border bg-bg2">
            <textarea
              className="w-full p-2.5 border border-border bg-surface text-ink font-recursive text-[13px] leading-[1.6] resize-none outline-none min-h-[52px] focus:border-ink transition-colors placeholder:text-ink4"
              style={{ ...MONO_TERMINAL, fontWeight: 400 }}
              placeholder="describe what you want to build..."
              rows={3}
              readOnly
            />
            <div className="flex justify-between items-center mt-1.5">
              <span
                className="font-recursive text-[9px] text-ink4"
                style={MONO_TERMINAL}
              >
                enter to build
              </span>
              <button
                className="px-4 py-1.5 border border-ink bg-ink text-surface font-recursive text-[10px] font-semibold uppercase tracking-[0.05em] cursor-pointer hover:bg-coral hover:border-coral transition-all"
                style={{ ...MONO_TERMINAL, fontWeight: 650 }}
              >
                build
              </button>
            </div>
          </div>
        </div>

        <PaneDivider />

        {/* Preview pane */}
        <div
          className={`flex-1 overflow-y-auto bg-surface ${
            activePane === 'preview' ? '' : 'hidden md:block'
          }`}
        >
          <LandingContent />
        </div>
      </div>
    </div>
  )
}
