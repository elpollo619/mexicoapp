import { useEffect, useState, type CSSProperties } from 'react'
import { Pencil, Trash2, Undo2 } from 'lucide-react'
import { person } from '../../data/people'
import { todayOnTrip } from '../../data/trip'
import { useMe } from '../../lib/me'
import { put, remove, useItems } from '../../lib/store'
import { toast } from '../../lib/toast'
import { Avatar, buzz, name } from '../../components/ui'
import './birthday.css'

const BDAY = '2026-10-12'
const PABLO = 'pablo'
const SHOTS_ID = 'bday:shots'
const MAX = 140
const PIECES = 60
const CONFETTI_MS = 6000
const COLORS = ['#d1006b', '#e89a0c', '#00857f', '#2f7d4f', '#c8322f', '#8e44ad', '#2980b9', '#ffd166']

/** Mensaje de una persona para Pablo (uno por persona: id `bday:<persona>`) */
type Msg = { text: string; at: string; for: 'pablo' }
/** Contador de shots del cumpleañero (id `bday:shots`); `last` es quien tocó por última vez, para poder deshacer */
type Shots = { count: number; by: Record<string, number>; at: string; last?: string }

const iso = () => new Date().toISOString()
/** Días que faltan para el cumple desde una fecha YYYY-MM-DD */
const daysUntil = (today: string) => Math.round((Date.parse(BDAY) - Date.parse(today)) / 86_400_000)

/** Chip de aviso los 3 días antes (9–11 oct): "Faltan N días para el cumple de Pablo 🎂" */
export function PabloTeaser({ now }: { now: number }) {
  const n = daysUntil(todayOnTrip(now))
  if (n < 1 || n > 3) return null
  return (
    <span className="chip bday-chip">
      {n === 1 ? 'Falta 1 día' : `Faltan ${n} días`} para el cumple de Pablo 🎂
    </span>
  )
}

/** Modo Pablo: el 12 de octubre (en la zona del viaje) aparece la fiesta en Inicio. `force` lo muestra siempre (pruebas). */
export default function PabloDay({ now, force }: { now: number; force?: boolean }) {
  if (!force && todayOnTrip(now) !== BDAY) return null
  return (
    <>
      <Party />
      <Messages />
      <ShotCounter />
    </>
  )
}

type Piece = { x: number; c: string; s: number; d: number; delay: number; r: number; sway: number }

function makePieces(): Piece[] {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return []
  return Array.from({ length: PIECES }, () => ({
    x: Math.random() * 100,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
    s: 6 + Math.random() * 6,
    d: 2.2 + Math.random() * 2.2,
    delay: Math.random() * 1.5,
    r: (Math.random() - 0.5) * 900,
    sway: (Math.random() - 0.5) * 80,
  }))
}

type Burst = { id: number; pieces: Piece[] }
const newBurst = (): Burst => ({ id: Date.now(), pieces: makePieces() })

/** Tarjeta festiva con confeti (CSS puro); se relanza tocándola y se apaga sola a los ~6 s */
function Party() {
  const [burst, setBurst] = useState<Burst>(newBurst)
  const { id, pieces } = burst
  useEffect(() => {
    if (!pieces.length) return
    const t = setTimeout(() => setBurst({ id, pieces: [] }), CONFETTI_MS)
    return () => clearTimeout(t)
  }, [id, pieces])
  const fire = () => {
    buzz([10, 40, 10])
    setBurst(newBurst())
  }
  return (
    <button className="card bday col" style={{ gap: 6 }} onClick={fire} aria-label="¡Feliz cumple, Pablo! Toca para más confeti">
      <div className="row" style={{ gap: 12 }}>
        <span className="bday-cake" aria-hidden>
          🎂
        </span>
        <div className="col grow" style={{ gap: 2 }}>
          <span className="label" style={{ color: 'var(--rosa)' }}>
            Modo Pablo · Guadalajara
          </span>
          <span className="bday-title">¡Feliz cumple, Pablo!</span>
          <span style={{ fontWeight: 700 }}>30 años invicto 🥂</span>
        </div>
      </div>
      <span className="tiny muted">Toca la tarjeta para más confeti</span>
      {pieces.length > 0 && (
        <span className="bday-confetti" aria-hidden>
          {pieces.map((p, i) => (
            <i
              key={`${id}-${i}`}
              style={{ '--x': `${p.x}%`, '--c': p.c, '--s': `${p.s}px`, '--d': `${p.d}s`, '--delay': `${p.delay}s`, '--r': `${p.r}deg`, '--sway': `${p.sway}px` } as CSSProperties}
            />
          ))}
        </span>
      )}
    </button>
  )
}

