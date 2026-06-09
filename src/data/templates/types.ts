export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'color' | 'toggle'
  default: string | boolean
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  fields: TemplateField[]
  code: string
}
