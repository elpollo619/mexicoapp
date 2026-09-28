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
  { id: 'cristian', name: 'Cristian', emoji: '🧠', color: '#e4572e', nickname: 'El Arquitecto del Caos', tagline: 'Hizo un PDF de 36 páginas, una app y un Excel. Nadie le pidió nada.' },
  { id: 'bia', name: 'Bia', emoji: '🖤', color: '#8e44ad', nickname: 'La Jefa Sin Piedad', tagline: 'Te saca del grupo con una sola mirada. Pregúntenle a Pipo.' },
  { id: 'pipo', name: 'Pipo', emoji: '💪', color: '#1f8a70', nickname: 'El Tesorero Fantasma', tagline: 'Compró el vuelo a 780 y pagó 856. Luego pidió el IBAN a todos.' },
  { id: 'tania', name: 'Tania', emoji: '🌺', color: '#d81b60', nickname: 'La Voladora de Punta Cana', tagline: 'Aterriza un día después que todos. Paga igual, brilla más.' },
  { id: 'jhoni', name: 'Jhoni', emoji: '🍸', color: '#f39c12', nickname: 'El Guía Enmascarado', tagline: 'Mejor que una agencia. Cobra en mezcal. Sede en Gstaad.' },
  { id: 'nicolas', name: 'Nicolas', emoji: '🤟', color: '#2980b9', nickname: 'El Rayo de Porto', tagline: 'Se equivoca de chat, acierta de fiesta. Llega bien depilado.' },
  { id: 'pablo', name: 'Pablo', emoji: '🎂', color: '#c0392b', nickname: 'El Rey de los Treinta', tagline: 'Treinta años invicto. Bring your booze.', gdlOnly: true },
  { id: 'invitado', name: 'Invitad@ de Pablo', emoji: '🎉', color: '#16a085', nickname: 'La Sorpresa Enmascarada', tagline: 'Nadie sabe quién es. Nadie pregunta. Salud.', gdlOnly: true },
  { id: 'gracia', name: 'Gracia', emoji: '🇭🇳', color: '#0073cf', nickname: 'Gracinha Sin Freno', tagline: 'Catracha de Berna. Llega el 6 a Vallarta y ya no hay quien la pare.', from: '2026-10-06' },
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
