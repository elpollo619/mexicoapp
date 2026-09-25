import { useId, type ReactNode } from 'react'
import { person } from '../data/people'

/* Avatares de luchador originales, dibujados en SVG (viewBox 100×100).
   Cada persona: máscara en su color, adorno de ojos, emblema en la frente y extras. */

type EyeTrim = 'flame' | 'star' | 'tear' | 'bolt' | 'ring' | 'wing'
type Mouth = 'grin' | 'smirk' | 'open' | 'tongue' | 'teeth' | 'o'

type Look = {
  skin: string
  accent: string
  trim: EyeTrim
  mouth: Mouth
  /** Hacia dónde miran las pupilas */
  gaze: [number, number]
  emblem: 'brain' | 'heart' | 'dollar' | 'flower' | 'martini' | 'horns' | 'thirty' | 'question'
  extras: ('glasses' | 'lashes' | 'bun' | 'mustache' | 'chain' | 'plane' | 'shades' | 'cocktail' | 'rockhorns' | 'shine' | 'partyhat' | 'confetti' | 'clipboard' | 'blush' | 'gold')[]
}

const INK = '#1d1720'

const LOOKS: Record<string, Look> = {
  cristian: { skin: '#e0ac86', accent: '#ffd23f', trim: 'ring', mouth: 'grin', gaze: [1, -1], emblem: 'brain', extras: ['glasses', 'clipboard'] },
  bia: { skin: '#c68a64', accent: '#ffffff', trim: 'wing', mouth: 'smirk', gaze: [-1.5, 0], emblem: 'heart', extras: ['lashes', 'bun', 'blush'] },
  pipo: { skin: '#d9a07a', accent: '#f5c518', trim: 'flame', mouth: 'teeth', gaze: [1.5, 0.5], emblem: 'dollar', extras: ['mustache', 'chain'] },
  tania: { skin: '#e8b996', accent: '#ffe066', trim: 'tear', mouth: 'open', gaze: [0, -1.5], emblem: 'flower', extras: ['lashes', 'plane', 'blush'] },
  jhoni: { skin: '#d59a73', accent: '#1d1720', trim: 'star', mouth: 'tongue', gaze: [-1, 1], emblem: 'martini', extras: ['shades', 'cocktail'] },
  nicolas: { skin: '#eec1a0', accent: '#ffffff', trim: 'bolt', mouth: 'o', gaze: [1.2, -1.2], emblem: 'horns', extras: ['rockhorns', 'shine'] },
  pablo: { skin: '#d8a47f', accent: '#c0392b', trim: 'flame', mouth: 'grin', gaze: [0, 0], emblem: 'thirty', extras: ['partyhat', 'gold', 'confetti'] },
  invitado: { skin: '#caa07e', accent: '#ffd23f', trim: 'star', mouth: 'smirk', gaze: [1.5, 1.5], emblem: 'question', extras: ['confetti'] },
}

const FALLBACK: Look = { skin: '#d9a07a', accent: '#ffffff', trim: 'ring', mouth: 'grin', gaze: [0, 0], emblem: 'question', extras: [] }

/** Un adorno alrededor del ojo izquierdo (el derecho se refleja) */
function Trim({ kind, color }: { kind: EyeTrim; color: string }) {
  const s = { fill: color, stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'flame':
      return <path {...s} d="M26 58 C24 50 26 44 30 40 C29 44 31 45 33 42 C33 38 36 34 40 33 C38 37 41 39 44 37 C47 40 48 46 46 52 C44 58 38 61 33 61 C30 61 27 60 26 58 Z" />
    case 'star':
      return <path {...s} d="M37 35 L40 43 L49 43 L42 48 L45 57 L37 52 L29 57 L32 48 L25 43 L34 43 Z" transform="translate(0 2) scale(1.12) translate(-4 -5)" />
    case 'tear':
      return <path {...s} d="M29 44 C32 38 44 37 47 44 C49 50 45 56 38 57 C36 62 33 66 30 68 C31 63 31 59 30 55 C27 52 27 47 29 44 Z" />
    case 'bolt':
      return <path {...s} d="M45 36 L31 44 L37 46 L27 58 L44 48 L38 46 Z" transform="translate(1 1)" />
    case 'wing':
      return <path {...s} d="M46 44 C40 38 30 36 22 39 C27 41 28 43 26 44 C30 45 30 47 27 49 C32 50 32 52 30 54 C36 55 43 54 47 50 Z" />
    case 'ring':
    default:
      return <ellipse {...s} cx="38" cy="47" rx="11.5" ry="10.5" />
  }
}

