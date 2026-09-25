import { useState } from 'react'
import { PEOPLE, person } from '../../data/people'
import { Avatar, buzz } from '../../components/ui'
import { useMe } from '../../lib/me'
import { put, remove, useItems } from '../../lib/store'
import { BINGO_CELLS, BINGO_FREE } from './content'
import { Confetti } from './util'

type Mark = { cell: number; person: string }

const LINES: number[][] = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

function score(cells: Set<number>) {
  const full = LINES.filter((l) => l.every((i) => cells.has(i)))
  return { marked: cells.size - 1, lines: full.length, inLine: new Set(full.flat()) }
}

export default function Bingo() {
  const me = useMe() ?? PEOPLE[0].id
  const [view, setView] = useState(me)
  const [party, setParty] = useState(false)
  const marks = useItems<Mark>('bingo')

  const byPerson = new Map<string, Set<number>>()
  for (const p of PEOPLE) byPerson.set(p.id, new Set([BINGO_FREE]))
  for (const m of marks) byPerson.get(m.data.person)?.add(m.data.cell)

  const cells = byPerson.get(view) ?? new Set([BINGO_FREE])
  const { inLine, lines } = score(cells)
  const mine = view === me

  const toggle = (i: number) => {
    if (!mine || i === BINGO_FREE) return
    const id = `bingo:${i}:${me}`
    if (cells.has(i)) {
      remove(id)
      buzz(8)
    } else {
      const next = new Set(cells).add(i)
      put('bingo', id, { cell: i, person: me })
      if (score(next).lines > lines) {
        buzz([80, 40, 80, 40, 160])
        setParty(true)
        window.setTimeout(() => setParty(false), 3500)
      } else buzz(15)
    }
  }

  const board = PEOPLE.map((p) => ({ id: p.id, ...score(byPerson.get(p.id)!) }))
    .filter((r) => r.marked > 0 || r.id === me)
    .sort((a, b) => b.lines - a.lines || b.marked - a.marked)

  return (
    <div className="col" style={{ gap: 12 }}>
      {party && <Confetti n={90} />}
      <div className="chips">
        {PEOPLE.map((p) => (
          <button key={p.id} className={`chip${view === p.id ? ' on' : ''}`} onClick={() => setView(p.id)}>
            {p.emoji} {p.id === me ? 'Yo' : p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="row between">
        <b>{mine ? 'Mi tablero' : `Tablero de ${person(view).name}`}</b>
        <span className="small muted">
          {lines > 0 ? `🎉 ${lines} línea${lines > 1 ? 's' : ''}` : `${cells.size - 1}/24`}
        </span>
      </div>

      <div className="g-bingo">
        {BINGO_CELLS.map((c, i) => {
          const on = cells.has(i)
          const cls = inLine.has(i) ? 'line' : on ? 'on' : ''
          return (
            <button key={i} className={cls} onClick={() => toggle(i)} disabled={!mine || i === BINGO_FREE} title={c.text}>
              {c.emoji}
              <small>{c.text}</small>
            </button>
          )
        })}
      </div>
      {!mine && <p className="small muted center" style={{ margin: 0 }}>Solo puedes marcar tu propio tablero 😉</p>}

      <div className="card col" style={{ gap: 6 }}>
        <b>Tabla de posiciones</b>
        {board.map((r, i) => (
          <div key={r.id} className="row">
            <span className="muted small" style={{ width: 18 }}>{i + 1}.</span>
            <Avatar id={r.id} />
            <span className="grow">{person(r.id).name}</span>
            {r.lines > 0 && <span className="tag ok">BINGO ×{r.lines}</span>}
            <b>{r.marked}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
