import { Header } from './Header'
import { PaneDivider } from './PaneDivider'
import { useUIStore } from '../../stores/ui'

export function Shell() {
  const activePane = useUIStore((s) => s.activePane)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`shrink-0 flex flex-col bg-bg w-full md:w-80 lg:w-[370px] ${
            activePane === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div
            className="px-3.5 py-2.5 border-b border-border flex justify-between font-recursive text-[9px] font-medium text-ink4 uppercase tracking-[0.1em]"
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
          >
            <span>conversation</span>
            <span>nat &middot; local</span>
          </div>
          <div className="flex-1" />
          <div className="p-3 border-t border-border bg-bg2">
            <textarea
              className="w-full p-2.5 border border-border bg-surface text-ink font-recursive text-[13px] leading-relaxed resize-none outline-none min-h-[52px] focus:border-ink transition-colors"
              style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 400 }}
              placeholder="describe what you want to build..."
              rows={3}
              readOnly
            />
          </div>
        </div>

        <PaneDivider />

        <div
          className={`flex-1 overflow-y-auto bg-surface ${
            activePane === 'preview' ? '' : 'hidden md:block'
          }`}
        >
          <div className="p-12 md:p-14 lg:p-16 max-w-[620px]">
            <div
              className="font-fraunces font-black leading-[0.88] tracking-[-0.04em] text-[clamp(48px,9vw,88px)] mb-1"
              style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0, "opsz" 144' }}
            >
              not a<br />
              <span className="text-coral">terminal.</span>
            </div>
            <div
              className="font-fraunces italic text-[15px] text-ink4 mb-11 tracking-[0.01em]"
              style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100, "opsz" 24', fontWeight: 200 }}
            >
              definitely not a terminal.
            </div>
            <div
              className="font-fraunces text-[clamp(22px,3.5vw,30px)] leading-[1.35] text-ink2 mb-3.5"
              style={{ fontVariationSettings: '"WONK" 1, "SOFT" 30, "opsz" 48', fontWeight: 400 }}
            >
              <strong className="font-extrabold text-ink">Describe your idea.</strong>
              <br />
              See it come to life.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
