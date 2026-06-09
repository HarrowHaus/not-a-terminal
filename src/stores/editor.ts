import { create } from 'zustand'

interface EditorState {
  files: Record<string, string>
  activeFile: string
  showEditor: boolean
  setFiles: (files: Record<string, string>) => void
  setFile: (path: string, content: string) => void
  setActiveFile: (path: string) => void
  toggleEditor: () => void
  addFile: (path: string, content: string) => void
  removeFile: (path: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  files: {},
  activeFile: '/App.tsx',
  showEditor: false,
  setFiles: (files) => set({ files }),
  setFile: (path, content) =>
    set((s) => ({ files: { ...s.files, [path]: content } })),
  setActiveFile: (path) => set({ activeFile: path }),
  toggleEditor: () => set((s) => ({ showEditor: !s.showEditor })),
  addFile: (path, content) =>
    set((s) => ({ files: { ...s.files, [path]: content }, activeFile: path })),
  removeFile: (path) =>
    set((s) => {
      const rest = { ...s.files }
      delete rest[path]
      const newActive = s.activeFile === path ? Object.keys(rest)[0] ?? '' : s.activeFile
      return { files: rest, activeFile: newActive }
    }),
}))
