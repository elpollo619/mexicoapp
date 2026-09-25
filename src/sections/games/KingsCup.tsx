import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { buzz } from '../../components/ui'
import { KINGS_LAST, KINGS_RULES } from './drinks'
import { Confetti, shuffle, SoberToggle } from './util'

const SUITS = [
  { s: '♥', red: true },
  { s: '♦', red: true },
  { s: '♣', red: false },
  { s: '♠', red: false },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

type Card = { rank: string; suit: string; red: boolean }

const newDeck = (): Card[] => shuffle(SUITS.flatMap(({ s, red }) => RANKS.map((rank) => ({ rank, suit: s, red }))))

export default function KingsCup() {
  const [deck, setDeck] = useState<Card[]>(newDeck)
  const [pos, setPos] = useState(0)
  const [noAlc, setNoAlc] = useState(false)

  const current = pos > 0 ? deck[pos - 1] : null
  const kings = deck.slice(0, pos).filter((c) => c.rank === 'K').length
  const over = kings >= 4
  const lastKing = current?.rank === 'K' && over
  const rule = current ? (lastKing ? KINGS_LAST : KINGS_RULES[current.rank]) : null

  const draw = () => {
    if (over || pos >= deck.length) return
    const c = deck[pos]
    setPos(pos + 1)
    buzz(c.rank === 'K' ? [40, 30, 90] : 12)
  }

  const reset = () => {
    setDeck(newDeck())
    setPos(0)
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <SoberToggle value={noAlc} onChange={setNoAlc} />

      <div className="row between small">
        <span className="muted">Quedan <b style={{ color: 'var(--ink)' }}>{52 - pos}</b> cartas</span>
        <span>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ opacity: i < kings ? 1 : 0.2, fontSize: 18 }}>👑</span>
          ))}
        </span>
      </div>

      {current && rule ? (
        <div className="g-pcard" key={pos} onClick={draw} style={{ color: current.red ? '#c8322f' : '#1d1720' }}>
          <div className="corner">{current.rank}<br />{current.suit}</div>
          <div className="mid">{current.suit}</div>
          <div className="corner br">{current.rank}<br />{current.suit}</div>
        </div>
      ) : (
        <div className="g-pcard back" onClick={draw}>
          <div className="mid" style={{ fontSize: 60 }}>🍻</div>
        </div>
      )}

      {rule && (
        <div className={`card ${lastKing ? 'rosa' : 'cempa'} g-result`} key={`r${pos}`}>
          {lastKing && <Confetti />}
          <div className="label">{current?.rank} · {rule.title}</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{noAlc ? rule.sober : rule.rule}</div>
        </div>
      )}

      <div className="row">
        <button className="btn primary grow" onClick={draw} disabled={over}>
          {over ? '¡Se acabó! 👑' : pos === 0 ? 'Sacar primera carta' : 'Siguiente carta'}
        </button>
        <button className="iconbtn" onClick={reset} aria-label="Nuevo mazo">
          <RotateCcw size={18} />
        </button>
      </div>

      <details className="card small">
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Reglas de cada carta</summary>
        <div className="col" style={{ gap: 4, marginTop: 8 }}>
          {RANKS.map((r) => (
            <div key={r}>
              <b>{r}</b> · {KINGS_RULES[r].title}
            </div>
          ))}
          <div className="muted">Se ponen en círculo alrededor de una copa. Al 4.º rey, se acaba.</div>
        </div>
      </details>
    </div>
  )
}
