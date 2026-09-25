import { useMemo, useRef, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { buzz } from '../../components/ui'
import { YO_NUNCA, type NuncaCard } from './content'
import { shuffle } from './util'

type Level = 'suave' | 'picante' | 'todo'

export default function YoNunca() {
  const [level, setLevel] = useState<Level>('suave')
  const [seed, setSeed] = useState(0)
  const [i, setI] = useState(0)
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)

  const deck: NuncaCard[] = useMemo(
    () => shuffle(YO_NUNCA.filter((c) => level === 'todo' || c.level === level)),
    // `seed` vuelve a barajar
    [level, seed],
  )
  const card = deck[i % deck.length]

  const next = (dir = 1) => {
    buzz(8)
    setI((x) => (x + dir + deck.length) % deck.length)
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="seg">
        {(['suave', 'picante', 'todo'] as Level[]).map((l) => (
          <button key={l} className={level === l ? 'on' : ''} onClick={() => { setLevel(l); setI(0) }}>
            {l === 'suave' ? '😇 Suave' : l === 'picante' ? '🌶️ Picante' : '🎲 Todo'}
          </button>
        ))}
      </div>

      <div
        key={`${level}-${seed}-${i}`}
        className={`g-deck ${card.level}`}
        onClick={() => {
          if (swiped.current) {
            swiped.current = false
            return
          }
          next()
        }}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return
          const dx = e.clientX - startX.current
          startX.current = null
          if (Math.abs(dx) > 60) {
            swiped.current = true
            window.setTimeout(() => (swiped.current = false), 400)
            next(dx < 0 ? 1 : -1)
          }
        }}
      >
        <small>{card.level === 'suave' ? '😇 suave' : '🌶️ picante'} · {(i % deck.length) + 1}/{deck.length}</small>
        {card.text}
        <small style={{ textTransform: 'none', letterSpacing: 0 }}>Si lo has hecho… ¡toma! 🥃</small>
      </div>

      <div className="row">
        <button className="btn ghost" onClick={() => next(-1)}>←</button>
        <button className="btn primary grow" onClick={() => next()}>Siguiente</button>
        <button className="iconbtn" onClick={() => { setSeed((s) => s + 1); setI(0) }} aria-label="Barajar">
          <Shuffle size={18} />
        </button>
      </div>
      <p className="small muted center" style={{ margin: 0 }}>Toca la carta o desliza para pasar. Con agua también cuenta 💧</p>
    </div>
  )
}
