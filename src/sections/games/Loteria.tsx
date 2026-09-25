import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { buzz, Sheet } from '../../components/ui'
import { useMe } from '../../lib/me'
import { LOTERIA } from './content'
import { seeded, shuffle } from './util'

function speak(text: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = synth.getVoices()
    const v = voices.find((x) => x.lang === 'es-MX') ?? voices.find((x) => x.lang.startsWith('es'))
    if (v) u.voice = v
    u.lang = v?.lang ?? 'es-MX'
    u.rate = 0.95
    synth.speak(u)
  } catch {
    /* sin voz */
  }
}

const readMarks = (key: string): number[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

export default function Loteria() {
  const me = useMe() ?? 'yo'
  const [order, setOrder] = useState(() => shuffle(LOTERIA.map((c) => c.n)))
  const [pos, setPos] = useState(0)
  const [auto, setAuto] = useState(false)
  const [every, setEvery] = useState(5)
  const [voice, setVoice] = useState(true)
  const [tablaOpen, setTablaOpen] = useState(false)

  const drawn = order.slice(0, pos)
  const current = pos > 0 ? LOTERIA[order[pos - 1] - 1] : null
  const done = pos >= order.length

  const voiceRef = useRef(voice)
  voiceRef.current = voice

  const posRef = useRef(pos)
  posRef.current = pos
  const orderRef = useRef(order)
  orderRef.current = order

  const draw = () => {
    const p = posRef.current
    const ord = orderRef.current
    if (p >= ord.length) return
    const card = LOTERIA[ord[p] - 1]
    if (voiceRef.current) speak(`${card.name}. ${card.verso}`)
    buzz(12)
    posRef.current = p + 1
    setPos(p + 1)
  }

  useEffect(() => {
    if (!auto || done) return
    const t = window.setInterval(draw, every * 1000)
    return () => window.clearInterval(t)
  }, [auto, every, done])

  useEffect(() => {
    if (done) setAuto(false)
  }, [done])

  const reset = () => {
    setAuto(false)
    setOrder(shuffle(LOTERIA.map((c) => c.n)))
    setPos(0)
    window.speechSynthesis?.cancel()
  }

  // Tabla estable por persona y día
  const today = new Date().toISOString().slice(0, 10)
  const tablaKey = `mx-tabla-${me}-${today}`
  const tabla = useMemo(() => shuffle(LOTERIA.map((c) => c.n), seeded(`${me}-${today}`)).slice(0, 16), [me, today])
  const [marks, setMarks] = useState<number[]>(() => readMarks(tablaKey))
  useEffect(() => setMarks(readMarks(tablaKey)), [tablaKey])
  const toggleMark = (n: number) => {
    const next = marks.includes(n) ? marks.filter((m) => m !== n) : [...marks, n]
    setMarks(next)
    buzz(8)
    try {
      localStorage.setItem(tablaKey, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  const drawnSet = new Set(drawn)
  const full = tabla.every((n) => marks.includes(n))

  return (
    <div className="col" style={{ gap: 14 }}>
      {current ? (
        <div className="g-lcard" key={current.n}>
          <div className="n">{current.n}</div>
          <div className="e">{current.emoji}</div>
          <div className="t">{current.name}</div>
        </div>
      ) : (
        <div className="g-lcard" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 8 }}>
          <div style={{ fontSize: 70 }}>🎴</div>
          <b>¡Se va y se corre con…!</b>
          <span className="small">Toquen “¡Corre!” para cantar la primera carta</span>
        </div>
      )}
      {current && <p className="center" style={{ margin: 0, fontStyle: 'italic' }}>“{current.verso}”</p>}

      <div className="row">
        <button className="btn primary grow" onClick={draw} disabled={done}>
          {done ? '¡Ya se cantaron todas!' : pos === 0 ? '¡Corre! 🎴' : 'Siguiente carta'}
        </button>
        <button className="iconbtn" onClick={() => setAuto((a) => !a)} aria-label={auto ? 'Pausar' : 'Automático'} disabled={done}>
          {auto ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="iconbtn" onClick={() => setVoice((v) => !v)} aria-label="Voz">
          {voice ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button className="iconbtn" onClick={reset} aria-label="Barajar de nuevo">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="row between small">
        <span className="muted">Automático cada</span>
        <div className="seg" style={{ flex: 'none' }}>
          {[3, 5, 8].map((s) => (
            <button key={s} className={every === s ? 'on' : ''} onClick={() => setEvery(s)}>
              {s} s
            </button>
          ))}
        </div>
      </div>

      <button className="btn cempa block" onClick={() => setTablaOpen(true)}>🃏 Mi tabla</button>

      <div className="col">
        <div className="row between">
          <b>Cartas cantadas</b>
          <span className="muted small">{pos} / 54</span>
        </div>
        {drawn.length ? (
          <div className="g-drawn">
            {[...drawn].reverse().map((n) => (
              <span key={n} title={LOTERIA[n - 1].name}>
                {LOTERIA[n - 1].emoji}
                <small>{n}</small>
              </span>
            ))}
          </div>
        ) : (
          <div className="empty small">Todavía nada.</div>
        )}
      </div>

      <Sheet open={tablaOpen} onClose={() => setTablaOpen(false)} title="Mi tabla">
        <p className="small muted" style={{ marginTop: -6 }}>
          Toca las cartas para poner tu frijolito. Borde amarillo = ya la cantaron.
        </p>
        <div className="g-tabla">
          {tabla.map((n) => {
            const c = LOTERIA[n - 1]
            return (
              <button key={n} className={`${marks.includes(n) ? 'marked' : ''} ${drawnSet.has(n) ? 'called' : ''}`} onClick={() => toggleMark(n)}>
                {c.emoji}
                <small>{c.name}</small>
              </button>
            )
          })}
        </div>
        {full && <div className="card hero center big g-result" style={{ marginTop: 12 }}>¡LOTERÍA! 🎉</div>}
        <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => { setMarks([]); try { localStorage.removeItem(tablaKey) } catch { /* ignore */ } }}>
          Quitar frijolitos
        </button>
      </Sheet>
    </div>
  )
}
