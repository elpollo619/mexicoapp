import { useState } from 'react'
import { Home, Plus, Smartphone } from 'lucide-react'
import { Sheet } from './ui'

/** Marca en localStorage de que ya se vio la bienvenida (una por teléfono) */
export const ONBOARD_KEY = 'mx-onboarded-v1'
/** WhoAmI lo pone al crear el PIN; App lo lee para abrir la bienvenida una sola vez */
export const ONBOARD_FLAG = 'mx-show-onboarding'

const STEPS = [
  { icon: Home, title: 'Hoy te dice qué toca', text: 'Plan del día, próximo vuelo, clima y dónde está cada uno. Abre siempre ahí.' },
  { icon: Plus, title: 'Gasto y Foto, a un toque', text: 'En Plata apuntas lo que pagaste: qué + cuánto y listo. En 📷 Fotos subes las del día y todos las ven al instante.' },
  { icon: Smartphone, title: 'Instálala en tu celular', text: 'Ícono en tu pantalla, pantalla completa y funciona sin internet. Está en Info › Instalar.' },
] as const

export default function Onboarding({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  const s = STEPS[i]
  const Icon = s.icon
  const done = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
      sessionStorage.removeItem(ONBOARD_FLAG)
    } catch {
      /* ignore */
    }
    setI(0)
    onClose()
  }
  return (
    <Sheet open={open} onClose={done}>
      <div className="col" style={{ gap: 14, alignItems: 'center', textAlign: 'center', padding: '8px 0 4px' }}>
        <span style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--chip)', display: 'grid', placeItems: 'center' }}>
          <Icon size={30} />
        </span>
        <h2>{s.title}</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 320 }}>
          {s.text}
        </p>
        <div className="row" style={{ gap: 6 }} aria-label={`Paso ${i + 1} de ${STEPS.length}`}>
          {STEPS.map((_, k) => (
            <span key={k} style={{ width: 8, height: 8, borderRadius: 4, background: k === i ? 'var(--rosa)' : 'var(--line)' }} />
          ))}
        </div>
        <button className="btn primary" style={{ minHeight: 48, minWidth: 200 }} onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : done())}>
          {i < STEPS.length - 1 ? 'Siguiente' : '¡Vamos! 🇲🇽'}
        </button>
        {i < STEPS.length - 1 && (
          <button className="btn ghost small" onClick={done}>
            Saltar
          </button>
        )}
      </div>
    </Sheet>
  )
}
