import { useRef, useState } from 'react'
import { ALL, CORE, person } from '../../data/people'
import { Avatar, buzz } from '../../components/ui'
import { RETOS, VERDADES } from './content'

type Kind = 'verdad' | 'reto'

/** Saca una carta sin repetir hasta agotar el mazo */
function useDeck(cards: string[]) {
  const used = useRef<Set<number>>(new Set())
  return () => {
    if (used.current.size >= cards.length) used.current.clear()
    let i: number
    do i = Math.floor(Math.random() * cards.length)
    while (used.current.has(i))
    used.current.add(i)
    return cards[i]
  }
}

export default function VerdadReto() {
  const [withGdl, setWithGdl] = useState(false)
  const [player, setPlayer] = useState<string | null>(null)
  const [card, setCard] = useState<{ kind: Kind; text: string } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const drawVerdad = useDeck(VERDADES)
  const drawReto = useDeck(RETOS)
  const players = withGdl ? ALL : CORE

  const choose = () => {
    setCard(null)
    setSpinning(true)
    let n = 0
    const tick = () => {
      setPlayer(players[Math.floor(Math.random() * players.length)])
      buzz(5)
      n++
      if (n < 14) window.setTimeout(tick, 50 + n * 12)
      else {
        setSpinning(false)
        buzz([40, 30, 80])
      }
    }
    tick()
  }

  const draw = (kind: Kind) => {
    buzz(10)
    setCard({ kind, text: kind === 'verdad' ? drawVerdad() : drawReto() })
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <label className="row small" style={{ gap: 8 }}>
        <input type="checkbox" checked={withGdl} onChange={(e) => setWithGdl(e.target.checked)} />
        Incluir a Pablo e invitad@ (modo Guadalajara 🎂)
      </label>

      <div className="card center col" style={{ alignItems: 'center', gap: 6 }}>
        {player ? (
          <>
            <Avatar id={player} lg />
            <div className="big" style={{ fontSize: 28 }}>{person(player).name}</div>
            <div className="muted small">{spinning ? 'Eligiendo…' : '¿Verdad o reto?'}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 44 }}>🤔</div>
            <b>¿A quién le toca?</b>
          </>
        )}
        <button className="btn ghost small" onClick={choose} disabled={spinning} style={{ marginTop: 4 }}>
          🎲 Elegir al azar
        </button>
      </div>

      <div className="grid2">
        <button className="btn" style={{ background: "#2563eb", color: "#fff" }} onClick={() => draw('verdad')} disabled={spinning}>
          🙊 Verdad
        </button>
        <button className="btn cempa" onClick={() => draw('reto')} disabled={spinning}>
          🔥 Reto
        </button>
      </div>

      {card && (
        <div key={card.text} className={`g-deck ${card.kind}`} style={{ cursor: 'default' }}>
          <small>{card.kind === 'verdad' ? '🙊 Verdad' : '🔥 Reto'}{player && !spinning ? ` para ${person(player).name}` : ''}</small>
          {card.text}
          <small style={{ textTransform: 'none', letterSpacing: 0 }}>¿No te atreves? Shot de castigo 🥃</small>
        </div>
      )}
    </div>
  )
}
