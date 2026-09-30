import { useEffect, useRef } from 'react'
import { person } from '../data/people'
import { useMe } from '../lib/me'
import { fmt, type Expense } from '../lib/money'
import { useItems, useSyncStatus } from '../lib/store'
import { toast } from '../lib/toast'

const SEEN = 'mx-seen-expenses-v1'

const readSeen = (): Set<string> | null => {
  try {
    const raw = localStorage.getItem(SEEN)
    return raw ? new Set(JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}
const writeSeen = (s: Set<string>) => {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...s].slice(-500)))
  } catch {
    /* ignore */
  }
}

/** Avisa cuando otra persona apunta un gasto donde uno participa (toast en la app; notificación del sistema si la app está en segundo plano) */
export default function ExpenseAlerts() {
  const me = useMe()
  const expenses = useItems<Expense>('expense')
  const { status } = useSyncStatus()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!me || status !== 'live') return
    if (!seen.current) seen.current = readSeen()
    // Primera vez en este teléfono: lo que ya existe no es "nuevo"
    if (!seen.current) {
      seen.current = new Set(expenses.map((x) => x.id))
      writeSeen(seen.current)
      return
    }
    const fresh = expenses.filter((x) => !seen.current!.has(x.id))
    if (!fresh.length) return
    for (const x of fresh) seen.current.add(x.id)
    writeSeen(seen.current)
    for (const x of fresh) {
      const e = x.data
      if (!e.by || e.by === me || !(me in (e.shares ?? {}))) continue
      const parts = Object.values(e.shares).reduce((a, b) => a + b, 0) || 1
      const mine = (e.chf * e.shares[me]) / parts
      const text = `${person(e.by).name} apuntó «${e.title}» · ${fmt(e.amount, e.currency)}${e.currency === 'CHF' ? '' : ` (≈ ${fmt(e.chf)})`} · te toca ${fmt(mine)}`
      if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void navigator.serviceWorker?.ready.then((r) => r.showNotification('México Lindo · gasto nuevo', { body: text, tag: x.id }))
      } else {
        toast(text, 6000)
      }
    }
  }, [expenses, me, status])

  return null
}
