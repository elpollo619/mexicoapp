import { useState } from 'react'
import { ArrowRight, Car, Dices, Plus, Siren } from 'lucide-react'
import type { Go } from '../App'
import { CITIES, DAYS, STOPS, spotOf, todayOnTrip, tripTz, type Spot } from '../data/trip'
import { CITY_PHOTO, DAY_PHOTO, photo } from '../data/photos'
import { useMe } from '../lib/me'
import { balances, fmt, fromCHF, useRates, type Expense, type Settlement } from '../lib/money'
import { useItems } from '../lib/store'
import { countdown, dayParts, hhmm, longDate, useNow, zoned } from '../lib/time'
import { weatherIcon, useWeather } from '../lib/weather'
import { arrEpoch, hasTime, inFlight, useFlights } from '../lib/flights'
import { name } from '../components/ui'
import { InstallBanner } from '../components/Install'
import { CHECKLIST } from '../data/info'
import { FlightPass } from './Flights'
import SafeHome from '../features/SafeHome'
import StormBanner from '../features/storm/StormBanner'
import { DriverCardButton } from '../features/DriverCard'

const DEPARTURE = zoned('2026-10-02T15:35', 'Europe/Zurich')
const FIRST = DAYS[1].date
const LAST = DAYS[DAYS.length - 1].date
/** Días de viaje: del 3 al 18 de octubre (el 2 es solo el despegue) */
const TRIP_DAYS = DAYS.length - 1

/**
 * Día del itinerario que toca mostrar "hoy".
 * before: cuenta atrás · enVuelo: ya despegaron y en México aún es 2 oct · during: día N · after: ya volvimos
 */
export function currentDay(now: number) {
  if (now < DEPARTURE) return { day: DAYS[1], phase: 'before' as const }
  const t = todayOnTrip(now)
  if (t < FIRST) return { day: DAYS[1], phase: 'enVuelo' as const }
  if (t > LAST) return { day: DAYS[DAYS.length - 1], phase: 'after' as const }
  return { day: DAYS.find((d) => d.date === t) ?? DAYS[1], phase: 'during' as const }
}

const cityVar = (id: string) => `var(--c-${id === 'zrh' || id === 'home' ? 'cdmx' : id})`
const coastal = (id: string) => id === 'pvr' || id === 'baja'

