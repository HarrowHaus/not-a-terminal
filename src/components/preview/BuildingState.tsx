import { useState, useEffect } from 'react'
import { MorphText } from '../shared/MorphText'

export function BuildingState() {
  const [evolved, setEvolved] = useState(false)
  const [text, setText] = useState('nat is building...')

  useEffect(() => {
    const morphTimer = setTimeout(() => setEvolved(true), 100)
    const doneTimer = setTimeout(() => {
      setText('done — your app preview would render here.')
    }, 2800)

    return () => {
      clearTimeout(morphTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <MorphText evolved={evolved}>{text}</MorphText>
      <div
        className="font-fraunces italic text-[13px] text-ink4"
        style={{ fontVariationSettings: '"WONK" 1, "SOFT" 80', fontWeight: 200 }}
      >
        your app preview will appear here
      </div>
    </div>
  )
}
