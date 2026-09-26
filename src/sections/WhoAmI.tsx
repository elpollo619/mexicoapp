import { useEffect, useState } from 'react'
import { Lock, RefreshCw, WifiOff } from 'lucide-react'
import { PEOPLE, person } from '../data/people'
import { hashPin, setMe, useMe, type Profile } from '../lib/me'
import { put, retry, useItems, useSyncStatus } from '../lib/store'
import { readInvite } from '../lib/install'
import { photo } from '../data/photos'
import { Avatar, buzz } from '../components/ui'
import PinPad from '../components/PinPad'
import { toast } from '../lib/toast'

type Step = { kind: 'pick' } | { kind: 'pin'; id: string } | { kind: 'create'; id: string; first?: string }

const MAX_TRIES = 5
const LOCK_S = 30

/** Pantalla de inicio de sesión: nombre + PIN de 4 dígitos */
export default function WhoAmI({ onDone }: { onDone: () => void }) {
  const me = useMe()
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const [invite] = useState(readInvite)
  const [fails, setFails] = useState(0)
  const [locked, setLocked] = useState(0)
  const profiles = useItems<Profile>('profile')
  const { status } = useSyncStatus()
  const hero = photo('cdmx', 'angel')

  const profileOf = (id: string) => profiles.find((p) => p.id === `profile:${id}`)?.data
  const known = status === 'live' || status === 'local'
  const can = (id: string) => !!profileOf(id) || known

  const choose = (id: string) => {
    buzz()
    // Crear PIN solo con los datos del grupo cargados: si no, podríamos pisar el PIN real de alguien
    if (!can(id)) {
      toast(status === 'syncing' ? 'Un segundo, conectando con el grupo…' : 'Necesitas conexión para entrar la primera vez')
      return
    }
    setStep(profileOf(id) ? { kind: 'pin', id } : { kind: 'create', id })
  }

  // Link personal (?yo=bia): salta directo al PIN de esa persona en cuanto sabemos si ya tiene uno
  useEffect(() => {
    if (!invite || step.kind !== 'pick' || me) return
    if (!PEOPLE.some((p) => p.id === invite) || !can(invite)) return
    setStep(profileOf(invite) ? { kind: 'pin', id: invite } : { kind: 'create', id: invite })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite, status, profiles.length])

  // Si alguien del grupo resetea el PIN mientras estás en esta pantalla, pasas a crearlo
  useEffect(() => {
    if (step.kind === 'pin' && known && !profileOf(step.id)) {
      setStep({ kind: 'create', id: step.id })
      toast('Tu PIN fue reseteado · crea uno nuevo')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, profiles, known])

  // Pausa tras varios intentos fallidos
  useEffect(() => {
    if (locked <= 0) return
    const t = setTimeout(() => setLocked((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [locked])

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
              <h2>¿Quién eres?</h2>
              {me && (
                <button className="btn ghost small" onClick={onDone}>
                  Cancelar
                </button>
              )}
            </div>
            <span className="small muted" style={{ marginTop: -8 }}>
              Toca tu luchador. La primera vez creas un PIN de 4 números; después entras con él desde cualquier teléfono.
            </span>
            <div className="grid2 login-grid">
              {PEOPLE.map((p) => {
                const has = !!profileOf(p.id)
                const dim = !can(p.id)
                return (
                  <button
                    key={p.id}
                    className={`card row who${me === p.id ? ' me' : ''}`}
                    style={{ borderColor: me === p.id ? p.color : undefined, opacity: dim ? 0.55 : 1, ['--who' as string]: p.color }}
                    onClick={() => choose(p.id)}
                    aria-label={`${p.name}, ${has ? 'entrar con PIN' : 'crear PIN'}`}
                  >
                    <Avatar id={p.id} size={48} />
                    <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                      <b style={{ lineHeight: 1.15 }}>{p.name}</b>
                      <span className="tiny" style={{ color: p.color, fontWeight: 700, lineHeight: 1.2 }}>
                        {p.nickname}
                      </span>
                      <span className="tiny muted row" style={{ gap: 4 }}>
                        {has ? (
                          <>
                            <Lock size={10} /> con PIN
                          </>
                        ) : p.gdlOnly ? (
                          'Guadalajara · nuevo'
                        ) : (
                          'Nuevo'
                        )}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <ConnState status={status} />
          </>
        )}

        {step.kind === 'pin' && (
          <PinPad
            id={step.id}
            title={`Hola, ${person(step.id).name}`}
            subtitle="Escribe tu PIN"
            locked={locked}
            onBack={() => setStep({ kind: 'pick' })}
            onComplete={async (pin, reset) => {
              const ok = (await hashPin(step.id, pin)) === profileOf(step.id)?.pin
              if (ok) {
                setFails(0)
                setMe(step.id)
                toast(`¡Bienvenid@, ${person(step.id).name}! 🇲🇽`)
                onDone()
                return
              }
              buzz([60, 40, 60])
              const n = fails + 1
              setFails(n)
              if (n >= MAX_TRIES) {
                setFails(0)
                setLocked(LOCK_S)
                reset()
              } else {
                reset(n >= 3 ? `PIN incorrecto · ${MAX_TRIES - n} intentos más` : 'PIN incorrecto')
              }
            }}
            footer={
              <span className="tiny muted center" style={{ maxWidth: 280 }}>
                ¿Lo olvidaste? Pídele a alguien del grupo que lo resetee desde su perfil (su luchador, arriba a la derecha).
              </span>
            }
          />
        )}

        {step.kind === 'create' && (
          <PinPad
            key={step.first ? 'confirm' : 'first'}
            id={step.id}
            title={step.first ? 'Repite tu PIN' : `Crea tu PIN, ${person(step.id).name}`}
            subtitle={step.first ? 'Para confirmar' : '4 números que no se te olviden'}
            onBack={() => setStep(step.first ? { kind: 'create', id: step.id } : { kind: 'pick' })}
            backLabel={step.first ? 'Cambiar' : 'Otra persona'}
            onComplete={async (pin, reset) => {
              if (!step.first) {
                if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '0000') {
                  buzz([60, 40, 60])
                  reset('Muy fácil de adivinar, elige otro')
                  return
                }
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
            footer={
              !step.first && (
                <span className="tiny muted center" style={{ maxWidth: 280 }}>
                  El PIN es para que nadie entre como tú por error. Si lo olvidas, cualquiera del grupo te lo resetea.
                </span>
              )
            }
          />
        )}
      </main>
    </div>
  )
}

/** Estado de la conexión debajo de la lista, con botón para reintentar cuando falla */
function ConnState({ status }: { status: 'offline' | 'syncing' | 'live' | 'local' }) {
  if (status === 'syncing')
    return (
      <span className="tiny muted center row" style={{ justifyContent: 'center', gap: 8 }}>
        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} aria-hidden /> Conectando con el grupo…
      </span>
    )
  if (status === 'offline')
    return (
      <div className="card flat col center" style={{ gap: 8, alignItems: 'center' }}>
        <span className="small row" style={{ gap: 6 }}>
          <WifiOff size={15} /> <b>Sin conexión con el grupo</b>
        </span>
        <span className="tiny muted">Si ya tienes PIN puedes entrar igual. Para crear uno hace falta internet.</span>
        <button className="btn ghost small" onClick={() => void retry()}>
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    )
  return null
}
