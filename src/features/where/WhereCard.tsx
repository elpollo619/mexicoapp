import { useState } from 'react'
import { LocateFixed, MapPin, Navigation, Radio, X } from 'lucide-react'
import { PEOPLE } from '../../data/people'
import { useMe } from '../../lib/me'
import { toast } from '../../lib/toast'
import { Avatar, buzz } from '../../components/ui'
import { ago, directions, distLabel, isLive, shareOnce, startLive, stopLive, stopSharing, useLive, useWhere, type Where } from './where'
import type { Go } from '../../App'

const FAIL: Record<string, string> = {
  denegado: 'Sin permiso de ubicación: actívalo en los ajustes del navegador para esta app.',
  error: 'No se pudo obtener tu ubicación. ¿GPS apagado o sin señal?',
}

/** "Dónde estamos": cada uno comparte su posición con un toque; se ve quién está a cuánto de ti */
export default function WhereCard({ now, go }: { now: number; go: Go }) {
  const me = useMe()!
  const where = useWhere(now)
  const { live } = useLive()
  const [busy, setBusy] = useState(false)
  const mine = where[me]
  const others = PEOPLE.filter((p) => p.id !== me && where[p.id])
  const fresh = mine && now - Date.parse(mine.at) < 10 * 60 * 1000

  const share = async (mode: 'once' | 'live') => {
    buzz()
    setBusy(true)
    const r = mode === 'live' ? await startLive(me) : await shareOnce(me)
    setBusy(false)
    if (r === 'ok') toast(mode === 'live' ? 'Compartiendo tu ubicación 30 min 📡' : 'Ubicación compartida 📍')
    else toast(FAIL[r], 4000)
  }

  return (
    <section className="card col where" style={{ gap: 10 }}>
      <div className="row between">
        <span className="label">📍 Dónde estamos</span>
        {others.length > 0 && (
          <button className="btn ghost small" onClick={() => go('viaje', 'mapa')}>
            <MapPin size={14} /> Mapa
          </button>
        )}
      </div>

      {others.length === 0 ? (
        <span className="small muted">Nadie compartió su ubicación en las últimas 3 horas. Comparte la tuya para que te encuentren.</span>
      ) : (
        <div className="col" style={{ gap: 6 }}>
          {others.map((p) => {
            const w = where[p.id] as Where
            return (
              <a key={p.id} className="row where-row" href={directions(w)} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Avatar id={p.id} />
                <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                  <b className="ellipsis">
                    {p.name}
                    {w.live && now - Date.parse(w.at) < 5 * 60 * 1000 && (
                      <span className="tag ok" style={{ marginLeft: 6 }}>
                        en vivo
                      </span>
                    )}
                  </b>
                  <span className="tiny muted">
                    {ago(w.at, now)}
                    {fresh ? ` · a ${distLabel(mine!, w)} de ti` : ''}
                    {w.acc > 100 ? ` · ±${Math.round(w.acc / 100) * 100} m` : ''}
                  </span>
                </span>
                <Navigation size={16} style={{ color: 'var(--muted)', flex: 'none' }} />
              </a>
            )
          })}
        </div>
      )}

      <div className="row wrap" style={{ gap: 8 }}>
        {live ? (
          <button className="btn small" style={{ background: 'var(--rojo)', color: '#fff' }} onClick={() => { stopLive(); toast('Dejaste de compartir en vivo') }}>
            <Radio size={15} /> Compartiendo · parar
          </button>
        ) : (
          <>
            <button className="btn primary small" disabled={busy} onClick={() => void share('once')}>
              <LocateFixed size={15} /> {busy ? 'Buscando…' : 'Compartir mi ubicación'}
            </button>
            <button className="btn ghost small" disabled={busy} onClick={() => void share('live')} title="Actualiza sola durante 30 minutos">
              <Radio size={15} /> 30 min en vivo
            </button>
          </>
        )}
        {mine && !isLive() && (
          <button className="btn ghost small" onClick={() => { stopSharing(me); toast('Ya no se ve tu ubicación') }} aria-label="Dejar de compartir">
            <X size={15} /> Ocultar la mía
          </button>
        )}
      </div>
      {mine && <span className="tiny muted">Tu última ubicación: {ago(mine.at, now)}. Se borra sola a las 3 h.</span>}
    </section>
  )
}
