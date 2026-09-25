import { useState } from 'react'
import Polls from './Polls'
import Games from './Games'
import Photos from './Photos'
import LuchadorGallery from '../components/LuchadorGallery'

export type GroupView = 'votar' | 'juegos' | 'fotos' | 'cuates'

export default function Group({ initial }: { initial?: GroupView }) {
  const [view, setView] = useState<GroupView>(initial ?? 'votar')
  return (
    <>
      <div className="seg" role="tablist">
        {(
          [
            ['votar', 'Votar'],
            ['juegos', 'Juegos'],
            ['fotos', 'Fotos'],
            ['cuates', 'Cuates'],
          ] as [GroupView, string][]
        ).map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            className={view === v ? 'on' : ''}
            onClick={() => {
              setView(v)
              history.replaceState(null, '', `#grupo/${v}`)
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {view === 'votar' && <Polls />}
      {view === 'juegos' && <Games />}
      {view === 'fotos' && <Photos />}
      {view === 'cuates' && <LuchadorGallery />}
    </>
  )
}
