import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: '"Recursive", monospace' },
  '.cm-content': { fontVariationSettings: '"MONO" 1, "CASL" 0', padding: '8px 0' },
  '.cm-gutters': {
    backgroundColor: '#FAF7F0',
    borderRight: '1px solid #D2CEC2',
    color: '#B5B1A6',
    fontVariationSettings: '"MONO" 1, "CASL" 0',
    fontSize: '11px',
  },
  '.cm-activeLineGutter': { backgroundColor: '#EAE4D8' },
  '.cm-activeLine': { backgroundColor: 'rgba(234, 228, 216, 0.3)' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(222, 90, 68, 0.12) !important' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(222, 90, 68, 0.18) !important' },
  '.cm-cursor': { borderLeftColor: '#1E1C18' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(59, 158, 120, 0.2)', outline: 'none' },
})

interface Props {
  value: string
  onChange: (value: string) => void
}

export function EditorPane({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        theme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return <div ref={containerRef} className="h-full w-full overflow-hidden bg-surface" />
}
