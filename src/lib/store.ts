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

async function flush() {
  if (!supabase || !outbox.length) return
  while (outbox.length) {
    const op = outbox[0]
    const res =
      op.op === 'put'
        ? await supabase.from('mx_items').upsert({ id: op.item.id, trip: TRIP, kind: op.item.kind, data: op.item.data })
        : await supabase.from('mx_items').delete().eq('id', op.id)
    if (res.error) {
      // Error de validación: descartar para no bloquear la cola; error de red: reintentar luego
      if (res.status >= 400 && res.status < 500) {
        outbox.shift()
        continue
      }
      setStatus('offline')
      return
    }
    outbox.shift()
  }
  persist()
}

async function pull() {
  if (!supabase) return
  const { data, error } = await supabase.from('mx_items').select('*').eq('trip', TRIP).limit(5000)
  if (error) {
    setStatus('offline')
    return
  }
  const fresh = new Map<string, Item>()
  for (const row of data as Item[]) fresh.set(row.id, row)
  // Mantener lo que aún no se subió
  for (const op of outbox) if (op.op === 'put') fresh.set(op.item.id, op.item)
  for (const op of outbox) if (op.op === 'del') fresh.delete(op.id)
  items = fresh
  setStatus('live')
}



export async function start() {
  load()
  emit()
  if (!supabase) return
  await flush()
  await pull()
  supabase
    .channel('mx-items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mx_items', filter: `trip=eq.${TRIP}` }, (payload) => {
      if (payload.eventType === 'DELETE') items.delete((payload.old as Item).id)
      else items.set((payload.new as Item).id, payload.new as Item)
      emit()
    })
    .subscribe((s) => {
      if (s === 'SUBSCRIBED') setStatus('live')
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
  items.set(id, item)
  outbox = outbox.filter((o) => !(o.op === 'put' && o.item.id === id))
  outbox.push({ op: 'put', item })
  emit()
  void flush()
}

export function remove(id: string) {
  items.delete(id)
  outbox = outbox.filter((o) => !(o.op === 'put' && o.item.id === id))
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
  const blob = await shrinkImage(file)
  const path = `${new Date().toISOString().slice(0, 10)}/${uid()}.jpg`
  const { error } = await supabase.storage.from('mx-receipts').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) return null
  return supabase.storage.from('mx-receipts').getPublicUrl(path).data.publicUrl
}

/** Reduce la foto a ~1400 px en JPEG para que suba rápido con datos móviles */
async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', 0.8))
  } catch {
    return file
  }
}
