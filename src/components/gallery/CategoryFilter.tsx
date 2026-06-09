const CATEGORIES = [
  'Landing Page', 'Dashboard', 'Blog', 'Portfolio', 'SaaS',
  'Ecommerce', 'Restaurant', 'Docs', 'Freelancer', 'Event',
]

interface Props {
  active: string | null
  onChange: (cat: string | null) => void
}

export function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
          active === null ? 'bg-ink text-surface' : 'bg-bg2 text-ink3 hover:text-ink'
        }`}
        style={{ fontFamily: 'Anybody', fontVariationSettings: '"wdth" 130' }}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-[0.08em] transition-colors whitespace-nowrap ${
            active === cat ? 'bg-ink text-surface' : 'bg-bg2 text-ink3 hover:text-ink'
          }`}
          style={{ fontFamily: 'Anybody', fontVariationSettings: '"wdth" 130' }}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
