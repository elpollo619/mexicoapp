import { useState } from 'react'
import { Download, PlusSquare, Share, Share2, X } from 'lucide-react'
import { isIOS, isStandalone, shareApp, useInstall } from '../lib/install'
import { toast } from '../lib/toast'

const DISMISS = 'mx-install-dismissed'
const APP_URL = 'https://elpollo619.github.io/mexicoapp/'

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

      <ol className="steps">
        {os === 'ios' ? (
          <>
            <li>
              Abre el link en <b>Safari</b> (no en el navegador de WhatsApp: toca ⋯ → “Abrir en Safari”).
            </li>
            <li>
              Toca el botón <b>Compartir</b> <Share size={15} style={{ verticalAlign: -2 }} /> abajo al centro.
            </li>
            <li>
              Baja y toca <b>“Añadir a pantalla de inicio”</b> <PlusSquare size={15} style={{ verticalAlign: -2 }} />.
            </li>
            <li>
              Toca <b>Añadir</b>. Aparece el ícono 🇲🇽 “México Lindo” como una app más.
            </li>
          </>
        ) : (
          <>
            <li>
              Abre el link en <b>Chrome</b>.
            </li>
            <li>
              Toca <b>“Instalar app”</b> en el aviso de abajo, o el menú <b>⋮</b> → <b>“Instalar aplicación”</b>.
            </li>
            <li>Confirma. El ícono aparece en tu pantalla de inicio y en el cajón de apps.</li>
          </>
        )}
        <li>
          Ábrela, elige tu nombre y crea tu <b>PIN</b> de 4 números. ¡Listo!
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
      </div>
    </div>
  )
}
