/**
 * Banner — thin "early preview" strip below the header.
 * Honest signal that the template library is small and growing.
 */
export function Banner() {
  return (
    <div className="shrink-0 bg-coral/10 border-b border-coral/20 px-4 py-1.5 text-center">
      <span
        className="font-recursive text-[10px] text-coral"
        style={{ fontVariationSettings: '"MONO" 1, "CASL" 0' }}
      >
        Early preview — small template library, growing fast.
      </span>
    </div>
  )
}
