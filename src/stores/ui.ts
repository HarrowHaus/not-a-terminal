import { create } from 'zustand'

type ActivePane = 'chat' | 'preview'
type PreviewMode = 'landing' | 'building' | 'gallery' | 'preview'

interface UIState {
  activePane: ActivePane
  previewMode: PreviewMode
  buildId: number
  showDocs: boolean
  setActivePane: (pane: ActivePane) => void
  setPreviewMode: (mode: PreviewMode) => void
  startBuild: () => void
  setShowDocs: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activePane: 'preview',
  previewMode: 'landing',
  buildId: 0,
  showDocs: false,
  setActivePane: (pane) => set({ activePane: pane }),
  setPreviewMode: (mode) => set({ previewMode: mode, activePane: 'preview' }),
  startBuild: () =>
    set((s) => ({
      previewMode: 'building',
      buildId: s.buildId + 1,
      activePane: 'preview',
    })),
  setShowDocs: (show) => set({ showDocs: show }),
}))
