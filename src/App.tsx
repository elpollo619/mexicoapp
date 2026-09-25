import { lazy, Suspense, useEffect, useState } from 'react'
import { Compass, Home as HomeIcon, LifeBuoy, Users, Wallet } from 'lucide-react'
import { useMe } from './lib/me'
import { useItems, useSyncStatus } from './lib/store'
import { Toaster } from './lib/toast'
import { CORE } from './data/people'
import { Avatar } from './components/ui'
import WhoAmI from './sections/WhoAmI'
import ProfileSheet from './components/ProfileSheet'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './sections/Home'
import Itinerary, { TRIP_VIEWS } from './sections/Itinerary'
import { GROUP_VIEWS, INFO_VIEWS } from './sections/views'

// Se cargan al abrir la pestaña (primera carga más rápida con datos móviles)
const Money = lazy(() => import('./sections/Money'))
const Group = lazy(() => import('./sections/Group'))
const Info = lazy(() => import('./sections/Info'))

export type Tab = 'hoy' | 'viaje' | 'plata' | 'grupo' | 'info'
/** Destino de navegación: pestaña + (opcional) sub-vista */
export type Go = (t: Tab, sub?: string) => void

const TABS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'hoy', label: 'Hoy', icon: HomeIcon },
  { id: 'viaje', label: 'Viaje', icon: Compass },
  { id: 'plata', label: 'Plata', icon: Wallet },
  { id: 'grupo', label: 'Grupo', icon: Users },
  { id: 'info', label: 'Info', icon: LifeBuoy },
]

const TITLES: Record<Tab, string> = {
  hoy: 'México Lindo',
  viaje: 'El viaje',
  plata: 'Plata',
  grupo: 'El grupo',
  info: 'Info práctica',
}

// Enlaces viejos (#plan, #vuelos, #votar, #juegos) siguen funcionando
const LEGACY: Record<string, [Tab, string?]> = {
  plan: ['viaje', 'dia'],
  vuelos: ['viaje', 'vuelos'],
  votar: ['grupo', 'votar'],
  juegos: ['grupo', 'juegos'],
}

function readHash(): [Tab, string | undefined] {
  const [h, sub] = location.hash.replace('#', '').split('/')
  if (LEGACY[h]) return [LEGACY[h][0], LEGACY[h][1]]
  return TABS.some((t) => t.id === h) ? [h as Tab, sub] : ['hoy', undefined]
}

/** Sub-vista válida o la de por defecto (evita pantallas vacías con enlaces raros) */
function pick<T extends string>(v: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}

type PollData = { closed?: boolean; city?: string }
type VoteData = { poll: string; person: string }

export default function App() {
  const me = useMe()
  const [[tab, sub], setRoute] = useState(readHash)
  const [profile, setProfile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { status, pending } = useSyncStatus()
  const polls = useItems<PollData>('poll')
  const votes = useItems<VoteData>('vote')

  useEffect(() => {
    const on = () => setRoute(readHash())
    window.addEventListener('popstate', on)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('hashchange', on)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('hashchange', on)
      window.removeEventListener('popstate', on)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const go: Go = (t, s) => {
    const hash = `#${t}${s ? `/${s}` : ''}`
    // pushState: el botón "atrás" del celular vuelve a la pantalla anterior
    if (location.hash !== hash) history.pushState(null, '', hash)
    const sameTab = t === tab
    setRoute([t, s])
    if (!sameTab) window.scrollTo({ top: 0 })
  }

  if (!me) return (
    <>
      <WhoAmI onDone={() => go('hoy')} />
      <Toaster />
    </>
  )

  const pendingVotes = CORE.includes(me)
    ? polls.filter((p) => !p.data.closed && !votes.some((v) => v.data.poll === p.id && v.data.person === me)).length
    : 0

  const statusLabel =
    status === 'live' ? 'En vivo' : status === 'local' ? 'Local' : status === 'syncing' ? 'Conectando' : `Sin conexión${pending ? ` · ${pending}` : ''}`

  return (
    <div className="app">
      <div className="picado" aria-hidden />
      <header className={`top${scrolled ? ' scrolled' : ''}`}>
        <div className="grow">
          <span className="kicker">3–19 oct · 2026</span>
          <h1>{TITLES[tab]}</h1>
        </div>
        <span className="sync" title="Estado de sincronización">
          <span className={`dot ${status}`} /> {statusLabel}
        </span>
        <button className="iconbtn" onClick={() => setProfile(true)} aria-label="Mi perfil" style={{ background: 'none', width: 44, height: 44 }}>
          <Avatar id={me} />
        </button>
      </header>

      <main className="page" key={tab}>
        <ErrorBoundary resetKey={tab}>
        <Suspense fallback={<div className="empty"><span className="spinner" aria-label="Cargando" /></div>}>
          {tab === 'hoy' && <Home go={go} />}
          {tab === 'viaje' && <Itinerary view={pick(sub, TRIP_VIEWS, 'dia')} onView={(v) => go('viaje', v)} />}
          {tab === 'plata' && <Money />}
          {tab === 'grupo' && <Group view={pick(sub, GROUP_VIEWS, 'votar')} onView={(v) => go('grupo', v)} />}
          {tab === 'info' && <Info view={pick(sub, INFO_VIEWS, 'moverse')} onView={(v) => go('info', v)} />}
        </Suspense>
        </ErrorBoundary>
      </main>

      <nav className="nav" aria-label="Secciones">
        <div className="nav-inner">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined}>
              <span className="pill">
                <Icon size={21} strokeWidth={tab === id ? 2.3 : 1.8} />
              </span>
              {label}
              {id === 'grupo' && pendingVotes > 0 && <span className="badge">{pendingVotes}</span>}
            </button>
          ))}
        </div>
      </nav>
      <ProfileSheet me={me} open={profile} onClose={() => setProfile(false)} />
      <Toaster />
    </div>
  )
}
