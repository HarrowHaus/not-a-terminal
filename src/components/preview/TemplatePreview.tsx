import { useMemo } from 'react'
import { useTemplateStore } from '../../stores/template'
import { useUIStore } from '../../stores/ui'
import { templates } from '../../data/templates'
import { applyCustomizations } from '../../engine/ast/customizer'
import { CustomizeForm } from '../gallery/CustomizeForm'
import { IframeRenderer } from './IframeRenderer'

export function TemplatePreview() {
  const selectedId = useTemplateStore((s) => s.selectedId)
  const customizations = useTemplateStore((s) => s.customizations)
  const clearSelection = useTemplateStore((s) => s.clearSelection)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)

  const template = templates.find((t) => t.id === selectedId)

  const files = useMemo(() => {
    if (!template) return { '/App.tsx': 'export default function App() { return <div /> }' }
    const code = applyCustomizations(template.code, template.fields, customizations)
    return { '/App.tsx': code }
  }, [template, customizations])

  function handleBack() {
    clearSelection()
    setPreviewMode('gallery')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-bg2 shrink-0">
        <button
          onClick={handleBack}
          className="font-recursive text-ink3 hover:text-ink text-[11px]"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          ← gallery
        </button>
        <span className="text-ink5 text-xs">·</span>
        <span
          className="font-recursive text-[11px] text-ink font-medium"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          {template?.name ?? 'Template'}
        </span>
      </div>
      <CustomizeForm />
      <div className="flex-1 min-h-0">
        <IframeRenderer files={files} />
      </div>
    </div>
  )
}
