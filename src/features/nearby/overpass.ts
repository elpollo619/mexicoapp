export type NearbyKind = 'farmacia' | 'cajero' | 'hospital' | 'oxxo'

export type Place = { id: number; lat: number; lon: number; name: string }

export const KINDS: { id: NearbyKind; label: string; emoji: string }[] = [
  { id: 'farmacia', label: 'Farmacia', emoji: '💊' },
  { id: 'cajero', label: 'Cajero', emoji: '🏧' },
  { id: 'hospital', label: 'Hospital', emoji: '🏥' },
  { id: 'oxxo', label: 'OXXO', emoji: '🏪' },
]

const FALLBACK_NAME: Record<NearbyKind, string> = { farmacia: 'Farmacia', cajero: 'Cajero', hospital: 'Hospital', oxxo: 'OXXO' }

function query(kind: NearbyKind, lat: number, lon: number) {
  const a = `(around:${kind === 'hospital' ? 4000 : 1500},${lat},${lon})`
  const body =
    kind === 'farmacia'
      ? `node${a}[amenity=pharmacy];way${a}[amenity=pharmacy];`
      : kind === 'cajero'
        ? `node${a}[amenity=atm];node${a}[amenity=bank][atm=yes];`
        : kind === 'hospital'
          ? `node${a}[amenity~"^(hospital|clinic)$"];way${a}[amenity~"^(hospital|clinic)$"];`
          : `node${a}[shop=convenience][name~"oxxo",i];way${a}[shop=convenience][name~"oxxo",i];`
  return `[out:json][timeout:15];(${body});out center 30;`
}

type Element = { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

/** Busca lugares cercanos en OpenStreetMap (Overpass, gratis y sin clave). Cachea por sesión. */
export async function findNearby(kind: NearbyKind, lat: number, lon: number): Promise<Place[]> {
  const key = `mx-near:${kind}:${lat.toFixed(3)},${lon.toFixed(3)}`
  try {
    const hit = sessionStorage.getItem(key)
    if (hit) return JSON.parse(hit)
  } catch {
    /* ignore */
  }
  const json = await fetchOverpass(query(kind, lat, lon))
  const places: Place[] = (json.elements ?? [])
    .map((e) => {
      const la = e.lat ?? e.center?.lat
      const lo = e.lon ?? e.center?.lon
      if (la == null || lo == null) return null
      const t = e.tags ?? {}
      const name = t.name || t.brand || t.operator || FALLBACK_NAME[kind]
      return { id: e.id, lat: la, lon: lo, name }
    })
    .filter((p): p is Place => !!p)
  try {
    sessionStorage.setItem(key, JSON.stringify(places))
  } catch {
    /* ignore */
  }
  return places
}

// Servidor principal y espejo (el principal a veces responde 504 cuando está saturado)
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']

async function fetchOverpass(q: string): Promise<{ elements?: Element[] }> {
  let last: unknown
  for (const url of ENDPOINTS) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: ctrl.signal })
      if (res.ok) return await res.json()
      last = new Error(`Overpass ${res.status}`)
    } catch (e) {
      last = e
    } finally {
      clearTimeout(timer)
    }
  }
  throw last
}

/** Posición del teléfono (o null si se niega / no hay) */
export function locate(timeoutMs = 8000): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60_000 },
    )
  })
}
