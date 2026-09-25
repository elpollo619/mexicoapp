import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { ALL, CORE, person } from '../../data/people'
import { balances, CATEGORIES, fmt, fromCHF, type Expense, type Settlement } from '../../lib/money'
import { put, useItems } from '../../lib/store'
import { todayIn, useNow } from '../../lib/time'
import { toast } from '../../lib/toast'
import { Avatar, buzz, name, Sheet } from '../../components/ui'

/** Presupuesto por persona (sin vuelos): guía del grupo hasta GDL (1.020) + 4.ª noche GDL, Baja y última noche CDMX, aprox. */
const DEFAULT_BUDGET = 1550
const GDL_BUDGET = 260
export const defaultBudget = (p: string) => (CORE.includes(p) ? DEFAULT_BUDGET : GDL_BUDGET)

const TRIP_START = '2026-10-03'
const TRIP_END = '2026-10-18'
const TRIP_DAYS = 16

type Budget = { chf: number; by: string }

/** Paradas del viaje por fecha del gasto; plan por persona en CHF (plan de la guía, aprox.) */
const STOPS = [
  { id: 'antes', label: 'Antes del viaje', emoji: '🧳', until: '2026-10-03', plan: 0 },
  { id: 'cdmx', label: 'CDMX · 3–6 oct', emoji: '🌮', until: '2026-10-06', plan: 303 },
  { id: 'pvr', label: 'Vallarta · 6–8 oct', emoji: '🏝️', until: '2026-10-08', plan: 332 },
  { id: 'gdl', label: 'Guadalajara · 8–12 oct', emoji: '🎂', until: '2026-10-12', plan: 280 },
  { id: 'baja', label: 'Baja · 12–17 oct', emoji: '🦭', until: '2026-10-17', plan: 525 },
  { id: 'cdmx2', label: 'CDMX · 17–18 oct', emoji: '🌆', until: '9999-12-31', plan: 110 },
]
const stopOf = (date: string) => STOPS.find((s) => date < s.until) ?? STOPS[STOPS.length - 1]

/** Reparto por categoría del presupuesto de 1.550 CHF (aprox.) */
const CAT_PLAN: Record<string, number> = { alojamiento: 480, transporte: 170, tour: 420, comida: 380, fiesta: 100 }

const parts = (e: Expense) => Object.values(e.shares).reduce((a, b) => a + b, 0)
export const shareOf = (e: Expense, p: string) => {
  const t = parts(e)
  return t ? (e.chf * (e.shares[p] ?? 0)) / t : 0
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)

