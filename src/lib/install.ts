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

export async function shareApp() {
  const url = `${location.origin}${import.meta.env.BASE_URL}`
  const data = { title: 'México Lindo 2026', text: 'La app del viaje 🇲🇽 — instálala en tu celular', url }
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
