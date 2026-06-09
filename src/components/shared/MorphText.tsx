interface MorphTextProps {
  children: string
  evolved: boolean
}

export function MorphText({ children, evolved }: MorphTextProps) {
  return (
    <div
      className="font-recursive text-base text-ink2 mb-3"
      style={{
        fontVariationSettings: evolved
          ? '"MONO" 0, "CASL" 0.5'
          : '"MONO" 1, "CASL" 0',
        fontWeight: 450,
        transition: 'font-variation-settings 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  )
}
