import { Home as HomeIcon, MessageCircle, Undo2 } from 'lucide-react'
import { CORE } from '../data/people'
import { tripTz } from '../data/trip'
import { useMe } from '../lib/me'
import { put, remove, useItems } from '../lib/store'
import { longDate, useNow } from '../lib/time'
import { toast } from '../lib/toast'
import { Avatar, buzz, name } from '../components/ui'
import { hourIn, nightKey } from './night'

type HomeNote = { night: string; person: string; at: string }

/** Quién está esa noche: los 6 siempre; Pablo y su invitad@ solo en Guadalajara (8–11 oct) */
function peopleOn(night: string) {
  const gdl = night >= '2026-10-08' && night <= '2026-10-11'
  return gdl ? [...CORE, 'pablo', 'invitado'] : CORE
}

export default function SafeHome() {
  const me = useMe()!
  const now = useNow(60_000)
  const night = nightKey(now)
  const notes = useItems<HomeNote>('note').filter((n) => n.id.startsWith(`home:${night}:`))
  const home = new Map(notes.map((n) => [n.data.person, n.data.at]))
  const who = peopleOn(night)
  if (!who.includes(me)) return null
  const arrived = who.filter((p) => home.has(p))
  const missing = who.filter((p) => !home.has(p))
  const mine = home.get(me)
  // Hora local de donde estamos (Baja va 1 h menos que CDMX)
  const tz = tripTz(now)
  const hour = hourIn(now, tz)
  const late = hour < 6 && missing.length > 0

  const checkIn = () => {
    buzz([20, 40, 20])
    put('note', `home:${night}:${me}`, { night, person: me, at: new Date().toISOString() })
    toast('¡Qué bueno que llegaste! 🏠')
  }

  const hm = (iso: string) =>
    new Intl.DateTimeFormat('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))

  const wa = `https://wa.me/?text=${encodeURIComponent(`¿Ya llegaste? 🏠 Márcalo en la app México Lindo 🇲🇽`)}`

  return (
    <section className={`card col${late ? ' cempa' : ''}`} style={{ gap: 10 }}>
      <div className="row between">
        <div className="col" style={{ gap: 0 }}>
          <span className="label">Noche del {longDate(night)}</span>
          <h3>¿Llegaste bien? 🏠</h3>
        </div>
        <span className="num small muted" style={{ fontWeight: 700 }}>
          {arrived.length}/{who.length}
        </span>
      </div>

      {arrived.length > 0 && (
        <div className="row wrap" style={{ gap: 8 }}>
          {arrived.map((p) => (
            <span key={p} className="row" style={{ gap: 5 }} title={`${name(p)} · ${hm(home.get(p)!)}`}>
              <Avatar id={p} />
              <span className="tiny muted num">{hm(home.get(p)!)}</span>
            </span>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <div className={late ? 'warn' : 'small muted'} style={late ? undefined : { fontWeight: 600 }}>
          {late ? '⚠️ ' : ''}Faltan: {missing.map(name).join(', ')}
        </div>
      )}

      <div className="row" style={{ gap: 8 }}>
        {mine ? (
          <>
            <span className="grow small" style={{ fontWeight: 650, color: 'var(--verde)' }}>
              ✓ Llegaste a las {hm(mine)}
            </span>
            <button
              className="btn ghost small"
              onClick={() => {
                remove(`home:${night}:${me}`)
                toast('Check-in deshecho')
              }}
            >
              <Undo2 size={15} /> Deshacer
            </button>
          </>
        ) : (
          <button className="btn primary grow" onClick={checkIn}>
            <HomeIcon size={18} /> Llegué a casa ✓
          </button>
        )}
        {late && (
          <a className="btn outline small" href={wa} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp">
            <MessageCircle size={16} /> WhatsApp
          </a>
        )}
      </div>
    </section>
  )
}
