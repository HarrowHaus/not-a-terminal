export type TransformIntent =
  | { type: 'replace-text'; target: string; value: string }
  | { type: 'swap-color'; from: string; to: string }
  | { type: 'remove-section'; key: string }
  | { type: 'add-section'; position: 'before' | 'after'; anchor: string; jsx: string }
  | { type: 'reorder-section'; key: string; direction: 'up' | 'down' }
  | { type: 'change-layout'; target: string; add?: string[]; remove?: string[] }
  | { type: 'swap-icon'; from: string; to: string }
  | { type: 'dark-mode'; enable: boolean }
