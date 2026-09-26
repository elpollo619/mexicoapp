import { useSyncExternalStore } from 'react'

export type ToastAction = { label: string; onClick: () => void }
export type ToastOptions = {
  /** Botón dentro del aviso (p. ej. "Actualizar") */
  action?: ToastAction
  /** No se cierra solo: queda hasta que se toque el botón o se muestre otro aviso */
  sticky?: boolean
}

type Toast = { id: number; text: string; action?: ToastAction; sticky?: boolean }

let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Mensaje corto de confirmación ("Gasto guardado ✓"). `ms` puede ser un número o las opciones (acción, sticky). */
export function toast(text: string, ms: number | ToastOptions = 2200, opts: ToastOptions = {}) {
  const o = typeof ms === 'number' ? opts : ms
  const delay = typeof ms === 'number' ? ms : 2200
  current = { id: Date.now(), text, action: o.action, sticky: o.sticky }
  emit()
  clearTimeout(timer)
  if (o.sticky) return
  timer = setTimeout(() => {
    current = null
    emit()
  }, delay)
}

/** Cierra el aviso actual (útil tras una acción) */
export function dismissToast() {
  clearTimeout(timer)
  current = null
  emit()
}

export function Toaster() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
  return (
    <div className="toast-wrap" aria-live="polite">
      {t && (
        <div key={t.id} className="toast" style={t.action ? { pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 } : undefined}>
          <span style={{ flex: 1 }}>{t.text}</span>
          {t.action && (
            <button
              type="button"
              className="btn small"
              style={{ background: 'var(--bg)', color: 'var(--ink)', flexShrink: 0 }}
              onClick={() => {
                t.action?.onClick()
                dismissToast()
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
