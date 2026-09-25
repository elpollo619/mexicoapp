import { useState } from 'react'
import { Check, ExternalLink, Lock, LockOpen, Plus, Trash2, Trophy, X } from 'lucide-react'
import { CORE } from '../data/people'
import { put, remove, uid, useItems, type Item } from '../lib/store'
import { useMe } from '../lib/me'
import { Avatars, buzz, name, Sheet } from '../components/ui'
import './polls/polls.css'

export type PollOption = { id: string; label: string; detail?: string; url?: string }
export type Poll = {
  question: string
  options: PollOption[]
  by?: string
  multi?: boolean
  closed?: boolean
  city?: string
  order?: number
}
export type Vote = { poll: string; person: string; options: string[] }

const voteId = (pollId: string, p: string) => `vote:${pollId}:${p}`

export default function Polls() {
  const me = useMe() ?? 'cristian'
  const polls = useItems<Poll>('poll')
  const votes = useItems<Vote>('vote')
  const [creating, setCreating] = useState(false)

  const sorted = [...polls].sort(
    (a, b) =>
      Number(!!a.data.closed) - Number(!!b.data.closed) ||
      (a.data.order ?? 999) - (b.data.order ?? 999) ||
      a.created_at.localeCompare(b.created_at),
  )
  const pending = sorted.filter((p) => !p.data.closed && !votes.some((v) => v.data.poll === p.id && v.data.person === me)).length

  return (
    <>
      <div className="card turq row">
        <span style={{ fontSize: 30 }}>🗳️</span>
        <div className="grow small">
          {pending ? (
            <>
              Te faltan <b>{pending}</b> {pending === 1 ? 'votación' : 'votaciones'}. ¡Manito arriba o abajo! 👍👎
            </>
          ) : (
            <>Ya votaste en todo. ¡Eres un ciudadano ejemplar! 🇲🇽</>
          )}
        </div>
      </div>

      {!sorted.length && <div className="card empty">No hay votaciones todavía. ¡Crea la primera!</div>}
      {sorted.map((p) => (
        <PollCard key={p.id} poll={p} votes={votes.filter((v) => v.data.poll === p.id)} me={me} />
      ))}

      <button className="btn fab" onClick={() => setCreating(true)}>
        <Plus size={18} /> Encuesta
      </button>
      <Sheet open={creating} onClose={() => setCreating(false)} title="Nueva encuesta">
        {creating && <NewPoll me={me} order={sorted.length} onDone={() => setCreating(false)} />}
      </Sheet>
    </>
  )
}

