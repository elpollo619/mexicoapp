import { useRef, useState } from 'react'
import { Camera, Share2, Trash2 } from 'lucide-react'
import { CITIES, DAYS } from '../data/trip'
import { useMe } from '../lib/me'
import { put, remove, uid, uploadImage, useItems, type Item } from '../lib/store'
import { toast } from '../lib/toast'
import { longDate, todayIn } from '../lib/time'
import { Avatar, name, Sheet } from '../components/ui'

/** `thumb` (400 px) para la cuadrícula; las fotos viejas solo tienen `url` */
type Photo = { url: string; thumb?: string; by: string; caption?: string; date: string }
type Reason = 'formato' | 'red' | 'local'

const WHY: Record<Reason, string> = {
  formato: 'Formato no compatible (¿HEIC?): compártela como JPEG',
  red: 'Sin conexión o subida cortada: intenta de nuevo',
  local: 'Las fotos solo se suben con el grupo conectado',
}

/**
 * Descargar en el celular: `download` se ignora entre dominios y en iOS instalada abre un visor
 * dentro de la app. Mejor: bajar la foto y compartirla como archivo (Guardar imagen, WhatsApp…);
 * si el navegador no comparte archivos, se abre en una pestaña nueva.
 */
async function sharePhoto(url: string, who: string) {
  try {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.share && nav.canShare) {
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], `mexico-${who}-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'México Lindo 2026' })
        return
      }
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return
  }
  window.open(url, '_blank', 'noopener')
}

export default function Photos() {
  const me = useMe()!
  const photos = useItems<Photo>('photo').slice().reverse()
  const [progress, setProgress] = useState<{ i: number; n: number } | null>(null)
  const [sharing, setSharing] = useState(false)
  const [open, setOpen] = useState<Item<Photo> | null>(null)
  const [confirm, setConfirm] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files].slice(0, 10)
    if (files.length > 10) toast('Máximo 10 fotos por vez: subo las primeras 10')
    let ok = 0
    const why = new Set<Reason>()
    try {
      for (const [i, f] of list.entries()) {
        setProgress({ i: i + 1, n: list.length })
        const r = await uploadImage(f)
        if (r.ok) {
          put('photo', `photo:${uid()}`, { url: r.url, thumb: r.thumb, by: me, date: todayIn('America/Mexico_City') })
          ok++
        } else why.add(r.reason)
      }
    } finally {
      // El store corta la subida a los 60 s: pase lo que pase, el botón vuelve a habilitarse
      setProgress(null)
      if (input.current) input.current.value = ''
    }
    if (ok === list.length) {
      toast(`📸 ${ok} foto${ok > 1 ? 's' : ''} subida${ok > 1 ? 's' : ''}`)
      return
    }
    const reason = (['formato', 'red', 'local'] as Reason[]).find((k) => why.has(k))!
    toast(`${ok ? `Se subieron ${ok} de ${list.length}. ` : ''}${WHY[reason]}`)
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
        <button className="btn primary" onClick={() => input.current?.click()} disabled={!!progress} aria-live="polite">
          <Camera size={18} /> {progress ? (progress.n > 1 ? `Subiendo ${progress.i} de ${progress.n}…` : 'Subiendo…') : 'Subir'}
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
                  <img src={p.data.thumb ?? p.data.url} alt="" loading="lazy" decoding="async" />
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
              <button
                className="iconbtn"
                aria-label="Guardar o compartir la foto"
                disabled={sharing}
                onClick={async () => {
                  setSharing(true)
                  try {
                    await sharePhoto(open.data.url, open.data.by)
                  } finally {
                    setSharing(false)
                  }
                }}
              >
                {sharing ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden /> : <Share2 size={18} />}
              </button>
              {open.data.by === me &&
                (confirm ? (
                  <button
                    className="btn small"
                    style={{ background: 'var(--rojo)', color: '#fff', minHeight: 40 }}
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
