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
]

export const CORE = PEOPLE.filter((p) => !p.gdlOnly).map((p) => p.id)
export const ALL = PEOPLE.map((p) => p.id)

export const person = (id: string): Person =>
  PEOPLE.find((p) => p.id === id) ?? { id, name: id, emoji: '🙂', color: '#777', nickname: 'El Misterioso', tagline: '' }
