import { useState } from 'react'
import { KeyRound, LogOut, Smartphone } from 'lucide-react'
import { PEOPLE, person } from '../data/people'
import { setMe, type Profile } from '../lib/me'
import { remove, useItems } from '../lib/store'
import { toast } from '../lib/toast'
import { Avatar, Sheet } from './ui'
import { InstallGuide } from './Install'

export default function ProfileSheet({ me, open, onClose }: { me: string; open: boolean; onClose: () => void }) {
  const profiles = useItems<Profile>('profile')
  const [view, setView] = useState<'main' | 'install'>('main')
  const [confirm, setConfirm] = useState<string | null>(null)
  const p = person(me)
  const close = () => {
    setView('main')
    setConfirm(null)
    onClose()
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
      ) : (
        <div className="col" style={{ gap: 14 }}>
          <div className="row">
            <span className="avatar lg" style={{ background: p.color }}>
              {p.emoji}
            </span>
            <div className="grow col" style={{ gap: 0 }}>
              <h2>{p.name}</h2>
              <span className="small muted">Sesión iniciada en este teléfono</span>
            </div>
          </div>

          <button className="btn outline block" onClick={() => setView('install')} style={{ justifyContent: 'flex-start' }}>
            <Smartphone size={18} /> Instalar en el celular / compartir QR
          </button>
          <button
            className="btn outline block"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => {
              remove(`profile:${me}`)
              setMe(null)
              toast('Crea tu nuevo PIN')
              close()
            }}
          >
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
            <span className="label">¿Alguien olvidó su PIN?</span>
            <span className="small muted">Resetéalo y esa persona crea uno nuevo al entrar.</span>
            {PEOPLE.filter((x) => x.id !== me && profiles.some((pr) => pr.id === `profile:${x.id}`)).map((x) => (
              <div key={x.id} className="row">
                <Avatar id={x.id} />
                <span className="grow">{x.name}</span>
                {confirm === x.id ? (
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
                    Resetear PIN
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
