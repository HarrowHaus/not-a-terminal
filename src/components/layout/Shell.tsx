import { Header } from './Header'
import { PaneDivider } from './PaneDivider'
import { IframeRenderer } from '../preview/IframeRenderer'
import { useUIStore } from '../../stores/ui'

const DEMO_FILES: Record<string, string> = {
  '/App.tsx': `
export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Preview Engine</h1>
        <p className="text-gray-500 text-sm mb-6">esbuild-wasm · Tailwind CDN · esm.sh</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">React 19</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">JSX</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Tailwind</span>
        </div>
        <p className="text-xs text-gray-400">Compiled in-browser. No server required.</p>
      </div>
    </div>
  )
}
`,
}

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
          className={`flex-1 overflow-hidden bg-surface ${
            activePane === 'preview' ? '' : 'hidden md:block'
          }`}
        >
          <IframeRenderer files={DEMO_FILES} />
        </div>
      </div>
    </div>
  )
}
