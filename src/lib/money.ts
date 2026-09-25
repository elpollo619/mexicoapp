import { useEffect, useState } from 'react'

export type Currency = 'CHF' | 'MXN' | 'USD' | 'EUR'
export const CURRENCIES: Currency[] = ['MXN', 'CHF', 'USD', 'EUR']

/** Cuántos CHF vale 1 unidad de cada moneda (valores de respaldo, 24 sep 2026) */
const FALLBACK: Record<Currency, number> = { CHF: 1, MXN: 1 / 21, USD: 0.82, EUR: 0.94 }
const FX_KEY = 'mx-fx-v1'

let rates: Record<Currency, number> = FALLBACK
let ratesDate = 'aprox.'

try {
  const cached = localStorage.getItem(FX_KEY)
  if (cached) ({ rates, date: ratesDate } = JSON.parse(cached))
} catch {
  /* ignore */
}

/** Tipo de cambio del BCE vía Frankfurter (gratis, sin clave) */
export function useRates() {
  const [state, setState] = useState({ rates, date: ratesDate })
  useEffect(() => {
    fetch('https://api.frankfurter.dev/v1/latest?base=CHF&symbols=MXN,USD,EUR')
      .then((r) => r.json())
      .then((j: { date: string; rates: { MXN: number; USD: number; EUR: number } }) => {
        rates = { CHF: 1, MXN: 1 / j.rates.MXN, USD: 1 / j.rates.USD, EUR: 1 / j.rates.EUR }
        ratesDate = j.date
        try {
          localStorage.setItem(FX_KEY, JSON.stringify({ rates, date: ratesDate }))
        } catch {
          /* ignore */
        }
        setState({ rates, date: ratesDate })
      })
      .catch(() => {})
  }, [])
  return state
}

export const toCHF = (amount: number, cur: Currency) => amount * (rates[cur] ?? 1)
export const fromCHF = (chf: number, cur: Currency) => chf / (rates[cur] ?? 1)

export const fmt = (n: number, cur: Currency = 'CHF') => {
  const digits = cur === 'MXN' ? 0 : 2
  const s = n.toLocaleString('de-CH', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return cur === 'MXN' ? `MX$${s}` : `${cur} ${s}`
}

export type Expense = {
  title: string
  amount: number
  currency: Currency
  /** Monto convertido a CHF al momento de guardarlo */
  chf: number
  payer: string
  /** persona → partes (1 = parte igual) */
  shares: Record<string, number>
  category: string
  date: string
  receipt?: string
  by?: string
}

export type Settlement = { from: string; to: string; chf: number; date: string; by?: string }

/** Saldo por persona en CHF: positivo = le deben, negativo = debe */
export function balances(expenses: Expense[], settlements: Settlement[]) {
  const bal: Record<string, number> = {}
  const add = (p: string, v: number) => (bal[p] = (bal[p] ?? 0) + v)
  for (const e of expenses) {
    const total = Object.values(e.shares).reduce((a, b) => a + b, 0)
    if (!total) continue
    add(e.payer, e.chf)
    for (const [p, s] of Object.entries(e.shares)) add(p, (-e.chf * s) / total)
  }
  for (const s of settlements) {
    add(s.from, s.chf)
    add(s.to, -s.chf)
  }
  return bal
}

/** Mínimo de transferencias para quedar a mano (greedy) */
export function settleUp(bal: Record<string, number>) {
  const debtors = Object.entries(bal).filter(([, v]) => v < -0.005).map(([p, v]) => ({ p, v: -v })).sort((a, b) => b.v - a.v)
  const creditors = Object.entries(bal).filter(([, v]) => v > 0.005).map(([p, v]) => ({ p, v })).sort((a, b) => b.v - a.v)
  const out: { from: string; to: string; chf: number }[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const x = Math.min(debtors[i].v, creditors[j].v)
    if (x > 0.005) out.push({ from: debtors[i].p, to: creditors[j].p, chf: Math.round(x * 100) / 100 })
    debtors[i].v -= x
    creditors[j].v -= x
    if (debtors[i].v < 0.005) i++
    if (creditors[j].v < 0.005) j++
  }
  return out
}

export const CATEGORIES = [
  { id: 'vuelo', label: 'Vuelos', emoji: '✈️' },
  { id: 'alojamiento', label: 'Alojamiento', emoji: '🏠' },
  { id: 'comida', label: 'Comida', emoji: '🌮' },
  { id: 'fiesta', label: 'Fiesta y chelas', emoji: '🍻' },
  { id: 'transporte', label: 'Uber, taxi, van', emoji: '🚐' },
  { id: 'tour', label: 'Tours y entradas', emoji: '🎟️' },
  { id: 'super', label: 'Súper', emoji: '🛒' },
  { id: 'otro', label: 'Otro', emoji: '🧾' },
]
