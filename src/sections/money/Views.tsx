import { useState } from 'react'
import { ArrowLeftRight, ArrowRight, Check, Pencil, Trash2, Undo2 } from 'lucide-react'
import { CORE, person } from '../../data/people'
import { CATEGORIES, fmt, fromCHF, parseAmount, settleUp, toCHF, type Expense, type Settlement } from '../../lib/money'
import { put, remove, type Item } from '../../lib/store'
import { Avatar, Avatars, buzz, name } from '../../components/ui'
import { toast } from '../../lib/toast'
import { todayIn } from '../../lib/time'

export const catOf = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]

const dayLabel = (d: string) => {
  const dt = new Date(`${d}T12:00:00`)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function ExpenseList({ items, onOpen }: { items: Item<Expense>[]; onOpen: (i: Item<Expense>) => void }) {
  if (!items.length)
    return (
      <div className="card empty">
        <div style={{ fontSize: 40 }}>🧾</div>
        Todavía no hay gastos. Toca <b>+ Gasto</b> para subir el primero.
      </div>
    )
  const byDay = new Map<string, Item<Expense>[]>()
  for (const it of [...items].sort((a, b) => b.data.date.localeCompare(a.data.date) || b.created_at.localeCompare(a.created_at))) {
    const list = byDay.get(it.data.date) ?? []
    list.push(it)
    byDay.set(it.data.date, list)
  }
  return (
    <>
      {[...byDay.entries()].map(([day, list]) => (
        <div key={day} className="col" style={{ gap: 8 }}>
          <div className="day-head row between">
            <span>{dayLabel(day)}</span>
            <span>{fmt(list.reduce((a, i) => a + i.data.chf, 0))}</span>
          </div>
          <div className="card tight">
            {list.map((it) => {
              const e = it.data
              return (
                <button key={it.id} className="exp-row" onClick={() => onOpen(it)}>
                  {e.receipt ? <img src={e.thumb ?? e.receipt} alt="" className="exp-thumb" loading="lazy" /> : <span className="exp-emoji">{catOf(e.category).emoji}</span>}
                  <span className="grow col" style={{ gap: 3 }}>
                    <b className="ellipsis">{e.title}</b>
                    <span className="row small muted" style={{ gap: 6 }}>
                      <Avatar id={e.payer} />
                      <ArrowRight size={12} />
                      <Avatars ids={Object.keys(e.shares)} />
                    </span>
                  </span>
                  <span className="exp-amt">
                    <b>{fmt(e.amount, e.currency)}</b>
                    {e.currency !== 'CHF' && <span className="tiny muted">{fmt(e.chf)}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

export function ExpenseDetail({ item, onEdit, onClose }: { item: Item<Expense>; onEdit: () => void; onClose: () => void }) {
  const e = item.data
  const [confirm, setConfirm] = useState(false)
  const total = Object.values(e.shares).reduce((a, b) => a + b, 0)
  const cat = catOf(e.category)
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row">
        <span className="exp-emoji">{cat.emoji}</span>
        <div className="grow">
          <h2>{e.title}</h2>
          <div className="small muted">
            {cat.label} · {dayLabel(e.date)}
          </div>
        </div>
      </div>
      <div className="card rosa">
        <div className="big">{fmt(e.amount, e.currency)}</div>
        {e.currency !== 'CHF' && <div className="small muted">≈ {fmt(e.chf)}</div>}
        <div className="row small" style={{ marginTop: 8 }}>
          <Avatar id={e.payer} /> Pagó <b>{name(e.payer)}</b>
        </div>
      </div>
      <div className="card tight col" style={{ gap: 6 }}>
        <b className="small">Reparto</b>
        {Object.entries(e.shares).map(([p, s]) => {
          const chf = total ? (e.chf * s) / total : 0
          return (
            <div key={p} className="row small">
              <Avatar id={p} />
              <span className="grow">
                {name(p)}
                {s !== 1 && <span className="muted"> · {s} partes</span>}
              </span>
              <b>{fmt(chf)}</b>
              <span className="muted tiny">{fmt(fromCHF(chf, 'MXN'), 'MXN')}</span>
            </div>
          )
        })}
      </div>
      {e.receipt && (
        <a href={e.receipt} target="_blank" rel="noreferrer">
          <img src={e.receipt} alt="Ticket" className="receipt-full" />
        </a>
      )}
      {e.by && <div className="tiny muted">Subido por {name(e.by)}</div>}
      {confirm ? (
        <div className="confirm-row">
          <span className="grow small">¿Borrar este gasto?</span>
          <button className="btn ghost small" onClick={() => setConfirm(false)}>
            No
          </button>
          <button
            className="btn small"
            style={{ background: 'var(--rojo)' }}
            onClick={() => {
              remove(item.id)
              buzz(30)
              toast('Gasto borrado')
              onClose()
            }}
          >
            Sí, borrar
          </button>
        </div>
      ) : (
        <div className="row">
          <button className="btn ghost grow" onClick={() => setConfirm(true)}>
            <Trash2 size={16} /> Borrar
          </button>
          <button className="btn primary grow" onClick={onEdit}>
            <Pencil size={16} /> Editar
          </button>
        </div>
      )}
    </div>
  )
}

type Transfer = { from: string; to: string; chf: number }
export type Paid = Transfer & { id: string }

/**
 * Registra un pago propuesto. El id es determinista (quién, a quién, cuánto, qué día): si el deudor y el
 * acreedor lo marcan los dos, o alguien toca dos veces sin conexión, el upsert lo deja en un solo pago.
 */
function markPaid(t: Transfer, me: string): Paid {
  const date = todayIn('America/Mexico_City')
  const id = `set:${t.from}:${t.to}:${Math.round(t.chf * 100)}:${date}`
  put<Settlement>('settlement', id, { from: t.from, to: t.to, chf: t.chf, date, by: me })
  buzz([10, 40, 10])
  toast(`${name(t.from)} → ${name(t.to)}: pagado ✓`)
  return { ...t, id }
}

/** Botón "Pagado" con confirmación de un toque (como el reseteo de PIN) */
export function PayButton({ t, me, primary, onPaid }: { t: Transfer; me: string; primary?: boolean; onPaid: (p: Paid) => void }) {
  const [confirm, setConfirm] = useState(false)
  const involved = t.from === me || t.to === me
  if (confirm)
    return (
      <div className="confirm-row grow" style={{ flexBasis: '100%' }}>
        <span className="grow small">¿Marcar como pagado?</span>
        <button className="btn ghost small" onClick={() => setConfirm(false)}>
          No
        </button>
        <button className={`btn small${primary ? ' primary' : ''}`} onClick={() => onPaid(markPaid(t, me))}>
          <Check size={15} /> Confirmar
        </button>
      </div>
    )
  return (
    <button className={`btn small ${primary ? 'primary' : involved ? '' : 'ghost'}`} onClick={() => setConfirm(true)}>
      <Check size={15} /> Pagado
    </button>
  )
}

/** "Pagado ✓ · Deshacer" para el último pago marcado, por si fue un toque de más */
export function UndoPaid({ paid, settlements, onDone }: { paid: Paid | null; settlements: Item<Settlement>[]; onDone: () => void }) {
  if (!paid || !settlements.some((s) => s.id === paid.id)) return null
  return (
    <div className="confirm-row">
      <span className="grow small">
        {name(paid.from)} → {name(paid.to)} {fmt(paid.chf)}: pagado ✓
      </span>
      <button
        className="btn ghost small"
        onClick={() => {
          remove(paid.id)
          toast('Pago deshecho')
          onDone()
        }}
      >
        <Undo2 size={14} /> Deshacer
      </button>
    </div>
  )
}

export function Balances({ bal, settlements, me }: { bal: Record<string, number>; settlements: Item<Settlement>[]; me: string }) {
  const ids = [...new Set([...CORE, ...Object.keys(bal)])].filter((p) => CORE.includes(p) || Math.abs(bal[p] ?? 0) > 0.005)
  const max = Math.max(1, ...ids.map((p) => Math.abs(bal[p] ?? 0)))
  const transfers = settleUp(bal)
  const [paid, setPaid] = useState<Paid | null>(null)
  return (
    <>
      <div className="card col" style={{ gap: 10 }}>
        <b>Saldo de cada uno</b>
        {ids.map((p) => {
          const v = bal[p] ?? 0
          const w = (Math.abs(v) / max) * 50
          return (
            <div key={p} className="col" style={{ gap: 4 }}>
              <div className="row small">
                <Avatar id={p} />
                <span className="grow">{name(p)}</span>
                <b className={v > 0.005 ? 'pos' : v < -0.005 ? 'neg' : 'muted'}>
                  {v > 0.005 ? '+' : ''}
                  {fmt(v)}
                </b>
              </div>
              <div className="bal-bar">
                <div style={{ left: v >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, background: v >= 0 ? 'var(--verde)' : 'var(--rojo)' }} />
              </div>
            </div>
          )
        })}
        <div className="tiny muted">Verde = le deben · Rojo = debe</div>
      </div>

      <div className="card col" style={{ gap: 10 }}>
        <b>Quién le paga a quién</b>
        {!transfers.length && <div className="small muted">Todos a mano 🙌</div>}
        {transfers.map((t) => (
          <div key={`${t.from}-${t.to}`} className="col" style={{ gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
            <div className="row small">
              <Avatar id={t.from} />
              <b>{name(t.from)}</b>
              <ArrowRight size={14} />
              <Avatar id={t.to} />
              <b className="grow">{name(t.to)}</b>
            </div>
            <div className="row wrap">
              <div className="grow">
                <b style={{ fontSize: 18 }}>{fmt(t.chf)}</b> <span className="small muted">≈ {fmt(fromCHF(t.chf, 'MXN'), 'MXN')}</span>
              </div>
              <PayButton t={t} me={me} onPaid={setPaid} />
            </div>
          </div>
        ))}
        <UndoPaid paid={paid} settlements={settlements} onDone={() => setPaid(null)} />
      </div>

      {settlements.length > 0 && (
        <div className="card col" style={{ gap: 8 }}>
          <b>Pagos hechos</b>
          {[...settlements].reverse().map((s) => (
            <div key={s.id} className="row small">
              <Avatar id={s.data.from} />
              <ArrowRight size={12} />
              <Avatar id={s.data.to} />
              <span className="grow">
                {name(s.data.from)} → {name(s.data.to)} <span className="muted tiny">{s.data.date}</span>
              </span>
              <b>{fmt(s.data.chf)}</b>
              <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={() => {
                  remove(s.id)
                  toast('Pago deshecho')
                }} aria-label="Deshacer">
                <Undo2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Bars({ rows }: { rows: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="col" style={{ gap: 8 }}>
      {rows.map((r) => (
        <div key={r.label} className="col" style={{ gap: 3 }}>
          <div className="row between small">
            <span>{r.label}</span>
            <b>{fmt(r.value)}</b>
          </div>
          <div className="bar">
            <div style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Stats({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) return <div className="card empty">Sin gastos todavía: aquí saldrán las estadísticas 📊</div>
  const total = expenses.reduce((a, e) => a + e.chf, 0)
  const byCat = new Map<string, number>()
  const byPayer = new Map<string, number>()
  const byDay = new Map<string, number>()
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.chf)
    byPayer.set(e.payer, (byPayer.get(e.payer) ?? 0) + e.chf)
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.chf)
  }
  // "Por persona y día": promedio de los 6 que hacen todo el viaje, sin vuelos (se pagan antes y no son gasto "del día").
  // Las partes de Pablo e invitad@ (solo GDL) no se cuentan: si no, el total/6 inflaría el promedio de los demás.
  const daily = expenses.filter((e) => e.category !== 'vuelo')
  const coreShare = (e: Expense) => {
    const parts = Object.values(e.shares).reduce((a, b) => a + b, 0)
    return parts ? (e.chf * CORE.reduce((a, p) => a + (e.shares[p] ?? 0), 0)) / parts : 0
  }
  const dailyDays = new Set(daily.map((e) => e.date)).size || 1
  const perHeadDay = daily.reduce((a, e) => a + coreShare(e), 0) / CORE.length / dailyDays
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])
  return (
    <>
      <div className="grid2">
        <div className="card tight">
          <div className="tiny muted">Total del grupo</div>
          <b style={{ fontSize: 20 }}>{fmt(total)}</b>
        </div>
        <div className="card tight">
          <div className="tiny muted">Por persona y día</div>
          <b style={{ fontSize: 20 }}>{fmt(perHeadDay)}</b>
          <div className="tiny muted">
            {dailyDays} {dailyDays === 1 ? 'día' : 'días'} con gastos · sin vuelos
          </div>
        </div>
      </div>
      <div className="card col" style={{ gap: 10 }}>
        <b>Por categoría</b>
        <Bars rows={sorted(byCat).map(([c, v]) => ({ label: `${catOf(c).emoji} ${catOf(c).label}`, value: v }))} />
      </div>
      <div className="card col" style={{ gap: 10 }}>
        <b>Quién ha pagado</b>
        <Bars rows={sorted(byPayer).map(([p, v]) => ({ label: `${person(p).emoji} ${name(p)}`, value: v, color: person(p).color }))} />
      </div>
      <div className="card col" style={{ gap: 10 }}>
        <b>Por día</b>
        <Bars rows={[...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ label: dayLabel(d), value: v, color: 'var(--turq)' }))} />
      </div>
    </>
  )
}

export function Converter() {
  const [chf, setChf] = useState('10')
  const [flip, setFlip] = useState(false)
  const n = parseAmount(chf)
  const out = Number.isFinite(n) ? (flip ? toCHF(n, 'MXN') : fromCHF(n, 'MXN')) : 0
  return (
    <div className="card col" style={{ gap: 8 }}>
      <b>Convertidor rápido</b>
      <div className="conv">
        <label className="field">
          {flip ? 'MXN' : 'CHF'}
          <input className="input" inputMode="decimal" value={chf} onChange={(e) => setChf(e.target.value)} />
        </label>
        <button className="iconbtn" onClick={() => setFlip(!flip)} aria-label="Invertir" style={{ marginBottom: 3 }}>
          <ArrowLeftRight size={16} />
        </button>
        <div className="field">
          {flip ? 'CHF' : 'MXN'}
          <div className="input" style={{ fontWeight: 800 }}>
            {flip ? fmt(out) : fmt(out, 'MXN')}
          </div>
        </div>
      </div>
    </div>
  )
}
