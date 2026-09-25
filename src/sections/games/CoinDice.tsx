import { useState } from 'react'
import { buzz } from '../../components/ui'

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={`g-die${rolling ? ' rolling' : ''}`} aria-label={`Dado: ${value}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ display: 'grid' }}>{PIPS[value].includes(i) && <i />}</span>
      ))}
    </div>
  )
}

const roll = () => 1 + Math.floor(Math.random() * 6)

export default function CoinDice() {
  // Moneda
  const [deg, setDeg] = useState(0)
  const [side, setSide] = useState<'águila' | 'sol' | null>(null)
  const [flipping, setFlipping] = useState(false)

  const flip = () => {
    if (flipping) return
    const res = Math.random() < 0.5 ? 'águila' : 'sol'
    const target = res === 'águila' ? 0 : 180
    const base = deg + 360 * 5
    setDeg(base + ((target - (base % 360) + 360) % 360))
    setSide(null)
    setFlipping(true)
    buzz(10)
    window.setTimeout(() => {
      setSide(res)
      setFlipping(false)
      buzz([30, 30, 60])
    }, 1650)
  }

  // Dados
  const [count, setCount] = useState(2)
  const [dice, setDice] = useState<number[]>([6, 6])
  const [rolling, setRolling] = useState(false)

  const rollDice = () => {
    if (rolling) return
    setRolling(true)
    let n = 0
    const t = window.setInterval(() => {
      setDice(Array.from({ length: count }, roll))
      if (++n > 8) {
        window.clearInterval(t)
        setRolling(false)
        buzz([20, 20, 60])
      }
    }, 80)
  }

  // Número del 1 al N
  const [max, setMax] = useState(10)
  const [num, setNum] = useState<{ v: number; k: number } | null>(null)

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card col" style={{ alignItems: 'center' }}>
        <b>🪙 ¿Águila o sol?</b>
        <div className="g-coin-wrap" onClick={flip}>
          <div className="g-coin" style={{ transform: `rotateY(${deg}deg)` }}>
            <div className="front">🦅<span>ÁGUILA</span></div>
            <div className="back">☀️<span>SOL · $10</span></div>
          </div>
        </div>
        <div className="big g-result" key={side ?? 'x'} style={{ fontSize: 26, minHeight: 30 }}>
          {side ? `¡${side[0].toUpperCase()}${side.slice(1)}!` : flipping ? '…' : ' '}
        </div>
        <button className="btn primary block" onClick={flip} disabled={flipping}>Lanzar moneda</button>
      </div>

      <div className="card col">
        <div className="row between">
          <b>🎲 Dados</b>
          <div className="seg" style={{ flex: 'none' }}>
            {[1, 2, 3].map((c) => (
              <button key={c} className={count === c ? 'on' : ''} onClick={() => { setCount(c); setDice(Array.from({ length: c }, () => 6)) }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="g-dice" onClick={rollDice}>
          {dice.map((v, i) => (
            <Die key={i} value={v} rolling={rolling} />
          ))}
        </div>
        {!rolling && count > 1 && <div className="center muted small">Total: <b>{dice.reduce((a, b) => a + b, 0)}</b></div>}
        <button className="btn turq block" onClick={rollDice} disabled={rolling}>Tirar dados</button>
      </div>

      <div className="card col">
        <b>🔢 Número al azar</b>
        <div className="row">
          <span className="small muted">Del 1 al</span>
          <input className="input" type="number" min={2} max={1000} value={max} onChange={(e) => setMax(Math.max(2, Math.min(1000, Number(e.target.value) || 2)))} style={{ width: 90 }} />
          <button className="btn cempa grow" onClick={() => { setNum((o) => ({ v: 1 + Math.floor(Math.random() * max), k: (o?.k ?? 0) + 1 })); buzz(20) }}>Sacar</button>
        </div>
        {num && <div className="big center g-result" key={num.k}>{num.v}</div>}
      </div>
    </div>
  )
}
