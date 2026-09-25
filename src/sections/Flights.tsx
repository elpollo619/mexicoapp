import { useState } from 'react'
import { Pencil, Plane, Plus } from 'lucide-react'
import { AIRPORT_TZ, type Flight } from '../data/flights'
import { CORE } from '../data/people'
import { depEpoch, arrEpoch, hasTime, useFlights } from '../lib/flights'
import { useMe } from '../lib/me'
import { put, uid } from '../lib/store'
import { countdown, longDate, useNow } from '../lib/time'
import { Avatars, name, PeoplePicker, Sheet } from '../components/ui'

export default function Flights() {
  const flights = useFlights()
  const me = useMe()!
  const now = useNow(30000)
  const [mineOnly, setMineOnly] = useState(false)
  const [edit, setEdit] = useState<Flight | null>(null)
  const list = mineOnly ? flights.filter((f) => f.who.includes(me)) : flights

  return (
    <>
      <div className="seg">
        <button className={!mineOnly ? 'on' : ''} onClick={() => setMineOnly(false)}>
          Todos ({flights.length})
        </button>
        <button className={mineOnly ? 'on' : ''} onClick={() => setMineOnly(true)}>
          Los míos ({flights.filter((f) => f.who.includes(me)).length})
        </button>
      </div>

      {list.map((f) => (
        <FlightPass key={f.id} f={f} now={now} onEdit={() => setEdit(f)} />
      ))}

      <button
        className="btn block ghost"
        onClick={() =>
          setEdit({
            id: `f-${uid()}`,
            dep: '2026-10-17T10:00',
            arr: '2026-10-17T12:00',
            from: '',
            fromName: '',
            to: '',
            toName: '',
            airline: '',
            numbers: '',
            who: CORE,
            status: 'comprado',
            custom: true,
          })
        }
      >
        <Plus size={16} /> Añadir vuelo
      </button>
      <p className="tiny muted center">Horas locales de cada aeropuerto. Sin localizadores ni PIN: están en los PDF del chat.</p>

      <EditFlight flight={edit} onClose={() => setEdit(null)} />
    </>
  )
}

function EditFlight({ flight, onClose }: { flight: Flight | null; onClose: () => void }) {
  return (
    <Sheet open={!!flight} onClose={onClose} title="Editar vuelo">
      {flight && <FlightForm key={flight.id} flight={flight} onClose={onClose} />}
    </Sheet>
  )
}