export default function Home({ go }: { go: Go }) {
  const now = useNow(1000)
  const me = useMe()!
  const { day, phase } = currentDay(now)
  const city = CITIES[day.city]
  const place = spotOf(day)
  const tz = tripTz(now)
  const flights = useFlights()
  // El vuelo en el aire sigue siendo "el próximo" hasta que aterriza
  const next =
    flights.find((f) => hasTime(f) && arrEpoch(f) > now && f.who.includes(me)) ?? flights.find((f) => hasTime(f) && arrEpoch(f) > now)
  const airborne = flights.find((f) => inFlight(f, now)) ?? flights.find((f) => hasTime(f) && arrEpoch(f) > now)
  const landing = airborne ? countdown(arrEpoch(airborne) - now) : null
  const expenses = useItems<Expense>('expense').map((i) => i.data)
  const settlements = useItems<Settlement>('settlement').map((i) => i.data)
  const myBal = balances(expenses, settlements)[me] ?? 0
  const dayIndex = DAYS.findIndex((d) => d.date === day.date)
  const lastDay = day.city === 'home'
  const hero = photo(...(DAY_PHOTO[day.date] ?? []), ...CITY_PHOTO[day.city])
  const cd = countdown(DEPARTURE - now)

  return (
    <>
      <section className="photo" style={{ minHeight: 236, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
        {hero && <img src={hero.src} alt="" />}
        <span className="label" style={{ color: 'rgba(255,255,255,.82)' }}>
          ¡Hola, {name(me)}!
        </span>
        {phase === 'before' && (
          <>
            <div className="row" style={{ gap: 18, alignItems: 'flex-end' }}>
              {(
                [
                  [cd.d, 'días'],
                  [cd.h, 'horas'],
                  [cd.m, 'min'],
                  [cd.s, 'seg'],
                ] as const
              ).map(([v, l]) => (
                <div key={l} className="col" style={{ gap: 0 }}>
                  <span className="big" style={{ fontSize: 40, minWidth: '2ch' }}>
                    {String(v).padStart(2, '0')}
                  </span>
                  <span className="tiny">{l}</span>
                </div>
              ))}
            </div>
            <span className="small" style={{ fontWeight: 600 }}>
              para despegar rumbo a México 🇲🇽
            </span>
          </>
        )}
        {phase === 'enVuelo' && (
          <>
            <span className="big" style={{ fontSize: 34 }}>
              En el aire ✈️
            </span>
            <span style={{ fontWeight: 650 }}>
              {landing
                ? `${airborne?.who.includes(me) ? 'aterrizas' : 'aterrizan'} en ${landing.h} h ${String(landing.m).padStart(2, '0')} min`
                : 'rumbo a México 🇲🇽'}
            </span>
          </>
        )}
        {phase === 'during' && (
          <>
            <span className="big" style={{ fontSize: 40 }}>
              Día {dayIndex} <span style={{ opacity: 0.55, fontSize: 24 }}>/ {TRIP_DAYS}</span>
            </span>
            <span style={{ fontWeight: 650 }}>
              {lastDay ? 'Último día · ¡Casa! 🏠' : city.name} · {longDate(day.date)}
            </span>
            <span className="small num" style={{ color: 'rgba(255,255,255,.82)' }}>
              🕒 {hhmm(now, tz)} aquí · en Suiza son las {hhmm(now, 'Europe/Zurich')}
            </span>
          </>
        )}
        {phase === 'after' && <span className="big">¡Qué viaje! 🥹</span>}
      </section>

      {(() => {
        // Vigilar la costa donde estamos hoy; el día que la dejamos (van a GDL el 8, vuelo a CDMX el 17) seguimos
        // vigilándola, y tierra adentro, la próxima parada en la costa
        const prev = DAYS[dayIndex - 1]
        const leaving = prev && coastal(prev.city) && !coastal(day.city) && day.items.some((it) => it.type === 'move' || it.type === 'fly')
        const coast: Spot = coastal(day.city)
          ? place
          : leaving
            ? spotOf(prev)
            : CITIES[STOPS.find((s) => coastal(s.city) && s.to > day.date)?.city ?? day.city]
        return <StormBanner lat={coast.lat} lon={coast.lon} place={coast.short} />
      })()}

      <InstallBanner onGuide={() => go('info', 'instalar')} />

      <div className="quick">
        <button onClick={() => go('plata')}>
          <span className="qi" style={{ background: 'var(--rosa-soft)', color: 'var(--rosa)' }}>
            <Plus size={20} />
          </span>
          Gasto
        </button>
        <button onClick={() => go('grupo', 'juegos')}>
          <span className="qi" style={{ background: 'var(--cempa-soft)', color: '#b26a00' }}>
            <Dices size={20} />
          </span>
          Quién paga
        </button>
        <button onClick={() => go('info', 'moverse')}>
          <span className="qi" style={{ background: 'var(--turq-soft)', color: 'var(--turq)' }}>
            <Car size={20} />
          </span>
          Taxis
        </button>
        <button onClick={() => go('info', 'sos')}>
          <span className="qi" style={{ background: 'var(--rojo-soft)', color: 'var(--rojo)' }}>
            <Siren size={20} />
          </span>
          SOS
        </button>
      </div>

      {phase === 'before' && <ToBook go={go} />}

      <section className="card col" style={{ gap: 10 }}>
        <div className="row between">
          <div className="col" style={{ gap: 0 }}>
            <span className="label" style={{ color: cityVar(day.city) }}>
              {phase === 'before' || phase === 'enVuelo' ? 'Primer día' : 'Hoy'} · {city.short}
            </span>
            <h3>{day.title}</h3>
          </div>
        </div>
        <div className="col" style={{ gap: 7 }}>
          {day.items.slice(0, 6).map((it) => {
            const isNext = phase === 'during' && it.id === nextItemId(day.items, now, place.tz)
            return (
              <div key={it.id} className="row small" style={{ alignItems: 'baseline', fontWeight: isNext ? 700 : undefined }}>
                <span className="num" style={{ width: 52, flex: 'none', fontWeight: 700, fontSize: 12, color: isNext ? 'var(--rosa)' : 'var(--muted)' }}>
                  {it.time ?? '·'}
                </span>
                <span className="grow ellipsis">{it.title}</span>
                {isNext && <span className="tag ok">Sigue</span>}
              </div>
            )
          })}
        </div>
        <button className="btn ghost small" onClick={() => go('viaje', 'dia')}>
          Ver el día completo <ArrowRight size={15} />
        </button>
      </section>

      {phase === 'during' && <DriverCardButton />}
      {phase === 'during' && <SafeHome />}

      {next && (
        <section className="col" style={{ gap: 8 }}>
          <div className="row between">
            <span className="label">Próximo vuelo</span>
            <button className="btn ghost small" onClick={() => go('viaje', 'vuelos')}>
              Todos <ArrowRight size={14} />
            </button>
          </div>
          <FlightPass f={next} now={now} compact />
        </section>
      )}

      <Weather city={place} />

      <div className="grid2">
        <button className="card col" style={{ textAlign: 'left', gap: 2 }} onClick={() => go('plata')}>
          <span className="label">Mi saldo</span>
          <span className="big num" style={{ fontSize: 26, color: Math.abs(myBal) < 0.5 ? 'var(--ink)' : myBal > 0 ? 'var(--verde)' : 'var(--rojo)' }}>
            {myBal > 0.5 ? '+' : myBal < -0.5 ? '−' : ''}
            {Math.abs(myBal).toFixed(0)}
            <span style={{ fontSize: 14 }}> CHF</span>
          </span>
          <span className="tiny muted">{Math.abs(myBal) < 0.5 ? 'estás a mano' : myBal > 0 ? 'te deben' : 'debes'}</span>
        </button>
        <Converter />
      </div>

      <section className="card col">
        <span className="label">La ruta</span>
        <div className="route">
          {STOPS.map((s, i) => {
            const c = CITIES[s.city]
            const active = phase === 'during' && day.date >= s.from && day.date < s.to
            const done = phase === 'after' || (phase === 'during' && s.to <= day.date)
            return (
              <div key={i} className={`stop${done ? ' done' : ''}`} style={{ color: cityVar(s.city) }}>
                <span className="node" style={{ background: active ? 'currentColor' : 'var(--card)' }} />
                <div className="col" style={{ gap: 0, color: 'var(--ink)' }}>
                  <b>{c.name}</b>
                  <span className="small muted num">
                    {dayParts(s.from).day}–{dayParts(s.to).day} oct · {s.nights} noche{s.nights > 1 ? 's' : ''} · {s.people} pers.
                  </span>
                </div>
                {active && <span className="tag ok">Aquí</span>}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

/** Clima del lugar concreto de hoy (en Baja: La Paz o San José del Cabo según el día) */
function Weather({ city }: { city: Spot }) {
  const w = useWeather(city.lat, city.lon, city.tz)
  return (
    <section className="card col" style={{ gap: 10 }}>
      <div className="row between">
        <div className="col" style={{ gap: 0 }}>
          <span className="label">Clima · {city.short}</span>
          <span className="small muted">{w ? `Viento ${Math.round(w.wind)} km/h` : 'Cargando pronóstico…'}</span>
        </div>
        {w && (
          <span className="row" style={{ gap: 6 }}>
            <span style={{ fontSize: 26 }}>{weatherIcon(w.code)}</span>
            <span className="big num" style={{ fontSize: 30 }}>
              {Math.round(w.temp)}°
            </span>
          </span>
        )}
      </div>
      {w && (
        <div className="grid4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {w.daily.slice(0, 5).map((d) => (
            <div key={d.date} className="col center" style={{ gap: 1, alignItems: 'center' }}>
              <span className="tiny muted" style={{ fontWeight: 650 }}>
                {dayParts(d.date).dow}
              </span>
              <span style={{ fontSize: 19 }}>{weatherIcon(d.code)}</span>
              <span className="small num" style={{ fontWeight: 700 }}>
                {Math.round(d.max)}°<span className="muted" style={{ fontWeight: 500 }}> {Math.round(d.min)}°</span>
              </span>
              <span className="tiny num" style={{ color: 'var(--turq)', visibility: d.rain >= 30 ? 'visible' : 'hidden' }}>
                💧{d.rain}%
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Converter() {
  const { rates } = useRates()
  const [mxn, setMxn] = useState('500')
  const val = Number(mxn.replace(',', '.')) || 0
  return (
    <div className="card col" style={{ gap: 4 }}>
      <span className="label">Pesos → CHF</span>
      <input className="input num" inputMode="decimal" value={mxn} onChange={(e) => setMxn(e.target.value)} style={{ minHeight: 38, padding: '6px 10px' }} aria-label="Monto en pesos" />
      <span className="num" style={{ fontWeight: 800 }}>{fmt(val * rates.MXN, 'CHF')}</span>
      <span className="tiny muted num">1 CHF = {fromCHF(1, 'MXN').toFixed(2)} MXN</span>
    </div>
  )
}

/** Primera actividad con hora (HH:MM) que aún no pasó, en la hora local de la ciudad */
function nextItemId(items: { id: string; time?: string }[], now: number, tz: string) {
  const hm = hhmm(now, tz)
  return items.find((it) => it.time && /^\d{2}:\d{2}/.test(it.time) && it.time.slice(0, 5) >= hm)?.id
}

type Check = { key: string; by: string }

function ToBook({ go }: { go: Go }) {
  const checks = useItems<Check>('check')
  const group = CHECKLIST.filter((c) => !c.group.startsWith('Antes de salir'))
  const missing = group.filter((c) => !checks.some((x) => x.id === `check:${c.id}`))
  if (!missing.length) return null
  return (
    <button className="card cempa row" style={{ textAlign: 'left' }} onClick={() => go('info', 'lista')}>
      <span style={{ fontSize: 26 }}>📝</span>
      <span className="grow col" style={{ gap: 0 }}>
        <b>
          Faltan {missing.length} reserva{missing.length > 1 ? 's' : ''}
        </b>
        <span className="small muted ellipsis">{missing.slice(0, 3).map((m) => m.label.split(' · ')[0].split(' (')[0]).join(' · ')}…</span>
      </span>
      <ArrowRight size={18} />
    </button>
  )
}
