import { useMemo, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { CORE, person } from '../../data/people'
import { Avatar, buzz } from '../../components/ui'
import { MAS_PROBABLE } from './drinks'
import { Confetti, shuffle, SoberToggle } from './util'

export default function MasProbable() {
  const [seed, setSeed] = useState(0)
  const [i, setI] = useState(0)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [reveal, setReveal] = useState(false)
  const [noAlc, setNoAlc] = useState(false)

  // `seed` vuelve a barajar
  const deck = useMemo(() => shuffle(MAS_PROBABLE), [seed])
  const prompt = deck[i % deck.length]
  const total = Object.values(votes).reduce((a, b) => a + b, 0)
  const top = Math.max(0, ...Object.values(votes))
  const winners = reveal && top > 0 ? Object.keys(votes).filter((k) => votes[k] === top) : []

  const next = () => {
    buzz(8)
    setI((x) => x + 1)
    setVotes({})
    setReveal(false)
  }

  const vote = (id: string) => {
    if (reveal) return
    buzz(6)
    setVotes((v) => ({ ...v, [id]: (v[id] ?? 0) + 1 }))
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <SoberToggle value={noAlc} onChange={setNoAlc} />
      <div className="g-deck picante" key={`${seed}-${i}`} onClick={next}>
        <small>¿Quién es más probable…</small>
        {prompt}
        <small style={{ textTransform: 'none', letterSpacing: 0 }}>
          A la cuenta de 3 todos señalan. El más señalado {noAlc ? 'hace un reto' : 'toma'} 👉
        </small>
      </div>

      <div className="card col">
        <div className="row between">
          <b className="small">Votación rápida (opcional)</b>
          <span className="small muted">{total} votos</span>
        </div>
        <div className="grid3">
          {CORE.map((id) => (
            <button
              key={id}
              className="card tight col"
              style={{ alignItems: 'center', gap: 2, outline: winners.includes(id) ? '3px solid var(--rosa)' : undefined }}
              onClick={() => vote(id)}
            >
              <Avatar id={id} />
              <span className="small">{person(id).name}</span>
              <b className="small">{votes[id] ? '●'.repeat(Math.min(votes[id], 6)) : ' '}</b>
            </button>
          ))}
        </div>
        <button className="btn ghost block" disabled={!total || reveal} onClick={() => { setReveal(true); buzz([40, 30, 90]) }}>
          Revelar al ganador
        </button>
      </div>

      {winners.length > 0 && (
        <div className="card hero center g-result">
          <Confetti n={50} />
          <div className="big" style={{ fontSize: 26 }}>{winners.map((w) => person(w).name).join(' y ')}</div>
          <div className="muted">{noAlc ? '¡Te toca un reto!' : '¡Salud! Te toca tomar 🍻'}</div>
        </div>
      )}

      <div className="row">
        <button className="btn primary grow" onClick={next}>Siguiente</button>
        <button className="iconbtn" onClick={() => { setSeed((s) => s + 1); setI(0); setVotes({}); setReveal(false) }} aria-label="Barajar">
          <Shuffle size={18} />
        </button>
      </div>
    </div>
  )
}
