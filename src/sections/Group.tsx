import Polls from './Polls'
import Games from './Games'
import Photos from './Photos'
import LuchadorGallery from '../components/LuchadorGallery'

import type { GroupView } from './views'
export type { GroupView }

export default function Group({ view, onView: setView }: { view: GroupView; onView: (v: GroupView) => void }) {
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
