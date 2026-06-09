function App() {
  return (
    <div className="min-h-screen bg-bg text-ink p-8">
      <h1
        className="font-fraunces text-7xl leading-tight"
        style={{ fontVariationSettings: "'WONK' 1, 'SOFT' 0" }}
      >
        not a <span className="text-coral">terminal.</span>
      </h1>

      <p
        className="font-fraunces text-2xl italic mt-2 text-ink/60"
        style={{ fontVariationSettings: "'WONK' 1, 'SOFT' 100" }}
      >
        definitely not a terminal.
      </p>

      <p
        className="font-recursive text-lg mt-6"
        style={{ fontVariationSettings: "'MONO' 1, 'CASL' 0" }}
      >
        scaffold complete — all systems nominal
      </p>

      <p
        className="font-recursive text-lg mt-2"
        style={{ fontVariationSettings: "'MONO' 0, 'CASL' 0.5" }}
      >
        this is the warm human voice
      </p>

      <p
        className="font-anybody text-sm uppercase tracking-widest mt-6 text-green font-bold"
        style={{ fontVariationSettings: "'wdth' 130" }}
      >
        BUILD &middot; LIVE &middot; YOURS
      </p>

      <div className="mt-8 p-4 bg-surface rounded-lg inline-block">
        <p className="font-recursive text-sm" style={{ fontVariationSettings: "'MONO' 1, 'CASL' 0" }}>
          <span className="text-green">&#9679;</span> ready
        </p>
      </div>
    </div>
  )
}

export default App
