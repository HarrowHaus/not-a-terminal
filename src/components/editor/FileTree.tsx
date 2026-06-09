import { useEditorStore } from '../../stores/editor'

export function FileTree() {
  const files = useEditorStore((s) => s.files)
  const activeFile = useEditorStore((s) => s.activeFile)
  const setActiveFile = useEditorStore((s) => s.setActiveFile)

  const paths = Object.keys(files).sort()

  return (
    <div className="w-36 border-r border-border bg-bg shrink-0 overflow-y-auto p-2">
      <div
        className="font-recursive text-[9px] font-bold text-ink4 uppercase tracking-widest mb-2 px-1"
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
      >
        Files
      </div>
      {paths.map((path) => (
        <button
          key={path}
          onClick={() => setActiveFile(path)}
          className={`font-recursive block w-full text-left px-2 py-1 text-[11px] rounded transition-colors ${
            path === activeFile
              ? 'bg-bg2 text-ink font-medium'
              : 'text-ink3 hover:bg-bg2 hover:text-ink'
          }`}
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          {path.replace(/^\//, '')}
        </button>
      ))}
    </div>
  )
}
