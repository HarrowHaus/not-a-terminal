import { create } from 'zustand'

type ActivePane = 'chat' | 'preview'
type PreviewMode = 'landing' | 'building'

interface UIState {
  activePane: ActivePane
  previewMode: PreviewMode
  buildId: number
  setActivePane: (pane: ActivePane) => void
  startBuild: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activePane: 'preview',
  previewMode: 'landing',
  buildId: 0,
  setActivePane: (pane) => set({ activePane: pane }),
  startBuild: () =>
    set((s) => ({
      previewMode: 'building',
      buildId: s.buildId + 1,
      activePane: 'preview',
    })),
}))
