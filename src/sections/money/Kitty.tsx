import { useState } from 'react'
import { Coins, Pencil, PiggyBank, Trash2 } from 'lucide-react'
import { CORE } from '../../data/people'
import { fmt, isKittyEntry, kittyClose, kittyContributions, kittyTotals, parseAmount, toCHF, type KittyData, type KittyEntry, type KittyHolder } from '../../lib/money'
import { put, remove, uid, type Item } from '../../lib/store'
import { Avatar, buzz, name, PeoplePicker, Sheet } from '../../components/ui'
import { toast } from '../../lib/toast'
import { todayIn } from '../../lib/time'

const KITTY_HOLDER_ID = 'kitty:holder'
const QUICK = [500, 1000, 2000]
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const today = () => todayIn('America/Mexico_City')

const dayLabel = (d: string) => {
  const dt = new Date(`${d}T12:00:00`)
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

type Mode = 'in' | 'out'

/**
 * La vaquita: el grupo junta efectivo en pesos, uno lo lleva y los gastos chicos en efectivo (tacos, taxis,
 * propinas) salen de ahí en vez de apuntarse uno por uno. Los aportes entran en Saldos como gasto repartido
 * entre los 6 (ver `kittyAsExpenses` en lib/money.ts); los gastos de la vaquita solo bajan el fondo.
 */
export default function KittyView({ me, items }: { me: string; items: Item<KittyData>[] }) {
  const entries = items.filter((i): i is Item<KittyEntry> => isKittyEntry(i.data))
  const holder = (items.find((i) => i.id === KITTY_HOLDER_ID)?.data as KittyHolder | undefined)?.holder
  const data = entries.map((e) => e.data)
  const totals = kittyTotals(data)
  const contributions = kittyContributions(data)
  const [form, setForm] = useState<Mode | null>(null)
  const [pickHolder, setPickHolder] = useState(false)
  const [closing, setClosing] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)

  const ins = entries.filter((e) => e.data.type === 'in')
  const outs = entries.filter((e) => e.data.type === 'out')
  const newest = (a: Item<KittyEntry>, b: Item<KittyEntry>) => b.data.date.localeCompare(a.data.date) || b.data.at.localeCompare(a.data.at)
  const people = [...new Set([...CORE, ...contributions.map(([p]) => p)])]

  function setHolder(p: string) {
    put<KittyHolder>('kitty', KITTY_HOLDER_ID, { holder: p })
    buzz(15)
    toast(`La vaquita la lleva ${name(p)}`)
    setPickHolder(false)
  }

  function del(it: Item<KittyEntry>) {
    remove(it.id)
    buzz(30)
    toast(it.data.type === 'in' ? 'Aporte borrado' : 'Gasto borrado')
    setConfirm(null)
  }

  const rows = (list: Item<KittyEntry>[]) =>
    [...list].sort(newest).map((it) => <KittyRow key={it.id} it={it} confirming={confirm === it.id} onConfirm={() => setConfirm(it.id)} onCancel={() => setConfirm(null)} onDelete={() => del(it)} />)

  return (
    <>
      {/* Cuánto hay y quién la lleva */}
      <div className={`card col ${totals.mxn < 0 ? 'rosa' : 'turq'}`} style={{ gap: 6 }}>
        <span className="label">🐄 En la vaquita</span>
        <span className="big num">{fmt(totals.mxn, 'MXN')}</span>
        <span className="small muted num">
          ≈ {fmt(toCHF(totals.mxn, 'MXN'))} · entraron {fmt(totals.inMxn, 'MXN')} · salieron {fmt(totals.outMxn, 'MXN')}
        </span>
        {totals.mxn < 0 && <div className="warn">La vaquita está en negativo: alguien puso de su bolsillo. Registra el aporte.</div>}
        <div className="row" style={{ marginTop: 6 }}>
          {holder ? (
            <span className="row grow small" style={{ gap: 8 }}>
              <Avatar id={holder} /> La lleva <b>{name(holder)}</b>
            </span>
          ) : (
            <span className="grow small muted">Nadie la lleva todavía</span>
          )}
          <button className="btn ghost small" onClick={() => setPickHolder(!pickHolder)}>
            <Pencil size={13} /> {holder ? 'Cambiar' : 'Elegir'}
          </button>
        </div>
        {pickHolder && <PeoplePicker value={holder ? [holder] : []} onChange={(v) => v[0] && setHolder(v[0])} />}
      </div>

      {/* Aportes por persona */}
      <div className="card col" style={{ gap: 10 }}>
        <div className="row between">
          <b>Quién puso</b>
          <button className="btn primary small" onClick={() => setForm('in')}>
            <Coins size={15} /> Poner MX$
          </button>
        </div>
        {!contributions.length && <div className="small muted">Todavía nadie puso. Lo típico: MX$2.000 cada uno.</div>}
        {people.map((p) => {
          const v = contributions.find(([id]) => id === p)?.[1] ?? 0
          return (
            <div key={p} className="row small">
              <Avatar id={p} />
              <span className="grow">{name(p)}</span>
              <b className={v ? 'num' : 'muted num'}>{v ? fmt(v, 'MXN') : '—'}</b>
            </div>
          )
        })}
        {ins.length > 0 && (
          <details>
            <summary className="tiny muted" style={{ cursor: 'pointer' }}>
              Ver los {ins.length} {ins.length === 1 ? 'aporte' : 'aportes'}
            </summary>
            <div className="col" style={{ gap: 0, marginTop: 6 }}>{rows(ins)}</div>
          </details>
        )}
      </div>

      {/* Gastos de la vaquita */}
      <div className="card col" style={{ gap: 10 }}>
        <div className="row between">
          <b>Gastos de la vaquita ({outs.length})</b>
          <button className="btn ghost small" onClick={() => setForm('out')} disabled={!ins.length}>
            <PiggyBank size={15} /> Anotar gasto
          </button>
        </div>
        {!outs.length ? (
          <div className="small muted">Tacos, taxis, propinas… lo que se pague con la vaquita va aquí, no en Gastos.</div>
        ) : (
          <div className="col" style={{ gap: 0 }}>{rows(outs)}</div>
        )}
      </div>

      {/* Cerrar */}
      <div className="card col" style={{ gap: 10 }}>
        <div className="row between">
          <b>Cerrar la vaquita</b>
          <button className="btn ghost small" onClick={() => setClosing(!closing)} disabled={!ins.length}>
            {closing ? 'Ocultar' : 'Ver cómo se reparte'}
          </button>
        </div>
        {closing ? (
          <CloseSummary data={data} />
        ) : (
          <div className="small muted">Al final del viaje, lo que sobre se devuelve a quienes pusieron, en proporción a lo que puso cada uno.</div>
        )}
      </div>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form === 'in' ? 'Poner en la vaquita' : 'Gasto de la vaquita'}>
        {form && <KittyForm mode={form} me={me} holder={holder} onDone={() => setForm(null)} />}
      </Sheet>
    </>
  )
}

