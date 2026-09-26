import { useEffect, useRef, useState } from 'react'
import { CORE, person } from '../../data/people'
import { buzz, PeoplePicker } from '../../components/ui'
import { Confetti } from './util'

type Mode = 'uno' | 'elim'

const CX = 100
const R = 96
/** Duración de la transición en games.css (.g-wheel) + un margen */
const SPIN_MS = 4700

/** Elige al azar el gajo ganador y cuántos grados girar para caer en él (fuera del render) */
function randomSpin(n: number, rot: number) {
  const idx = Math.floor(Math.random() * n)
  const seg = 360 / n
  const target = (idx + 0.5 + (Math.random() - 0.5) * 0.7) * seg
  const cur = ((rot % 360) + 360) % 360
  const delta = (360 - target - cur + 720) % 360
  return { idx, rot: rot + 360 * (5 + Math.floor(Math.random() * 3)) + delta }
}

function slicePath(i: number, n: number) {
  if (n === 1) return `M ${CX} ${CX - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CX - R} Z`
  const a0 = (i / n) * 2 * Math.PI
  const a1 = ((i + 1) / n) * 2 * Math.PI
  const p = (a: number) => `${CX + R * Math.sin(a)} ${CX - R * Math.cos(a)}`
  return `M ${CX} ${CX} L ${p(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`
}

export type Slice = { key: string; label: string; emoji: string; color: string }

/**
 * Ruleta SVG genérica: gira a `rot` grados con transición y avisa al terminar.
 * `transitionend` es solo un atajo: si no llega (movimiento reducido, pantalla bloqueada
 * a mitad del giro) un temporizador avisa igual, así el botón nunca se queda en "Girando…".
 */
export function WheelSvg({ slices, rot, onEnd, onClick, hub }: { slices: Slice[]; rot: number; onEnd: () => void; onClick: () => void; hub: string }) {
  const n = slices.length
  const small = n > 6
  const end = useRef(onEnd)
  const fire = useRef<(() => void) | null>(null)
  const prevRot = useRef(rot)
  useEffect(() => {
    end.current = onEnd
  })
  useEffect(() => {
    if (prevRot.current === rot) return
    prevRot.current = rot
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const done = () => {
      if (fire.current !== done) return
      fire.current = null
      window.clearTimeout(t)
      end.current()
    }
    fire.current = done
    const t = window.setTimeout(done, reduced ? 350 : SPIN_MS)
    return () => {
      window.clearTimeout(t)
      if (fire.current === done) fire.current = null
    }
  }, [rot])
  return (
    <div className="g-wheel-wrap">
      <div className="g-pointer" />
      <svg
        viewBox="0 0 200 200"
        className="g-wheel"
        style={{ transform: `rotate(${rot}deg)` }}
        onTransitionEnd={(e) => e.target === e.currentTarget && fire.current?.()}
        onClick={onClick}
      >
        {n === 0 && <circle cx={CX} cy={CX} r={R} fill="var(--chip)" />}
        {slices.map((s, i) => {
          const mid = ((i + 0.5) / n) * 2 * Math.PI
          const tx = CX + R * 0.64 * Math.sin(mid)
          const ty = CX - R * 0.64 * Math.cos(mid)
          const deg = (mid * 180) / Math.PI
          return (
            <g key={s.key}>
              <path d={slicePath(i, n)} fill={s.color} stroke="white" strokeWidth={1.5} />
              <g transform={`translate(${tx} ${ty}) rotate(${deg})`}>
                <text textAnchor="middle" y={-4} fontSize={small ? 12 : 16}>
                  {s.emoji}
                </text>
                <text textAnchor="middle" y={small ? 8 : 11} fontSize={n > 10 ? 5.6 : small ? 7 : 9} fontWeight={800} fill="white">
                  {s.label}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
      <div className="g-hub">{hub}</div>
    </div>
  )
}

export default function Wheel() {
  const [players, setPlayers] = useState<string[]>(CORE)
  const [mode, setMode] = useState<Mode>('uno')
  const [out, setOut] = useState<string[]>([])
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const [loser, setLoser] = useState<string | null>(null)
  const pending = useRef<string | null>(null)

  const alive = players.filter((p) => !out.includes(p))
  const n = alive.length

  const reset = (next = players) => {
    setPlayers(next)
    setOut([])
    setLast(null)
    setLoser(null)
  }

  const spin = () => {
    if (spinning || n < 2 || loser) return
    const r = randomSpin(n, rot)
    pending.current = alive[r.idx]
    setLast(null)
    setSpinning(true)
    setRot(r.rot)
    buzz(10)
  }

  const onEnd = () => {
    const who = pending.current
    if (!who) return
    setSpinning(false)
    pending.current = null
    buzz([60, 40, 120])
    if (mode === 'uno') {
      setLoser(who)
      return
    }
    // Eliminación: el que sale se salva; el último que quede paga
    const nextOut = [...out, who]
    setOut(nextOut)
    setLast(who)
    const rest = players.filter((p) => !nextOut.includes(p))
    if (rest.length === 1) {
      setLoser(rest[0])
      setOut(nextOut)
    }
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="seg">
        <button className={mode === 'uno' ? 'on' : ''} onClick={() => { setMode('uno'); reset() }}>🎯 Uno paga</button>
        <button className={mode === 'elim' ? 'on' : ''} onClick={() => { setMode('elim'); reset() }}>🔥 Eliminación</button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        {mode === 'uno' ? 'Un giro y al que le toque… ¡paga la cuenta!' : 'Cada giro salva a alguien. El último que queda en la ruleta paga. 😈'}
      </p>

      <WheelSvg
        slices={alive.map((id) => ({ key: id, emoji: person(id).emoji, label: person(id).name.split(' ')[0], color: person(id).color }))}
        rot={rot}
        onEnd={onEnd}
        onClick={spin}
        hub="💸"
      />

      {loser ? (
        <div className="card hero center col g-result" style={{ alignItems: 'center' }}>
          <Confetti />
          <div style={{ fontSize: 54 }}>{person(loser).emoji}</div>
          <div className="big">¡{person(loser).name} paga!</div>
          <div className="muted">Ni modo, carnal. Saca la cartera 💳</div>
          <button className="btn ghost" onClick={() => reset()} style={{ marginTop: 6 }}>Otra vez</button>
        </div>
      ) : (
        <>
          {last && mode === 'elim' && (
            <div className="card turq center g-result" key={last}>
              😮‍💨 <b>{person(last).name}</b> se salvó. Quedan {n}.
            </div>
          )}
          <button className="btn primary block" onClick={spin} disabled={spinning || n < 2}>
            {spinning ? 'Girando…' : n < 2 ? 'Elige al menos 2' : '¡Girar! 🎡'}
          </button>
        </>
      )}

      {mode === 'elim' && out.length > 0 && (
        <div className="row wrap small">
          <span className="muted">Salvados:</span>
          {out.map((id) => (
            <span key={id} className="chip g-out">{person(id).emoji} {person(id).name}</span>
          ))}
        </div>
      )}

      <div className="card col">
        <b className="small">¿Quiénes entran?</b>
        <PeoplePicker multi value={players} onChange={(v) => !spinning && reset(v)} />
      </div>
    </div>
  )
}
