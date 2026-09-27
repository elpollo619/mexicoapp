import { useState } from 'react'
import { CalendarPlus, Sunrise } from 'lucide-react'
import { DAYS, CITIES, todayOnTrip, tripTz, tzOfDay } from '../data/trip'
import { addDays, hourIn } from '../lib/time'
import { eventOf, timeOf } from '../lib/ics'
import { CalMenu } from '../components/CalendarButton'
import type { Go } from '../App'

/**
 * "Mañana": desde las 17:00 locales muestra lo primero del día siguiente (hora del primer plan)
 * y deja guardar todo el día en el calendario del teléfono, que es el que avisa.
 */
export default function Tomorrow({ now, go }: { now: number; go: Go }) {
  const [open, setOpen] = useState(false)
  const today = todayOnTrip(now)
  const tomorrow = DAYS.find((d) => d.date === addDays(today, 1))
  if (!tomorrow || tomorrow.city === 'home' || hourIn(now, tripTz(now)) < 17) return null
  const timed = tomorrow.items.filter((it) => timeOf(it))
  const first = timed[0]
  const events = tomorrow.items.map((it) => eventOf(tomorrow, it)).filter((e): e is NonNullable<typeof e> => !!e)
  const city = CITIES[tomorrow.city]
  return (
    <section className="card col" style={{ gap: 8, background: 'var(--cempa-soft)', borderColor: 'transparent', boxShadow: 'none' }}>
      <div className="row between">
        <span className="label row" style={{ gap: 6 }}>
          <Sunrise size={14} /> Mañana · {city.short}
        </span>
        {events.length > 0 && (
          <span style={{ position: 'relative' }}>
            <button className="btn ghost small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              <CalendarPlus size={14} /> Al calendario
            </button>
            {open && <CalMenu events={events} onClose={() => setOpen(false)} />}
          </span>
        )}
      </div>
      <b>{tomorrow.title}</b>
      {first ? (
        <span className="small">
          Lo primero: <b>{first.time}</b> {first.title}
          {first.type === 'fly' || first.type === 'move' ? ' · pon la alarma con tiempo' : ''}
        </span>
      ) : (
        <span className="small muted">Sin horarios fijos, día tranquilo.</span>
      )}
      {timed.length > 1 && (
        <span className="tiny muted">
          {timed.slice(1, 4).map((it) => `${it.time} ${it.title}`).join(' · ')}
        </span>
      )}
      <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => go('viaje', 'dia')}>
        Ver el día
      </button>
      <span className="tiny muted" style={{ display: 'none' }}>{tzOfDay(tomorrow)}</span>
    </section>
  )
}
