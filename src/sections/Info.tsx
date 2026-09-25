import { useState } from 'react'
import { Phone } from 'lucide-react'
import { CHECKLIST, EMERGENCY, MONEY_TIPS, PACKING, RIDES, SAFETY, SLANG, WEATHER_NORMS } from '../data/info'
import { useMe } from '../lib/me'
import { useRates } from '../lib/money'
import { put, remove, useItems } from '../lib/store'
import { Avatar, buzz } from '../components/ui'
import { InstallGuide } from '../components/Install'
import { TipCalc } from '../features/TipCalc'
import { ALL_CREDITS } from '../data/photos'

import type { InfoView } from './views'
export type { InfoView }
type View = InfoView
type Check = { key: string; by: string }

export default function Info({ view, onView: setView }: { view: View; onView: (v: View) => void }) {
  return (
    <>
      <div className="chips">
        {(
          [
            ['moverse', '🚕 Taxis y Uber'],
            ['propinas', '💸 Propinas'],
            ['lista', '✅ Checklist'],
            ['sos', '🆘 Emergencias'],
            ['tips', '💡 Dinero y clima'],
            ['jerga', '🗣️ Jerga'],
            ['instalar', '📲 Instalar app'],
          ] as [View, string][]
        ).map(([v, l]) => (
          <button key={v} className={`chip${view === v ? ' on' : ''}`} onClick={() => setView(v)}>
            {l}
          </button>
        ))}
      </div>
      {view === 'moverse' && <Rides />}
      {view === 'propinas' && <TipCalc />}
      {view === 'lista' && <Checklist />}
      {view === 'sos' && <Sos />}
      {view === 'tips' && <Tips />}
      {view === 'jerga' && <Slang />}
      {view === 'instalar' && <InstallGuide />}
    </>
  )
}

function Rides() {
  const { rates } = useRates()
  const cities = [...new Set(RIDES.map((r) => r.city))]
  const [city, setCity] = useState(cities[0])
  const chf = ([a, b]: [number, number]) => `≈ CHF ${Math.round(a * rates.MXN)}–${Math.round(b * rates.MXN)}`
  return (
    <>
      <div className="card cempa small">
        Precios por coche en pesos. Un UberX lleva máx. 4: para los 6, <b>UberXL</b> (~1,8–2×) o 2 coches. Uber/DiDi suelen salir más baratos que el taxi.
      </div>
      <div className="chips">
        {cities.map((c) => (
          <button key={c} className={`chip${city === c ? ' on' : ''}`} onClick={() => setCity(c)}>
            {c}
          </button>
        ))}
      </div>
      {RIDES.filter((r) => r.city === city).map((r) => (
        <div key={r.route} className="card col" style={{ gap: 6 }}>
          <div className="row between">
            <b>{r.route}</b>
            <span className="small muted">⏱ {r.minutes} min</span>
          </div>
          <div className="grid2">
            <div className="card tight turq col" style={{ gap: 0 }}>
              <span className="tiny muted">Uber / DiDi</span>
              {r.uber ? (
                <>
                  <b>
                    MX${r.uber[0]}–{r.uber[1]}
                  </b>
                  <span className="tiny muted">{chf(r.uber)}</span>
                </>
              ) : (
                <b>—</b>
              )}
            </div>
            <div className="card tight cempa col" style={{ gap: 0 }}>
              <span className="tiny muted">{r.uber ? 'Taxi' : 'Taxi / transfer'}</span>
              {r.taxi ? (
                <>
                  <b>
                    MX${r.taxi[0]}–{r.taxi[1]}
                  </b>
                  <span className="tiny muted">{chf(r.taxi)}</span>
                </>
              ) : (
                <b>—</b>
              )}
            </div>
          </div>
          <span className="small muted">{r.tip}</span>
        </div>
      ))}
    </>
  )
}

