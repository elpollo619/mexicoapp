import { useMemo, type CSSProperties } from 'react'

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Generador pseudoaleatorio con semilla (mulberry32) */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CONFETTI_COLORS = ['#e4007c', '#f5a623', '#00a3a3', '#1f8a4c', '#7b2cbf', '#d7263d']

/** Confeti con CSS puro */
export function Confetti({ n = 70 }: { n?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    [n],
  )
  return (
    <div className="g-confetti" aria-hidden>
      {bits.map((b, i) => (
        <i
          key={i}
          style={
            {
              left: `${b.left}%`,
              background: b.color,
              width: b.w,
              height: b.w * 0.45,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              '--rot': `${b.rot}deg`,
              '--drift': `${b.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** Interruptor "Modo sin alcohol" */
export function SoberToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row small" style={{ gap: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>🧃 Modo sin alcohol <span className="muted">(retos y puntos en vez de tragos)</span></span>
    </label>
  )
}
