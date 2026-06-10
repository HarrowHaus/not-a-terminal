import { X } from 'lucide-react'
import { useUIStore } from '../../stores/ui'
import { templates } from '../../data/templates'

const CAPABILITIES = [
  {
    label: 'Describe',
    title: 'Describe what you want',
    body: 'Type a plain-English request like “a restaurant website” or “a portfolio for a photographer.” Nat embeds it and finds the closest human-made template — no generation, no hallucination.',
  },
  {
    label: 'Modify',
    title: 'Refine with natural language',
    body: 'Say “make the header blue,” “add a pricing section,” or “remove testimonials.” Each phrase is matched against an action and section index, then applied to the live preview.',
  },
  {
    label: 'Export',
    title: 'Export as a ZIP',
    body: 'Download your project as a complete, runnable Vite + React + Tailwind app. Run npm install && npm run dev and it just works. No lock-in, no account, no tokens.',
  },
]

export function Docs() {
  const setShowDocs = useUIStore((s) => s.setShowDocs)

  return (
    <div className="absolute inset-0 z-30 bg-bg overflow-y-auto">
      {/* Close */}
      <button
        onClick={() => setShowDocs(false)}
        className="fixed top-3 right-4 z-40 flex items-center gap-1 font-recursive text-[11px] text-ink3 hover:text-coral transition-colors"
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
      >
        close <X size={13} />
      </button>

      <div className="max-w-[640px] mx-auto px-8 py-14 md:px-10 md:py-20">
        {/* Accent label */}
        <div
          className="font-anybody text-[10px] font-extrabold uppercase tracking-[0.14em] text-coral mb-5"
          style={{ fontVariationSettings: '"wdth" 140' }}
        >
          Docs
        </div>

        {/* Title */}
        <h1
          className="font-fraunces font-black leading-[0.9] tracking-[-0.035em] text-[clamp(40px,7vw,64px)] mb-6"
          style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0, "opsz" 120' }}
        >
          What is <span className="text-coral">not a terminal</span>?
        </h1>

        {/* Lede */}
        <p
          className="font-recursive text-[15px] leading-[1.95] text-ink2 mb-5"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 400 }}
        >
          A search engine for web templates with a natural-language interface. You
          describe what you want, and the closest professionally-designed template
          appears in the preview. You shape it by talking — change colors, add
          sections, rearrange things — then export everything as a real project.
        </p>
        <p
          className="font-recursive text-[14px] leading-[1.95] text-ink3 mb-12"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 380 }}
        >
          Everything runs in your browser. No backend, no account, no token limits,
          and no generative AI in the core path — the intelligence is a 23&nbsp;MB
          embedding model doing similarity search against a curated index.
        </p>

        {/* Thesis */}
        <div className="border-l-2 border-coral pl-5 mb-14">
          <p
            className="font-fraunces text-[clamp(20px,3.2vw,26px)] leading-[1.4] text-ink"
            style={{ fontVariationSettings: '"WONK" 1, "SOFT" 40, "opsz" 40', fontWeight: 450 }}
          >
            Every template was designed by a human. Every combination is made for
            you.
          </p>
        </div>

        {/* What you can do */}
        <div
          className="font-anybody text-[9px] font-bold uppercase tracking-[0.14em] text-ink3 mb-6"
          style={{ fontVariationSettings: '"wdth" 140' }}
        >
          What you can do
        </div>

        <div className="mb-14">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={cap.label}
              className={`flex gap-5 py-5 border-b border-border ${i === 0 ? 'border-t' : ''}`}
            >
              <div className="min-w-[78px] pt-0.5">
                <span
                  className="font-anybody text-[10px] font-extrabold uppercase tracking-[0.1em] text-coral"
                  style={{ fontVariationSettings: '"wdth" 130' }}
                >
                  {cap.label}
                </span>
              </div>
              <div className="flex-1">
                <h3
                  className="font-fraunces text-[18px] text-ink mb-1.5"
                  style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0, "opsz" 28', fontWeight: 600 }}
                >
                  {cap.title}
                </h3>
                <p
                  className="font-recursive text-[13px] leading-[1.8] text-ink2"
                  style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 380 }}
                >
                  {cap.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Library status */}
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="font-fraunces font-black text-[clamp(40px,7vw,56px)] text-coral leading-none"
            style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0, "opsz" 96' }}
          >
            {templates.length}
          </span>
          <span
            className="font-recursive text-[13px] text-ink3"
            style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 400 }}
          >
            starter templates available today
          </span>
        </div>
        <p
          className="font-recursive text-[13px] leading-[1.85] text-ink3 mb-12"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 380 }}
        >
          The build pipeline is in place to scale this to thousands of templates,
          actions, and sections — each one crawled from a real, human-designed
          library and enriched at build time.
        </p>

        {/* Early preview note */}
        <div className="bg-coral/10 border border-coral/20 rounded-lg px-5 py-4 mb-14">
          <p
            className="font-recursive text-[12px] leading-[1.8] text-coral"
            style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 450 }}
          >
            This is an early preview. The template library is small and growing
            fast — expect rough edges, and check back as it fills out.
          </p>
        </div>

        {/* Back */}
        <button
          onClick={() => setShowDocs(false)}
          className="font-recursive text-[12px] text-ink3 hover:text-coral transition-colors"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          &larr; back to building
        </button>
      </div>
    </div>
  )
}
