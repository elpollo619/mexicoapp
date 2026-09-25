import { useSyncExternalStore } from 'react'

const KEY = 'mx-session-v2'
const listeners = new Set<() => void>()

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

let me = read()

/** Guarda la sesión (solo después de verificar el PIN) o la cierra con null */
export function setMe(id: string | null) {
  me = id
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

/** Id de la persona con sesión iniciada en este teléfono */
export function useMe(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => me,
  )
}

export type Profile = { pin: string; updated: string }

/** Hash del PIN (no se guarda el PIN en claro) */
export async function hashPin(person: string, pin: string) {
  const data = new TextEncoder().encode(`mexico-lindo-2026:${person}:${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