function KittyRow({ it, confirming, onConfirm, onCancel, onDelete }: { it: Item<KittyEntry>; confirming: boolean; onConfirm: () => void; onCancel: () => void; onDelete: () => void }) {
  const k = it.data
  if (confirming)
    return (
      <div className="confirm-row">
        <span className="grow small">¿Borrar {k.type === 'in' ? 'este aporte' : 'este gasto'}?</span>
        <button className="btn ghost small" onClick={onCancel}>
          No
        </button>
        <button className="btn small" style={{ background: 'var(--rojo)' }} onClick={onDelete}>
          Sí, borrar
        </button>
      </div>
    )
  return (
    <div className="exp-row">
      <span className="exp-emoji">{k.type === 'in' ? '💵' : '🐄'}</span>
      <span className="grow col" style={{ gap: 3 }}>
        <b className="ellipsis">{k.type === 'in' ? `${name(k.by)} puso` : k.title}</b>
        <span className="row small muted" style={{ gap: 6 }}>
          <Avatar id={k.by} size={20} />
          <span style={{ whiteSpace: 'nowrap' }}>
            {k.type === 'out' && `${name(k.by)} · `}
            {dayLabel(k.date)}
          </span>
        </span>
      </span>
      <span className="exp-amt">
        <b className={k.type === 'in' ? 'pos' : undefined}>
          {k.type === 'in' ? '+' : '−'}
          {fmt(k.amountMxn, 'MXN')}
        </b>
        <span className="tiny muted">{fmt(k.chf)}</span>
      </span>
      <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={onConfirm} aria-label="Borrar">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function CloseSummary({ data }: { data: KittyEntry[] }) {
  const c = kittyClose(data)
  return (
    <div className="col" style={{ gap: 8 }}>
      {c.overdrawn > 0 ? (
        <div className="warn">Falta {fmt(c.overdrawn, 'MXN')}: se gastó más de lo que había. Registra quién puso ese efectivo antes de cerrar.</div>
      ) : (
        <div className="small">
          Sobran <b className="num">{fmt(c.remaining, 'MXN')}</b> (≈ {fmt(toCHF(c.remaining, 'MXN'))}). Se devuelven así:
        </div>
      )}
      {c.refunds.map((r) => (
        <div key={r.p} className="row small">
          <Avatar id={r.p} />
          <span className="grow">
            {name(r.p)} <span className="muted tiny num">puso {fmt(r.put, 'MXN')}</span>
          </span>
          <b className="num">{fmt(r.back, 'MXN')}</b>
        </div>
      ))}
      <div className="tiny muted">
        Los aportes ya cuentan en Saldos como gasto entre los 6, así que no hay que registrar nada más. Ojo: lo que se devuelva quedó contado de más; si sobra
        poco, mejor gástenlo en la última cena 🌮.
      </div>
    </div>
  )
}

function KittyForm({ mode, me, holder, onDone }: { mode: Mode; me: string; holder?: string; onDone: () => void }) {
  const [amountStr, setAmountStr] = useState(mode === 'in' ? '2000' : '')
  const [title, setTitle] = useState('')
  const [by, setBy] = useState(me)
  const [date, setDate] = useState(today())
  const amount = parseAmount(amountStr)
  const dateOk = DATE_RE.test(date)
  const valid = Number.isFinite(amount) && amount > 0 && dateOk && (mode === 'in' || title.trim().length > 0)
  const chf = valid ? toCHF(amount, 'MXN') : 0

  function save() {
    if (!valid) return
    const data: KittyEntry = {
      type: mode,
      amountMxn: amount,
      chf: Math.round(chf * 100) / 100,
      by,
      ...(holder ? { holder } : {}),
      title: mode === 'in' ? 'Aporte a la vaquita' : title.trim(),
      date,
      at: new Date().toISOString(),
    }
    put('kitty', `kitty:${uid()}`, data)
    buzz([10, 40, 10])
    toast(mode === 'in' ? `${name(by)} puso ${fmt(amount, 'MXN')} ✓` : 'Gasto de la vaquita guardado ✓')
    onDone()
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      {mode === 'out' && (
        <label className="field">
          ¿Qué fue?
          <input className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Tacos al pastor" maxLength={80} autoFocus />
        </label>
      )}
      <label className="field">
        Monto (MXN)
        <input
          className="input num"
          value={amountStr}
          onChange={(ev) => setAmountStr(ev.target.value)}
          inputMode="decimal"
          placeholder="0"
          style={{ fontSize: 22, fontWeight: 800 }}
          autoFocus={mode === 'in'}
        />
      </label>
      {mode === 'in' && (
        <div className="chips">
          {QUICK.map((q) => (
            <button key={q} type="button" className={`chip${amount === q ? ' on' : ''}`} onClick={() => setAmountStr(String(q))}>
              {fmt(q, 'MXN')}
            </button>
          ))}
        </div>
      )}
      {valid && <div className="small muted">≈ {fmt(chf)}</div>}

      <div className="field">
        {mode === 'in' ? 'Quién puso' : 'Quién pagó'}
        <PeoplePicker value={[by]} onChange={(v) => v[0] && setBy(v[0])} />
      </div>

      <label className="field">
        Fecha
        <input className="input" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
      </label>
      {!dateOk && <div className="warn">Falta la fecha.</div>}

      {mode === 'in' && valid && (
        <div className="card cempa tight small">
          En Saldos cuenta como gasto de {name(by)} repartido entre los 6: cada uno ≈ <b>{fmt(chf / CORE.length)}</b>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn ghost grow" onClick={onDone}>
          Cancelar
        </button>
        <button type="button" className="btn primary grow" disabled={!valid} onClick={save}>
          {mode === 'in' ? 'Poner' : 'Guardar gasto'}
        </button>
      </div>
    </div>
  )
}
