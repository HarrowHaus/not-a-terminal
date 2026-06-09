import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useTemplateStore } from '../../stores/template'
import { useUIStore } from '../../stores/ui'
import { useEditorStore } from '../../stores/editor'
import { templates } from '../../data/templates'
import { applyCustomizations } from '../../engine/ast/customizer'
import { CustomizeForm } from '../gallery/CustomizeForm'
import { IframeRenderer } from './IframeRenderer'
import { EditorPane } from '../editor/EditorPane'
import { FileTabs } from '../editor/FileTabs'
import { FileTree } from '../editor/FileTree'

export function TemplatePreview() {
  const selectedId = useTemplateStore((s) => s.selectedId)
  const customizations = useTemplateStore((s) => s.customizations)
  const clearSelection = useTemplateStore((s) => s.clearSelection)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)

  const showEditor = useEditorStore((s) => s.showEditor)
  const editorFiles = useEditorStore((s) => s.files)
  const activeFile = useEditorStore((s) => s.activeFile)
  const setFiles = useEditorStore((s) => s.setFiles)
  const setFile = useEditorStore((s) => s.setFile)
  const toggleEditor = useEditorStore((s) => s.toggleEditor)

  const template = templates.find((t) => t.id === selectedId)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const formFiles = useMemo(() => {
    if (!template) return { '/App.tsx': 'export default function App() { return <div /> }' }
    const code = applyCustomizations(template.code, template.fields, customizations)
    return { '/App.tsx': code }
  }, [template, customizations])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function handleToggleEditor() {
    if (!showEditor) setFiles(formFiles)
    toggleEditor()
  }

  function handleBack() {
    clearSelection()
    if (showEditor) toggleEditor()
    setPreviewMode('gallery')
  }

  const handleCodeChange = useCallback(
    (newCode: string) => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setFile(activeFile, newCode)
      }, 300)
    },
    [activeFile, setFile],
  )

  const previewFiles = showEditor ? editorFiles : formFiles
  const editorValue = editorFiles[activeFile] ?? ''

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
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
        <div className="ml-auto flex">
          <button
            onClick={handleToggleEditor}
            className={`font-recursive text-[10px] px-2.5 py-1 rounded-l border border-border transition-colors ${
              !showEditor
                ? 'bg-surface text-ink font-medium'
                : 'bg-bg2 text-ink3 hover:text-ink'
            }`}
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
          >
            FORM
          </button>
          <button
            onClick={handleToggleEditor}
            className={`font-recursive text-[10px] px-2.5 py-1 rounded-r border border-l-0 border-border transition-colors ${
              showEditor
                ? 'bg-surface text-ink font-medium'
                : 'bg-bg2 text-ink3 hover:text-ink'
            }`}
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
          >
            CODE
          </button>
        </div>
      </div>

      {showEditor ? (
        <>
          <FileTabs />
          <div className="flex flex-1 min-h-0">
            <FileTree />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 min-h-0">
                <EditorPane value={editorValue} onChange={handleCodeChange} />
              </div>
            </div>
            <div className="w-[45%] shrink-0 border-l border-border min-h-0">
              <IframeRenderer files={previewFiles} />
            </div>
          </div>
        </>
      ) : (
        <>
          <CustomizeForm />
          <div className="flex-1 min-h-0">
            <IframeRenderer files={previewFiles} />
          </div>
        </>
      )}
    </div>
  )
}
