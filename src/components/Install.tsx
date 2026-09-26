import { useState } from 'react'
import { Copy, Download, PlusSquare, Share, Share2, X } from 'lucide-react'
import { isIOS, isStandalone, shareApp, useInstall } from '../lib/install'
import { toast } from '../lib/toast'

const DISMISS = 'mx-install-dismissed'
const APP_URL = 'https://elpollo619.github.io/mexicoapp/'

async function copyLink() {
  try {
    await navigator.clipboard.writeText(APP_URL)
    toast('Link copiado 📋')
  } catch {
    toast(`No se pudo copiar. El link es ${APP_URL}`)
  }
}

/**
 * Tarjeta compacta para la pantalla de inicio de sesión: en Android con `beforeinstallprompt`
 * ofrece el botón "Instalar"; en iPhone explica los 2 pasos (Compartir → Añadir a pantalla de inicio).
 * No aparece si la app ya está instalada.
 */
export function InstallCard() {
  const { canPrompt, prompt } = useInstall()
  if (isStandalone()) return null
  const ios = isIOS()
  return (
    <div className="card install-card col" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 10 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
          📲
        </span>
        <b className="grow">Instalar la app en tu celular</b>
        {canPrompt && (
          <button className="btn primary small" style={{ minHeight: 40 }} onClick={() => void prompt()}>
            <Download size={16} /> Instalar
          </button>
        )}
      </div>
      {ios ? (
        <ol className="steps install-steps">
          <li>
            <span>
              En <b>Safari</b>, toca <b>Compartir</b> <Share size={15} style={{ verticalAlign: -2 }} /> abajo al centro.
            </span>
          </li>
          <li>
            <span>
              Elige <b>“Añadir a pantalla de inicio”</b> <PlusSquare size={15} style={{ verticalAlign: -2 }} /> y confirma.
            </span>
          </li>
        </ol>
      ) : (
        <span className="small muted">
          {canPrompt ? 'Ícono en tu pantalla, pantalla completa y funciona sin internet.' : 'En Chrome: menú ⋮ → “Instalar aplicación”. Queda como una app más, con ícono y sin internet.'}
        </span>
      )}
    </div>
  )
}

/** Banner compacto en "Hoy" para instalar la app */
export function InstallBanner({ onGuide }: { onGuide: () => void }) {
  const { canPrompt, prompt } = useInstall()
  const [hidden, setHidden] = useState(() => {
    try {
      return isStandalone() || localStorage.getItem(DISMISS) === '1'
    } catch {
      return isStandalone()
    }
  })
  if (hidden) return null
  return (
    <div className="card install">
      <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
      <div className="grow col" style={{ gap: 0 }}>
        <b>Instala la app</b>
        <span className="small muted">Ícono en tu pantalla, pantalla completa y funciona sin internet.</span>
      </div>
      <button className="btn primary small" onClick={() => (canPrompt ? void prompt() : onGuide())}>
        {canPrompt ? 'Instalar' : 'Cómo'}
      </button>
      <button
        className="iconbtn"
        aria-label="Ocultar"
        style={{ width: 32, height: 32, background: 'none' }}
        onClick={() => {
          try {
            localStorage.setItem(DISMISS, '1')
          } catch {
            /* ignore */
          }
          setHidden(true)
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

/** Guía completa: iPhone, Android, QR y compartir */
export function InstallGuide() {
  const { canPrompt, prompt } = useInstall()
  const [os, setOs] = useState<'ios' | 'android'>(isIOS() ? 'ios' : 'android')
  const installed = isStandalone()

  return (
    <div className="col" style={{ gap: 14 }}>
      {installed ? (
        <div className="card turq row">
          <span style={{ fontSize: 26 }}>✅</span>
          <span className="grow">
            <b>Ya la tienes instalada.</b>
            <br />
            <span className="small muted">Compártela con el grupo con el QR o el botón de abajo.</span>
          </span>
        </div>
      ) : (
        canPrompt && (
          <button className="btn primary block" onClick={() => void prompt()}>
            <Download size={18} /> Instalar ahora
          </button>
        )
      )}

      <div className="seg">
        <button className={os === 'ios' ? 'on' : ''} onClick={() => setOs('ios')}>
          🍎 iPhone
        </button>
        <button className={os === 'android' ? 'on' : ''} onClick={() => setOs('android')}>
          🤖 Android
        </button>
      </div>

      {/* Cada paso va en un <span>: el <li> es una cuadrícula (número + texto) y el texto suelto se partiría en celdas */}
      <ol className="steps">
        {os === 'ios' ? (
          <>
            <li>
              <span>
                Abre el link en <b>Safari</b> (no en el navegador de WhatsApp: toca ⋯ → “Abrir en Safari”).
              </span>
            </li>
            <li>
              <span>
                Toca el botón <b>Compartir</b> <Share size={15} style={{ verticalAlign: -2 }} /> abajo al centro.
              </span>
            </li>
            <li>
              <span>
                Baja y toca <b>“Añadir a pantalla de inicio”</b> <PlusSquare size={15} style={{ verticalAlign: -2 }} />.
              </span>
            </li>
            <li>
              <span>
                Toca <b>Añadir</b>. Aparece el ícono 🇲🇽 “México Lindo” como una app más.
              </span>
            </li>
          </>
        ) : (
          <>
            <li>
              <span>
                Abre el link en <b>Chrome</b>.
              </span>
            </li>
            <li>
              <span>
                Toca <b>“Instalar app”</b> en el aviso de abajo, o el menú <b>⋮</b> → <b>“Instalar aplicación”</b>.
              </span>
            </li>
            <li>
              <span>Confirma. El ícono aparece en tu pantalla de inicio y en el cajón de apps.</span>
            </li>
          </>
        )}
        <li>
          <span>
            Ábrela, elige tu nombre y crea tu <b>PIN</b> de 4 números. ¡Listo!
          </span>
        </li>
      </ol>

      <div className="card col" style={{ alignItems: 'center', gap: 10 }}>
        <span className="label">Escanea para abrir</span>
        <img src={`${import.meta.env.BASE_URL}qr.svg`} alt={`Código QR de ${APP_URL}`} width={200} height={200} style={{ borderRadius: 12 }} />
        <code className="small" style={{ wordBreak: 'break-all', textAlign: 'center' }}>
          {APP_URL}
        </code>
        <button
          className="btn block"
          onClick={async () => {
            const r = await shareApp()
            if (r === 'copied') toast('Link copiado 📋')
          }}
        >
          <Share2 size={17} /> Compartir con el grupo
        </button>
        <button className="btn ghost block" onClick={() => void copyLink()}>
          <Copy size={16} /> Copiar link
        </button>
      </div>
    </div>
  )
}
