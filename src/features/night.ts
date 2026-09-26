import { DAYS, TRIP_TZ, tripTz, todayOnTrip, tzOfDay } from '../data/trip'
import { addDays, hourIn, todayIn } from '../lib/time'

export { hourIn }

/** Clave de la noche (para "¿Llegaste bien?"): de 00:00 a 11:59 hora local cuenta como la noche anterior */
export function nightKey(now: number) {
  const tz = tripTz(now)
  const today = todayIn(tz, now)
  return hourIn(now, tz) >= 12 ? today : addDays(today, -1)
}

/**
 * Día del itinerario cuyo alojamiento toca mostrar al taxista: desde las ~06:00 (hora local del destino)
 * ya vale el de hoy, aunque lleguemos por la mañana (van a GDL el 8, vuelo a CDMX el 17).
 */
export function stayKey(now: number) {
  const today = todayOnTrip(now)
  const day = dayOf(today)
  const tz = day ? tzOfDay(day) : TRIP_TZ
  return hourIn(now, tz) >= 6 ? today : addDays(today, -1)
}

/** Día del itinerario para una fecha (o null si está fuera del viaje) */
export const dayOf = (date: string) => DAYS.find((d) => d.date === date) ?? null
