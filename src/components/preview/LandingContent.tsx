const FACTS = [
  { label: 'Build', value: 'Unlimited. Free. No token limits.', tag: 'free', tagClass: 'bg-green text-white' },
  { label: 'Go Live', value: '$7/month. Your link. Professional.', tag: '$7', tagClass: 'bg-ink3 text-white' },
  { label: 'Yours', value: 'Download. Edit. Host it yourself.', tag: 'own', tagClass: 'bg-coral text-white' },
] as const

const LABEL_COLORS = ['text-green', 'text-ink', 'text-coral'] as const

const USES = [
  'A website for a bakery that just opened',
  'A portfolio a photographer kept putting off',
  'A landing page to test a startup idea',
  'A blog for someone with something to say',
  'A booking site for a freelance dog walker',
  'A family reunion page, built by the daughter',
]

export function LandingContent() {
  return (
    <div className="p-8 py-8 md:px-9 md:py-11 lg:px-14 lg:py-[52px] xl:px-14 max-w-[620px]">
      {/* Name */}
      <div
        className="font-fraunces font-black leading-[0.88] tracking-[-0.04em] text-[clamp(56px,9vw,88px)] mb-1"
        style={{ fontVariationSettings: '"WONK" 1, "SOFT" 0, "opsz" 144' }}
      >
        not a<br />
        <span className="text-coral">terminal.</span>
      </div>

      {/* Subtitle */}
      <div
        className="font-fraunces italic text-[15px] text-ink4 mb-11 tracking-[0.01em]"
        style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100, "opsz" 24', fontWeight: 200 }}
      >
        definitely not a terminal.
      </div>

      {/* Hero */}
      <div
        className="font-fraunces text-[clamp(22px,3.5vw,30px)] leading-[1.35] text-ink2 mb-3.5"
        style={{ fontVariationSettings: '"WONK" 1, "SOFT" 30, "opsz" 48', fontWeight: 400 }}
      >
        <strong className="font-extrabold text-ink">Describe your idea.</strong>
        <br />
        See it come to life.
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-9" />

      {/* Body */}
      <p
        className="font-recursive text-[14px] leading-[1.95] text-ink2 mb-9 max-w-[460px]"
        style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5', fontWeight: 380 }}
      >
        You describe what you want in plain English. An app appears. You refine
        it by talking to Nat — change colors, add sections, rearrange things.
        When it feels right, go live or download everything.
      </p>

      {/* Facts */}
      <div className="mb-10">
        {FACTS.map((fact, i) => (
          <div
            key={fact.label}
            className={`flex items-center gap-3.5 py-3.5 border-b border-border ${i === 0 ? 'border-t' : ''}`}
          >
            <div className="min-w-[72px] py-1">
              <span
                className={`font-anybody text-[10px] font-extrabold uppercase tracking-[0.12em] ${LABEL_COLORS[i]}`}
                style={{ fontVariationSettings: '"wdth" 130' }}
              >
                {fact.label}
              </span>
            </div>
            <div
              className="font-recursive text-[13px] text-ink2 flex-1"
              style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.4', fontWeight: 400 }}
            >
              {fact.value}
            </div>
            <span
              className={`font-recursive text-[8px] font-semibold uppercase tracking-[0.06em] px-1.5 py-0.5 ${fact.tagClass}`}
              style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 650 }}
            >
              {fact.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div
        className="font-anybody text-[9px] font-bold uppercase tracking-[0.14em] text-ink3 mb-4"
        style={{ fontVariationSettings: '"wdth" 140' }}
      >
        People build all kinds of things
      </div>

      {/* Uses */}
      <div className="mb-10">
        {USES.map((use, i) => (
          <div
            key={i}
            className={`font-recursive text-[13px] leading-[1.8] py-1 ${
              i === 0 ? 'text-ink font-[450]' : 'text-ink2 font-[380]'
            }`}
            style={{ fontVariationSettings: '"MONO" 0, "CASL" 0.5' }}
          >
            <span
              className={`font-recursive text-[9px] mr-2 font-medium ${
                i === 0 ? 'text-coral' : 'text-ink4'
              }`}
              style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 500 }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            {use}
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href="#"
        className="inline-block px-8 py-3.5 bg-coral text-white font-anybody text-[11px] font-bold uppercase tracking-[0.08em] no-underline hover:bg-[#C24A36] transition-colors mb-9"
        style={{ fontVariationSettings: '"wdth" 120' }}
        onClick={(e) => e.preventDefault()}
      >
        Start Building &rarr;
      </a>

      {/* Footer */}
      <div className="pt-5 border-t border-border">
        <div
          className="font-recursive text-[10px] text-ink3 mb-1"
          style={{ fontVariationSettings: '"MONO" 1, "CASL" 0', fontWeight: 550 }}
        >
          this page was built with not a terminal.
        </div>
        <div
          className="font-fraunces italic text-[13px] text-ink4"
          style={{ fontVariationSettings: '"WONK" 1, "SOFT" 90', fontWeight: 200 }}
        >
          type something in the chat to build yours.
        </div>
      </div>
    </div>
  )
}
