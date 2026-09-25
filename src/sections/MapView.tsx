import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { maps } from '../data/trip'

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

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([21.5, -104.5], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
    }
  }, [])

  return (
    <>
      <div ref={el} className="map" style={{ height: '62dvh' }} />
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
