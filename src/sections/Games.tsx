import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import './games/games.css'
import Wheel from './games/Wheel'
import Finger from './games/Finger'
import Loteria from './games/Loteria'
import YoNunca from './games/YoNunca'
import VerdadReto from './games/VerdadReto'
import Trivia from './games/Trivia'
import Bingo from './games/Bingo'
import CoinDice from './games/CoinDice'
import KingsCup from './games/KingsCup'
import MasProbable from './games/MasProbable'
import ShotWheel from './games/ShotWheel'
import Fiesta from './games/Fiesta'

type GameId = 'wheel' | 'finger' | 'loteria' | 'nunca' | 'verdad' | 'trivia' | 'bingo' | 'coin' | 'kings' | 'probable' | 'shots' | 'fiesta'

type Game = { id: GameId; emoji: string; title: string; desc: string; accent: string; drink?: boolean; render: () => ReactNode }

const GAMES: Game[] = [
  { id: 'wheel', emoji: '🎡', title: '¿Quién paga?', desc: 'La ruleta decide quién saca la cartera', accent: '#e4007c', render: () => <Wheel /> },
  { id: 'finger', emoji: '👆', title: 'Dedo del destino', desc: 'Todos un dedo en la pantalla… y elige uno', accent: '#7b2cbf', render: () => null },
  { id: 'loteria', emoji: '🎴', title: 'Lotería', desc: 'El cantor con las 54 cartas y tu tabla', accent: '#f5a623', render: () => <Loteria /> },
  { id: 'bingo', emoji: '🎯', title: 'Bingo del viaje', desc: 'Retos compartidos entre todos', accent: '#00a3a3', render: () => <Bingo /> },
  { id: 'nunca', emoji: '🥃', title: 'Yo nunca nunca', desc: 'Suave o picante, tú decides', accent: '#d7263d', render: () => <YoNunca /> },
  { id: 'verdad', emoji: '🙊', title: 'Verdad o reto', desc: 'Edición México lindo', accent: '#2563eb', render: () => <VerdadReto /> },
  { id: 'trivia', emoji: '🧠', title: 'Trivia México', desc: '¿Quién sabe más de México?', accent: '#1f8a4c', render: () => <Trivia /> },
  { id: 'coin', emoji: '🪙', title: 'Moneda y dados', desc: 'Águila o sol, dados y números', accent: '#b8860b', render: () => <CoinDice /> },
  { id: 'fiesta', emoji: '🎉', title: 'Fiesta', desc: 'Cartas con retos, votos y virus', accent: '#15803d', drink: true, render: () => <Fiesta /> },
  { id: 'kings', emoji: '👑', title: 'Círculo de la muerte', desc: 'Kings Cup: 52 cartas y la copa', accent: '#c8322f', drink: true, render: () => <KingsCup /> },
  { id: 'shots', emoji: '🥃', title: 'Ruleta de shots', desc: 'Gira y cumple lo que salga', accent: '#c2410c', drink: true, render: () => <ShotWheel /> },
  { id: 'probable', emoji: '👉', title: '¿Quién es más probable…?', desc: 'Todos señalan a la vez', accent: '#7b2cbf', drink: true, render: () => <MasProbable /> },
]

let overlaySeq = 0

/**
 * El juego abierto no está en el hash del router: se agrega una entrada al historial mientras
 * está abierto para que el botón "atrás" del celular vuelva a la lista de juegos, y se quita
 * (solo si sigue arriba de todo) cuando se cierra con la flecha.
 */
function useBackClosesGame(active: boolean, onBack: () => void) {
  const back = useRef(onBack)
  useEffect(() => {
    back.current = onBack
  })
  useEffect(() => {
    if (!active) return
    const key = ++overlaySeq
    let own = true
    const onPop = () => {
      own = false
      back.current()
    }
    history.pushState({ overlay: key }, '')
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (own && history.state?.overlay === key) history.back()
    }
  }, [active])
}

export default function Games() {
  const [open, setOpen] = useState<GameId | null>(null)
  const game = GAMES.find((g) => g.id === open)
  const close = () => setOpen(null)
  useBackClosesGame(open !== null, close)

  if (open === 'finger') return <Finger onClose={close} />

  if (game) {
    return (
      <div className="col" style={{ gap: 14 }}>
        <div className="g-head">
          <button className="iconbtn" onClick={close} aria-label="Volver a los juegos">
            <ArrowLeft size={20} />
          </button>
          <h2>
            {game.emoji} {game.title}
          </h2>
        </div>
        {game.render()}
      </div>
    )
  }

  const tile = (g: Game) => (
    <button
      key={g.id}
      className="card g-tile"
      style={{ '--g-accent': g.accent } as CSSProperties}
      onClick={() => {
        setOpen(g.id)
        window.scrollTo({ top: 0 })
      }}
    >
      <span className="g-emoji">{g.emoji}</span>
      <b>{g.title}</b>
      <span className="small muted">{g.desc}</span>
    </button>
  )

  return (
    <div className="col" style={{ gap: 20 }}>
      <section className="g-sec">
        <h3>🎲 Clásicos</h3>
        <div className="g-menu">{GAMES.filter((g) => !g.drink).map(tile)}</div>
      </section>
      <section className="g-sec">
        <h3>🍻 Para beber (+18, con cabeza)</h3>
        <div className="g-notice">Tomen con responsabilidad: agua entre rondas, nadie maneja 🚗❌. Cada juego tiene “Modo sin alcohol”.</div>
        <div className="g-menu">{GAMES.filter((g) => g.drink).map(tile)}</div>
      </section>
    </div>
  )
}
