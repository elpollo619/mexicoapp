import { useEffect, useState } from 'react'
import { ArrowLeft, Delete, Lock } from 'lucide-react'
import { PEOPLE, person } from '../data/people'
import { hashPin, setMe, useMe, type Profile } from '../lib/me'
import { put, useItems, useSyncStatus } from '../lib/store'
import { photo } from '../data/photos'
import { buzz } from '../components/ui'
import { toast } from '../lib/toast'

type Step = { kind: 'pick' } | { kind: 'pin'; id: string } | { kind: 'create'; id: string; first?: string }

/** Pantalla de inicio de sesión: nombre + PIN de 4 dígitos */
export default function WhoAmI({ onDone }: { onDone: () => void }) {
  const me = useMe()
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const profiles = useItems<Profile>('profile')
  const { status } = useSyncStatus()
  const hero = photo('cdmx', 'angel')

  const profileOf = (id: string) => profiles.find((p) => p.id === `profile:${id}`)?.data

  const choose = (id: string) => {
    buzz()
    // Crear PIN solo con los datos del grupo cargados: si no, podríamos pisar el PIN real de alguien
    if (!profileOf(id) && status !== 'live' && status !== 'local') {
      toast(status === 'syncing' ? 'Un segundo, conectando con el grupo…' : 'Necesitas conexión para entrar la primera vez')
      return
    }
    setStep(profileOf(id) ? { kind: 'pin', id } : { kind: 'create', id })
  }

  return (
    <div className="app login">
      <div className="picado" aria-hidden />
      <div className="photo" style={{ margin: '12px 16px 0', minHeight: 190, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 18 }}>
        {hero && <img src={hero.src} alt="" />}
        <span className="label" style={{ color: 'rgba(255,255,255,.8)' }}>
          3–19 octubre · 2026
        </span>
        <h1 style={{ fontSize: 34, color: '#fff' }}>México Lindo</h1>
        <span className="small muted">CDMX · Vallarta · Guadalajara · La Paz · Los Cabos</span>
      </div>

      <main className="page" style={{ animation: 'none' }}>
        {step.kind === 'pick' && (
          <>
            <div className="row between">
              <h2>Inicia sesión</h2>
              {me && (
                <button className="btn ghost small" onClick={onDone}>
                  Cancelar
                </button>
              )}
            </div>
            <span className="small muted" style={{ marginTop: -8 }}>
              Elige tu nombre. La primera vez creas un PIN de 4 números; después entras con él desde cualquier teléfono.
            </span>
            <div className="grid2">
              {PEOPLE.map((p) => {
                const has = !!profileOf(p.id)
                return (
                  <button key={p.id} className="card row" style={{ textAlign: 'left', minHeight: 68, borderColor: me === p.id ? p.color : undefined }} onClick={() => choose(p.id)}>
                    <span className="avatar lg" style={{ background: p.color }}>
                      {p.emoji}
                    </span>
                    <span className="col grow" style={{ gap: 0 }}>
                      <b>{p.name}</b>
                      <span className="tiny muted">{has ? '🔒 con PIN' : p.gdlOnly ? 'Guadalajara · nuevo' : 'Nuevo'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            {status === 'syncing' && <span className="tiny muted center">Conectando con el grupo…</span>}
          </>
        )}

        {step.kind === 'pin' && (
          <PinPad
            id={step.id}
            title={`Hola, ${person(step.id).name}`}
            subtitle="Escribe tu PIN"
            onBack={() => setStep({ kind: 'pick' })}
            onComplete={async (pin, reset) => {
              const ok = (await hashPin(step.id, pin)) === profileOf(step.id)?.pin
              if (ok) {
                setMe(step.id)
                toast(`¡Bienvenid@, ${person(step.id).name}! 🇲🇽`)
                onDone()
              } else {
                buzz([60, 40, 60])
                reset('PIN incorrecto')
              }
            }}
            footer={<span className="tiny muted center">¿Lo olvidaste? Pídele a alguien del grupo que lo resetee desde su perfil.</span>}
          />
        )}

        {step.kind === 'create' && (
          <PinPad
            key={step.first ? 'confirm' : 'first'}
            id={step.id}
            title={step.first ? 'Repite tu PIN' : `Crea tu PIN, ${person(step.id).name}`}
            subtitle={step.first ? 'Para confirmar' : '4 números que no se te olviden'}
            onBack={() => setStep({ kind: 'pick' })}
            onComplete={async (pin, reset) => {
              if (!step.first) {
                setStep({ kind: 'create', id: step.id, first: pin })
                return
              }
              if (pin !== step.first) {
                buzz([60, 40, 60])
                setStep({ kind: 'create', id: step.id })
                reset('No coinciden, otra vez')
                toast('Los PIN no coinciden, intenta otra vez')
                return
              }
              put('profile', `profile:${step.id}`, { pin: await hashPin(step.id, pin), updated: new Date().toISOString() })
              setMe(step.id)
              toast('PIN creado · sesión iniciada ✓')
              onDone()
            }}
          />
        )}
      </main>
    </div>
  )
}

function PinPad({
  id,
  title,
  subtitle,
  onBack,
  onComplete,
  footer,
}: {
  id: string
  title: string
  subtitle: string
  onBack: () => void
  onComplete: (pin: string, reset: (msg?: string) => void) => void | Promise<void>
  footer?: React.ReactNode
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const p = person(id)

  const press = (d: string) => {
    if (busy) return
    buzz(8)
    setError(null)
    setPin((x) => (x.length < 4 ? x + d : x))
  }

  useEffect(() => {
    if (pin.length !== 4) return
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        await onComplete(pin, (msg) => {
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
      if (e.key === 'Backspace') setPin((x) => x.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="col" style={{ alignItems: 'center', gap: 14 }}>
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Otra persona
      </button>
      <span className="avatar lg" style={{ background: p.color, width: 64, height: 64, fontSize: 30 }}>
        {p.emoji}
      </span>
      <div className="col center" style={{ gap: 2 }}>
        <h2>{title}</h2>
        <span className="small muted">{subtitle}</span>
      </div>
      <div className={`pin-dots${error ? ' shake' : ''}`} aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <span className="small" style={{ color: 'var(--rojo)', minHeight: 20, fontWeight: 650 }}>
        {error}
      </span>
      <div className="pinpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <span className="pin-lock">
          <Lock size={18} />
        </span>
        <button onClick={() => press('0')}>0</button>
        <button onClick={() => setPin((x) => x.slice(0, -1))} aria-label="Borrar">
          <Delete size={22} />
        </button>
      </div>
      {footer}
    </div>
  )
}
