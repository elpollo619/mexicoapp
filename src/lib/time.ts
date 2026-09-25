import { useEffect, useState } from 'react'

/** Offset (ms) de una zona horaria en un instante dado */
function tzOffset(epoch: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epoch))
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
  return asUTC - epoch
}

/** "2026-10-06T16:05" en la zona `tz` → epoch ms */
export function zoned(local: string, tz: string) {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(local ?? '')) return NaN
  const [d, t = '00:00'] = local.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, day, hh, mm)
  return guess - tzOffset(guess - tzOffset(guess, tz), tz)
}

/** Fecha YYYY-MM-DD de "ahora" en una zona */
export function todayIn(tz: string, now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(now))
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function dayParts(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return { dow: DOW[dt.getUTCDay()], day: d, mon: MON[m - 1] }
}

export const longDate = (date: string) => {
  const p = dayParts(date)
  return `${p.dow} ${p.day} ${p.mon}`
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}
