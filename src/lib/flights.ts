import { AIRPORT_TZ, FLIGHTS, type Flight } from '../data/flights'
import { useItems } from './store'
import { zoned } from './time'

/** Vuelos base + los editados/añadidos por el grupo (misma id = reemplaza) */
export function useFlights(): Flight[] {
  const custom = useItems<Flight>('flight')
  const map = new Map(FLIGHTS.map((f) => [f.id, f]))
  for (const c of custom) map.set(c.id, { ...c.data, id: c.id, dep: norm(c.data.dep), arr: norm(c.data.arr), who: c.data.who ?? [] })
  // Orden por hora real (cada aeropuerto tiene su zona); sin hora, por fecha
  return [...map.values()].sort((a, b) => sortKey(a) - sortKey(b))
}

/** "2026-10-17T10:00:00" (iOS) → "2026-10-17T10:00"; valores vacíos quedan vacíos */
const norm = (v?: string) => (v ?? '').slice(0, 16)
const tzOf = (code: string) => AIRPORT_TZ[code] ?? 'America/Mexico_City'
const sortKey = (f: Flight) => {
  const e = zoned(f.dep, tzOf(f.from))
  return Number.isFinite(e) ? e : Number.MAX_SAFE_INTEGER
}
export const knownAirport = (code: string) => code in AIRPORT_TZ

export const depEpoch = (f: Flight) => zoned(f.dep, tzOf(f.from))
export const arrEpoch = (f: Flight) => zoned(f.arr, tzOf(f.to))
/** Tiene fecha y hora válidas (las plantillas "por confirmar" no tienen hora) */
export const hasTime = (f: Flight) =>
  !(f.status === 'pendiente' && f.dep.endsWith('T00:00')) && Number.isFinite(depEpoch(f)) && Number.isFinite(arrEpoch(f))
/** Está en el aire ahora mismo (despegó y aún no aterrizó) */
export const inFlight = (f: Flight, now: number) => hasTime(f) && depEpoch(f) <= now && now < arrEpoch(f)
