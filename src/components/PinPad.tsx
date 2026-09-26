import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Delete, Lock } from 'lucide-react'
import { person } from '../data/people'
import { Avatar, buzz } from './ui'

/**
 * Teclado de PIN de 4 dígitos. Se completa solo al cuarto número.
 * `onComplete` recibe `reset(msg)` para vaciar los puntos y mostrar un error.
 * `locked` (segundos) bloquea el teclado con una cuenta atrás.
 */
export default function PinPad({
  id,
  title,
  subtitle,
  onBack,
  backLabel = 'Otra persona',
  onComplete,
  footer,
  locked = 0,
}: {
  id: string
  title: string
  subtitle: string
  onBack?: () => void
  backLabel?: string
  onComplete: (pin: string, reset: (msg?: string) => void) => void | Promise<void>
  footer?: ReactNode
  locked?: number
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const p = person(id)
  const disabled = busy || locked > 0

  // Siempre la última versión de las callbacks, sin reengancharlas en cada render
  const complete = useRef(onComplete)
  complete.current = onComplete
  const state = useRef({ disabled, pin })
  state.current = { disabled, pin }

  const press = (d: string) => {
    if (state.current.disabled) return
    buzz(8)
    setError(null)
    setPin((x) => (x.length < 4 ? x + d : x))
  }
  const back = () => {
    if (state.current.disabled) return
    setPin((x) => x.slice(0, -1))
  }

  useEffect(() => {
    if (pin.length !== 4) return
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        await complete.current(pin, (msg) => {
          setPin('')
          setError(msg ?? null)
        })
      } finally {
        setBusy(false)
      }
    }, 120)
    return () => clearTimeout(t)
  }, [pin])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === 'Backspace') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="col pin" style={{ alignItems: 'center', gap: 14 }}>
      {onBack && (
        <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> {backLabel}
        </button>
      )}
      <Avatar id={id} size={76} />
      <div className="col center" style={{ gap: 2 }}>
        <h2>{title}</h2>
        <span className="small muted">{subtitle}</span>
        <span className="tiny" style={{ color: p.color, fontWeight: 700 }}>
          {p.nickname}
        </span>
      </div>
      <div className={`pin-dots${error ? ' shake' : ''}`} role="status" aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <span className="small" style={{ color: 'var(--rojo)', minHeight: 20, fontWeight: 650 }} aria-live="polite">
        {locked > 0 ? `Demasiados intentos · espera ${locked} s` : error}
      </span>
      <div className={`pinpad${disabled ? ' off' : ''}`}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)} disabled={disabled} aria-label={d}>
            {d}
          </button>
        ))}
        <span className="pin-lock">{busy ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} aria-label="Comprobando" /> : <Lock size={18} />}</span>
        <button onClick={() => press('0')} disabled={disabled} aria-label="0">
          0
        </button>
        <button onClick={back} disabled={disabled} aria-label="Borrar">
          <Delete size={22} />
        </button>
      </div>
      {footer}
    </div>
  )
}
