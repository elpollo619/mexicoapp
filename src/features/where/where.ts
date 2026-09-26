import { useEffect, useState } from 'react'
import { put, remove, useItems } from '../../lib/store'
import { distanceKm } from '../storm/StormBanner'

/** Última posición compartida por una persona (item `where:<persona>`) */
export type Where = { lat: number; lon: number; acc: number; at: string; live?: boolean }

/** Se muestra hasta 3 h después de compartir; luego desaparece del mapa */
export const MAX_AGE_MS = 3 * 60 * 60 * 1000
/** "Seguir compartiendo" se apaga solo a los 30 min (batería y privacidad) */
export const LIVE_MS = 30 * 60 * 1000

export const whereId = (person: string) => `where:${person}`

export function useWhere(now: number): Record<string, Where> {
  const items = useItems<Where>('where')
  const out: Record<string, Where> = {}
  for (const i of items) {
    const person = i.id.replace('where:', '')
    if (now - Date.parse(i.data.at) <= MAX_AGE_MS) out[person] = i.data
  }
  return out
}

function position(highAccuracy = true): Promise<GeolocationPosition> {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('sin geolocalización'))
    navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 30000 })
  })
}

const save = (person: string, p: GeolocationPosition, live: boolean) =>
  put<Where>('where', whereId(person), {
    lat: Math.round(p.coords.latitude * 1e5) / 1e5,
    lon: Math.round(p.coords.longitude * 1e5) / 1e5,
    acc: Math.round(p.coords.accuracy),
    at: new Date().toISOString(),
    live,
  })

/** Comparte la posición actual una vez. Devuelve el motivo si no se pudo. */
export async function shareOnce(person: string): Promise<'ok' | 'denegado' | 'error'> {
  try {
    const p = await position()
    save(person, p, false)
    return 'ok'
  } catch (e) {
    return (e as GeolocationPositionError)?.code === 1 ? 'denegado' : 'error'
  }
}

export const stopSharing = (person: string) => remove(whereId(person))

let watchId: number | null = null
let watchTimer: ReturnType<typeof setTimeout> | undefined
let watchPerson: string | null = null
const liveListeners = new Set<() => void>()
const emitLive = () => liveListeners.forEach((l) => l())

export const isLive = () => watchId !== null

/** Sigue compartiendo durante LIVE_MS (o hasta parar). Una posición nueva cada ≥20 s o ≥25 m. */
export async function startLive(person: string): Promise<'ok' | 'denegado' | 'error'> {
  const first = await shareOnce(person)
  if (first !== 'ok') return first
  stopLive()
  watchPerson = person
  let last = 0
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      const t = Date.now()
      if (t - last < 20000) return
      last = t
      save(person, p, true)
    },
    () => stopLive(),
    { enableHighAccuracy: true, maximumAge: 10000 },
  )
  watchTimer = setTimeout(stopLive, LIVE_MS)
  emitLive()
  return 'ok'
}

export function stopLive() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  clearTimeout(watchTimer)
  watchId = null
  watchPerson = null
  emitLive()
}

export function useLive() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    liveListeners.add(l)
    return () => {
      liveListeners.delete(l)
    }
  }, [])
  return { live: watchId !== null, person: watchPerson }
}

/** "hace 2 min", "hace 1 h 10" */
export function ago(at: string, now: number) {
  const m = Math.max(0, Math.round((now - Date.parse(at)) / 60000))
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `hace ${h} h${r ? ` ${r}` : ''}`
}

/** "350 m", "2.4 km" */
export function distLabel(a: Where, b: Where) {
  const km = distanceKm(a.lat, a.lon, b.lat, b.lon)
  return km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`
}

export const directions = (w: Where) => `https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lon}&travelmode=walking`
