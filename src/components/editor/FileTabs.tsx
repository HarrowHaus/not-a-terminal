import { useEditorStore } from '../../stores/editor'

export function FileTabs() {
  const files = useEditorStore((s) => s.files)
  const activeFile = useEditorStore((s) => s.activeFile)
  const setActiveFile = useEditorStore((s) => s.setActiveFile)

  const paths = Object.keys(files)

  return (
    <div
      className="flex items-center border-b border-border bg-bg2 shrink-0 overflow-x-auto"
      style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
    >
      {paths.map((path) => (
        <button
          key={path}
          onClick={() => setActiveFile(path)}
          className={`font-recursive text-[11px] px-3 py-1.5 border-r border-border whitespace-nowrap transition-colors ${
            path === activeFile
              ? 'bg-surface text-ink font-medium'
              : 'text-ink3 hover:text-ink hover:bg-bg'
          }`}
        >
          {path.replace(/^\//, '')}
        </button>
      ))}
    </div>
  )
}
