import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { X } from 'lucide-react'
import { buzz } from '../../components/ui'

type Touch = { id: number; x: number; y: number; color: string }
type Phase = 'waiting' | 'choosing' | 'done'

const COLORS = ['#ff2e93', '#ffc233', '#22d3ee', '#4ade80', '#a78bfa', '#fb7185', '#f97316', '#60a5fa', '#e879f9', '#facc15']
const TEAM = ['#ff2e93', '#22d3ee']

export default function Finger({ onClose }: { onClose: () => void }) {
  const [teams, setTeams] = useState(false)
  const [touches, setTouches] = useState<Touch[]>([])
  const [phase, setPhase] = useState<Phase>('waiting')
  const [winner, setWinner] = useState<number | null>(null)
  const [teamOf, setTeamOf] = useState<Record<number, number>>({})
  const map = useRef(new Map<number, Touch>())
  const timer = useRef<number | undefined>(undefined)
  const phaseRef = useRef<Phase>('waiting')
  const colorIdx = useRef(0)
  const teamsRef = useRef(teams)
  teamsRef.current = teams

  const setP = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const sync = () => setTouches([...map.current.values()])

  const decide = () => {
    const list = [...map.current.values()]
    if (list.length < 2) return
    setP('choosing')
    buzz(20)
    timer.current = window.setTimeout(() => {
      const now = [...map.current.values()]
      if (now.length < 2) {
        setP('waiting')
        return
      }
      if (teamsRef.current) {
        const ids = now.map((t) => t.id).sort(() => Math.random() - 0.5)
        const assign: Record<number, number> = {}
        ids.forEach((id, i) => (assign[id] = i % 2))
        setTeamOf(assign)
      } else {
        setWinner(now[Math.floor(Math.random() * now.length)].id)
      }
      setP('done')
      buzz([120, 60, 200])
    }, 1400)
  }

  const restart = () => {
    window.clearTimeout(timer.current)
    if (phaseRef.current === 'choosing') setP('waiting')
    if (phaseRef.current === 'waiting' && map.current.size >= 2) timer.current = window.setTimeout(decide, 2500)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const down = (e: RPointerEvent) => {
    e.preventDefault()
    if (phaseRef.current === 'done') return
    const color = COLORS[colorIdx.current++ % COLORS.length]
    map.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY, color })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    buzz(8)
    sync()
    restart()
  }
  const move = (e: RPointerEvent) => {
    const t = map.current.get(e.pointerId)
    if (!t) return
    t.x = e.clientX
    t.y = e.clientY
    sync()
  }
  const up = (e: RPointerEvent) => {
    if (!map.current.has(e.pointerId)) return
    map.current.delete(e.pointerId)
    sync()
    if (phaseRef.current === 'done') {
      if (map.current.size === 0) {
        // Nueva ronda en cuanto todos levantan el dedo (sin ignorar toques rápidos)
        setWinner(null)
        setTeamOf({})
        colorIdx.current = 0
        setP('waiting')
      }
      return
    }
    restart()
  }

  const hint =
    phase === 'done'
      ? teams
        ? '¡Equipos listos! Levanten los dedos para otra ronda.'
        : '¡Ese es! Levanten los dedos para otra ronda.'
      : phase === 'choosing'
        ? 'Eligiendo…'
        : touches.length === 0
          ? 'Todos pongan un dedo en la pantalla'
          : touches.length === 1
            ? 'Falta alguien más…'
            : 'No se muevan… 🤫'

  return (
    <div className="g-finger" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}>
      <div className="g-finger-top" onPointerDown={(e) => e.stopPropagation()}>
        <button className="iconbtn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }} onClick={onClose} aria-label="Salir">
          <X size={20} />
        </button>
        <div className="seg" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <button className={!teams ? 'on' : ''} onClick={() => setTeams(false)} style={{ color: teams ? 'white' : undefined }}>👆 Uno</button>
          <button className={teams ? 'on' : ''} onClick={() => setTeams(true)} style={{ color: !teams ? 'white' : undefined }}>👥 Equipos</button>
        </div>
      </div>

      {touches.length < 2 && phase === 'waiting' && (
        <div className="g-finger-hint">
          <div className="col" style={{ alignItems: 'center' }}>
            <div className="big">👆</div>
            <h2>{hint}</h2>
            <p style={{ opacity: 0.7, margin: 0 }}>{teams ? 'La app los separa en 2 equipos.' : 'La app elige a uno al azar. ¿Quién paga? ¿Quién maneja?'}</p>
          </div>
        </div>
      )}
      {(touches.length >= 2 || phase !== 'waiting') && (
        <div className="g-finger-hint" style={{ alignItems: 'end', paddingBottom: 'calc(env(safe-area-inset-bottom) + 30px)' }}>
          <h3 style={{ opacity: 0.85 }}>{hint}</h3>
        </div>
      )}

      {touches.map((t) => {
        let cls = ''
        let color = t.color
        if (phase === 'choosing') cls = 'choosing'
        if (phase === 'done' && !teams) cls = t.id === winner ? 'win' : 'lost'
        if (phase === 'done' && teams && teamOf[t.id] !== undefined) color = TEAM[teamOf[t.id]]
        return <div key={t.id} className={`g-touch ${cls}`} style={{ left: t.x, top: t.y, color }} />
      })}
    </div>
  )
}