/** Mensajes para Pablo: uno por persona (se puede editar o borrar el propio); Pablo los ve todos */
function Messages() {
  const me = useMe()!
  const notes = useItems<Msg>('note').filter((n) => n.id.startsWith('bday:') && n.id !== SHOTS_ID && n.data.for === PABLO)
  const mine = notes.find((n) => n.id === `bday:${me}`)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const isPablo = me === PABLO
  const showForm = !isPablo && (!mine || editing)

  const save = () => {
    const t = text.trim().slice(0, MAX)
    if (!t) return
    put('note', `bday:${me}`, { text: t, at: iso(), for: PABLO } satisfies Msg)
    setEditing(false)
    setText('')
    buzz()
    toast(mine ? 'Mensaje actualizado 💌' : 'Mensaje para Pablo enviado 💌')
  }
  const edit = () => {
    setText(mine?.data.text ?? '')
    setEditing(true)
  }
  const del = () => {
    if (!mine) return
    remove(mine.id)
    setEditing(false)
    setText('')
    toast('Mensaje borrado')
  }

  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="row between">
        <span className="label">{isPablo ? '🎉 Mensajes para ti' : '💌 Mensajes para Pablo'}</span>
        {notes.length > 0 && (
          <span className="tag ok">
            {notes.length} {notes.length === 1 ? 'mensaje' : 'mensajes'}
          </span>
        )}
      </div>
      {isPablo && notes.length === 0 && <span className="small muted">Todavía nadie te escribió… dales chance, están pidiendo el desayuno.</span>}
      {!isPablo && notes.length === 0 && !showForm && <span className="small muted">Aún no hay mensajes.</span>}
      {notes.map((n) => {
        const who = n.id.slice('bday:'.length)
        const own = who === me
        return (
          <div key={n.id} className="bday-msg">
            <Avatar id={who} />
            <div className="col" style={{ gap: 2 }}>
              <div className="row between" style={{ gap: 6 }}>
                <span className="who ellipsis">
                  {name(who)} <span className="muted" style={{ fontWeight: 500 }}>· {person(who).nickname}</span>
                </span>
                {own && !editing && (
                  <span className="ops">
                    <button className="btn ghost" onClick={edit} aria-label="Editar mi mensaje">
                      <Pencil size={15} />
                    </button>
                    <button className="btn ghost" onClick={del} aria-label="Borrar mi mensaje">
                      <Trash2 size={15} />
                    </button>
                  </span>
                )}
              </div>
              <p>{n.data.text}</p>
            </div>
          </div>
        )
      })}
      {showForm && (
        <div className="col" style={{ gap: 6 }}>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Algo corto y con cariño (o con burla)…"
            maxLength={MAX}
            aria-label="Mensaje para Pablo"
          />
          <div className="row between">
            <span className="tiny muted num">
              {text.length}/{MAX}
            </span>
            <span className="row" style={{ gap: 6 }}>
              {editing && (
                <button className="btn ghost small" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              )}
              <button className="btn primary small" onClick={save} disabled={!text.trim()}>
                {mine ? 'Actualizar' : 'Enviar 🎈'}
              </button>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

/** Contador de shots del cumpleañero: cualquiera suma; solo quien tocó último puede restar uno */
function ShotCounter() {
  const me = useMe()!
  const shots = useItems<Shots>('note').find((n) => n.id === SHOTS_ID)?.data
  const total = shots?.count ?? 0
  const ranking = Object.entries(shots?.by ?? {}).sort((a, b) => b[1] - a[1])
  const top = ranking[0]
  const canUndo = !!shots && shots.last === me && (shots.by[me] ?? 0) > 0

  const add = () => {
    buzz(20)
    const by = { ...(shots?.by ?? {}) }
    by[me] = (by[me] ?? 0) + 1
    put('note', SHOTS_ID, { count: total + 1, by, at: iso(), last: me } satisfies Shots)
    toast(total + 1 === 30 ? '¡30 shots! Uno por año 🥃🎂' : '¡Salud, Pablo! 🥃')
  }
  const undo = () => {
    if (!shots || !canUndo) return
    const by = { ...shots.by }
    by[me] = by[me] - 1
    if (by[me] <= 0) delete by[me]
    put('note', SHOTS_ID, { count: Math.max(0, shots.count - 1), by, at: iso() } satisfies Shots)
    toast('Shot deshecho (no pasó nada)')
  }

  return (
    <section className="card col" style={{ gap: 10 }}>
      <span className="label">🥃 Shots del cumpleañero</span>
      <div className="bday-shots">
        <div className="col" style={{ gap: 2 }}>
          <span className="big num bday-total">{total}</span>
          <span className="small muted">
            {total === 0 ? 'Todavía va sobrio. Arréglenlo.' : total === 1 ? 'shot invitado a Pablo' : 'shots invitados a Pablo'}
          </span>
          {top && (
            <span className="small row" style={{ gap: 6 }}>
              <Avatar id={top[0]} size={22} />
              <span className="ellipsis">
                <b>{name(top[0])}</b> es quien más invita ({top[1]})
              </span>
            </span>
          )}
        </div>
        <button className="btn primary bday-plus" onClick={add} aria-label="Sumar un shot a Pablo">
          +1 🥃
        </button>
      </div>
      {canUndo && (
        <button className="btn ghost small" onClick={undo} style={{ alignSelf: 'flex-start' }}>
          <Undo2 size={14} /> −1 (fue sin querer)
        </button>
      )}
      {ranking.length > 1 && (
        <span className="tiny muted ellipsis">
          {ranking
            .slice(0, 5)
            .map(([id, n]) => `${name(id)} ${n}`)
            .join(' · ')}
        </span>
      )}
    </section>
  )
}
