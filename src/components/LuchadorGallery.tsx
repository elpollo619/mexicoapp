import { PEOPLE } from '../data/people'
import Luchador from './Luchador'

/** "Los luchadores": presentación de cada persona con su máscara y apodo */
export default function LuchadorGallery({ ids }: { ids?: string[] }) {
  const list = ids ? PEOPLE.filter((p) => ids.includes(p.id)) : PEOPLE
  return (
    <section className="col" style={{ gap: 10 }}>
      <span className="label">Los luchadores</span>
      <div className="grid2">
        {list.map((p) => (
          <div key={p.id} className="card col" style={{ alignItems: 'center', textAlign: 'center', gap: 6, padding: '16px 12px' }}>
            <span style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 3px var(--card), 0 0 0 5px ${p.color}` }}>
              <Luchador id={p.id} size={96} />
            </span>
            <span className="tiny muted" style={{ fontWeight: 650 }}>
              {p.name}
            </span>
            <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, lineHeight: 1.15, color: p.color, textWrap: 'balance' }}>{p.nickname}</b>
            <span className="small muted" style={{ textWrap: 'pretty' }}>
              {p.tagline}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
