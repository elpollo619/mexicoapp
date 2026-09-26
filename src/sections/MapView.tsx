import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES, maps } from '../data/trip'
import { currentDay } from './Home'
import { findNearby, KINDS, locate, type NearbyKind } from '../features/nearby/overpass'
import { PEOPLE, person } from '../data/people'
import { avatarSrc } from '../data/avatars'
import { useNow } from '../lib/time'
import { ago, useWhere } from '../features/where/where'

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

type Pt = { name: string; lat: number; lon: number; emoji: string; when: string }

const POINTS: Pt[] = [
  { name: 'Ciudad de México', lat: 19.4126, lon: -99.1716, emoji: '🌮', when: '3–6 oct y 17 oct' },
  { name: 'Teotihuacán', lat: 19.6925, lon: -98.8438, emoji: '🛕', when: 'lun 5' },
  { name: 'Puerto Vallarta', lat: 20.6034, lon: -105.2374, emoji: '🏝️', when: '6–8 oct' },
  { name: 'Islas Marietas', lat: 20.6993, lon: -105.5695, emoji: '🐢', when: 'mié 7' },
  { name: 'Tequila', lat: 20.8826, lon: -103.8364, emoji: '🥃', when: 'jue 8' },
  { name: 'Guadalajara', lat: 20.6736, lon: -103.3688, emoji: '🎂', when: '8–12 oct' },
  { name: 'Tlaquepaque', lat: 20.6409, lon: -103.3112, emoji: '🎺', when: 'sáb 10' },
  { name: 'La Paz', lat: 24.1426, lon: -110.3128, emoji: '🦭', when: '12–15 oct' },
  { name: 'Playa Balandra', lat: 24.3221, lon: -110.3285, emoji: '🏖️', when: 'mié 14' },
  { name: 'Isla Espíritu Santo', lat: 24.4719, lon: -110.3587, emoji: '🐬', when: 'mar 13' },
  { name: 'Todos Santos', lat: 23.4464, lon: -110.2265, emoji: '🎸', when: 'jue 15' },
  { name: 'San José del Cabo', lat: 23.0615, lon: -109.6974, emoji: '🌵', when: '15–17 oct' },
  { name: 'Cabo San Lucas · El Arco', lat: 22.8761, lon: -109.8912, emoji: '🌊', when: 'vie 16' },
]

const P = (n: string) => {
  const p = POINTS.find((x) => x.name === n)!
  return [p.lat, p.lon] as [number, number]
}

const ROAD: [number, number][][] = [
  [P('Puerto Vallarta'), P('Tequila'), P('Guadalajara')],
  [P('La Paz'), P('Todos Santos'), P('San José del Cabo'), P('Cabo San Lucas · El Arco')],
]
const AIR: [number, number][][] = [
  [P('Ciudad de México'), P('Puerto Vallarta')],
  [P('Guadalajara'), P('La Paz')],
  [P('San José del Cabo'), P('Ciudad de México')],
]

