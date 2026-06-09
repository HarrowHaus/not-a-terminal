import { create } from 'zustand'

type ActivePane = 'chat' | 'preview'

interface UIState {
  activePane: ActivePane
  setActivePane: (pane: ActivePane) => void
}

export const useUIStore = create<UIState>((set) => ({
  activePane: 'preview',
  setActivePane: (pane) => set({ activePane: pane }),
}))
