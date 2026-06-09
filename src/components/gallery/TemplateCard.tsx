import type { Template } from '../../data/templates/types'

const CATEGORY_COLORS: Record<string, string> = {
  'Landing Page': 'bg-blue-500',
  'Dashboard': 'bg-indigo-500',
  'Blog': 'bg-purple-500',
  'Portfolio': 'bg-teal-500',
  'SaaS': 'bg-violet-500',
  'Ecommerce': 'bg-emerald-500',
  'Restaurant': 'bg-amber-500',
  'Docs': 'bg-sky-500',
  'Freelancer': 'bg-rose-500',
  'Event': 'bg-fuchsia-500',
}

interface Props {
  template: Template
  onSelect: (id: string) => void
}

export function TemplateCard({ template, onSelect }: Props) {
  const accentColor = CATEGORY_COLORS[template.category] || 'bg-gray-500'

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1.5 ${accentColor}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3
            className="font-fraunces text-lg font-semibold text-ink"
            style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0' }}
          >
            {template.name}
          </h3>
          <span
            className="text-[8px] font-bold uppercase tracking-[0.08em] text-ink4 bg-bg2 px-2 py-0.5 rounded shrink-0 ml-2"
            style={{ fontFamily: 'Anybody', fontVariationSettings: '"wdth" 130' }}
          >
            {template.category}
          </span>
        </div>
        <p
          className="font-recursive text-[13px] text-ink3 mb-4 leading-relaxed"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5' }}
        >
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="font-recursive text-[9px] text-ink4 bg-bg px-2 py-0.5 rounded"
              style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => onSelect(template.id)}
          className="w-full py-2 bg-ink text-surface text-[10px] font-semibold uppercase tracking-[0.06em] rounded hover:bg-coral transition-colors font-recursive"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          Use Template
        </button>
      </div>
    </div>
  )
}
