import { useSyncExternalStore } from 'react'

let current: { id: number; text: string } | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Mensaje corto de confirmación ("Gasto guardado ✓") */
export function toast(text: string, ms = 2200) {
  current = { id: Date.now(), text }
  emit()
  clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    emit()
  }, ms)
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
        <div key={t.id} className="toast">
          {t.text}
        </div>
      )}
    </div>
  )
}
