import { useState } from 'react'
import { Camera, Minus, Plus, X } from 'lucide-react'
import { ALL, CORE } from '../../data/people'
import { CATEGORIES, CURRENCIES, fmt, fromCHF, parseAmount, toCHF, type Currency, type Expense } from '../../lib/money'
import { put, uid, uploadReceipt } from '../../lib/store'
import { buzz, name, PeoplePicker } from '../../components/ui'
import { toast } from '../../lib/toast'

type Mode = 'core' | 'all' | 'custom' | 'parts'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

function initialMode(shares: Record<string, number>): Mode {
  const ids = Object.keys(shares)
  const allOnes = Object.values(shares).every((v) => v === 1)
  if (!allOnes) return 'parts'
  if (sameSet(ids, CORE)) return 'core'
  if (sameSet(ids, ALL)) return 'all'
  return 'custom'
}

export default function ExpenseForm({ me, edit, onDone }: { me: string; edit?: { id: string; data: Expense }; onDone: () => void }) {
  const e = edit?.data
  const [title, setTitle] = useState(e?.title ?? '')
  const [amountStr, setAmountStr] = useState(e ? String(e.amount).replace('.', ',') : '')
  const [currency, setCurrency] = useState<Currency>(e?.currency ?? 'MXN')
  const [payer, setPayer] = useState(e?.payer ?? me)
  const [category, setCategory] = useState(e?.category ?? 'comida')
  const [date, setDate] = useState(e?.date ?? today())
  const [mode, setMode] = useState<Mode>(e ? initialMode(e.shares) : 'core')
  const [custom, setCustom] = useState<string[]>(e ? Object.keys(e.shares) : CORE)
  const [parts, setParts] = useState<Record<string, number>>(() => {
    const base = Object.fromEntries(ALL.map((p) => [p, 0]))
    return e ? { ...base, ...e.shares } : { ...base, ...Object.fromEntries(CORE.map((p) => [p, 1])) }
  })
  const [receipt, setReceipt] = useState<string | undefined>(e?.receipt)
  const [uploading, setUploading] = useState(false)
  const [uploadFail, setUploadFail] = useState(false)

  const amount = parseAmount(amountStr)
  const valid = title.trim().length > 0 && Number.isFinite(amount) && amount > 0

  const shares: Record<string, number> =
    mode === 'core'
      ? Object.fromEntries(CORE.map((p) => [p, 1]))
      : mode === 'all'
        ? Object.fromEntries(ALL.map((p) => [p, 1]))
        : mode === 'custom'
          ? Object.fromEntries(custom.map((p) => [p, 1]))
          : Object.fromEntries(Object.entries(parts).filter(([, v]) => v > 0))
  const totalParts = Object.values(shares).reduce((a, b) => a + b, 0)
  // Al editar sin cambiar monto ni moneda se conserva el CHF original (no recalcular con la tasa de hoy)
  const chf = !valid ? 0 : e && e.amount === amount && e.currency === currency ? e.chf : toCHF(amount, currency)
  const perPartCHF = totalParts ? chf / totalParts : 0

  async function onFile(f: File | undefined) {
    if (!f) return
    setUploading(true)
    setUploadFail(false)
    const url = await uploadReceipt(f)
    setUploading(false)
    if (url) setReceipt(url)
    else setUploadFail(true)
  }

  function save() {
    if (!valid || !totalParts) return
    const data: Expense = {
      title: title.trim(),
      amount,
      currency,
      chf: Math.round(chf * 100) / 100,
      payer,
      shares,
      category,
      date,
      ...(receipt ? { receipt } : {}),
      by: e?.by ?? me,
    }
    put('expense', edit?.id ?? `exp:${uid()}`, data)
    buzz([10, 40, 10])
    toast(edit ? 'Gasto actualizado ✓' : 'Gasto guardado ✓')
    onDone()
  }

  return (
    <div className="col" style={{ gap: 14 }}>
      <label className="field">
        ¿Qué fue?
        <input className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Tacos en Los Cocuyos" maxLength={80} autoFocus={!edit} />
      </label>

      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <label className="field grow">
          Monto
          <input className="input" value={amountStr} onChange={(ev) => setAmountStr(ev.target.value)} inputMode="decimal" placeholder="0" style={{ fontSize: 22, fontWeight: 800 }} />
        </label>
      </div>
      <div className="seg">
        {CURRENCIES.map((c) => (
          <button key={c} type="button" className={currency === c ? 'on' : ''} onClick={() => setCurrency(c)}>
            {c}
          </button>
        ))}
      </div>
      {valid && currency !== 'CHF' && <div className="small muted">≈ {fmt(chf)}</div>}

      <div className="field">
        Pagó
        <PeoplePicker value={[payer]} onChange={(v) => v[0] && setPayer(v[0])} />
      </div>

      <div className="field">
        Categoría
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`chip${category === c.id ? ' on' : ''}`} onClick={() => setCategory(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        Fecha
        <input className="input" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
      </label>

      <div className="field">
        Entre quiénes
        <div className="seg">
          <button type="button" className={mode === 'core' ? 'on' : ''} onClick={() => setMode('core')}>
            Los 6
          </button>
          <button type="button" className={mode === 'all' ? 'on' : ''} onClick={() => setMode('all')}>
            + GDL (8)
          </button>
          <button type="button" className={mode === 'custom' ? 'on' : ''} onClick={() => setMode('custom')}>
            Elegir
          </button>
          <button type="button" className={mode === 'parts' ? 'on' : ''} onClick={() => setMode('parts')}>
            Partes
          </button>
        </div>
        {mode === 'custom' && <PeoplePicker multi value={custom} onChange={setCustom} />}
        {mode === 'parts' && (
          <div className="card tight col" style={{ gap: 0 }}>
            {ALL.map((p) => (
              <div key={p} className="parts-row">
                <span className="grow" style={{ color: 'var(--ink)' }}>
                  {name(p)}
                </span>
                <button type="button" className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setParts({ ...parts, [p]: Math.max(0, (parts[p] ?? 0) - 1) })} aria-label="Menos">
                  <Minus size={16} />
                </button>
                <span className="n" style={{ color: 'var(--ink)' }}>
                  {parts[p] ?? 0}
                </span>
                <button type="button" className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setParts({ ...parts, [p]: (parts[p] ?? 0) + 1 })} aria-label="Más">
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {valid && totalParts > 0 && (
        <div className="card cempa tight small">
          {mode === 'parts' ? 'Cada parte' : `Cada uno (${totalParts})`} ≈ <b>{fmt(perPartCHF)}</b> · {fmt(fromCHF(perPartCHF, 'MXN'), 'MXN')}
        </div>
      )}
      {!totalParts && <div className="warn">Elige al menos una persona.</div>}

      <div className="field">
        Foto del ticket (opcional)
        <div className="row wrap">
          <label className="btn ghost small file-btn">
            <Camera size={16} /> {receipt ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" capture="environment" onChange={(ev) => void onFile(ev.target.files?.[0])} />
          </label>
          {uploading && <span className="small muted">Subiendo…</span>}
          {receipt && !uploading && (
            <span className="row" style={{ gap: 6 }}>
              <img src={receipt} alt="Ticket" className="exp-thumb" />
              <button type="button" className="iconbtn" style={{ width: 30, height: 30 }} onClick={() => setReceipt(undefined)} aria-label="Quitar foto">
                <X size={14} />
              </button>
            </span>
          )}
        </div>
        {uploadFail && <span className="small" style={{ color: 'var(--rojo)' }}>No se pudo subir la foto (¿sin conexión?). Puedes guardar igual.</span>}
      </div>

      <div className="row">
        <button type="button" className="btn ghost grow" onClick={onDone}>
          Cancelar
        </button>
        <button type="button" className="btn primary grow" disabled={!valid || !totalParts || uploading} onClick={save}>
          {edit ? 'Guardar cambios' : 'Añadir gasto'}
        </button>
      </div>
    </div>
  )
}
