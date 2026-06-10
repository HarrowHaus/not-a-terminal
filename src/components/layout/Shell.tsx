import { Header } from './Header'
import { Banner } from './Banner'
import { PaneDivider } from './PaneDivider'
import { ChatPane } from '../chat/ChatPane'
import { LandingContent } from '../preview/LandingContent'
import { BuildingState } from '../preview/BuildingState'
import { TemplateGallery } from '../gallery/TemplateGallery'
import { TemplatePreview } from '../preview/TemplatePreview'
import { Docs } from '../docs/Docs'
import { useUIStore } from '../../stores/ui'

export function Shell() {
  const activePane = useUIStore((s) => s.activePane)
  const previewMode = useUIStore((s) => s.previewMode)
  const buildId = useUIStore((s) => s.buildId)
  const showDocs = useUIStore((s) => s.showDocs)

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-bg">
      <Header />
      <Banner />
      {showDocs && <Docs />}
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
          {previewMode === 'landing' && (
            <div className="flex-1 overflow-y-auto">
              <LandingContent />
            </div>
          )}
          {previewMode === 'building' && <BuildingState key={buildId} />}
          {previewMode === 'gallery' && (
            <div className="flex-1 overflow-y-auto">
              <TemplateGallery />
            </div>
          )}
          {previewMode === 'preview' && <TemplatePreview />}
        </div>
      </div>
    </div>
  )
}
