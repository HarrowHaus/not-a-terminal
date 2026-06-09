import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  files: Record<string, string>
  entry?: string
}

function buildSrcdoc(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"><\/script>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19",
    "react-dom": "https://esm.sh/react-dom@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime"
  }
}
<\/script>
<style>body{margin:0}</style>
</head>
<body>
<div id="root"></div>
<script type="module">
${code}
<\/script>
</body>
</html>`
}

function makeEntry(appPath: string): string {
  return [
    `import {createElement} from 'react'`,
    `import {createRoot} from 'react-dom/client'`,
    `import App from '${appPath}'`,
    `createRoot(document.getElementById('root')).render(createElement(App))`,
  ].join('\n')
}

export function IframeRenderer({ files, entry = './App' }: Props) {
  const workerRef = useRef<Worker | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'compiling' | 'done' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef<Record<string, string> | null>(null)

  const compile = useCallback((f: Record<string, string>) => {
    if (!workerRef.current) return
    const allFiles = { ...f, '/__entry.tsx': makeEntry(entry) }
    setStatus('compiling')
    workerRef.current.postMessage({
      type: 'compile',
      id: Date.now().toString(),
      files: allFiles,
      entry: '/__entry.tsx',
    })
  }, [entry])

  useEffect(() => {
    const worker = new Worker(
      new URL('../../engine/preview/compile.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data
      if (msg.type === 'ready') {
        setStatus('ready')
      } else if (msg.type === 'compiled') {
        setError(null)
        setStatus('done')
        if (iframeRef.current) {
          iframeRef.current.srcdoc = buildSrcdoc(msg.code)
        }
      } else if (msg.type === 'error') {
        setError(msg.error)
        setStatus('error')
      }
    }

    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      pendingRef.current = files
      return
    }
    compile(files)
  }, [files, compile])

  useEffect(() => {
    if (status === 'ready' && pendingRef.current) {
      const pending = pendingRef.current
      pendingRef.current = null
      compile(pending)
    }
  }, [status, compile])

  return (
    <div className="relative w-full h-full">
      {(status === 'loading' || status === 'compiling') && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <span
            className="font-recursive text-sm text-ink4"
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
          >
            {status === 'loading' ? 'initializing preview engine...' : 'compiling...'}
          </span>
        </div>
      )}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-coral/10 border-t border-coral/20 z-20">
          <pre
            className="font-recursive text-xs text-coral overflow-auto whitespace-pre-wrap"
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
          >
            {error}
          </pre>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts"
        title="Preview"
      />
    </div>
  )
}
