import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

export type Storm = {
  id: string
  basin: 'ep' | 'at'
  name: string
  classification: string
  intensity: number
  pressure: number
  lat: number
  lon: number
  movementDir: number
  movementSpeed: number
  lastUpdate: string
  publicAdvisory: string
}

const ENDPOINT = 'https://fopblphtagryrdjotohf.supabase.co/functions/v1/mx-storms'
const CACHE = 'mx-storms-v1'
/** Radio de alerta en km */
const ALERT_KM = 800

function readCache(): { updated: string; storms: Storm[] } | null {
  try {
    const raw = localStorage.getItem(CACHE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Distancia en km (haversine) */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Categoría Saffir-Simpson a partir del viento en nudos */
const hurricaneCat = (kt: number) => (kt >= 137 ? 5 : kt >= 113 ? 4 : kt >= 96 ? 3 : kt >= 83 ? 2 : 1)

export function kindLabel(s: Storm) {
  switch (s.classification.toUpperCase()) {
    case 'HU':
      return `Huracán cat. ${hurricaneCat(s.intensity)}`
    case 'TS':
      return 'Tormenta tropical'
    case 'TD':
      return 'Depresión tropical'
    case 'STS':
      return 'Tormenta subtropical'
    case 'SD':
      return 'Depresión subtropical'
    case 'PTC':
      return 'Posible ciclón tropical'
    case 'PC':
      return 'Ciclón post-tropical'
    default:
      return 'Sistema tropical'
  }
}

const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
const compass = (deg: number) => DIRS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
const mphToKmh = (mph: number) => Math.round(mph * 1.609)
const ktToKmh = (kt: number) => Math.round(kt * 1.852)
const fmtKm = (km: number) => Math.round(km).toLocaleString('es-MX')

/** Aviso de huracanes/tormentas cerca de la parada actual (NHC vía Edge Function) */
export default function StormBanner({ lat, lon, place }: { lat: number; lon: number; place: string }) {
  const [data, setData] = useState(readCache)

  useEffect(() => {
    let alive = true
    const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined
    fetch(ENDPOINT, { headers: key ? { apikey: key } : {} })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { updated: string; storms: Storm[] }) => {
        if (!alive || !Array.isArray(j?.storms)) return
        setData(j)
        try {
          localStorage.setItem(CACHE, JSON.stringify(j))
        } catch {
          /* ignore */
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!data?.storms?.length) return null

  const withDist = data.storms
    .map((s) => ({ s, km: distanceKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.km - b.km)
  const near = withDist.filter((x) => x.km <= ALERT_KM)

  if (!near.length) {
    const nearest = withDist[0]
    const pacific = withDist.filter((x) => x.s.basin === 'ep').length
    const n = withDist.length
    return (
      <div className="small muted row" style={{ gap: 6, padding: '0 4px' }}>
        <span aria-hidden>🌀</span>
        <span className="grow">
          {n} sistema{n > 1 ? 's' : ''} activo{n > 1 ? 's' : ''}
          {pacific ? ` (${pacific} en el Pacífico)` : ' en el Atlántico'}, el más cercano a {fmtKm(nearest.km)} km de {place} — sin riesgo
        </span>
      </div>
    )
  }

  return (
    <section
      className="card col"
      role="alert"
      style={{ gap: 10, background: 'var(--rojo-soft)', borderColor: 'color-mix(in srgb, var(--rojo) 35%, transparent)' }}
    >
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
          🌀
        </span>
        <div className="col grow" style={{ gap: 2 }}>
          <span className="label" style={{ color: 'var(--rojo)' }}>
            Alerta tropical · cerca de {place}
          </span>
          {near.map(({ s, km }) => (
            <div key={s.id} className="col" style={{ gap: 2 }}>
              <b>
                {kindLabel(s)} «{s.name}»
              </b>
              <span className="small num">
                A {fmtKm(km)} km · vientos {ktToKmh(s.intensity)} km/h · se mueve al {compass(s.movementDir)} a {mphToKmh(s.movementSpeed)} km/h
              </span>
              <a className="small" href={s.publicAdvisory} target="_blank" rel="noreferrer" style={{ fontWeight: 650, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                Ver aviso NHC <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      </div>
      <span className="small">
        Revisen{' '}
        <a href="https://smn.conagua.gob.mx/" target="_blank" rel="noreferrer">
          smn.conagua.gob.mx
        </a>
        ; los tours en lancha pueden cancelarse; tengan agua y efectivo a mano.
      </span>
      <span className="tiny muted num">Actualizado {new Date(data.updated).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
    </section>
  )
}
