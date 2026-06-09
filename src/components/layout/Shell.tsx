import { Header } from './Header'
import { PaneDivider } from './PaneDivider'
import { ChatPane } from '../chat/ChatPane'
import { LandingContent } from '../preview/LandingContent'
import { BuildingState } from '../preview/BuildingState'
import { useUIStore } from '../../stores/ui'

export function Shell() {
  const activePane = useUIStore((s) => s.activePane)
  const previewMode = useUIStore((s) => s.previewMode)
  const buildId = useUIStore((s) => s.buildId)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`shrink-0 flex flex-col bg-bg w-full md:w-80 lg:w-[370px] ${
            activePane === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatPane />
        </div>

        <PaneDivider />

        <div
          className={`flex-1 flex flex-col bg-surface ${
            activePane === 'preview' ? '' : 'hidden md:flex'
          }`}
        >
          {previewMode === 'landing' ? (
            <div className="flex-1 overflow-y-auto">
              <LandingContent />
            </div>
          ) : (
            <BuildingState key={buildId} />
          )}
        </div>
      </div>
    </div>
  )
}
