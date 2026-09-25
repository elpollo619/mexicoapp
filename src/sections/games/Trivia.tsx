import { useState } from 'react'
import { CORE, person } from '../../data/people'
import { Avatar, buzz, PeoplePicker } from '../../components/ui'
import { useMe } from '../../lib/me'
import { TRIVIA, type TriviaQ } from './content'
import { Confetti, shuffle } from './util'

type Game = { players: string[]; qs: TriviaQ[]; turn: number; scores: Record<string, number>; picked: number | null }

export default function Trivia() {
  const me = useMe()
  const [players, setPlayers] = useState<string[]>(me ? [me] : CORE)
  const [rounds, setRounds] = useState(5)
  const [game, setGame] = useState<Game | null>(null)

  const start = () => {
    // Mismo número de preguntas para cada jugador
    const total = Math.floor(Math.min(TRIVIA.length, rounds * players.length) / players.length) * players.length
    // Barajar también las opciones de cada pregunta
    const qs = shuffle(TRIVIA)
      .slice(0, total)
      .map((q) => {
        const order = shuffle(q.options.map((_, i) => i))
        return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
      })
    setGame({ players: shuffle(players), qs, turn: 0, scores: Object.fromEntries(players.map((p) => [p, 0])), picked: null })
  }

  if (!game) {
    return (
      <div className="col" style={{ gap: 14 }}>
        <div className="card col">
          <b>¿Quiénes juegan?</b>
          <PeoplePicker multi value={players} onChange={setPlayers} />
        </div>
        <div className="card col">
          <b>Preguntas por persona</b>
          <div className="seg">
            {[3, 5, 8].map((r) => (
              <button key={r} className={rounds === r ? 'on' : ''} onClick={() => setRounds(r)}>
                {r}
              </button>
            ))}
          </div>
          <span className="small muted">{TRIVIA.length} preguntas de geografía, comida, historia y los lugares del viaje. Se pasan el teléfono.</span>
        </div>
        <button className="btn primary block" disabled={!players.length} onClick={start}>
          ¡A jugar! 🧠
        </button>
      </div>
    )
  }

  const finished = game.turn >= game.qs.length
  const ranking = Object.entries(game.scores).sort((a, b) => b[1] - a[1])

  if (finished) {
    const top = ranking[0]?.[1] ?? 0
    const winners = ranking.filter(([, s]) => s === top).map(([p]) => p)
    return (
      <div className="col" style={{ gap: 14 }}>
        <Confetti />
        <div className="card hero center col g-result" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: 50 }}>🏆</div>
          <div className="big">{winners.map((w) => person(w).name).join(' y ')}</div>
          <div className="muted">{winners.length > 1 ? '¡Empate! Desempaten con un shot 🥃' : '¡Sabe más de México que un chilango!'}</div>
        </div>
        <Scores ranking={ranking} />
        <div className="row">
          <button className="btn primary grow" onClick={start}>Revancha</button>
          <button className="btn ghost" onClick={() => setGame(null)}>Cambiar jugadores</button>
        </div>
      </div>
    )
  }

  const q = game.qs[game.turn]
  const who = game.players[game.turn % game.players.length]
  const answered = game.picked !== null

  const answer = (i: number) => {
    if (answered) return
    const ok = i === q.answer
    buzz(ok ? [30, 30, 30] : 150)
    setGame({ ...game, picked: i, scores: ok ? { ...game.scores, [who]: game.scores[who] + 1 } : game.scores })
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row between">
        <div className="row">
          <Avatar id={who} />
          <b>Le toca a {person(who).name}</b>
        </div>
        <span className="muted small">
          {game.turn + 1}/{game.qs.length}
        </span>
      </div>
      <div className="bar">
        <div style={{ width: `${(game.turn / game.qs.length) * 100}%` }} />
      </div>
      <div className="card" key={game.turn}>
        <h3 style={{ fontSize: 19 }}>{q.q}</h3>
      </div>
      <div className="col">
        {q.options.map((o, i) => {
          const cls = answered ? (i === q.answer ? 'right' : i === game.picked ? 'wrong' : '') : ''
          return (
            <button key={o} className={`g-opt ${cls}`} onClick={() => answer(i)} disabled={answered && cls === ''}>
              {o}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`card ${game.picked === q.answer ? 'turq' : 'rosa'} g-result`}>
          <b>{game.picked === q.answer ? '¡Correcto! 🎉' : '¡Nel! 😅'}</b> <span className="small">{q.why}</span>
        </div>
      )}
      {answered && (
        <button className="btn primary block" onClick={() => setGame({ ...game, turn: game.turn + 1, picked: null })}>
          {game.turn + 1 >= game.qs.length ? 'Ver resultados 🏆' : 'Siguiente →'}
        </button>
      )}
      <Scores ranking={ranking} />
    </div>
  )
}

function Scores({ ranking }: { ranking: [string, number][] }) {
  return (
    <div className="card col" style={{ gap: 6 }}>
      {ranking.map(([p, s], i) => (
        <div key={p} className="row">
          <span className="muted small" style={{ width: 18 }}>{i + 1}.</span>
          <Avatar id={p} />
          <span className="grow">{person(p).name}</span>
          <b>{s}</b>
        </div>
      ))}
    </div>
  )
}