function FlightForm({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  const [f, setF] = useState(flight)
  const set = <K extends keyof Flight>(k: K, v: Flight[K]) => setF({ ...f, [k]: v })
  const text = (k: 'from' | 'fromName' | 'to' | 'toName' | 'airline' | 'numbers' | 'notes' | 'bags' | 'price', label: string) => (
    <label className="field">
      {label}
      <input className="input" value={f[k] ?? ''} onChange={(e) => set(k, k === 'from' || k === 'to' ? e.target.value.toUpperCase() : e.target.value)} />
    </label>
  )
  return (
    <form
      className="col"
      onSubmit={(e) => {
        e.preventDefault()
        put('flight', f.id, f)
        onClose()
      }}
    >
      <div className="grid2">
        {text('from', 'Desde (código)')}
        {text('to', 'Hasta (código)')}
      </div>
      <div className="grid2">
        {text('fromName', 'Aeropuerto salida')}
        {text('toName', 'Aeropuerto llegada')}
      </div>
      <div className="grid2">
        <label className="field">
          Salida (hora local)
          <input className="input" type="datetime-local" value={f.dep} onChange={(e) => set('dep', e.target.value)} />
        </label>
        <label className="field">
          Llegada (hora local)
          <input className="input" type="datetime-local" value={f.arr} onChange={(e) => set('arr', e.target.value)} />
        </label>
      </div>
      <div className="grid2">
        {text('airline', 'Aerolínea')}
        {text('numbers', 'N.º de vuelo')}
      </div>
      {text('bags', 'Equipaje')}
      {text('price', 'Precio')}
      {text('notes', 'Notas')}
      <div className="field">
        Quién va
        <PeoplePicker multi value={f.who} onChange={(v) => set('who', v)} />
      </div>
      <div className="seg">
        <button type="button" className={f.status === 'comprado' ? 'on' : ''} onClick={() => set('status', 'comprado')}>
          ✓ Comprado
        </button>
        <button type="button" className={f.status === 'pendiente' ? 'on' : ''} onClick={() => set('status', 'pendiente')}>
          ⏳ Pendiente
        </button>
      </div>
      <button className="btn block" type="submit" disabled={!f.from || !f.to}>
        Guardar para todos
      </button>
    </form>
  )
}

const AIRLINE_COLOR: Record<string, string> = {
  Volaris: '#a3238e',
  Viva: '#00a651',
  Arajet: '#8ec641',
  Aeroméxico: '#0b2343',
  Swiss: '#e2001a',
}
const accentOf = (f: Flight) => Object.entries(AIRLINE_COLOR).find(([k]) => f.airline.includes(k))?.[1] ?? 'var(--line-2)'

/** Vuelo con formato de pase de abordar */
export function FlightPass({ f, now, onEdit, compact }: { f: Flight; now: number; onEdit?: () => void; compact?: boolean }) {
  const timed = hasTime(f)
  const past = timed && arrEpoch(f) < now
  const upcoming = timed && depEpoch(f) > now
  const cd = timed ? countdown(depEpoch(f) - now) : null
  const mins = timed ? Math.round((arrEpoch(f) - depEpoch(f)) / 60000) : 0
  const nextDay = timed && f.arr.slice(0, 10) !== f.dep.slice(0, 10)
  const tzNote = AIRPORT_TZ[f.from] !== AIRPORT_TZ[f.to]
  return (
    <article className={`pass${past ? ' past' : ''}`}>
      <span className="accent" style={{ background: accentOf(f) }} />
      <div className="pass-top">
        <div className="row between">
          <span className="label">{longDate(f.dep.slice(0, 10))}</span>
          <span className={`tag ${f.status === 'comprado' ? 'ok' : 'wait'}`}>{f.status === 'comprado' ? 'Comprado' : 'Pendiente'}</span>
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 0 }}>
          <div className="col" style={{ gap: 3 }}>
            <span className="code">{f.from}</span>
            <span className="num" style={{ fontWeight: 700 }}>{timed ? f.dep.slice(11) : '--:--'}</span>
          </div>
          <div className="col grow" style={{ alignItems: 'stretch', gap: 0, padding: '0 12px 26px' }}>
            <span className="tiny muted num center">{timed && mins > 0 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min` : ''}</span>
            <div className="route-line" style={{ width: '100%' }}>
              <Plane size={16} />
            </div>
          </div>
          <div className="col" style={{ gap: 3, alignItems: 'flex-end' }}>
            <span className="code">{f.to}</span>
            <span className="num" style={{ fontWeight: 700 }}>
              {timed ? f.arr.slice(11) : '--:--'}
              {nextDay && <sup className="tiny" style={{ color: 'var(--rosa)' }}> +1</sup>}
            </span>
          </div>
        </div>
        <div className="row between tiny muted" style={{ marginTop: -6 }}>
          <span className="ellipsis" style={{ maxWidth: '48%' }}>{f.fromName}</span>
          <span className="ellipsis" style={{ maxWidth: '48%', textAlign: 'right' }}>{f.toName}</span>
        </div>
      </div>
      <div className="pass-stub">
        <div className="meta">
          <div>
            <span className="label">Vuelo</span>
            <b>{f.numbers}</b>
          </div>
          <div>
            <span className="label">Aerolínea</span>
            <b className="ellipsis">{f.airline}</b>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="label">{upcoming ? 'Sale en' : past ? 'Estado' : 'Hora'}</span>
            <b style={{ color: upcoming ? 'var(--rosa)' : undefined }}>
              {upcoming && cd ? (cd.d > 0 ? `${cd.d} d ${cd.h} h` : `${cd.h} h ${cd.m} min`) : past ? 'Volado ✓' : 'Por definir'}
            </b>
          </div>
        </div>
        <div className="row between">
          <Avatars ids={f.who} />
          {onEdit && (
            <button className="btn ghost small" onClick={onEdit}>
              <Pencil size={14} /> Editar
            </button>
          )}
        </div>
        {!compact && (
          <>
            {f.bags && <span className="small muted">🧳 {f.bags}</span>}
            {f.price && (
              <span className="small muted">
                💳 {f.price}
                {f.bookedBy ? ` · pagó ${name(f.bookedBy)}` : ''}
              </span>
            )}
            {f.notes && <span className="small">{f.notes}</span>}
            {tzNote && timed && <span className="tiny muted">Horas locales de cada aeropuerto (cambia la zona horaria).</span>}
          </>
        )}
      </div>
    </article>
  )
}
