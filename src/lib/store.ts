import { createClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

export type Kind = 'expense' | 'settlement' | 'poll' | 'vote' | 'signup' | 'check' | 'bingo' | 'flight' | 'note' | 'photo' | 'profile' | 'budget'

export type Item<T = Record<string, unknown>> = {
  id: string
  kind: Kind
  data: T
  created_at: string
  updated_at: string
}

const TRIP = 'mexico-2026'
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const supabase = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false } }) : null

const CACHE_KEY = 'mx-cache-v1'
const OUTBOX_KEY = 'mx-outbox-v1'

type Op = { op: 'put'; item: Item } | { op: 'del'; id: string }

let items = new Map<string, Item>()
let outbox: Op[] = []
let status: 'offline' | 'syncing' | 'live' | 'local' = supabase ? 'syncing' : 'local'
const listeners = new Set<() => void>()
let version = 0

function load() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) items = new Map((JSON.parse(raw) as Item[]).map((i) => [i.id, i]))
    const ob = localStorage.getItem(OUTBOX_KEY)
    if (ob) outbox = JSON.parse(ob)
  } catch {
    /* sin almacenamiento: seguimos en memoria */
  }
}

function persist() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...items.values()]))
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox))
  } catch {
    /* ignore */
  }
}

function emit() {
  version++
  persist()
  listeners.forEach((l) => l())
}

function setStatus(s: typeof status) {
  status = s
  emit()
}

/** Solo un envío a la vez; las operaciones se quitan por identidad, nunca con shift() */
let flushing: Promise<void> | null = null
let retryTimer: ReturnType<typeof setTimeout> | undefined
let retryDelay = 3000
/** Aviso a la UI cuando el servidor rechaza un cambio (se registra desde main) */
let onRejected: (msg: string) => void = () => {}
export const setRejectHandler = (fn: (msg: string) => void) => (onRejected = fn)

const RETRYABLE = new Set([0, 401, 403, 408, 425, 429])

function scheduleRetry() {
  clearTimeout(retryTimer)
  retryTimer = setTimeout(() => void flush().then(() => { if (!outbox.length) void pull() }), retryDelay)
  retryDelay = Math.min(retryDelay * 2, 60000)
}

function flush(): Promise<void> {
  if (!supabase || !outbox.length) return Promise.resolve()
  if (flushing) return flushing
  flushing = (async () => {
    while (outbox.length) {
      const op = outbox[0]
      const res =
        op.op === 'put'
          ? await supabase!.from('mx_items').upsert({ id: op.item.id, trip: TRIP, kind: op.item.kind, data: op.item.data })
          : await supabase!.from('mx_items').delete().eq('id', op.id)
      if (res.error) {
        if (RETRYABLE.has(res.status) || res.status >= 500) {
          setStatus('offline')
          scheduleRetry()
          break
        }
        // Rechazo definitivo (datos inválidos): se descarta para no bloquear la cola, pero se avisa
        outbox = outbox.filter((o) => o !== op)
        onRejected('No se pudo guardar un cambio (el servidor lo rechazó).')
        continue
      }
      outbox = outbox.filter((o) => o !== op)
      retryDelay = 3000
    }
    emit()
  })().finally(() => {
    flushing = null
  })
  return flushing
}

/** Cambios aplicados mientras hay un pull en curso: se repiten sobre la foto del servidor */
let pulling = 0
let replay: ((m: Map<string, Item>) => void)[] = []

function apply(fn: (m: Map<string, Item>) => void) {
  fn(items)
  if (pulling) replay.push(fn)
}

