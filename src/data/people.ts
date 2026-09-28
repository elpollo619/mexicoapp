export type Person = {
  id: string
  name: string
  emoji: string
  color: string
  /** Nombre de luchador */
  nickname: string
  /** Frase graciosa */
  tagline: string
  /** Solo en Guadalajara (8–12 oct) */
  gdlOnly?: boolean
  /** Se incorpora en esta fecha (inclusive); antes no cuenta en repartos ni "¿llegaste bien?" */
  from?: string
}

export const PEOPLE: Person[] = [
  { id: 'cristian', name: 'Cristian', emoji: '🧠', color: '#e4572e', nickname: 'El Planeador', tagline: 'Hizo un PDF de 36 páginas… y una app. Nadie le pidió la app.' },
  { id: 'bia', name: 'Bia', emoji: '🖤', color: '#8e44ad', nickname: 'La Negra Letal', tagline: 'Te saca del grupo con una sola mirada. Pregúntenle a Pipo.' },
  { id: 'pipo', name: 'Pipo', emoji: '💪', color: '#1f8a70', nickname: 'El Contador del Narco', tagline: 'Compró el vuelo a 780… y pagó 856. Pero con estilo.' },
  { id: 'tania', name: 'Tania', emoji: '🌺', color: '#d81b60', nickname: 'La Flor Voladora', tagline: 'Aterriza desde Punta Cana… un día después. Paga igual.' },
  { id: 'jhoni', name: 'Jhoni', emoji: '🍸', color: '#f39c12', nickname: 'El Guía Turístico', tagline: 'Mejor que una agencia. Cobra en mezcal. Sede en Gstaad.' },
  { id: 'nicolas', name: 'Nicolas', emoji: '🤟', color: '#2980b9', nickname: 'El Portugués Salvaje', tagline: 'Llega bien depilado y se equivoca de chat. Saludos desde Porto.' },
  { id: 'pablo', name: 'Pablo', emoji: '🎂', color: '#c0392b', nickname: 'El Cumpleañero de Oro', tagline: 'Treinta años invicto. Bring your booze.', gdlOnly: true },
  { id: 'invitado', name: 'Invitad@ de Pablo', emoji: '🎉', color: '#16a085', nickname: 'La Sorpresa Enmascarada', tagline: 'Nadie sabe quién es. Nadie pregunta. Salud.', gdlOnly: true },
  { id: 'gracia', name: 'Gracia', emoji: '🇧🇷', color: '#009c3b', nickname: 'Gracinha Sin Freno', tagline: 'Parabéns para ella, cuenta para todos. Llega el 6 y ya no hay quien la pare.', from: '2026-10-06' },
]

/** Los que hacen el viaje entero (3–19 oct): base de promedios, vaquita y "Los 6" */
export const CORE = PEOPLE.filter((p) => !p.gdlOnly && !p.from).map((p) => p.id)
export const ALL = PEOPLE.map((p) => p.id)

export const TRIP_FROM = '2026-10-03'
export const TRIP_TO = '2026-10-19'

/** Días en que cada persona está en el viaje (inclusive) */
export function tripWindow(p: Person): { from: string; to: string } {
  if (p.gdlOnly) return { from: '2026-10-08', to: '2026-10-11' }
  return { from: p.from ?? TRIP_FROM, to: TRIP_TO }
}

/**
 * Quiénes están en el viaje ese día (YYYY-MM-DD): para repartos por defecto, votaciones y "¿llegaste bien?".
 * Fuera del viaje (vuelos comprados antes, cuentas después) vale el grupo base.
 */
export const presentOn = (date: string) => {
  if (date < TRIP_FROM || date > TRIP_TO) return CORE
  return PEOPLE.filter((p) => {
    const w = tripWindow(p)
    return date >= w.from && date <= w.to
  }).map((p) => p.id)
}

/** Quiénes están en cada parada (la primera estancia en CDMX es solo el grupo base) */
export const presentIn = (city?: string) =>
  city === 'gdl' ? presentOn('2026-10-08') : city === 'pvr' ? presentOn('2026-10-06') : city === 'baja' ? presentOn('2026-10-12') : CORE

/** Etiqueta bajo el nombre en "¿Quién eres?" para quien no hace todo el viaje */
export const joinLabel = (p: Person) => (p.gdlOnly ? 'Guadalajara · nuevo' : p.from ? `Desde el ${Number(p.from.slice(8))} oct · nuevo` : 'Nuevo')

export const person = (id: string): Person =>
  PEOPLE.find((p) => p.id === id) ?? { id, name: id, emoji: '🙂', color: '#777', nickname: 'El Misterioso', tagline: '' }
