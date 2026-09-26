import { useSyncExternalStore } from 'react'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: PromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as PromptEvent
  emit()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  emit()
})

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useInstall() {
  const canPrompt = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => !!deferred,
  )
  return {
    canPrompt,
    async prompt() {
      if (!deferred) return
      await deferred.prompt()
      deferred = null
      emit()
    },
  }
}

export const APP_URL = `${location.origin}${import.meta.env.BASE_URL}`

/** Link personal: abre la app directo en el PIN de esa persona (`?yo=bia`) */
export const loginUrl = (id: string) => `${APP_URL}?yo=${encodeURIComponent(id)}`

/** Quién viene en el link (`?yo=…`), y limpia la URL para que no se quede pegado */
export function readInvite(): string | null {
  const id = new URLSearchParams(location.search).get('yo')
  if (id) history.replaceState(null, '', `${location.pathname}${location.hash}`)
  return id
}

export async function shareApp(person?: { id: string; name: string }) {
  const url = person ? loginUrl(person.id) : APP_URL
  const data = person
    ? { title: 'México Lindo 2026', text: `${person.name}, esta es la app del viaje 🇲🇽 — abre el link, crea tu PIN y añádela a tu pantalla de inicio`, url }
    : { title: 'México Lindo 2026', text: 'La app del viaje 🇲🇽 — instálala en tu celular', url }
  try {
    if (navigator.share) {
      await navigator.share(data)
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'cancel'
  }
}
