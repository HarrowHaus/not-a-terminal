/**
 * export.ts — Download the current project as a runnable Vite + React + Tailwind ZIP.
 *
 * Takes the in-browser virtual file system (keys like '/App.tsx') and wraps it
 * in a minimal, runnable scaffold so a developer can `npm install && npm run dev`
 * the exported app immediately.
 */

import JSZip from 'jszip'

export interface ExportOptions {
  /** Virtual FS — keys are absolute-style paths like '/App.tsx'. */
  files: Record<string, string>
  /** Human-friendly project name; used for the folder, package name, and title. */
  projectName?: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'my-app'
}

// ─── Scaffold templates ──────────────────────────────────────────────

const MAIN_TSX = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

const INDEX_CSS = `@import "tailwindcss";
`

const indexHtml = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`

const packageJson = (slug: string) => JSON.stringify(
  {
    name: slug,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      tailwindcss: '^4.0.0',
      typescript: '~5.7.0',
      vite: '^6.0.0',
    },
  },
  null,
  2,
) + '\n'

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      jsx: 'react-jsx',
      moduleResolution: 'bundler',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      allowImportingTsExtensions: true,
    },
    include: ['src'],
  },
  null,
  2,
) + '\n'

const readme = (name: string) => `# ${name}

Built with [Not A Terminal](https://github.com/) — every template designed by a human, every combination made for you.

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open the printed localhost URL.

## Build for production

\`\`\`bash
npm run build
\`\`\`

The static site is output to \`dist/\`.
`

const GITIGNORE = `node_modules
dist
*.local
.DS_Store
`

// ─── Export ──────────────────────────────────────────────────────────

/**
 * Build the ZIP blob for the given project. Pure (no DOM side effects) so it
 * can be unit-tested; `exportProject` wraps it with the browser download.
 */
export async function buildProjectZip({ files, projectName = 'my-app' }: ExportOptions): Promise<Blob> {
  const zip = new JSZip()
  const slug = slugify(projectName)

  // User source files → src/
  let hasApp = false
  for (const [path, content] of Object.entries(files)) {
    const clean = path.replace(/^\/+/, '')
    if (/^app\.(t|j)sx?$/i.test(clean)) hasApp = true
    zip.file(`src/${clean}`, content)
  }

  // Guarantee an entry App component exists
  if (!hasApp) {
    zip.file('src/App.tsx', 'export default function App() {\n  return <div>Empty project</div>\n}\n')
  }

  // Scaffold
  zip.file('src/main.tsx', MAIN_TSX)
  zip.file('src/index.css', INDEX_CSS)
  zip.file('index.html', indexHtml(projectName))
  zip.file('vite.config.ts', VITE_CONFIG)
  zip.file('package.json', packageJson(slug))
  zip.file('tsconfig.json', TSCONFIG)
  zip.file('README.md', readme(projectName))
  zip.file('.gitignore', GITIGNORE)

  return zip.generateAsync({ type: 'blob' })
}

/** Trigger a browser download of a Blob. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on next tick so the download has a chance to start
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Build and download the project ZIP. */
export async function exportProject(options: ExportOptions): Promise<void> {
  const blob = await buildProjectZip(options)
  const slug = slugify(options.projectName ?? 'my-app')
  downloadBlob(blob, `${slug}.zip`)
}