function Checklist() {
  const me = useMe()!
  const checks = useItems<Check>('check')
  const done = new Map(checks.map((c) => [c.id, c.data.by]))
  const groups = [...new Set(CHECKLIST.map((c) => c.group))]
  const toggle = (id: string) => {
    buzz()
    if (done.has(id)) remove(id)
    else put('check', id, { key: id, by: me })
  }
  return (
    <>
      {groups.map((g) => {
        const personal = g.startsWith('Antes de salir')
        const items = CHECKLIST.filter((c) => c.group === g)
        const key = (id: string) => (personal ? `check:${id}:${me}` : `check:${id}`)
        const n = items.filter((i) => done.has(key(i.id))).length
        return (
          <section key={g} className="card col">
            <div className="row between">
              <h3>{g}</h3>
              <span className="small muted">
                {n}/{items.length}
              </span>
            </div>
            {personal && <span className="tiny muted">Tu lista personal (cada uno la suya).</span>}
            <div className="bar">
              <div style={{ width: `${(n / items.length) * 100}%`, background: 'var(--verde)' }} />
            </div>
            {items.map((i) => {
              const id = key(i.id)
              const by = done.get(id)
              return (
                <label key={i.id} className="row" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!by} onChange={() => toggle(id)} style={{ width: 20, height: 20, accentColor: 'var(--verde)' }} />
                  <span className="grow" style={{ textDecoration: by ? 'line-through' : undefined, opacity: by ? 0.6 : 1 }}>
                    {i.label}
                  </span>
                  {by && !personal && <Avatar id={by} />}
                </label>
              )
            })}
          </section>
        )
      })}
      <section className="card col">
        <h3>🎒 Qué llevar</h3>
        {PACKING.map((p) => {
          const id = `check:pack:${p}:${me}`
          return (
            <label key={p} className="row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={done.has(id)} onChange={() => toggle(id)} style={{ width: 20, height: 20, accentColor: 'var(--verde)' }} />
              <span>{p}</span>
            </label>
          )
        })}
      </section>
    </>
  )
}

function Sos() {
  return (
    <>
      {EMERGENCY.map((e) => (
        <a key={e.label} href={`tel:${e.tel}`} className="card row" style={{ color: 'inherit' }}>
          <span className="iconbtn" style={{ background: e.tel === '911' ? 'var(--rojo)' : 'var(--rosa-soft)', color: e.tel === '911' ? 'white' : 'var(--rosa)' }}>
            <Phone size={18} />
          </span>
          <span className="col grow" style={{ gap: 0 }}>
            <b>{e.label}</b>
            <span style={{ fontWeight: 700, color: 'var(--rosa)' }}>{e.value}</span>
            {e.note && <span className="tiny muted">{e.note}</span>}
          </span>
        </a>
      ))}
      <section className="card col">
        <h3>🛡️ Seguridad</h3>
        {SAFETY.map((s) => (
          <span key={s} className="small">
            • {s}
          </span>
        ))}
      </section>
    </>
  )
}

function Tips() {
  const { date } = useRates()
  return (
    <>
      <section className="card col">
        <h3>💵 Dinero y propinas</h3>
        {MONEY_TIPS.map((s) => (
          <span key={s} className="small">
            • {s}
          </span>
        ))}
        <span className="tiny muted">Tipo de cambio en vivo (BCE, {date}) en "Hoy" y "Plata".</span>
      </section>
      <section className="card col">
        <h3>🌤️ Clima típico en octubre</h3>
        {WEATHER_NORMS.map((w) => (
          <div key={w.city} className="row between small">
            <b style={{ width: 110 }}>{w.city}</b>
            <span style={{ fontWeight: 700, color: 'var(--turq)', width: 80 }}>{w.temp}</span>
            <span className="grow muted">{w.note}</span>
          </div>
        ))}
      </section>
      <section className="card col">
        <h3>📲 Apps útiles</h3>
        <span className="small">• Uber y DiDi · Google Maps (mapas sin conexión) · Travel Admin (DFAE) · WhatsApp · esta app 😎</span>
      </section>
      <section className="card col">
        <h3>📷 Créditos de fotos</h3>
        <span className="tiny muted">Fotos de Wikimedia Commons (licencias CC). Autor y licencia en cada enlace:</span>
        <div className="links">
          {Object.entries(ALL_CREDITS).map(([k, url]) => (
            <a key={k} href={url} target="_blank" rel="noreferrer">
              {k}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

function Slang() {
  const [q, setQ] = useState('')
  const list = SLANG.filter((s) => (s.word + s.meaning).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <input className="input" placeholder="Buscar… (güey, chela…)" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((s) => (
        <div key={s.word} className="card tight col" style={{ gap: 2 }}>
          <b style={{ color: 'var(--rosa)' }}>{s.word}</b>
          <span className="small">{s.meaning}</span>
        </div>
      ))}
    </>
  )
}