export default function MapView() {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const peopleRef = useRef<L.LayerGroup | null>(null)
  const now = useNow(30000)
  const where = useWhere(now)
  const people = PEOPLE.filter((p) => where[p.id])
  const [near, setNear] = useState<{ kind: NearbyKind | null; state: 'idle' | 'loading' | 'done' | 'error'; count: number; fallback: boolean }>({
    kind: null,
    state: 'idle',
    count: 0,
    fallback: false,
  })

  async function search(kind: NearbyKind) {
    const map = mapRef.current
    if (!map) return
    setNear({ kind, state: 'loading', count: 0, fallback: false })
    const here = await locate()
    const city = CITIES[currentDay(Date.now()).day.city]
    const origin = here ?? { lat: city.lat, lon: city.lon }
    try {
      const places = await findNearby(kind, origin.lat, origin.lon)
      const layer = layerRef.current ?? L.layerGroup().addTo(map)
      layerRef.current = layer
      layer.clearLayers()
      const emoji = KINDS.find((k) => k.id === kind)!.emoji
      L.circleMarker([origin.lat, origin.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
        .bindPopup(here ? 'Estás aquí' : `Centro de ${esc(city.name)} (sin ubicación)`)
        .addTo(layer)
      for (const p of places) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="font-size:18px;background:#fff;border-radius:50%;width:28px;height:28px;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,.35)">${emoji}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker([p.lat, p.lon], { icon })
          .bindPopup(
            `<b>${esc(p.name)}</b><br><a href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}" target="_blank" rel="noreferrer">Abrir en Google Maps</a>`,
          )
          .addTo(layer)
      }
      const pts: [number, number][] = [[origin.lat, origin.lon], ...places.map((p) => [p.lat, p.lon] as [number, number])]
      if (places.length) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 16 })
      else map.setView([origin.lat, origin.lon], 15)
      setNear({ kind, state: 'done', count: places.length, fallback: !here })
    } catch {
      setNear({ kind, state: 'error', count: 0, fallback: !here })
    }
  }

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([21.5, -104.5], 5)
    mapRef.current = map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    for (const line of ROAD) L.polyline(line, { color: '#e4007c', weight: 4 }).addTo(map)
    for (const line of AIR) L.polyline(line, { color: '#00a3a3', weight: 3, dashArray: '8 8' }).addTo(map)
    for (const p of POINTS) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${p.emoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      L.marker([p.lat, p.lon], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b><br>${p.when}<br><a href="${maps(p.name + ', México')}" target="_blank" rel="noreferrer">Abrir en Google Maps</a>`)
    }
    map.fitBounds(L.latLngBounds(POINTS.map((p) => [p.lat, p.lon])), { padding: [20, 20] })
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Marcadores de la gente (cara anime o máscara), se actualizan solos al llegar posiciones nuevas
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const layer = peopleRef.current ?? L.layerGroup().addTo(map)
    peopleRef.current = layer
    layer.clearLayers()
    for (const p of people) {
      const w = where[p.id]
      const src = avatarSrc(p.id)
      const face = src
        ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`
        : `<div style="width:100%;height:100%;display:grid;place-items:center;background:${p.color};font-size:18px">${p.emoji}</div>`
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid ${p.color};box-shadow:0 2px 6px rgba(0,0,0,.4);background:#fff">${face}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })
      L.marker([w.lat, w.lon], { icon, zIndexOffset: 1000 })
        .bindPopup(
          `<b>${esc(person(p.id).name)}</b> · ${esc(ago(w.at, now))}${w.acc > 100 ? ` · ±${Math.round(w.acc)} m` : ''}<br><a href="https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lon}&travelmode=walking" target="_blank" rel="noreferrer">Cómo llegar</a>`,
        )
        .addTo(layer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(where), now])

  const showGroup = () => {
    const map = mapRef.current
    if (!map || !people.length) return
    map.fitBounds(L.latLngBounds(people.map((p) => [where[p.id].lat, where[p.id].lon])), { padding: [40, 40], maxZoom: 16 })
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <div ref={el} className="map" style={{ height: '62dvh' }} />
        <div
          className="card tight col"
          style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 500, gap: 6, padding: '8px 10px', boxShadow: 'var(--shadow-2)' }}
        >
          <div className="row between">
            <span className="label">Cerca de mí</span>
            {people.length > 0 && (
              <button className="chip on" onClick={showGroup} style={{ flex: 'none' }}>
                📍 Ver al grupo ({people.length})
              </button>
            )}
          </div>
          <div className="chips" style={{ paddingBottom: 0 }}>
            {KINDS.map((k) => (
              <button
                key={k.id}
                className={`chip${near.kind === k.id ? ' on' : ''}`}
                onClick={() => void search(k.id)}
                disabled={near.state === 'loading'}
                aria-pressed={near.kind === k.id}
              >
                {k.emoji} {k.label}
              </button>
            ))}
          </div>
          {near.state === 'loading' && <span className="tiny muted">Buscando…</span>}
          {near.state === 'done' && (
            <span className="tiny muted">
              {near.count ? `${near.count} encontrado${near.count > 1 ? 's' : ''}` : 'Nada cerca de aquí'}
              {near.fallback ? ' · sin tu ubicación, busqué en el centro de la ciudad' : ''}
            </span>
          )}
          {near.state === 'error' && <span className="tiny" style={{ color: 'var(--rojo)' }}>No se pudo buscar (¿sin conexión?). Intenta de nuevo.</span>}
        </div>
      </div>
      <div className="row small muted wrap" style={{ gap: 14 }}>
        <span>
          <b style={{ color: 'var(--rosa)' }}>━━</b> por carretera
        </span>
        <span>
          <b style={{ color: 'var(--turq)' }}>┅┅</b> en avión
        </span>
        <span>Toca un emoji para ver el lugar.</span>
      </div>
    </>
  )
}