function PollCard({ poll, votes, me }: { poll: Item<Poll>; votes: Item<Vote>[]; me: string }) {
  const p = poll.data
  const [confirm, setConfirm] = useState(false)
  const mine = votes.find((v) => v.data.person === me)?.data.options ?? []
  const counts = Object.fromEntries(p.options.map((o) => [o.id, votes.filter((v) => v.data.options.includes(o.id))]))
  const max = Math.max(0, ...p.options.map((o) => counts[o.id].length))
  const voters = new Set(votes.map((v) => v.data.person))
  const expected = p.city === 'gdl' ? [...CORE, 'pablo', 'invitado'] : CORE
  const missing = expected.filter((x) => !voters.has(x))
  const canManage = !p.by || p.by === me

  function vote(opt: string) {
    if (p.closed) return
    const id = voteId(poll.id, me)
    const has = mine.includes(opt)
    const next = p.multi ? (has ? mine.filter((o) => o !== opt) : [...mine, opt]) : has ? [] : [opt]
    if (next.length) put<Vote>('vote', id, { poll: poll.id, person: me, options: next })
    else remove(id)
    buzz(12)
  }

  return (
    <div className={`card col${p.closed ? ' poll-closed' : ''}`} style={{ gap: 10 }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <h3 className="grow">{p.question}</h3>
        {p.closed && (
          <span className="tag wait">
            <Lock size={10} /> cerrada
          </span>
        )}
      </div>
      <div className="small muted" style={{ marginTop: -6 }}>
        {p.multi ? 'Puedes elegir varias' : 'Elige una'} · {voters.size} {voters.size === 1 ? 'voto' : 'votos'}
        {p.by && <> · por {name(p.by)}</>}
      </div>

      {p.options.map((o) => {
        const vs = counts[o.id]
        const total = voters.size || 1
        const on = mine.includes(o.id)
        return (
          <div
            key={o.id}
            role="button"
            tabIndex={p.closed ? -1 : 0}
            aria-pressed={on}
            aria-disabled={p.closed}
            className={`poll-opt${on ? ' mine' : ''}`}
            style={{ cursor: p.closed ? 'default' : 'pointer' }}
            onClick={() => vote(o.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                vote(o.id)
              }
            }}
          >
            <span className="poll-fill" style={{ width: `${(vs.length / total) * 100}%` }} />
            <span className="poll-in">
              <span className={`poll-check${p.multi ? ' sq' : ''}`}>{on && <Check size={13} strokeWidth={3} />}</span>
              <span className="grow col" style={{ gap: 1, minWidth: 0 }}>
                <span className="row" style={{ gap: 6 }}>
                  <b>{o.label}</b>
                  {max > 0 && vs.length === max && <Trophy size={14} color="var(--cempa)" aria-label="Va ganando" />}
                </span>
                {o.detail && <span className="tiny muted">{o.detail}</span>}
              </span>
              {vs.length > 0 && <Avatars ids={vs.map((v) => v.data.person)} />}
              <span className="poll-count">{vs.length}</span>
              {o.url && (
                <a
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  className="iconbtn"
                  style={{ width: 30, height: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver enlace"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </span>
          </div>
        )
      })}

      {!p.closed && missing.length > 0 && (
        <div className="row small muted wrap" style={{ gap: 6 }}>
          Falta: <Avatars ids={missing} /> <span className="tiny">{missing.map(name).join(', ')}</span>
        </div>
      )}

      {canManage &&
        (confirm ? (
          <div className="row" style={{ gap: 8, background: 'var(--rosa-soft)', borderRadius: 12, padding: '8px 10px' }}>
            <span className="grow small">¿Borrar la encuesta y sus votos?</span>
            <button className="btn ghost small" onClick={() => setConfirm(false)}>
              No
            </button>
            <button
              className="btn small"
              style={{ background: 'var(--rojo)' }}
              onClick={() => {
                votes.forEach((v) => remove(v.id))
                remove(poll.id)
              }}
            >
              Borrar
            </button>
          </div>
        ) : (
          <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
            <button className="btn ghost small" onClick={() => put<Poll>('poll', poll.id, { ...p, closed: !p.closed })}>
              {p.closed ? <LockOpen size={14} /> : <Lock size={14} />} {p.closed ? 'Reabrir' : 'Cerrar'}
            </button>
            <button className="btn ghost small" onClick={() => setConfirm(true)} aria-label="Borrar encuesta">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
    </div>
  )
}

function NewPoll({ me, order, onDone }: { me: string; order: number; onDone: () => void }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multi, setMulti] = useState(false)
  const clean = options.map((o) => o.trim()).filter(Boolean)
  const valid = question.trim().length > 0 && clean.length >= 2

  function save() {
    if (!valid) return
    put<Poll>('poll', `poll:${uid()}`, {
      question: question.trim(),
      options: clean.map((label) => ({ id: uid(), label })),
      by: me,
      multi,
      order: 100 + order,
    })
    buzz([10, 40, 10])
    onDone()
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <label className="field">
        Pregunta
        <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="¿Dónde cenamos hoy?" maxLength={120} autoFocus />
      </label>
      <div className="field">
        Opciones
        {options.map((o, i) => (
          <div key={i} className="opt-input">
            <input
              className="input"
              value={o}
              onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`Opción ${i + 1}`}
              maxLength={80}
            />
            {options.length > 2 && (
              <button type="button" className="iconbtn" onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label="Quitar opción">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {options.length < 8 && (
          <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => setOptions([...options, ''])}>
            <Plus size={14} /> Añadir opción
          </button>
        )}
      </div>
      <div className="seg">
        <button type="button" className={!multi ? 'on' : ''} onClick={() => setMulti(false)}>
          Una respuesta
        </button>
        <button type="button" className={multi ? 'on' : ''} onClick={() => setMulti(true)}>
          Varias
        </button>
      </div>
      <div className="row">
        <button className="btn ghost grow" onClick={onDone}>
          Cancelar
        </button>
        <button className="btn grow" disabled={!valid} onClick={save}>
          Crear
        </button>
      </div>
    </div>
  )
}
