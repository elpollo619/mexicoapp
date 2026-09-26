import { useEffect, useState } from 'react'
import { BedDouble, MapPin, Pencil, X } from 'lucide-react'
import { CITIES, STAYS, maps, type CityId } from '../data/trip'
import { useMe } from '../lib/me'
import { put, useItems } from '../lib/store'
import { useNow } from '../lib/time'
import { toast } from '../lib/toast'
import { Sheet, buzz, name } from '../components/ui'
import { dayOf, stayKey } from './night'
import './features.css'

type StayNote = { name: string; address: string; phone?: string; by: string }
type StayCity = Exclude<CityId, 'zrh' | 'home'>

/**
 * "Hueco" de alojamiento de esta noche. Baja tiene dos (La Paz y San José) y CDMX dos (inicio y última noche),
 * así que la dirección se guarda por hueco: stay:cdmx, stay:cdmx2, stay:pvr, stay:gdl, stay:baja, stay:baja2.
 */
function slotFor(night: string): { slot: string; city: StayCity; pickIndex: number } | null {
  const day = dayOf(night)
  if (!day || day.city === 'zrh' || day.city === 'home') return null
  const city = day.city as StayCity
  if (city === 'baja') return night >= '2026-10-15' ? { slot: 'baja2', city, pickIndex: 1 } : { slot: 'baja', city, pickIndex: 0 }
  if (city === 'cdmx' && night >= '2026-10-17') return { slot: 'cdmx2', city, pickIndex: -1 }
  return { slot: city, city, pickIndex: 0 }
}

export function DriverCardButton() {
  const me = useMe()!
  const now = useNow(60_000)
  const night = stayKey(now)
  const s = slotFor(night)
  const notes = useItems<StayNote>('note')
  const [edit, setEdit] = useState(false)
  const [show, setShow] = useState(false)
  if (!s) return null

  const override = notes.find((n) => n.id === `stay:${s.slot}`)?.data
  const picks = STAYS[s.city].filter((x) => x.pick)
  const pick = s.pickIndex >= 0 ? picks[s.pickIndex] ?? picks[0] : undefined
  const stayName = override?.name || pick?.name || 'Por definir'
  const address = override?.address || ''
  const mapsUrl = maps(address ? `${address}, ${CITIES[s.city].name}` : `${stayName}, ${CITIES[s.city].name}`)

  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="col grow" style={{ gap: 2 }}>
          <span className="label">Dónde dormimos hoy · {CITIES[s.city].short}</span>
          <h3>{stayName}</h3>
          {address ? (
            <span className="small">{address}</span>
          ) : (
            <span className="small muted">{pick?.area ? `${pick.area} · ` : ''}Falta la dirección exacta</span>
          )}
          {override?.phone && (
            <a className="small" href={`tel:${override.phone.replace(/\s/g, '')}`}>
              📞 {override.phone}
            </a>
          )}
        </div>
        <button className="iconbtn" onClick={() => setEdit(true)} aria-label="Editar dirección de esta noche">
          <Pencil size={17} />
        </button>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn primary grow"
          onClick={() => {
            buzz()
            setShow(true)
          }}
        >
          <BedDouble size={18} /> Mostrar al taxista
        </button>
        <a className="btn outline" href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Abrir en Google Maps">
          <MapPin size={17} /> Maps
        </a>
      </div>
      {override && <span className="tiny muted">Dirección puesta por {name(override.by)}</span>}

      <Sheet open={edit} onClose={() => setEdit(false)} title="Alojamiento de esta noche">
        {edit && (
          <StayForm
            initial={{ name: override?.name ?? pick?.name ?? '', address: override?.address ?? '', phone: override?.phone ?? '' }}
            onSave={(v) => {
              put('note', `stay:${s.slot}`, { ...v, by: me })
              toast('Dirección guardada para todos ✓')
              setEdit(false)
            }}
          />
        )}
      </Sheet>

      {show && <DriverOverlay stayName={stayName} address={address} mapsUrl={mapsUrl} onClose={() => setShow(false)} />}
    </section>
  )
}

function StayForm({ initial, onSave }: { initial: { name: string; address: string; phone: string }; onSave: (v: { name: string; address: string; phone?: string }) => void }) {
  const [v, setV] = useState(initial)
  return (
    <form
      className="col"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ name: v.name.trim(), address: v.address.trim(), ...(v.phone.trim() ? { phone: v.phone.trim() } : {}) })
      }}
    >
      <label className="field">
        Nombre (hotel / Airbnb)
        <input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </label>
      <label className="field">
        Dirección completa
        <textarea className="input" rows={3} value={v.address} placeholder="Calle, número, colonia" onChange={(e) => setV({ ...v, address: e.target.value })} />
      </label>
      <label className="field">
        Teléfono del anfitrión (opcional)
        <input className="input" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </label>
      <button className="btn primary block" type="submit" disabled={!v.name.trim()}>
        Guardar para todos
      </button>
    </form>
  )
}

type Sentinel = { release: () => Promise<void> }
type WakeNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }

function DriverOverlay({ stayName, address, mapsUrl, onClose }: { stayName: string; address: string; mapsUrl: string; onClose: () => void }) {
  // Pantalla siempre encendida mientras el taxista lee
  useEffect(() => {
    let lock: Sentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        const l = await (navigator as WakeNav).wakeLock?.request('screen')
        if (cancelled) void l?.release()
        else lock = l ?? null
      } catch {
        /* no soportado o sin permiso */
      }
    }
    void acquire()
    const onVis = () => document.visibilityState === 'visible' && void acquire()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelled = true
      void lock?.release().catch(() => {})
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const text = `${stayName} ${address}`
  // Letra lo más grande posible según el largo del texto
  const size = `clamp(26px, ${Math.max(6, Math.min(13, 260 / Math.max(12, text.length)))}vw, 72px)`

  return (
    <div className="driver" role="dialog" aria-modal="true" aria-label="Dirección para el taxista">
      <button className="driver-close" onClick={onClose} aria-label="Cerrar">
        <X size={26} />
      </button>
      <div className="driver-body">
        <span className="driver-kicker">Por favor, lléveme a:</span>
        <span className="driver-name" style={{ fontSize: size }}>
          {stayName}
        </span>
        {address && (
          <span className="driver-address" style={{ fontSize: `calc(${size} * 0.62)` }}>
            {address}
          </span>
        )}
        <span className="driver-thanks">¡Muchas gracias! 🙏</span>
      </div>
      <a className="btn block driver-maps" href={mapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} /> Abrir en Maps
      </a>
    </div>
  )
}
