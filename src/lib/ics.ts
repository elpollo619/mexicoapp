import { tzOfDay, type Activity, type Day } from '../data/trip'
import { zoned } from './time'

/** Hora "HH:MM" de una actividad (las que dicen "Tarde", "Después", "13–20 h" no tienen hora exacta) */
export const timeOf = (it: Activity) => (it.time && /^\d{1,2}:\d{2}$/.test(it.time) ? it.time.padStart(5, '0') : null)

/** Duración estimada por tipo, en minutos */
const DURATION: Record<NonNullable<Activity['type']> | 'default', number> = {
  fly: 180,
  food: 90,
  plan: 150,
  move: 120,
  party: 240,
  stay: 60,
  free: 120,
  default: 120,
}

export type CalEvent = { title: string; start: number; end: number; desc: string; location: string }

export function eventOf(day: Day, it: Activity): CalEvent | null {
  const t = timeOf(it)
  if (!t) return null
  const start = zoned(`${day.date}T${t}`, tzOfDay(day))
  if (!Number.isFinite(start)) return null
  const end = start + DURATION[it.type ?? 'default'] * 60000
  const desc = [it.desc, it.price ? `💰 ${it.price}` : '', it.warn ? `⚠️ ${it.warn}` : '', ...(it.links ?? []).map((l) => `${l.label}: ${l.url}`), 'México Lindo 2026']
    .filter(Boolean)
    .join('\n')
  return { title: it.title, start, end, desc, location: it.maps ?? '' }
}

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const escIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Link para crear el evento en Google Calendar (Android lo abre en la app; en iPhone en Google Calendar web/app) */
export function googleCalendarUrl(e: CalEvent) {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${stamp(e.start)}/${stamp(e.end)}`, details: e.desc, location: e.location })
  return `https://calendar.google.com/calendar/render?${q}`
}

/** Archivo .ics con uno o varios eventos (para el Calendario del iPhone o cualquier otro) */
export function icsOf(events: CalEvent[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//México Lindo 2026//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap((e, i) => [
      'BEGIN:VEVENT',
      `UID:mexico-lindo-${stamp(e.start)}-${i}@elpollo619.github.io`,
      `DTSTAMP:${stamp(Date.now())}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(e.end)}`,
      `SUMMARY:${escIcs(e.title)}`,
      e.location ? `LOCATION:${escIcs(e.location)}` : '',
      `DESCRIPTION:${escIcs(e.desc)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT45M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escIcs(e.title)} en 45 min`,
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].filter(Boolean)
  // Líneas de máximo 75 bytes según el estándar; los clientes modernos aceptan más, pero por si acaso
  return lines.map((l) => l.replace(/(.{72})(?=.)/g, '$1\r\n ')).join('\r\n')
}

/**
 * Guarda los eventos en el calendario del teléfono: comparte el .ics (iPhone: "Añadir a Calendario";
 * Android: elegir Calendar) o, si no se puede compartir archivos, lo descarga.
 */
export async function saveIcs(events: CalEvent[], filename = 'mexico-lindo.ics'): Promise<'shared' | 'downloaded' | 'cancel'> {
  const file = new File([icsOf(events)], filename, { type: 'text/calendar' })
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'México Lindo 2026' })
      return 'shared'
    }
  } catch {
    return 'cancel'
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return 'downloaded'
}
