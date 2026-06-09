import { create } from 'zustand'
import { templates } from '../data/templates'

interface TemplateState {
  selectedId: string | null
  customizations: Record<string, string | boolean>
  activeCategory: string | null
  selectTemplate: (id: string) => void
  updateField: (key: string, value: string | boolean) => void
  setCategory: (cat: string | null) => void
  clearSelection: () => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  selectedId: null,
  customizations: {},
  activeCategory: null,
  selectTemplate: (id) => {
    const template = templates.find((t) => t.id === id)
    if (!template) return
    const defaults: Record<string, string | boolean> = {}
    for (const field of template.fields) {
      defaults[field.key] = field.default
    }
    set({ selectedId: id, customizations: defaults })
  },
  updateField: (key, value) =>
    set((s) => ({
      customizations: { ...s.customizations, [key]: value },
    })),
  setCategory: (cat) => set({ activeCategory: cat }),
  clearSelection: () => set({ selectedId: null, customizations: {} }),
}))