async function pull() {
  if (!supabase) return
  pulling++
  const { data, error } = await supabase.from('mx_items').select('*').eq('trip', TRIP).limit(5000)
  pulling--
  if (error) {
    if (!pulling) replay = []
    setStatus('offline')
    return
  }
  const fresh = new Map<string, Item>()
  for (const row of data as Item[]) fresh.set(row.id, row)
  // Lo que aún no se subió, en el orden en que se hizo
  for (const op of outbox) {
    if (op.op === 'put') fresh.set(op.item.id, op.item)
    else fresh.delete(op.id)
  }
  // Cambios locales o en vivo que llegaron durante la descarga
  for (const fn of replay) fn(fresh)
  if (!pulling) replay = []
  items = fresh
  setStatus('live')
}

const hasPending = (id: string) => outbox.some((o) => (o.op === 'put' ? o.item.id : o.id) === id)

let started = false

export async function start() {
  if (started) return
  started = true
  load()
  emit()
  if (!supabase) return
  await flush()
  await pull()
  supabase
    .channel('mx-items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mx_items', filter: `trip=eq.${TRIP}` }, (payload) => {
      const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Item
      // Si tenemos un cambio propio pendiente para esa id, manda el nuestro
      if (!row?.id || hasPending(row.id)) return
      if (payload.eventType === 'DELETE') apply((m) => m.delete(row.id))
      else apply((m) => m.set(row.id, row))
      emit()
    })
    .subscribe((s) => {
      // Al (re)conectar se recupera lo que pasó mientras no había conexión
      if (s === 'SUBSCRIBED') void pull()
      else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('offline')
    })

  window.addEventListener('online', async () => {
    await flush()
    await pull()
  })
  window.addEventListener('offline', () => setStatus('offline'))
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      await flush()
      await pull()
    }
  })
}

export function put<T extends object>(kind: Kind, id: string, data: T) {
  const now = new Date().toISOString()
  const prev = items.get(id)
  const item: Item = { id, kind, data: data as Record<string, unknown>, created_at: prev?.created_at ?? now, updated_at: now }
  apply((m) => m.set(id, item))
  // Sustituye cualquier operación pendiente de la misma id (la última gana)
  outbox = outbox.filter((o) => (o.op === 'put' ? o.item.id : o.id) !== id)
  outbox.push({ op: 'put', item })
  emit()
  void flush()
}

export function remove(id: string) {
  apply((m) => m.delete(id))
  outbox = outbox.filter((o) => (o.op === 'put' ? o.item.id : o.id) !== id)
  outbox.push({ op: 'del', id })
  emit()
  void flush()
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Todos los items de un tipo, ordenados por fecha de creación */
export function useItems<T>(kind: Kind): Item<T>[] {
  useSyncExternalStore(subscribe, () => version)
  return [...items.values()]
    .filter((i) => i.kind === kind)
    .sort((a, b) => a.created_at.localeCompare(b.created_at)) as Item<T>[]
}

export function useSyncStatus() {
  useSyncExternalStore(subscribe, () => version)
  return { status, pending: outbox.length }
}

export async function uploadReceipt(file: File): Promise<string | null> {
  if (!supabase) return null
  const img = await shrinkImage(file)
  if (!img) return null
  const path = `${new Date().toISOString().slice(0, 10)}/${uid()}.${img.ext}`
  const { error } = await supabase.storage.from('mx-receipts').upload(path, img.blob, { contentType: img.type })
  if (error) return null
  return supabase.storage.from('mx-receipts').getPublicUrl(path).data.publicUrl
}

const MAX_BYTES = 8 * 1024 * 1024
const RAW_OK: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/**
 * Reduce la foto a ~1400 px en JPEG para que suba rápido con datos móviles.
 * Si el navegador no puede leerla (p. ej. HEIC en Android), solo se sube tal cual
 * cuando es un formato que todos pueden ver; si no, se rechaza (null).
 */
async function shrinkImage(file: File): Promise<{ blob: Blob; type: string; ext: string } | null> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8))
    if (blob) return { blob, type: 'image/jpeg', ext: 'jpg' }
  } catch {
    /* formato que el navegador no sabe leer */
  }
  const ext = RAW_OK[file.type]
  return ext && file.size <= MAX_BYTES ? { blob: file, type: file.type, ext } : null
}
