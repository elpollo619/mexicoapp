import { AIRPORT_TZ, FLIGHTS, type Flight } from '../data/flights'
import { useItems } from './store'
import { zoned } from './time'

/** Vuelos base + los editados/añadidos por el grupo (misma id = reemplaza) */
export function useFlights(): Flight[] {
  const custom = useItems<Flight>('flight')
  const map = new Map(FLIGHTS.map((f) => [f.id, f]))
  for (const c of custom) map.set(c.id, { ...c.data, id: c.id })
  return [...map.values()].sort((a, b) => a.dep.localeCompare(b.dep))
}

export const depEpoch = (f: Flight) => zoned(f.dep, AIRPORT_TZ[f.from] ?? 'America/Mexico_City')
export const arrEpoch = (f: Flight) => zoned(f.arr, AIRPORT_TZ[f.to] ?? 'America/Mexico_City')
export const hasTime = (f: Flight) => !f.dep.endsWith('T00:00')
