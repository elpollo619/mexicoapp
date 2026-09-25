import { DAYS } from '../data/trip'
import { todayIn } from '../lib/time'

const TZ = 'America/Mexico_City'

/** Hora local (0–23) en CDMX */
export function hourIn(now: number, tz = TZ) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(now)))
}

/** Clave de la noche: de 00:00 a 11:59 cuenta como la noche anterior */
export function nightKey(now: number) {
  const today = todayIn(TZ, now)
  if (hourIn(now) >= 12) return today
  const [y, m, d] = today.split('-').map(Number)
  const prev = new Date(Date.UTC(y, m - 1, d - 1))
  return prev.toISOString().slice(0, 10)
}

/** Día del itinerario para una fecha (o null si está fuera del viaje) */
export const dayOf = (date: string) => DAYS.find((d) => d.date === date) ?? null
