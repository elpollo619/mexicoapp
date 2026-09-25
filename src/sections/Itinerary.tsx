import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { CITIES, DAYS, FOOD, STAYS, type Activity, type CityId } from '../data/trip'
import { useMe } from '../lib/me'
import { put, remove, useItems } from '../lib/store'
import { dayParts, longDate, todayIn } from '../lib/time'
import { Avatars, buzz } from '../components/ui'
import Flights from './Flights'
import { CITY_PHOTO, DAY_PHOTO, photo } from '../data/photos'
import { currentDay } from './Home'

const MapView = lazy(() => import('./MapView'))

export const TRIP_VIEWS = ['dia', 'vuelos', 'mapa', 'comer', 'dormir'] as const
export type TripView = (typeof TRIP_VIEWS)[number]
type Signup = { item: string; person: string }

const TYPE_ICON: Record<NonNullable<Activity['type']>, string> = {
  fly: '✈️',
  food: '🌮',
  plan: '⭐',
  move: '🚐',
  party: '🎉',
  stay: '🏠',
  free: '🚶',
}

const CITY_TABS: Exclude<CityId, 'zrh' | 'home'>[] = ['cdmx', 'pvr', 'gdl', 'baja']

export default function Itinerary({ view, onView: setView }: { view: TripView; onView: (v: TripView) => void }) {
  const [date, setDate] = useState(() => currentDay(Date.now()).day.date)
  const day = DAYS.find((d) => d.date === date)!
  const [city, setCity] = useState<Exclude<CityId, 'zrh' | 'home'>>(() =>
    CITY_TABS.includes(day.city as never) ? (day.city as Exclude<CityId, 'zrh' | 'home'>) : 'cdmx',
  )
  const strip = useRef<HTMLDivElement>(null)
  const today = todayIn('America/Mexico_City')

  useEffect(() => {
    strip.current?.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [date, view])

  return (
    <>
      <div className="seg">
        {(
          [
            ['dia', 'Días'],
            ['vuelos', 'Vuelos'],
            ['mapa', 'Mapa'],
            ['comer', 'Comer'],
            ['dormir', 'Dormir'],
          ] as [TripView, string][]
        ).map(([v, l]) => (
          <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
            {l}
          </button>
        ))}
      </div>

      {view === 'dia' && (
        <>
          <div className="daystrip" ref={strip}>
            {DAYS.map((d) => {
              const p = dayParts(d.date)
              return (
                <button
                  key={d.date}
                  className={`daybtn${d.date === date ? ' on' : ''}${d.date === today ? ' today' : ''}`}
                  onClick={() => setDate(d.date)}
                  aria-label={`${p.dow} ${p.day} de octubre, ${CITIES[d.city].name}`}
                >
                  {p.dow}
                  <b>{p.day}</b>
                  <i style={{ background: cityColor(d.city) }} />
                </button>
              )
            })}
          </div>
          <DayHeader date={day.date} />
          <div className="timeline">
            {day.items.map((it) => (
              <Item key={it.id} it={it} />
            ))}
          </div>
          <div className="row between">
            <button className="btn ghost small" disabled={date === DAYS[0].date} onClick={() => setDate(DAYS[DAYS.findIndex((d) => d.date === date) - 1].date)}>
              ← Día anterior
            </button>
            <button className="btn ghost small" disabled={date === DAYS[DAYS.length - 1].date} onClick={() => setDate(DAYS[DAYS.findIndex((d) => d.date === date) + 1].date)}>
              Día siguiente →
            </button>
          </div>
        </>
      )}

      {(view === 'comer' || view === 'dormir') && (
        <>
          <div className="chips">
            {CITY_TABS.map((c) => (
              <button key={c} className={`chip${city === c ? ' on' : ''}`} onClick={() => setCity(c)}>
                {CITIES[c].emoji} {CITIES[c].short}
              </button>
            ))}
          </div>
          {view === 'comer' ? <Food city={city} /> : <Stays city={city} />}
        </>
      )}

      {view === 'vuelos' && <Flights />}
      {view === 'mapa' && (
        <Suspense fallback={<div className="map" />}>
          <MapView />
        </Suspense>
      )}
    </>
  )
}

function Item({ it }: { it: Activity }) {
  const me = useMe()!
  const signups = useItems<Signup>('signup').filter((s) => s.data.item === it.id)
  const people = signups.map((s) => s.data.person)
  const mine = people.includes(me)
  const toggle = () => {
    buzz()
    const id = `signup:${it.id}:${me}`
    if (mine) remove(id)
    else put('signup', id, { item: it.id, person: me })
  }
  return (
    <div className="tl">
      <span className="tl-time">{it.time ?? ''}</span>
      <span className="tl-ic">{TYPE_ICON[it.type ?? 'plan']}</span>
      <div className="tl-body card tight col" style={{ gap: 6 }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <b className="grow">{it.title}</b>
          {it.maps && (
            <a href={it.maps} target="_blank" rel="noreferrer" className="iconbtn" aria-label="Abrir en Google Maps" style={{ width: 32, height: 32 }}>
              <MapPin size={16} />
            </a>
          )}
        </div>
        {it.price && <span className="small" style={{ fontWeight: 700, color: 'var(--turq)' }}>💰 {it.price}</span>}
        {it.desc && <span className="small muted">{it.desc}</span>}
        {it.warn && <span className="warn">⚠️ {it.warn}</span>}
        {it.links && (
          <div className="links">
            {it.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        )}
        {it.signup && (
          <div className="row between">
            <Avatars ids={people} />
            <button className={`btn small ${mine ? 'turq' : 'ghost'}`} onClick={toggle}>
              {mine ? '✓ Voy' : '+ Me apunto'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const TAG_LABEL = { barato: '🌮 Barato', medio: '🍽️ Precio medio', especial: '✨ Cena especial' } as const

function Food({ city }: { city: Exclude<CityId, 'zrh' | 'home'> }) {
  const list = FOOD[city]
  return (
    <>
      <span className="small muted">Por persona, sin bebidas.</span>
      {(['barato', 'medio', 'especial'] as const).map((tag) => {
        const places = list.filter((p) => p.tag === tag)
        if (!places.length) return null
        return (
          <div key={tag} className="col">
            <h3>{TAG_LABEL[tag]}</h3>
            {places.map((p) => (
              <div key={p.name} className="card tight col" style={{ gap: 4 }}>
                <div className="row between">
                  <b>{p.name}</b>
                  <span className="small" style={{ fontWeight: 700, color: 'var(--turq)' }}>
                    {p.price}
                  </span>
                </div>
                <span className="tiny muted">{p.area}</span>
                <span className="small">{p.desc}</span>
                <div className="links">
                  <a href={p.maps} target="_blank" rel="noreferrer">
                    <MapPin size={12} /> Mapa
                  </a>
                  {p.links?.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                      {l.label} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

function Stays({ city }: { city: Exclude<CityId, 'zrh' | 'home'> }) {
  return (
    <>
      <span className="small muted">Una habitación por pareja. Precios de la guía (24 sep). ¡Voten en "Votar"!</span>
      {STAYS[city].map((s) => (
        <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="card col" style={{ gap: 4, color: 'inherit' }}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <b className="grow">{s.name}</b>
            {s.pick && <span className="tag ok">Propuesta</span>}
          </div>
          <span className="tiny muted">{s.area}</span>
          <span className="small">{s.desc}</span>
          <div className="row between">
            <span style={{ fontWeight: 800, color: 'var(--rosa)' }}>{s.perNight}</span>
            {s.total && <span className="small muted">{s.total}</span>}
          </div>
        </a>
      ))}
    </>
  )
}

const cityColor = (id: CityId) => `var(--c-${id === 'zrh' || id === 'home' ? 'cdmx' : id})`

function DayHeader({ date }: { date: string }) {
  const day = DAYS.find((d) => d.date === date)!
  const img = photo(...(DAY_PHOTO[date] ?? []), ...CITY_PHOTO[day.city])
  const idx = DAYS.findIndex((d) => d.date === date)
  return (
    <header className="photo" style={{ minHeight: 150, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
      {img && <img src={img.src} alt="" />}
      <span className="label" style={{ color: 'rgba(255,255,255,.85)' }}>
        {idx > 0 && idx < DAYS.length - 1 ? `Día ${idx} · ` : ''}
        {CITIES[day.city].name} · {longDate(day.date)}
      </span>
      <h2 style={{ color: '#fff', fontSize: 24 }}>{day.title}</h2>
    </header>
  )
}
