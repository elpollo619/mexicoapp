import { useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { fmt, parseAmount, useRates } from '../lib/money'
import { buzz } from '../components/ui'
import './features.css'

const PCTS = [0, 10, 12, 15, 20]

const GUIDE: [string, string][] = [
  ['🍽️', 'Restaurante: 10–15 % si no viene incluido el "servicio" en la cuenta.'],
  ['🍺', 'Bar: ~10 %, o MX$20–30 por ronda.'],
  ['🚗', 'Uber / DiDi: opcional, ~10 % si el viaje estuvo bien.'],
  ['🚕', 'Taxi: redondear hacia arriba.'],
  ['🧳', 'Maletero: MX$20–50 por maleta.'],
  ['🧭', 'Guía de tour: 10–15 %, o MX$100–200 por persona.'],
  ['🛏️', 'Limpieza del hotel: MX$50–100 por noche.'],
  ['⛽', 'Gasolinera: MX$10–20.'],
  ['🎺', 'Mariachi: el precio se acuerda ANTES de que toquen.'],
]

const mxn = (n: number) => `MX$${Math.round(n).toLocaleString('es-MX')}`

export function TipCalc() {
  const { rates } = useRates()
  const [bill, setBill] = useState('')
  const [pct, setPct] = useState(10)
  const [people, setPeople] = useState(6)
  const amount = parseAmount(bill)
  const valid = Number.isFinite(amount) && amount > 0
  const tip = valid ? (amount * pct) / 100 : 0
  const total = valid ? amount + tip : 0
  const each = people > 0 ? total / people : 0

  return (
    <section className="card col" style={{ gap: 12 }}>
      <div className="col" style={{ gap: 0 }}>
        <span className="label">Calculadora</span>
        <h3>Propina y cuenta dividida 💸</h3>
      </div>

      <label className="field">
        Cuenta en pesos
        <input
          className="input num"
          inputMode="decimal"
          placeholder="Ej. 1,850"
          value={bill}
          onChange={(e) => setBill(e.target.value)}
          aria-invalid={bill !== '' && !valid}
        />
      </label>
      {bill !== '' && !valid && (
        <span className="small" style={{ color: 'var(--rojo)', marginTop: -6 }}>
          Escribe solo el número, p. ej. 1850 o 1,850.
        </span>
      )}

      <div className="col" style={{ gap: 6 }}>
        <span className="field" style={{ gap: 0 }}>
          Propina
        </span>
        <div className="chips wrap">
          {PCTS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip${pct === p ? ' on' : ''}`}
              style={{ minWidth: 52, justifyContent: 'center' }}
              onClick={() => {
                buzz(8)
                setPct(p)
              }}
            >
              {p} %
            </button>
          ))}
        </div>
      </div>

      <div className="row between">
        <span className="field" style={{ gap: 0 }}>
          Entre cuántos
        </span>
        <div className="stepper">
          <button className="iconbtn" aria-label="Una persona menos" disabled={people <= 1} onClick={() => setPeople((n) => Math.max(1, n - 1))}>
            <Minus size={18} />
          </button>
          <b>{people}</b>
          <button className="iconbtn" aria-label="Una persona más" disabled={people >= 20} onClick={() => setPeople((n) => Math.min(20, n + 1))}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="tip-out">
        <div>
          <span className="tiny muted">Propina</span>
          <b>{mxn(tip)}</b>
          <span className="tiny muted num">≈ {fmt(tip * rates.MXN)}</span>
        </div>
        <div>
          <span className="tiny muted">Total</span>
          <b>{mxn(total)}</b>
          <span className="tiny muted num">≈ {fmt(total * rates.MXN)}</span>
        </div>
        <div className="hl">
          <span className="tiny muted">C/u</span>
          <b>{mxn(each)}</b>
          <span className="tiny muted num">≈ {fmt(each * rates.MXN)}</span>
        </div>
      </div>

      <details className="tip-details">
        <summary>
          Cuánto dar propina en México
          <ChevronDown size={18} className="chev" />
        </summary>
        <ul className="tip-guide">
          {GUIDE.map(([ic, t]) => (
            <li key={t}>
              <span>{ic}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="tiny muted" style={{ margin: '8px 0 0' }}>
          Paga siempre en pesos y rechaza la conversión a CHF de la terminal.
        </p>
      </details>
    </section>
  )
}

export default TipCalc
