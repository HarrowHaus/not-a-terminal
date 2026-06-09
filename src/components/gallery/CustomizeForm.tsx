import { useTemplateStore } from '../../stores/template'
import { templates } from '../../data/templates'

const COLORS = [
  'blue', 'indigo', 'purple', 'violet', 'fuchsia', 'rose',
  'red', 'orange', 'amber', 'emerald', 'teal', 'sky', 'cyan',
]

export function CustomizeForm() {
  const selectedId = useTemplateStore((s) => s.selectedId)
  const customizations = useTemplateStore((s) => s.customizations)
  const updateField = useTemplateStore((s) => s.updateField)

  const template = templates.find((t) => t.id === selectedId)
  if (!template) return null

  return (
    <div className="shrink-0 border-b border-border bg-bg2 px-4 py-3">
      <div className="flex flex-wrap gap-4 items-end">
        {template.fields.map((field) => {
          if (field.type === 'text') {
            return (
              <label key={field.key} className="flex flex-col gap-1">
                <span
                  className="font-recursive text-[9px] text-ink4 uppercase tracking-[0.08em] font-semibold"
                  style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
                >
                  {field.label}
                </span>
                <input
                  type="text"
                  value={(customizations[field.key] as string) ?? field.default}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="font-recursive px-2.5 py-1.5 border border-border rounded bg-surface text-ink text-[12px] w-40 outline-none focus:border-ink"
                  style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
                />
              </label>
            )
          }
          if (field.type === 'color') {
            return (
              <label key={field.key} className="flex flex-col gap-1">
                <span
                  className="font-recursive text-[9px] text-ink4 uppercase tracking-[0.08em] font-semibold"
                  style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
                >
                  {field.label}
                </span>
                <select
                  value={(customizations[field.key] as string) ?? field.default}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="font-recursive px-2.5 py-1.5 border border-border rounded bg-surface text-ink text-[12px] outline-none focus:border-ink"
                  style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
                >
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )
          }
          if (field.type === 'toggle') {
            return (
              <label key={field.key} className="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  checked={(customizations[field.key] as boolean) ?? field.default}
                  onChange={(e) => updateField(field.key, e.target.checked)}
                  className="accent-coral w-3.5 h-3.5"
                />
                <span
                  className="font-recursive text-[10px] text-ink3"
                  style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
                >
                  {field.label}
                </span>
              </label>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