function Ring({ spent, budget, size = 168 }: { spent: number; budget: number; size?: number }) {
  const pct = budget > 0 ? spent / budget : 0
  const color = pct > 1 ? 'var(--rojo)' : pct >= 0.8 ? 'var(--cempa)' : 'var(--turq)'
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const shown = Math.min(pct, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chip)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap={shown > 0.005 ? "round" : "butt"}
          strokeDasharray={`${c * shown} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s' }}
        />
      </svg>
      <div className="center" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center' }}>
        <span className="num" style={{ fontSize: size > 120 ? 30 : 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color }}>
          {Math.round(pct * 100)}%
        </span>
        <span className="tiny muted">del presupuesto</span>
      </div>
    </div>
  )
}

function PlanBars({ rows }: { rows: { key: string; label: string; spent: number; plan: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.spent, r.plan)))
  return (
    <div className="col" style={{ gap: 10 }}>
      {rows.map((r) => {
        const over = r.plan > 0 && r.spent > r.plan
        const warn = r.plan > 0 && r.spent >= r.plan * 0.8
        return (
          <div key={r.key} className="col" style={{ gap: 4 }}>
            <div className="row between small">
              <span>{r.label}</span>
              <span className="num">
                <b className={over ? 'neg' : undefined}>{fmt(r.spent)}</b>
                {r.plan > 0 && <span className="muted"> / {Math.round(r.plan)}</span>}
              </span>
            </div>
            <div className="bar" style={{ position: 'relative' }}>
              <div style={{ width: `${(r.spent / max) * 100}%`, background: over ? 'var(--rojo)' : warn ? 'var(--cempa)' : 'var(--turq)' }} />
              {r.plan > 0 && (
                <span
                  style={{ position: 'absolute', top: -2, bottom: -2, width: 2, borderRadius: 1, background: 'var(--ink)', opacity: 0.55, left: `calc(${(r.plan / max) * 100}% - 1px)` }}
                  title="Plan"
                />
              )}
            </div>
          </div>
        )
      })}
      <div className="tiny muted">Rayita = plan de la guía, aprox.</div>
    </div>
  )
}

export default function BudgetView({ me }: { me: string }) {
  const now = useNow(60_000)
  const expenses = useItems<Expense>('expense').map((e) => e.data)
  const settlements = useItems<Settlement>('settlement').map((s) => s.data)
  const budgets = useItems<Budget>('budget')
  const [scope, setScope] = useState<'yo' | 'grupo'>('yo')
  const [withFlights, setWithFlights] = useState(false)
  const [editing, setEditing] = useState(false)

  const budgetOf = (p: string) => budgets.find((b) => b.id === `budget:${p}`)?.data.chf ?? defaultBudget(p)
  const counted = expenses.filter((e) => withFlights || e.category !== 'vuelo')

  const who = scope === 'yo' ? [me] : ALL
  const shareFor = (e: Expense) => who.reduce((a, p) => a + shareOf(e, p), 0)
  const budget = who.reduce((a, p) => a + budgetOf(p), 0)
  const spent = counted.reduce((a, e) => a + shareFor(e), 0)
  const pre = counted.filter((e) => e.date < TRIP_START).reduce((a, e) => a + shareFor(e), 0)
  const during = spent - pre

  // Ritmo (hora de Ciudad de México)
  const today = todayIn('America/Mexico_City', now)
  const started = today >= TRIP_START
  const ended = today > TRIP_END
  const elapsed = started ? Math.min(TRIP_DAYS, dayDiff(TRIP_START, today) + 1) : 0
  const left = TRIP_DAYS - elapsed
  const perDay = elapsed ? during / elapsed : 0
  const projection = elapsed ? pre + perDay * TRIP_DAYS : spent
  const remainingPerDay = left > 0 ? (budget - spent) / left : 0
  const verdict =
    projection <= budget * 0.95
      ? { text: 'Vamos bien 👌', cls: 'turq' }
      : projection <= budget * 1.05
        ? { text: 'Ojo, vamos rápido 🔥', cls: 'cempa' }
        : { text: 'Nos pasamos 😬', cls: 'rosa' }
  const heads = who.length

  const byStop = STOPS.map((s) => ({
    key: s.id,
    label: `${s.emoji} ${s.label}`,
    spent: counted.filter((e) => stopOf(e.date).id === s.id).reduce((a, e) => a + shareFor(e), 0),
    plan: scope === 'yo' ? s.plan : s.plan * CORE.length + (s.id === 'gdl' ? GDL_BUDGET * (ALL.length - CORE.length) : 0),
  })).filter((r) => r.spent > 0 || r.plan > 0)

  const planMult = scope === 'yo' ? 1 : CORE.length
  const byCat = CATEGORIES.filter((c) => withFlights || c.id !== 'vuelo')
    .map((c) => ({
      key: c.id,
      label: `${c.emoji} ${c.label}`,
      spent: counted.filter((e) => e.category === c.id).reduce((a, e) => a + shareFor(e), 0),
      plan: (CAT_PLAN[c.id] ?? 0) * planMult,
    }))
    .filter((r) => r.spent > 0 || r.plan > 0)

  const bal = balances(expenses, settlements)
  const tableIds = ALL.filter((p) => CORE.includes(p) || expenses.some((e) => e.payer === p || (e.shares[p] ?? 0) > 0) || budgets.some((b) => b.id === `budget:${p}`))

  return (
    <>
      <div className="seg">
        <button className={scope === 'yo' ? 'on' : ''} onClick={() => setScope('yo')}>
          {person(me).emoji} Yo
        </button>
        <button className={scope === 'grupo' ? 'on' : ''} onClick={() => setScope('grupo')}>
          👯 Grupo ({ALL.length})
        </button>
      </div>

      {/* Presupuesto + anillo */}
      <div className="card col" style={{ gap: 12 }}>
        <div className="row between">
          <span className="label">Presupuesto {scope === 'yo' ? 'personal' : 'del grupo'}</span>
          <button className={`chip${withFlights ? ' on' : ''}`} onClick={() => setWithFlights(!withFlights)} aria-pressed={withFlights}>
            ✈️ incluir vuelos
          </button>
        </div>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <Ring spent={spent} budget={budget} size={scope === 'yo' ? 150 : 150} />
          <div className="col grow" style={{ gap: 4, minWidth: 0 }}>
            <span className="small muted">Gastado</span>
            <span className="num" style={{ fontSize: 24, fontWeight: 800 }}>
              {fmt(spent)}
            </span>
            <span className="small muted num">de {fmt(budget)}</span>
            <span className={`small num ${budget - spent < 0 ? 'neg' : 'pos'}`}>
              {budget - spent >= 0 ? `Quedan ${fmt(budget - spent)}` : `Pasados por ${fmt(spent - budget)}`}
            </span>
            {scope === 'yo' && (
              <button className="btn ghost small" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setEditing(true)}>
                <Pencil size={13} /> Mi presupuesto
              </button>
            )}
          </div>
        </div>
        {pre > 0 && (
          <div className="tiny muted num">
            Incluye {fmt(pre)} pagados antes del viaje{!withFlights && ' (sin vuelos)'}.
          </div>
        )}
      </div>

      {/* Ritmo */}
      <div className={`card col ${started ? verdict.cls : ''}`} style={{ gap: 8 }}>
        <span className="label">Ritmo</span>
        {!started ? (
          <>
            <b>El viaje aún no empieza ✈️</b>
            <div className="small">
              Faltan <b className="num">{dayDiff(today, TRIP_START)}</b> días. Hasta ahora: <b className="num">{fmt(spent)}</b>
              {heads > 1 && <> ({fmt(spent / heads)} por persona)</>}.
            </div>
            <div className="small muted num">
              Presupuesto por día{heads > 1 ? ' y persona' : ''}: {fmt((budget - spent) / TRIP_DAYS / heads)}
            </div>
          </>
        ) : (
          <>
            <div className="row between">
              <b style={{ fontSize: 18 }}>{ended ? (spent <= budget ? 'Terminamos dentro del presupuesto 🎉' : 'Nos pasamos un poquito 😅') : verdict.text}</b>
              <span className="tag wait num">
                día {elapsed}/{TRIP_DAYS}
              </span>
            </div>
            <div className="grid2 small">
              <div>
                <div className="muted tiny">Promedio por día{heads > 1 ? ' y persona' : ''}</div>
                <b className="num">{fmt(perDay / heads)}</b>
              </div>
              <div>
                <div className="muted tiny">Proyección al final</div>
                <b className={`num ${projection > budget ? 'neg' : ''}`}>{fmt(projection)}</b>
              </div>
            </div>
            {!ended && (
              <div className="small num">
                {remainingPerDay >= 0 ? (
                  <>
                    {scope === 'yo' ? 'Te quedan' : 'Nos quedan'} <b>{fmt(remainingPerDay / heads)}/día</b>
                    {heads > 1 && ' por persona'} para {left} {left === 1 ? 'día' : 'días'}.
                  </>
                ) : (
                  <>Ya nos comimos el presupuesto 🌮 — de aquí en adelante, comida corrida.</>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Por ciudad */}
      <div className="card col" style={{ gap: 10 }}>
        <span className="label">Por ciudad {scope === 'yo' ? '(tu parte)' : '(grupo)'}</span>
        <PlanBars rows={byStop} />
      </div>

      {/* Por categoría */}
      <div className="card col" style={{ gap: 10 }}>
        <span className="label">Por categoría vs plan</span>
        <PlanBars rows={byCat} />
      </div>

      {/* Tabla por persona */}
      <div className="card col" style={{ gap: 8 }}>
        <span className="label">Cada uno</span>
        <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <table className="num" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr className="muted tiny" style={{ textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '4px' }}></th>
                <th style={{ padding: '4px', fontWeight: 600 }}>Presup.</th>
                <th style={{ padding: '4px', fontWeight: 600 }}>Gastado</th>
                <th style={{ padding: '4px', fontWeight: 600 }}>Pagó</th>
                <th style={{ padding: '4px', fontWeight: 600 }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {tableIds.map((p) => {
                const b = budgetOf(p)
                const s = counted.reduce((a, e) => a + shareOf(e, p), 0)
                const paid = expenses.filter((e) => e.payer === p).reduce((a, e) => a + e.chf, 0)
                const v = bal[p] ?? 0
                return (
                  <tr key={p} style={{ borderTop: '1px solid var(--line)', textAlign: 'right', fontWeight: p === me ? 700 : 400 }}>
                    <td style={{ textAlign: 'left', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                      <span className="row" style={{ gap: 6 }}>
                        <Avatar id={p} /> {name(p)}
                      </span>
                    </td>
                    <td style={{ padding: '6px 4px' }}>{Math.round(b)}</td>
                    <td style={{ padding: '6px 4px' }} className={s > b ? 'neg' : undefined}>
                      {Math.round(s)}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{Math.round(paid)}</td>
                    <td style={{ padding: '6px 4px' }} className={v > 0.5 ? 'pos' : v < -0.5 ? 'neg' : 'muted'}>
                      {v > 0.5 ? '+' : ''}
                      {Math.round(v)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="tiny muted">En CHF. Gastado = tu parte{withFlights ? '' : ' (sin vuelos)'} · Saldo + = le deben.</div>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Mi presupuesto">
        {editing && <BudgetForm me={me} current={budgetOf(me)} onDone={() => setEditing(false)} />}
      </Sheet>
    </>
  )
}

function BudgetForm({ me, current, onDone }: { me: string; current: number; onDone: () => void }) {
  const [v, setV] = useState(String(Math.round(current)))
  const n = parseFloat(v.replace(/\s/g, '').replace(',', '.'))
  const valid = Number.isFinite(n) && n > 0 && n < 100000
  return (
    <div className="col" style={{ gap: 12 }}>
      <p className="small muted" style={{ margin: 0 }}>
        La guía calcula ~{defaultBudget(me)} CHF por persona para alojamiento, van, planes y comida (sin vuelos). Ajusta el tuyo.
      </p>
      <label className="field">
        Presupuesto total (CHF)
        <input className="input num" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} style={{ fontSize: 22, fontWeight: 800 }} autoFocus />
      </label>
      {valid && (
        <div className="small muted num">
          ≈ {fmt(fromCHF(n, 'MXN'), 'MXN')} · {fmt(n / TRIP_DAYS)} por día
        </div>
      )}
      <div className="row">
        <button className="btn ghost grow" onClick={() => setV(String(defaultBudget(me)))}>
          Restablecer
        </button>
        <button
          className="btn primary grow"
          disabled={!valid}
          onClick={() => {
            put<Budget>('budget', `budget:${me}`, { chf: Math.round(n * 100) / 100, by: me })
            buzz([10, 40, 10])
            toast('Presupuesto guardado ✓')
            onDone()
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