function Eye({ cx, gaze, lashes }: { cx: number; gaze: [number, number]; lashes: boolean }) {
  return (
    <g>
      <ellipse cx={cx} cy="47" rx="6.6" ry="7.4" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <circle cx={cx + gaze[0]} cy={47 + gaze[1]} r="3.3" fill={INK} />
      <circle cx={cx + gaze[0] + 1.2} cy={47 + gaze[1] - 1.3} r="1.1" fill="#fff" />
      {lashes && (
        <path
          d={`M${cx - 6} 42 l-2.6 -2.4 M${cx - 3} 40.3 l-1.4 -3 M${cx} 39.8 l0 -3.2`}
          stroke={INK}
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={cx > 50 ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}
        />
      )}
    </g>
  )
}

function MouthShape({ kind }: { kind: Mouth }) {
  const line = { stroke: INK, strokeWidth: 1.8, strokeLinecap: 'round' as const, fill: 'none' }
  switch (kind) {
    case 'teeth':
      return (
        <g>
          <path d="M41 71 Q50 81 59 71 Z" fill="#7a1f2b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M42.5 71.5 H57.5 V74 H42.5 Z" fill="#fff" />
          <path d="M50 71.5 V74" stroke={INK} strokeWidth="0.8" />
        </g>
      )
    case 'open':
      return (
        <g>
          <ellipse cx="50" cy="74" rx="6" ry="5" fill="#7a1f2b" stroke={INK} strokeWidth="1.6" />
          <ellipse cx="50" cy="76.5" rx="3.4" ry="2" fill="#ff8a9a" />
        </g>
      )
    case 'tongue':
      return (
        <g>
          <path d="M42 71 Q50 78 58 71" {...line} />
          <path d="M50 74.2 q0 6 3.6 6 q3.6 0 3.2 -6.6" fill="#ff6f8a" stroke={INK} strokeWidth="1.4" />
        </g>
      )
    case 'smirk':
      return <path d="M43 73 Q51 76 57 70" {...line} />
    case 'o':
      return <ellipse cx="50" cy="74" rx="3.6" ry="4.2" fill="#7a1f2b" stroke={INK} strokeWidth="1.6" />
    case 'grin':
    default:
      return <path d="M41 71 Q50 80 59 71" {...line} />
  }
}

function Emblem({ kind, accent }: { kind: Look['emblem']; accent: string }) {
  const s = { stroke: INK, strokeWidth: 1.3, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'brain':
      return (
        <g transform="translate(50 30)">
          <path {...s} fill="#ff9fb2" d="M-8 2 C-11 1 -11 -5 -7 -6 C-7 -10 -1 -11 0 -8 C1 -11 7 -10 7 -6 C11 -5 11 1 8 2 C8 5 3 6 0 4 C-3 6 -8 5 -8 2 Z" />
          <path d="M0 -8 V4 M-5 -3 q2 1 3 -1 M4 -4 q-1 2 2 3" stroke={INK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'heart':
      return <path {...s} fill={INK} d="M50 38 C43 33 42 26 46.5 24.5 C48.5 24 50 25.5 50 27.5 C50 25.5 51.5 24 53.5 24.5 C58 26 57 33 50 38 Z" />
    case 'dollar':
      return (
        <g>
          <circle cx="50" cy="30" r="8" fill={accent} {...s} />
          <text x="50" y="34.4" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif" fill={INK}>
            $
          </text>
        </g>
      )
    case 'flower':
      return (
        <g transform="translate(50 30)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-5" rx="3.6" ry="5.2" fill="#fff0f5" {...s} transform={`rotate(${a})`} />
          ))}
          <circle r="3.2" fill={accent} {...s} />
        </g>
      )
    case 'martini':
      return (
        <g transform="translate(50 29)">
          <path {...s} fill="#bdf2ff" d="M-8 -7 H8 L0 2 Z" />
          <path d="M0 2 V8 M-4 8 H4" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-2" cy="-4" r="1.6" fill="#7bc043" stroke={INK} strokeWidth="0.8" />
        </g>
      )
    case 'horns':
      return <path {...s} fill={accent} d="M42 36 L39 22 L46 30 L50 20 L54 30 L61 22 L58 36 Z" />
    case 'thirty':
      return (
        <text x="50" y="33" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="'Bricolage Grotesque', Arial, sans-serif" fill={accent} stroke={INK} strokeWidth="0.9" paintOrder="stroke">
          30
        </text>
      )
    case 'question':
    default:
      return (
        <text x="50" y="37" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="Arial, sans-serif" fill={accent} stroke={INK} strokeWidth="1" paintOrder="stroke">
          ?
        </text>
      )
  }
}

