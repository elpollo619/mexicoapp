import { useEffect, useMemo, useRef, useState } from 'react'
import { ALL, person } from '../../data/people'
import { buzz } from '../../components/ui'
import { CHARADAS } from './charadas'
import { Confetti, shuffle } from './util'

type Phase = 'setup' | 'count' | 'play' | 'done'

/** Cada luchador (apodo) también es una palabra: "El Contador del Narco", "La Flor Voladora"… */
const LUCHADORES = { id: 'luchadores', emoji: '🤼', title: 'Los luchadores', words: ALL.map((id) => person(id).nickname) }
const DECKS = [...CHARADAS, LUCHADORES]

export default function Charadas() {
  const [deckId, setDeckId] = useState(DECKS[0].id)
  const [secs, setSecs] = useState(60)
  const [phase, setPhase] = useState<Phase>('setup')
  const [count, setCount] = useState(3)
  const [left, setLeft] = useState(60)
  const [seed, setSeed] = useState(0)
  const [i, setI] = useState(0)
  const [ok, setOk] = useState<string[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const endAt = useRef(0)

  const deck = DECKS.find((d) => d.id === deckId) ?? DECKS[0]
  // `seed` vuelve a barajar en cada ronda
  const words = useMemo(() => shuffle(deck.words), [deck, seed])
  const word = words[i % words.length]

  const start = () => {
    setSeed((s) => s + 1)
    setI(0)
    setOk([])
    setSkipped([])
    setCount(3)
    setPhase('count')
    buzz(10)
  }

  // Cuenta regresiva 3-2-1
  useEffect(() => {
    if (phase !== 'count') return
    const t = window.setTimeout(() => {
      if (count > 1) {
        setCount(count - 1)
        buzz(8)
      } else {
        endAt.current = Date.now() + secs * 1000
        setLeft(secs)
        setPhase('play')
        buzz([40, 30, 80])
      }
    }, 900)
    return () => window.clearTimeout(t)
  }, [phase, count, secs])

  // Reloj de la ronda
  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setInterval(() => {
      const r = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft(r)
      if (r <= 5 && r > 0) buzz(6)
      if (r === 0) {
        setPhase('done')
        buzz([80, 40, 80, 40, 200])
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [phase])

  const answer = (good: boolean) => {
    buzz(good ? 14 : 6)
    if (good) setOk((a) => [...a, word])
    else setSkipped((a) => [...a, word])
    setI((x) => x + 1)
  }

  if (phase === 'setup') {
    return (
      <div className="col" style={{ gap: 14 }}>
        <p className="small muted" style={{ margin: 0 }}>
          Uno tiene el celular en la frente o lo mira a escondidas y <b>actúa o describe</b> la palabra sin decirla. Los demás adivinan. ¡Cada acierto suma!
        </p>
        <div className="card col">
          <b>Tema</b>
          <div className="chips wrap" style={{ flexWrap: 'wrap' }}>
            {DECKS.map((d) => (
              <button key={d.id} type="button" className={`chip${deckId === d.id ? ' on' : ''}`} onClick={() => setDeckId(d.id)}>
                {d.emoji} {d.title}
              </button>
            ))}
          </div>
        </div>
        <div className="card col">
          <b>Tiempo por ronda</b>
          <div className="seg">
            {[45, 60, 90].map((s) => (
              <button key={s} className={secs === s ? 'on' : ''} onClick={() => setSecs(s)}>
                {s} s
              </button>
            ))}
          </div>
        </div>
        <button className="btn primary block" onClick={start}>
          ¡Empezar! 🎬
        </button>
      </div>
    )
  }

  if (phase === 'count') {
    return (
      <div className="g-deck suave center" style={{ alignItems: 'center', fontSize: 96 }} aria-live="polite">
        {count}
        <small style={{ textTransform: 'none', letterSpacing: 0 }}>Prepárate: {deck.emoji} {deck.title}</small>
      </div>
    )
  }

  if (phase === 'play') {
    const pct = (left / secs) * 100
    return (
      <div className="col" style={{ gap: 12 }}>
        <div className="row between">
          <b>✅ {ok.length}</b>
          <b style={{ color: left <= 10 ? 'var(--rojo)' : undefined }}>⏱ {left}s</b>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: left <= 10 ? 'var(--rojo)' : 'var(--turq)', transition: 'width .25s linear' }} />
        </div>
        <div className="g-deck verdad" key={i} style={{ alignItems: 'center', textAlign: 'center', cursor: 'default' }}>
          <small>{deck.emoji} {deck.title}</small>
          {word}
        </div>
        <div className="row">
          <button className="btn ghost grow" onClick={() => answer(false)}>⏭ Pasar</button>
          <button className="btn primary grow" onClick={() => answer(true)}>✅ ¡Acertaron!</button>
        </div>
      </div>
    )
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card hero center g-result">
        <Confetti n={ok.length ? 70 : 0} />
        <div className="muted">¡Se acabó el tiempo!</div>
        <div className="big" style={{ fontSize: 44 }}>{ok.length}</div>
        <div className="muted">{ok.length === 0 ? 'Cero… a practicar la mímica 🙈' : ok.length === 1 ? 'acierto' : 'aciertos'}</div>
      </div>
      {ok.length > 0 && (
        <div className="card col">
          <b className="small">✅ Acertaron</b>
          <div className="small">{ok.join(' · ')}</div>
        </div>
      )}
      {skipped.length > 0 && (
        <div className="card col">
          <b className="small">⏭ Pasadas</b>
          <div className="small muted">{skipped.join(' · ')}</div>
        </div>
      )}
      <div className="row">
        <button className="btn ghost grow" onClick={() => setPhase('setup')}>Cambiar tema</button>
        <button className="btn primary grow" onClick={start}>Otra ronda</button>
      </div>
    </div>
  )
}
