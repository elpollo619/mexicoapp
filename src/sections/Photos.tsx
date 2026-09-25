import { useRef, useState } from 'react'
import { Camera, Download, Trash2 } from 'lucide-react'
import { CITIES, DAYS } from '../data/trip'
import { useMe } from '../lib/me'
import { put, remove, uid, uploadReceipt, useItems, type Item } from '../lib/store'
import { toast } from '../lib/toast'
import { longDate, todayIn } from '../lib/time'
import { Avatar, name, Sheet } from '../components/ui'

type Photo = { url: string; by: string; caption?: string; date: string }

export default function Photos() {
  const me = useMe()!
  const photos = useItems<Photo>('photo').slice().reverse()
  const [busy, setBusy] = useState(0)
  const [open, setOpen] = useState<Item<Photo> | null>(null)
  const [confirm, setConfirm] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files].slice(0, 10)
    setBusy(list.length)
    let ok = 0
    for (const f of list) {
      const url = await uploadReceipt(f)
      if (url) {
        put('photo', `photo:${uid()}`, { url, by: me, date: todayIn('America/Mexico_City') })
        ok++
      }
      setBusy((b) => b - 1)
    }
    toast(ok === list.length ? `📸 ${ok} foto${ok > 1 ? 's' : ''} subida${ok > 1 ? 's' : ''}` : `Se subieron ${ok} de ${list.length}. Revisa la conexión.`)
    if (input.current) input.current.value = ''
  }

  // Agrupar por día del viaje
  const groups = new Map<string, Item<Photo>[]>()
  for (const p of photos) {
    const g = groups.get(p.data.date) ?? []
    g.push(p)
    groups.set(p.data.date, g)
  }

  return (
    <>
      <div className="card row" style={{ gap: 12 }}>
        <div className="grow col" style={{ gap: 2 }}>
          <h3>Álbum del grupo</h3>
          <span className="small muted">
            {photos.length} foto{photos.length === 1 ? '' : 's'} · todos las ven al instante
          </span>
        </div>
        <button className="btn primary" onClick={() => input.current?.click()} disabled={busy > 0}>
          <Camera size={18} /> {busy > 0 ? `Subiendo ${busy}…` : 'Subir'}
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {!photos.length && (
        <div className="empty">
          <span className="e-ic">📷</span>
          <b>Todavía no hay fotos</b>
          <span className="small">Suban las mejores del día: el taco, el atardecer, Pablo bailando…</span>
        </div>
      )}

      {[...groups.entries()].map(([date, list]) => {
        const day = DAYS.find((d) => d.date === date)
        return (
          <section key={date} className="col" style={{ gap: 8 }}>
            <span className="label">
              {longDate(date)}
              {day ? ` · ${CITIES[day.city].short}` : ''}
            </span>
            <div className="gallery">
              {list.map((p) => (
                <button key={p.id} onClick={() => setOpen(p)} aria-label={`Foto de ${name(p.data.by)}`}>
                  <img src={p.data.url} alt="" loading="lazy" />
                  <span className="by">
                    <Avatar id={p.data.by} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <Sheet
        open={!!open}
        onClose={() => {
          setOpen(null)
          setConfirm(false)
        }}
      >
        {open && (
          <div className="col">
            <img src={open.data.url} alt="" className="photoimg" style={{ borderRadius: 14, width: '100%', maxHeight: '62dvh', objectFit: 'contain', background: 'var(--chip)' }} />
            <div className="row">
              <Avatar id={open.data.by} />
              <span className="grow small">
                <b>{name(open.data.by)}</b> · {longDate(open.data.date)}
              </span>
              <a className="iconbtn" href={open.data.url} target="_blank" rel="noreferrer" download aria-label="Descargar">
                <Download size={18} />
              </a>
              {open.data.by === me &&
                (confirm ? (
                  <button
                    className="btn small"
                    style={{ background: 'var(--rojo)', color: '#fff' }}
                    onClick={() => {
                      remove(open.id)
                      setOpen(null)
                      setConfirm(false)
                      toast('Foto borrada')
                    }}
                  >
                    Borrar
                  </button>
                ) : (
                  <button className="iconbtn" onClick={() => setConfirm(true)} aria-label="Borrar foto">
                    <Trash2 size={18} />
                  </button>
                ))}
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}