export default function Luchador({ id, size = 40 }: { id: string; size?: number }) {
  const p = person(id)
  const look = LOOKS[id] ?? FALLBACK
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const simple = size < 36
  const has = (x: Look['extras'][number]) => look.extras.includes(x)
  const maskFill = has('gold') ? `url(#g${uid})` : p.color

  const behind: ReactNode[] = []
  const front: ReactNode[] = []

  if (has('bun')) behind.push(<circle key="bun" cx="50" cy="17" r="8.5" fill="#2b1b17" stroke={INK} strokeWidth="1.4" />)
  if (has('rockhorns'))
    behind.push(
      <g key="rh" fill="#f3f0ea" stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M24 34 C17 26 17 17 20 11 C22 19 26 24 31 27 Z" />
        <path d="M76 34 C83 26 83 17 80 11 C78 19 74 24 69 27 Z" />
      </g>,
    )
  if (!simple) {
    if (has('glasses'))
      front.push(
        <g key="gl" fill="none" stroke={INK} strokeWidth="2.2">
          <circle cx="38" cy="47" r="9.5" />
          <circle cx="62" cy="47" r="9.5" />
          <path d="M47.5 46 Q50 44 52.5 46 M28.5 45 L22 42 M71.5 45 L78 42" />
        </g>,
      )
    if (has('shades'))
      front.push(
        <g key="sh">
          <path d="M31 13 H48 Q48 21 40 21 Q31 21 31 13 Z M52 13 H69 Q69 21 61 21 Q52 21 52 13 Z" fill={INK} />
          <path d="M48 14 H52" stroke={INK} strokeWidth="2" />
          <path d="M34 15 l4 0" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>,
      )
    if (has('mustache'))
      front.push(
        <path
          key="mu"
          d="M50 66 C46 63 38 63 34 67 C36 70 40 70 43 68 C46 70 48 69 50 67.5 C52 69 54 70 57 68 C60 70 64 70 66 67 C62 63 54 63 50 66 Z"
          fill="#2b1b17"
          stroke={INK}
          strokeWidth="1"
        />,
      )
    if (has('blush'))
      front.push(
        <g key="bl" fill="#ff7aa2" opacity="0.55">
          <ellipse cx="31" cy="63" rx="4.5" ry="2.6" />
          <ellipse cx="69" cy="63" rx="4.5" ry="2.6" />
        </g>,
      )
    if (has('shine')) front.push(<path key="sn" d="M30 30 Q36 21 46 19" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />)
    if (has('chain'))
      front.push(
        <g key="ch">
          <path d="M31 86 Q50 99 69 86" fill="none" stroke="#f5c518" strokeWidth="3.4" strokeDasharray="3 1.5" />
          <circle cx="50" cy="93" r="4" fill="#f5c518" stroke={INK} strokeWidth="1" />
        </g>,
      )
    if (has('plane'))
      front.push(
        <g key="pl" transform="translate(80 18) rotate(-25)">
          <path d="M-8 0 L8 0 M0 0 L-4 -6 M0 0 L-4 6 M-7 0 L-9 -3 M-7 0 L-9 3" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M-22 1 q5 -3 10 0" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.9" />
        </g>,
      )
    if (has('cocktail'))
      front.push(
        <g key="ck" transform="translate(84 80) rotate(12)">
          <path d="M-7 -8 H7 L0 1 Z" fill="#ff9f1c" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M0 1 V8 M-4 8 H4" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 -8 L7 -14" stroke={INK} strokeWidth="1.2" />
          <circle cx="7.5" cy="-14.5" r="1.8" fill="#e71d36" />
        </g>,
      )
    if (has('clipboard'))
      front.push(
        <g key="cb" transform="translate(83 80) rotate(10)">
          <rect x="-7" y="-9" width="14" height="18" rx="2" fill="#fff" stroke={INK} strokeWidth="1.3" />
          <rect x="-3.5" y="-11" width="7" height="4" rx="1" fill="#9aa0a6" stroke={INK} strokeWidth="1" />
          <path d="M-4 -3 l1.5 1.5 l3 -3 M-4 3 l1.5 1.5 l3 -3" stroke="#2f7d4f" strokeWidth="1.3" fill="none" />
        </g>,
      )
    if (has('confetti'))
      front.push(
        <g key="cf">
          {[
            [14, 22, '#ffd23f'],
            [86, 30, '#ff3d97'],
            [12, 72, '#2cc3ba'],
            [88, 64, '#ffd23f'],
            [20, 90, '#ff3d97'],
            [82, 90, '#2cc3ba'],
          ].map(([x, y, c], i) => (
            <rect key={i} x={x as number} y={y as number} width="4" height="4" rx="1" fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
          ))}
        </g>,
      )
  }

  if (has('partyhat'))
    front.push(
      <g key="hat">
        <path d="M39 22 L50 0 L61 22 Z" fill="#ff3d97" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M42.5 15 L57.5 15 M46 8 L54 8" stroke="#ffd23f" strokeWidth="3" />
        <circle cx="50" cy="2" r="3.2" fill="#ffd23f" stroke={INK} strokeWidth="1.2" />
      </g>,
    )


  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${p.name}, ${p.nickname}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`bg${uid}`} cx="50%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fff8ee" />
          <stop offset="1" stopColor={p.color} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#e0a526" />
          <stop offset="1" stopColor="#b7791f" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg${uid})`} />
      {behind}
      {/* Cuello / hombros */}
      <path d="M26 100 Q28 86 50 86 Q72 86 74 100 Z" fill={look.skin} stroke={INK} strokeWidth="1.4" />
      {/* Cabeza con máscara */}
      <path d="M50 18 C69 18 82 32 82 52 C82 72 69 89 50 89 C31 89 18 72 18 52 C18 32 31 18 50 18 Z" fill={maskFill} stroke={INK} strokeWidth="1.8" />
      {/* Costura central clásica */}
      <path d="M50 19 V38" stroke={look.accent} strokeWidth={simple ? 3 : 2.4} strokeDasharray={simple ? undefined : '3 2'} />
      {/* Adornos de ojos */}
      <Trim kind={look.trim} color={look.accent} />
      <g transform="translate(100 0) scale(-1 1)">
        <Trim kind={look.trim} color={look.accent} />
      </g>
      <Emblem kind={look.emblem} accent={look.accent} />
      {/* Hueco de la boca (piel) */}
      <path d="M36 70 C36 63 42 61 50 61 C58 61 64 63 64 70 C64 79 57 84 50 84 C43 84 36 79 36 70 Z" fill={look.skin} stroke={INK} strokeWidth="1.4" />
      <Eye cx={38} gaze={look.gaze} lashes={!simple && has('lashes')} />
      <Eye cx={62} gaze={look.gaze} lashes={!simple && has('lashes')} />
      <MouthShape kind={look.mouth} />
      {front}
    </svg>
  )
}
