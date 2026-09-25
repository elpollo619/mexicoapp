import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { setRejectHandler, start } from './lib/store'
import { toast } from './lib/toast'

setRejectHandler((msg) => toast(msg, 4000))

void start()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
