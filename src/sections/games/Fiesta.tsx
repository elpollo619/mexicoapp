import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CORE, person } from '../../data/people'
import { buzz } from '../../components/ui'
import { FIESTA, sober, type FiestaCard } from './drinks'
import { shuffle, SoberToggle } from './util'

type Shown = { kind: FiestaCard['type'] | 'fin'; text: string }
type Pending = { at: number; text: string }

const KIND_LABEL: Record<Shown['kind'], string> = {
  todos: '🍻 Para todos',
  regla: '🎯 Regla',
  reto: '🔥 Reto',
  voto: '🗳️ Votación',
  virus: '🦠 Virus',
  fin: '✅ Fin del virus',
}
const KIND_CLASS: Record<Shown['kind'], string> = {
  todos: 'suave',
  regla: 'verdad',
  reto: 'reto',
  voto: 'picante',
  virus: 'virus',
  fin: 'suave',
}

const fill = (text: string, a: string, b: string) => text.replaceAll('{A}', a).replaceAll('{B}', b)

export default function Fiesta() {
  const [names, setNames] = useState<string[]>(() => CORE.map((id) => person(id).name))
  const [newName, setNewName] = useState('')
  const [playing, setPlaying] = useState(false)
  const [noAlc, setNoAlc] = useState(false)
  const [card, setCard] = useState<Shown | null>(null)
  const [count, setCount] = useState(0)
  const deck = useRef<FiestaCard[]>([])
  const virus = useRef<Pending[]>([])

  const withPablo = names.includes('Pablo')
  const togglePablo = () =>
    setNames((n) => (withPablo ? n.filter((x) => x !== 'Pablo' && x !== 'Invitad@') : [...n, 'Pablo', 'Invitad@']))

  const add = () => {
    const v = newName.trim()
    if (v && !names.includes(v)) setNames([...names, v])
    setNewName('')
  }

  const next = () => {
    const turn = count + 1
    // ¿Toca terminar un virus?
    const due = virus.current.find((v) => v.at <= turn)
    if (due) {
      virus.current = virus.current.filter((v) => v !== due)
      setCard({ kind: 'fin', text: due.text })
    } else {
      if (!deck.current.length) deck.current = shuffle(FIESTA)
      let c = deck.current.pop()!
      // No más de 2 virus activos a la vez
      if (c.type === 'virus' && virus.current.length >= 2) {
        const alt = deck.current.findIndex((x) => x.type !== 'virus')
        if (alt >= 0) c = deck.current.splice(alt, 1)[0]
      }
      const [a, b] = shuffle(names)
      const text = fill(c.text, a, b ?? a)
      if (c.type === 'virus') virus.current.push({ at: turn + 4 + Math.floor(Math.random() * 5), text: fill(c.end, a, b ?? a) })
      setCard({ kind: c.type, text })
    }
    setCount(turn)
    buzz(10)
  }

  if (!playing) {
    return (
      <div className="col" style={{ gap: 14 }}>
        <div className="card col">
          <b>Jugadores</b>
          <div className="row wrap" style={{ gap: 6 }}>
            {names.map((n) => (
              <span key={n} className="chip">
                {n}
                <button aria-label={`Quitar a ${n}`} onClick={() => setNames(names.filter((x) => x !== n))} style={{ border: 'none', background: 'none', padding: 0, display: 'grid' }}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="row">
            <input className="input" placeholder="Agregar a alguien…" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
            <button className="iconbtn" onClick={add} aria-label="Agregar">
              <Plus size={18} />
            </button>
          </div>
          <label className="row small" style={{ gap: 8 }}>
            <input type="checkbox" checked={withPablo} onChange={togglePablo} />
            Modo Guadalajara: con Pablo e invitad@ 🎂
          </label>
        </div>
        <SoberToggle value={noAlc} onChange={setNoAlc} />
        <button className="btn primary block" disabled={names.length < 2} onClick={() => { setPlaying(true); deck.current = shuffle(FIESTA); virus.current = []; setCount(0); setCard(null) }}>
          {names.length < 2 ? 'Mínimo 2 jugadores' : '¡Que empiece la fiesta! 🎉'}
        </button>
      </div>
    )
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row between small">
        <span className="muted">Carta {count} · {names.length} jugadores</span>
        <button className="btn ghost small" onClick={() => setPlaying(false)}>Jugadores</button>
      </div>
      {card ? (
        <div className={`g-deck ${KIND_CLASS[card.kind]}`} key={count} onClick={next}>
          <small>{KIND_LABEL[card.kind]}</small>
          {noAlc ? sober(card.text) : card.text}
          <small style={{ textTransform: 'none', letterSpacing: 0 }}>Toca para la siguiente →</small>
        </div>
      ) : (
        <div className="g-deck suave" onClick={next}>
          <small>🎉 Fiesta</small>
          Llenen los vasos (de agua también cuenta) y toquen aquí para la primera carta.
        </div>
      )}
      <button className="btn primary block" onClick={next}>Siguiente carta</button>
    </div>
  )
}
