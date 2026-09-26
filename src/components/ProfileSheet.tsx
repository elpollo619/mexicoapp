import { useState } from 'react'
import { KeyRound, Link2, LogOut, Smartphone } from 'lucide-react'
import { PEOPLE, person } from '../data/people'
import { hashPin, setMe, type Profile } from '../lib/me'
import { put, remove, useItems } from '../lib/store'
import { shareApp } from '../lib/install'
import { toast } from '../lib/toast'
import { Avatar, buzz, Sheet } from './ui'
import { InstallGuide } from './Install'
import PinPad from './PinPad'

type View = 'main' | 'install' | { pin: 'new' | 'confirm'; first?: string }

export default function ProfileSheet({ me, open, onClose }: { me: string; open: boolean; onClose: () => void }) {
  const profiles = useItems<Profile>('profile')
  const [view, setView] = useState<View>('main')
  const [confirm, setConfirm] = useState<string | null>(null)
  const p = person(me)
  const hasPin = (id: string) => profiles.some((pr) => pr.id === `profile:${id}`)
  const close = () => {
    setView('main')
    setConfirm(null)
    onClose()
  }

  const share = async (x: { id: string; name: string }) => {
    const r = await shareApp(x)
    if (r === 'copied') toast(`Link de ${x.name} copiado`)
  }

  return (
    <Sheet open={open} onClose={close}>
      {view === 'install' ? (
        <div className="col">
          <div className="row between">
            <h2>Instalar la app</h2>
            <button className="btn ghost small" onClick={() => setView('main')}>
              Volver
            </button>
          </div>
          <InstallGuide />
        </div>
      ) : typeof view === 'object' ? (
        // Cambiar el PIN sin cerrar sesión: si no hay red, el cambio queda en cola y se sube después
        <PinPad
          key={view.pin}
          id={me}
          title={view.pin === 'new' ? 'Tu nuevo PIN' : 'Repite el nuevo PIN'}
          subtitle={view.pin === 'new' ? '4 números que no se te olviden' : 'Para confirmar'}
          onBack={() => setView(view.pin === 'new' ? 'main' : { pin: 'new' })}
          backLabel={view.pin === 'new' ? 'Cancelar' : 'Cambiar'}
          onComplete={async (pin, reset) => {
            if (view.pin === 'new') {
              if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '0000') {
                buzz([60, 40, 60])
                reset('Muy fácil de adivinar, elige otro')
                return
              }
              setView({ pin: 'confirm', first: pin })
              return
            }
            if (pin !== view.first) {
              buzz([60, 40, 60])
              setView({ pin: 'new' })
              toast('Los PIN no coinciden, intenta otra vez')
              return
            }
            put('profile', `profile:${me}`, { pin: await hashPin(me, pin), updated: new Date().toISOString() })
            toast('PIN cambiado ✓')
            setView('main')
          }}
        />
      ) : (
        <div className="col" style={{ gap: 14 }}>
          <div className="row">
            <Avatar id={me} size={56} />
            <div className="grow col" style={{ gap: 0 }}>
              <h2>{p.name}</h2>
              <span className="small" style={{ color: p.color, fontWeight: 700 }}>
                {p.nickname}
              </span>
              <span className="tiny muted">{p.tagline}</span>
            </div>
          </div>

          <button className="btn outline block" onClick={() => setView('install')} style={{ justifyContent: 'flex-start' }}>
            <Smartphone size={18} /> Instalar en el celular / compartir QR
          </button>
          <button className="btn outline block" style={{ justifyContent: 'flex-start' }} onClick={() => setView({ pin: 'new' })}>
            <KeyRound size={18} /> Cambiar mi PIN
          </button>
          <button
            className="btn block"
            onClick={() => {
              setMe(null)
              close()
            }}
          >
            <LogOut size={18} /> Cerrar sesión / cambiar de persona
          </button>

          <hr />
          <div className="col" style={{ gap: 6 }}>
            <span className="label">El grupo</span>
            <span className="small muted">
              <b>Enviar link</b> manda a esa persona un acceso directo a su PIN. <b>Resetear</b> borra su PIN para que cree uno nuevo al entrar.
            </span>
            {PEOPLE.filter((x) => x.id !== me).map((x) => (
              <div key={x.id} className="row" style={{ minHeight: 40 }}>
                <Avatar id={x.id} />
                <span className="grow col" style={{ gap: 0, minWidth: 0 }}>
                  <span className="ellipsis">{x.name}</span>
                  <span className="tiny muted">{hasPin(x.id) ? 'con PIN' : 'todavía no entró'}</span>
                </span>
                <button className="iconbtn" onClick={() => void share(x)} aria-label={`Enviar link a ${x.name}`} title="Enviar link de acceso" style={{ width: 38, height: 38 }}>
                  <Link2 size={17} />
                </button>
                {hasPin(x.id) &&
                  (confirm === x.id ? (
                    <button
                      className="btn small"
                      style={{ background: 'var(--rojo)', color: '#fff' }}
                      onClick={() => {
                        remove(`profile:${x.id}`)
                        setConfirm(null)
                        toast(`PIN de ${x.name} reseteado`)
                      }}
                    >
                      Confirmar
                    </button>
                  ) : (
                    <button className="btn ghost small" onClick={() => setConfirm(x.id)}>
                      Resetear
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
