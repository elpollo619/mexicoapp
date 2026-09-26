import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { setRejectHandler, start } from './lib/store'
import { toast } from './lib/toast'

setRejectHandler((msg) => toast(msg, 4000))

void start()

// Nueva versión publicada: no recargamos solos (cortaría un formulario a medias).
// Mostramos un aviso fijo y la persona decide cuándo actualizar.
const isTyping = () => {
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable)
}
const updateSW = registerSW({
  onNeedRefresh() {
    const ask = () => toast('Nueva versión lista · Tocá para actualizar', { sticky: true, action: { label: 'Actualizar', onClick: () => void updateSW(true) } })
    if (document.visibilityState !== 'hidden') return ask()
    // App en segundo plano: al volver, si nadie está escribiendo, se actualiza sola; si no, avisamos
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible' && !isTyping()) void updateSW(true)
        else ask()
      },
      { once: true },
    )
  },
})
// Si un trozo de la app ya no existe en el servidor (tras publicar), recargar una sola vez
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('mx-reloaded')) return
  sessionStorage.setItem('mx-reloaded', '1')
  location.reload()
})
setTimeout(() => sessionStorage.removeItem('mx-reloaded'), 10000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
