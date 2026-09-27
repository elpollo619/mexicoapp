import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import type { Activity, Day } from '../data/trip'
import { eventOf, googleCalendarUrl, saveIcs, type CalEvent } from '../lib/ics'
import { toast } from '../lib/toast'
import { buzz } from './ui'

/** Botón "📅" de una actividad: abre un mini menú con Google Calendar o archivo .ics (Calendario del iPhone) */
export function CalendarButton({ day, it }: { day: Day; it: Activity }) {
  const [open, setOpen] = useState(false)
  const e = eventOf(day, it)
  if (!e) return null
  return (
    <span style={{ position: 'relative', flex: 'none' }}>
      <button className="iconbtn" aria-label="Añadir al calendario" aria-expanded={open} onClick={() => { buzz(); setOpen((o) => !o) }} style={{ width: 32, height: 32 }}>
        <CalendarPlus size={16} />
      </button>
      {open && <CalMenu events={[e]} onClose={() => setOpen(false)} />}
    </span>
  )
}

/** Mismo menú para un día entero (varios eventos) */
export function CalMenu({ events, onClose, align = 'right' }: { events: CalEvent[]; onClose: () => void; align?: 'left' | 'right' }) {
  const single = events.length === 1 ? events[0] : null
  const save = async () => {
    const r = await saveIcs(events, events.length === 1 ? 'evento.ics' : 'mexico-lindo-dia.ics')
    if (r === 'downloaded') toast('Archivo .ics descargado: ábrelo para añadirlo al calendario', 3500)
    if (r === 'shared') toast('Elige "Calendario" para guardarlo 📅', 3000)
    onClose()
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} aria-hidden />
      <div className="card col cal-menu" style={{ [align]: 0 }} role="menu">
        {single && (
          <a className="btn ghost small" href={googleCalendarUrl(single)} target="_blank" rel="noreferrer" onClick={onClose} role="menuitem">
            Google Calendar
          </a>
        )}
        <button className="btn ghost small" onClick={() => void save()} role="menuitem">
          {single ? 'Calendario del iPhone (.ics)' : `Guardar ${events.length} eventos (.ics)`}
        </button>
      </div>
    </>
  )
}
