import { useEffect, useRef, type ReactNode } from 'react'
import { person, PEOPLE } from '../data/people'
import Luchador from './Luchador'

export function Avatar({ id, lg, size }: { id: string; lg?: boolean; size?: number }) {
  const p = person(id)
  const px = size ?? (lg ? 46 : 30)
  return (
    <span
      className={`avatar${lg ? ' lg' : ''}`}
      style={{ background: p.color, overflow: 'hidden', ...(size ? { width: size, height: size } : {}) }}
      title={`${p.name} · ${p.nickname}`}
    >
      <Luchador id={id} size={px} />
    </span>
  )
}

export function Avatars({ ids }: { ids: string[] }) {
  return (
    <span className="avatars">
      {ids.map((id) => (
        <Avatar key={id} id={id} />
      ))}
    </span>
  )
}

export const name = (id: string) => person(id).name

/** Selector de personas (una o varias) */
export function PeoplePicker({
  value,
  onChange,
  multi,
  ids = PEOPLE.map((p) => p.id),
}: {
  value: string[]
  onChange: (v: string[]) => void
  multi?: boolean
  ids?: string[]
}) {
  return (
    <div className="chips wrap" style={{ flexWrap: 'wrap' }}>
      {ids.map((id) => {
        const on = value.includes(id)
        const p = person(id)
        return (
          <button
            key={id}
            type="button"
            className={`chip${on ? ' on' : ''}`}
            onClick={() => onChange(multi ? (on ? value.filter((v) => v !== id) : [...value, id]) : [id])}
          >
            {p.emoji} {p.name}
          </button>
        )
      })}
    </div>
  )
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    const prevFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [open])
  if (!open) return null
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div
        ref={ref}
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Detalle'}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <div style={{ position: 'sticky', top: 0, height: 0, display: 'flex', justifyContent: 'flex-end', zIndex: 2 }}>
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar" style={{ width: 34, height: 34, marginTop: -2 }}>
            ✕
          </button>
        </div>
        <div className="sheet-handle" />
        {title && <h2 style={{ marginBottom: 12 }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function Section({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="col" style={{ gap: 10 }}>
      <div className="row between">
        <h2>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

/** Vibración corta en móviles (si el navegador la soporta) */
export const buzz = (ms: number | number[] = 15) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}
