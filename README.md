# Not A Terminal

A search engine for web templates with a natural-language interface. You describe what you want in plain English, the closest professionally-designed template appears in a live preview, and you refine it by talking — change colors, add sections, rearrange things — then export the result as a real, runnable project. Everything runs in the browser: no backend, no account, no token limits, and no generative AI in the core path. The intelligence is a 23&nbsp;MB embedding model doing cosine similarity against a curated index — the curation is the product, not the computation.

**Live demo:** https://not-a-terminal.pages.dev

## Quick start

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL (default `http://localhost:5173`). The first search downloads the embedding model (~23&nbsp;MB) and caches it in the browser.

## Tests

```bash
npm test
```

Runs the Vitest suite (AST transform engine unit tests).

## Build & deploy

```bash
npm run build                  # type-check + Vite production build → dist/
wrangler pages deploy dist     # deploy the static site to Cloudflare Pages
```

The output in `dist/` is a fully static site and can be hosted anywhere.

## How it works

User input → embed with `all-MiniLM-L6-v2` (INT8, CPU WASM) → cosine search against pre-computed indexes → AST transform → in-browser preview. Three indexes back the experience:

- **Template index** — "build me an X" → nearest starter template
- **Action index** — "make the header blue" → nearest modification → AST applies it
- **Section index** — "add a pricing section" → nearest section → AST inserts it

## Directory structure

```
src/
  App.tsx                 App root → renders the Shell
  main.tsx                React entry point
  components/
    layout/               Shell, Header, Banner, pane toggle/divider
    chat/                 Chat pane, message list, composer (the "Nat" interface)
    preview/              Live iframe preview, landing content, building state
    gallery/              Template gallery + form-based customization
    editor/               CodeMirror code editor, file tabs, file tree
    docs/                 In-app docs page
    shared/               Cross-cutting UI (font-morph text, etc.)
  engine/
    search/               Embedding worker, retrieval, PGlite vector store, indexes
    ast/                  Babel-based transform engine (color, layout, sections, dark mode)
    preview/              esbuild-wasm compile worker + virtual file system
    export.ts             ZIP export → runnable Vite + React + Tailwind project
  data/
    templates/            Starter templates with customization schemas
    actions.ts            Action index entries
    sections.ts           Section index entries
  stores/                 Zustand stores (ui, chat, template, editor)
scripts/                  Build-time pipeline (crawl, enrich, embed, shard, build indexes)
public/                   Static assets and generated index shards
```

## Stack

React 19, TypeScript, Vite, Tailwind 4, Zustand, CodeMirror 6, esbuild-wasm, `@babel/standalone`, Transformers.js, PGlite + pgvector, Dexie.js, JSZip, Lucide React, Framer Motion. Hosting: Cloudflare Pages.

## Status

Early preview — the template library is small and growing fast. The build pipeline in `scripts/` is in place to scale the indexes to thousands of human-designed templates, actions, and sections.

## The thesis

Every template was designed by a human. Every combination is made for you.
