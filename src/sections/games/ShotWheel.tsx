import { useRef, useState } from 'react'
import { buzz } from '../../components/ui'
import { SHOT_WHEEL } from './drinks'
import { Confetti, SoberToggle } from './util'
import { WheelSvg } from './Wheel'

export default function ShotWheel() {
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [noAlc, setNoAlc] = useState(false)
  const pending = useRef<number | null>(null)
  const n = SHOT_WHEEL.length

  const spin = () => {
    if (spinning) return
    const idx = Math.floor(Math.random() * n)
    const seg = 360 / n
    const target = (idx + 0.5 + (Math.random() - 0.5) * 0.7) * seg
    const cur = ((rot % 360) + 360) % 360
    const delta = (360 - target - cur + 720) % 360
    pending.current = idx
    setResult(null)
    setSpinning(true)
    setRot(rot + 360 * (5 + Math.floor(Math.random() * 3)) + delta)
    buzz(10)
  }

  const onEnd = () => {
    if (pending.current === null) return
    setResult(pending.current)
    pending.current = null
    setSpinning(false)
    buzz([60, 40, 120])
  }

  const r = result !== null ? SHOT_WHEEL[result] : null

  return (
    <div className="col" style={{ gap: 12 }}>
      <SoberToggle value={noAlc} onChange={setNoAlc} />
      <WheelSvg
        slices={SHOT_WHEEL.map((s, i) => ({ key: String(i), emoji: s.emoji, label: s.label, color: s.color }))}
        rot={rot}
        onEnd={onEnd}
        onClick={spin}
        hub={noAlc ? '🧃' : '🥃'}
      />
      {r && (
        <div className="card hero center col g-result" key={`${result}-${rot}`} style={{ alignItems: 'center', background: r.color }}>
          {(r.label === 'Todos toman' || r.label === 'Brindis Pablo') && <Confetti n={40} />}
          <div style={{ fontSize: 44 }}>{r.emoji}</div>
          <div className="big" style={{ fontSize: 26 }}>{r.label}</div>
          <div>{noAlc ? r.sober : r.text}</div>
        </div>
      )}
      <button className="btn primary block" onClick={spin} disabled={spinning}>
        {spinning ? 'Girando…' : '¡Girar! 🎡'}
      </button>
      <p className="small muted center" style={{ margin: 0 }}>Pásense el teléfono: cada quien gira en su turno.</p>
    </div>
  )
}
