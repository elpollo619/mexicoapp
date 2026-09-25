import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { setRejectHandler, start } from './lib/store'
import { toast } from './lib/toast'

setRejectHandler((msg) => toast(msg, 4000))

void start()

// Nueva versión publicada: el service worker toma el control y recargamos para no mezclar archivos viejos y nuevos
registerSW({ immediate: true })
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
