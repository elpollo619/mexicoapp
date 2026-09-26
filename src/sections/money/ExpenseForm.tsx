import { useEffect, useState } from 'react'
import { Camera, Minus, Plus, RotateCw, X } from 'lucide-react'
import { ALL, CORE } from '../../data/people'
import { CATEGORIES, CURRENCIES, fmt, fromCHF, parseAmount, toCHF, type Currency, type Expense } from '../../lib/money'
import { put, uid, uploadImage } from '../../lib/store'
import { buzz, name, PeoplePicker } from '../../components/ui'
import { toast } from '../../lib/toast'
import { todayIn } from '../../lib/time'

type Mode = 'core' | 'all' | 'custom' | 'parts'

/** La fecha del gasto es la de México, como el resto del módulo (no la del teléfono) */
const today = () => todayIn('America/Mexico_City')
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Última moneda y categoría usadas, para no cambiarlas a cada gasto */
const LAST_CUR = 'mx-last-currency'
const LAST_CAT = 'mx-last-category'
function remembered<T extends string>(key: string, ok: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && ok.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}
const remember = (key: string, v: string) => {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* ignore */
  }
}

type Receipt = { url: string; thumb?: string }
const UPLOAD_MSG = {
  formato: 'Formato no compatible (¿HEIC?): compártela como JPEG.',
  red: 'Sin conexión: el gasto se guarda sin foto, intenta subirla después.',
  local: 'Sin servidor de fotos configurado: el gasto se guarda sin foto.',
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
  const [currency, setCurrency] = useState<Currency>(e?.currency ?? remembered(LAST_CUR, CURRENCIES, 'MXN'))
  const [payer, setPayer] = useState(e?.payer ?? me)
  const [category, setCategory] = useState(e?.category ?? remembered(LAST_CAT, CATEGORIES.map((c) => c.id), 'comida'))
  const [date, setDate] = useState(e?.date ?? today())
  const [mode, setMode] = useState<Mode>(e ? initialMode(e.shares) : 'core')
  const [custom, setCustom] = useState<string[]>(e ? Object.keys(e.shares) : CORE)
  const [parts, setParts] = useState<Record<string, number>>(() => {
    const base = Object.fromEntries(ALL.map((p) => [p, 0]))
    return e ? { ...base, ...e.shares } : { ...base, ...Object.fromEntries(CORE.map((p) => [p, 1])) }
  })
  const [receipt, setReceipt] = useState<Receipt | undefined>(e?.receipt ? { url: e.receipt, thumb: e.thumb } : undefined)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  /** Foto que no se pudo subir por red: se puede reintentar */
  const [pending, setPending] = useState<File | null>(null)
  /** Vista previa local (URL.createObjectURL) mientras sube */
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const amount = parseAmount(amountStr)
  // Android permite "Borrar" la fecha: sin fecha válida no se guarda
  const dateOk = DATE_RE.test(date)
  const valid = title.trim().length > 0 && Number.isFinite(amount) && amount > 0 && dateOk

  const shares: Record<string, number> =
    mode === 'core'
      ? Object.fromEntries(CORE.map((p) => [p, 1]))
      : mode === 'all'
        ? Object.fromEntries(ALL.map((p) => [p, 1]))
        : mode === 'custom'
          ? Object.fromEntries(custom.map((p) => [p, 1]))
          : Object.fromEntries(Object.entries(parts).filter(([, v]) => v > 0))
  const totalParts = Object.values(shares).reduce((a, b) => a + b, 0)
  // Al editar sin cambiar la moneda se conserva la tasa del día original (e.chf / e.amount), no la de hoy:
  // mismo monto → mismo CHF; otro monto → proporcional. Solo se usa la tasa de hoy al cambiar de moneda.
  const chf = !valid
    ? 0
    : e && e.currency === currency && e.amount === amount
      ? e.chf
      : e && e.currency === currency && e.amount > 0 && e.chf > 0
        ? amount * (e.chf / e.amount)
        : toCHF(amount, currency)
  const perPartCHF = totalParts ? chf / totalParts : 0

  async function onFile(f: File | undefined) {
    if (!f) return
    setPending(null)
    setUploadMsg(null)
    setPreview(URL.createObjectURL(f))
    setUploading(true)
    const r = await uploadImage(f)
    setUploading(false)
    if (r.ok) {
      setReceipt({ url: r.url, thumb: r.thumb })
      return
    }
    setPreview(null)
    setUploadMsg(UPLOAD_MSG[r.reason])
    if (r.reason === 'red') setPending(f)
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
      ...(receipt ? { receipt: receipt.url, ...(receipt.thumb ? { thumb: receipt.thumb } : {}) } : {}),
      by: e?.by ?? me,
    }
    put('expense', edit?.id ?? `exp:${uid()}`, data)
    remember(LAST_CUR, currency)
    remember(LAST_CAT, category)
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
      {!dateOk && <div className="warn">Falta la fecha.</div>}

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
            <input
              type="file"
              accept="image/*"
              onChange={(ev) => {
                void onFile(ev.target.files?.[0])
                // Permite volver a elegir la misma foto después de un error
                ev.target.value = ''
              }}
            />
          </label>
          {uploading && (
            <span className="row" style={{ gap: 6 }}>
              {preview && <img src={preview} alt="" className="exp-thumb receipt-uploading" />}
              <span className="small muted">Subiendo…</span>
            </span>
          )}
          {receipt && !uploading && (
            <span className="row" style={{ gap: 6 }}>
              <img src={preview ?? receipt.thumb ?? receipt.url} alt="Ticket" className="exp-thumb" />
              <button
                type="button"
                className="iconbtn"
                style={{ width: 30, height: 30 }}
                onClick={() => {
                  setReceipt(undefined)
                  setPreview(null)
                }}
                aria-label="Quitar foto"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {pending && !uploading && (
            <button type="button" className="btn ghost small" onClick={() => void onFile(pending)}>
              <RotateCw size={14} /> Reintentar
            </button>
          )}
        </div>
        {uploadMsg && !uploading && (
          <span className="small" style={{ color: 'var(--rojo)' }}>
            {uploadMsg}
          </span>
        )}
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
