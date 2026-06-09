import { templates } from '../../data/templates'
import { useTemplateStore } from '../../stores/template'
import { useUIStore } from '../../stores/ui'
import { CategoryFilter } from './CategoryFilter'
import { TemplateCard } from './TemplateCard'

export function TemplateGallery() {
  const activeCategory = useTemplateStore((s) => s.activeCategory)
  const setCategory = useTemplateStore((s) => s.setCategory)
  const selectTemplate = useTemplateStore((s) => s.selectTemplate)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)

  const filtered = activeCategory
    ? templates.filter((t) => t.category === activeCategory)
    : templates

  function handleSelect(id: string) {
    selectTemplate(id)
    setPreviewMode('preview')
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setPreviewMode('landing')}
          className="font-recursive text-ink3 hover:text-ink text-sm"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
        >
          ← back
        </button>
        <h2
          className="font-fraunces text-2xl font-bold text-ink"
          style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0' }}
        >
          Templates
        </h2>
      </div>

      <div className="mb-6">
        <CategoryFilter active={activeCategory} onChange={setCategory} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p
          className="font-recursive text-ink4 text-center py-12 text-sm"
          style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5' }}
        >
          No templates in this category yet.
        </p>
      )}
    </div>
  )
}
