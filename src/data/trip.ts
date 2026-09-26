import { hourIn, todayIn, addDays } from '../lib/time'

export const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export type CityId = 'zrh' | 'cdmx' | 'pvr' | 'gdl' | 'baja' | 'home'

export type City = {
  id: CityId
  name: string
  short: string
  emoji: string
  lat: number
  lon: number
  tz: string
  color: string
}

export const CITIES: Record<CityId, City> = {
  zrh: { id: 'zrh', name: 'Zúrich', short: 'ZRH', emoji: '🇨🇭', lat: 47.45, lon: 8.56, tz: 'Europe/Zurich', color: '#6b7280' },
  cdmx: { id: 'cdmx', name: 'Ciudad de México', short: 'CDMX', emoji: '🌮', lat: 19.4126, lon: -99.1716, tz: 'America/Mexico_City', color: '#e4572e' },
  pvr: { id: 'pvr', name: 'Puerto Vallarta', short: 'Vallarta', emoji: '🏝️', lat: 20.6034, lon: -105.2374, tz: 'America/Mexico_City', color: '#0ea5a4' },
  gdl: { id: 'gdl', name: 'Guadalajara', short: 'GDL', emoji: '🎂', lat: 20.6736, lon: -103.3688, tz: 'America/Mexico_City', color: '#d81b60' },
  baja: { id: 'baja', name: 'La Paz y Los Cabos', short: 'Baja', emoji: '🦭', lat: 24.1426, lon: -110.3128, tz: 'America/Mazatlan', color: '#2563eb' },
  home: { id: 'home', name: 'De vuelta a casa', short: 'Casa', emoji: '🏠', lat: 47.45, lon: 8.56, tz: 'Europe/Zurich', color: '#6b7280' },
}

/** Paradas en orden (para mapa y resumen) */
export const STOPS: { city: CityId; from: string; to: string; nights: number; people: number }[] = [
  { city: 'cdmx', from: '2026-10-03', to: '2026-10-06', nights: 3, people: 6 },
  { city: 'pvr', from: '2026-10-06', to: '2026-10-08', nights: 2, people: 6 },
  { city: 'gdl', from: '2026-10-08', to: '2026-10-12', nights: 4, people: 8 },
  { city: 'baja', from: '2026-10-12', to: '2026-10-17', nights: 5, people: 6 },
  { city: 'cdmx', from: '2026-10-17', to: '2026-10-18', nights: 1, people: 6 },
]

/** Lugar concreto (coordenadas y zona) para clima, huracanes y hora local */
export type Spot = Pick<City, 'name' | 'short' | 'lat' | 'lon' | 'tz'>

/** Sub-paradas dentro de una ciudad: Baja tiene La Paz (12–15) y San José del Cabo (15–17, ~150 km más al sur) */
export type SpotId = 'baja2'
export const SPOTS: Record<SpotId, Spot> = {
  baja2: { name: 'San José del Cabo', short: 'Los Cabos', lat: 23.0631, lon: -109.7028, tz: 'America/Mazatlan' },
}

/** Dónde estamos ese día: la sub-parada si la hay, si no la ciudad */
export const spotOf = (day: Day): Spot => (day.spot ? SPOTS[day.spot] : CITIES[day.city])

/** Zona horaria de referencia del viaje (CDMX, Vallarta y Guadalajara; Baja va 1 h menos) */
export const TRIP_TZ = 'America/Mexico_City'

/** Zona horaria en la que vivimos ese día (los días de ida y vuelta cuentan como CDMX) */
export const tzOfDay = (day: Day) => (day.city === 'zrh' || day.city === 'home' ? TRIP_TZ : spotOf(day).tz)

/** Hora (0–23) a partir de la cual "vivimos" en la zona del día: el primer vuelo con hora, si no el mediodía */
const switchHour = (day?: Day) => {
  const t = day?.items.find((it) => it.type === 'fly' && /^\d{2}:\d{2}/.test(it.time ?? ''))?.time
  return t ? Number(t.slice(0, 2)) : 12
}

/**
 * Zona horaria donde está el grupo ahora. Los cambios de zona (GDL → La Paz el 12, Los Cabos → CDMX el 17)
 * pasan de día, así que hasta la hora del vuelo (o el mediodía) seguimos en la zona de ayer y después en la de hoy.
 */
export function tripTz(now: number) {
  const t = todayIn(TRIP_TZ, now)
  const today = DAYS.find((d) => d.date === t)
  const day = hourIn(now, TRIP_TZ) < switchHour(today) ? DAYS.find((d) => d.date === addDays(t, -1)) : today
  return day ? tzOfDay(day) : TRIP_TZ
}

/** Fecha YYYY-MM-DD de "hoy" en la zona horaria donde está el grupo (única fuente para Inicio, itinerario y noche) */
export const todayOnTrip = (now: number) => todayIn(tripTz(now), now)

export type Link = { label: string; url: string }

export type Activity = {
  id: string
  time?: string
  title: string
  desc?: string
  price?: string
  links?: Link[]
  maps?: string
  type?: 'fly' | 'food' | 'plan' | 'move' | 'party' | 'stay' | 'free'
  warn?: string
  /** Aparece "Me apunto" */
  signup?: boolean
}

export type Day = {
  date: string
  city: CityId
  /** Sub-parada (coordenadas/zona distintas a las de la ciudad) */
  spot?: SpotId
  title: string
  items: Activity[]
}

const viator = (label = 'Viator', url: string): Link => ({ label, url })

export const DAYS: Day[] = [
  {
    date: '2026-10-02',
    city: 'zrh',
    title: 'Despegue 🛫',
    items: [
      { id: 'd02-fly', time: '15:35', type: 'fly', title: 'ZRH → CDMX (Swiss + Aeroméxico)', desc: 'Pipo, Jhoni y Nicolas. Llegada sábado 03:15.' },
    ],
  },
  {
    date: '2026-10-03',
    city: 'cdmx',
    title: 'Llegada, Condesa y lucha libre',
    items: [
      { id: 'd03-arr', time: '03:15', type: 'fly', title: 'Aterrizaje en el AICM', desc: 'Al Airbnb (Condesa) ~30–45 min: 2 Uber o un UberXL (MX$290–320 c/u). Caja de llaves: pedir entrar temprano o dejar maletas.' },
      { id: 'd03-condesa', time: 'Tarde', type: 'free', title: 'Condesa caminando', desc: 'Parque México y Av. Ámsterdam.', maps: maps('Parque México, Condesa, Ciudad de México') },
      { id: 'd03-mezcal', time: '13–20 h', type: 'plan', title: 'Mezcalfest (Club de Leones, Roma Sur)', price: '~4–5 CHF', desc: 'Entrada con copa de cata. También el domingo.', maps: maps('Club de Leones, Roma Sur, Ciudad de México'), signup: true },
      { id: 'd03-lucha', time: '19:30', type: 'plan', title: 'Lucha libre en la Arena Coliseo', price: 'MX$80–700 (~4–33 CHF)', desc: 'Gradas MX$80–150, ringside MX$400–700. Paquete con tacos, chela y guía: 81 CHF.', links: [viator('Paquete Viator', 'https://www.viator.com/es-ES/tours/Mexico-City/Tacos-Beer-Lucha-BEST-NIGHT-EVER/d628-86240P2'), { label: 'Cartelera CMLL', url: 'https://cmll.com/cartelera/' }], maps: maps('Arena Coliseo, Centro, Ciudad de México'), signup: true },
      { id: 'd03-cocuyos', time: 'Después', type: 'food', title: 'Tacos en Los Cocuyos (24 h)', price: '~5–10 CHF', desc: 'Suadero, cabeza o campechano. Bib Gourmand.', maps: maps('Taquería Los Cocuyos, Centro, Ciudad de México') },
    ],
  },
  {
    date: '2026-10-04',
    city: 'cdmx',
    title: 'Museos (el lunes cierran)',
    items: [
      { id: 'd04-tania', time: '09:21', type: 'fly', title: 'Tania aterriza en el AIFA', desc: 'Desde Punta Cana (Arajet DM7104). AIFA → Condesa ~1 h.' },
      { id: 'd04-bici', time: '8–14 h', type: 'free', title: '"Muévete en Bici": Reforma sin autos', desc: 'Bicis gratis de 9 a 13 h.' },
      { id: 'd04-antro', time: 'Mañana', type: 'plan', title: 'Museo de Antropología + Castillo de Chapultepec', price: 'MX$210 c/u (~10 CHF)', desc: 'Llegar temprano: domingo gratis para residentes, hay más gente.', maps: maps('Museo Nacional de Antropología, Ciudad de México'), signup: true },
      { id: 'd04-frida', time: 'o', type: 'plan', title: 'Casa Azul (Frida Kahlo), Coyoacán', price: 'MX$320 (~15 CHF)', desc: 'Solo online y quedan pocas. Incluye Anahuacalli.', links: [{ label: 'Entradas oficiales', url: 'https://boletos.museofridakahlo.org.mx/en/tickets/museo-frida-kahlo-cdmx' }, { label: 'Civitatis', url: 'https://www.civitatis.com/es/ciudad-de-mexico/entrada-museos-frida-kahlo-diego-rivera' }], maps: maps('Museo Frida Kahlo, Coyoacán'), signup: true },
      { id: 'd04-xochi', time: 'Tarde', type: 'plan', title: 'Xochimilco en trajinera (opcional)', price: '~12 CHF por libre · 41 CHF fiesta', desc: 'MX$750/h por lancha. Versión fiesta +18 con barra libre.', links: [viator('Fiesta Viator', 'https://www.viator.com/es-ES/tours/Mexico-City/Coyoacan-Frida-Kahlo-and-Xochimilco-Private-Tour/d628-193670P2')], maps: maps('Embarcadero Nuevo Nativitas, Xochimilco'), signup: true },
    ],
  },
  {
    date: '2026-10-05',
    city: 'cdmx',
    title: 'Pirámides de Teotihuacán',
    items: [
      { id: 'd05-teo', time: '07:00', type: 'plan', title: 'Teotihuacán en tour', price: 'desde 41 CHF', desc: '~5,5 h con transporte, entrada y guía. Cancelación gratis 24 h.', links: [viator('Viator', 'https://www.viator.com/es-ES/tours/Mexico-City/Pyramids-of-Teotihuacan/d628-193670P1')], maps: maps('Zona Arqueológica de Teotihuacán'), signup: true },
      { id: 'd05-globo', time: '05:00', type: 'plan', title: 'o globo al amanecer', price: 'desde 123 CHF', desc: 'Con desayuno en una cueva y visita a las pirámides.', links: [viator('Viator', 'https://www.viator.com/es-ES/tours/Mexico-City/Hot-Air-Balloon-Flight-in-Teotihuacan-with-Breakfast-Included/d628-357659P1'), { label: 'Civitatis', url: 'https://www.civitatis.com/es/ciudad-de-mexico/paseo-globo-teotihuacan' }], signup: true },
      { id: 'd05-dinner', time: 'Noche', type: 'food', title: 'Cena en Roma / Condesa', desc: 'Tacos del Valle, Caracol de Mar o Contramar (solo comidas). Ver "Dónde comer".' },
    ],
  },
  {
    date: '2026-10-06',
    city: 'pvr',
    title: 'A Vallarta 🌴',
    items: [
      { id: 'd06-out', time: '11:00', type: 'stay', title: 'Salida del Airbnb', desc: 'Dejar maletas listas. Almuerzo cerca.' },
      { id: 'd06-go', time: '13:00', type: 'move', title: 'Salir de la Condesa al AICM', desc: '30–60 min con tráfico y estar 2 h antes (llevamos maleta).' },
      { id: 'd06-fly', time: '16:05', type: 'fly', title: 'CDMX → Puerto Vallarta (Volaris Y4 4282)', desc: 'Aterriza 17:35. Del aeropuerto a la Zona Romántica ~30 min.' },
      { id: 'd06-pancho', time: 'Noche', type: 'food', title: "Tacos al pastor en Pancho's Takos", price: '~7–10 CHF', desc: 'Lun–sáb 16–23:30, solo efectivo, hay fila.', maps: maps("Pancho's Takos, Puerto Vallarta") },
      { id: 'd06-malecon', time: 'Noche', type: 'free', title: 'Malecón y playa Los Muertos', desc: 'Muelle iluminado, Los Muertos Brewing (happy hour 16–18 h).', maps: maps('Malecón de Puerto Vallarta') },
    ],
  },
  {
    date: '2026-10-07',
    city: 'pvr',
    title: 'Islas, playa y atardecer',
    items: [
      { id: 'd07-marietas', time: '09:00', type: 'plan', title: 'Islas Marietas + Playa Escondida', price: '78 CHF + MX$600 en efectivo', desc: 'Desde Marina Vallarta, 4–5 h. Cupo de 116 personas al día: reservar ya. Playa Escondida cierra lun y mar.', links: [viator('Viator', 'https://www.viator.com/es-ES/tours/Puerto-Vallarta/Marietas-Islands-snorkel-and-hidden-beach-optional/d630-118966P4')], maps: maps('Marina Vallarta, Puerto Vallarta'), signup: true },
      { id: 'd07-conchas', time: 'Tarde', type: 'free', title: 'Snorkel gratis en Conchas Chinas', maps: maps('Playa Conchas Chinas, Puerto Vallarta') },
      { id: 'd07-bio', time: '17:00', type: 'plan', title: 'Atardecer + bioluminiscencia en Los Arcos', price: '~54–55 CHF', desc: 'Movido del martes: el vuelo aterriza 17:35. 3 h en lancha; con lluvia no se ve el plancton.', links: [{ label: 'Civitatis', url: 'https://www.civitatis.com/es/puerto-vallarta/paseo-lancha-bioluminiscencia-arcos-mismaloya' }, viator('Viator', 'https://www.viator.com/tours/Puerto-Vallarta/Sunset-and-Bioluminescence-Boat-Tour-at-Los-Arcos-Islands/d630-5529498P8')], signup: true },
      { id: 'd07-velero', time: '17:00', type: 'plan', title: 'o velero al atardecer (+16)', price: '83 CHF + tasas', desc: '3 h con barra libre, vinos y quesos.', links: [viator('Viator', 'https://www.viator.com/es-ES/tours/Puerto-Vallarta/Sunset-Sailing-on-Banderas-Bay/d630-2736SAIL_SUN')], signup: true },
      { id: 'd07-planb', type: 'plan', title: 'Plan B si llueve: tirolesas Los Veranos', price: '49–101 CHF', links: [viator('Original Canopy', 'https://www.viator.com/es-ES/tours/Puerto-Vallarta/Ziplining-in-Puerto-Vallarta-Original-Canopy-Tour/d630-7053ZIP'), viator('La barata', 'https://www.viator.com/es-ES/tours/Puerto-Vallarta/Canopy-Zip-Line-Puerto-Vallarta-Lowest-Price-Best-Adventure-9-Zip-Lines/d630-267243P1')] },
    ],
  },
  {
    date: '2026-10-08',
    city: 'gdl',
    title: 'A Guadalajara por Tequila + cena de cumple',
    items: [
      { id: 'd08-van', time: '08:30', type: 'move', title: 'Minivan Vallarta → Guadalajara (~4 h)', price: '~66 CHF/pers (estimación)', desc: 'Autopista 15D, peajes MX$1.440–1.630 en efectivo. Si nadie maneja: van con chofer ~67 CHF o bus ETN ~37 CHF.', links: [{ label: 'Kayak vans', url: 'https://www.kayak.com/Puerto-Vallarta-Van-Rentals.14318.cva.ksp' }, { label: 'Daytrip (chofer)', url: 'https://daytrip.com/transfers/puerto-vallarta-mx/guadalajara-mx-mx' }, { label: 'ETN', url: 'https://etn.com.mx/ejecutivos/puerto-vallarta-a-guadalajara.php' }] },
      { id: 'd08-tequila', time: '12:00', type: 'plan', title: 'Parada en Tequila: La Rojeña (José Cuervo)', price: 'MX$345–585 (~16–28 CHF)', desc: '12:00–14:30. El que maneja no cata 😇', maps: maps('La Rojeña, Tequila, Jalisco'), signup: true },
      { id: 'd08-check', time: '16:00', type: 'stay', title: 'Check-in en Guadalajara', desc: 'Devolver la van al llegar.' },
      { id: 'd08-cena', time: 'Noche', type: 'party', title: '🎂 Cena de cumple de Pablo (mesa para 8)', desc: 'Alcalde (1 Michelin, ~143 CHF), La Tequila (~15–24 CHF) o Hueso (~57 CHF). ¡Votar!', links: [{ label: 'Alcalde', url: 'https://www.opentable.com/r/alcalde-guadalajara' }, { label: 'La Tequila', url: 'https://www.opentable.com/r/la-tequila-avenida-mexico-guadalajara' }, { label: 'Hueso', url: 'https://www.opentable.com/r/hueso-guadalajara' }], signup: true },
    ],
  },
  {
    date: '2026-10-09',
    city: 'gdl',
    title: 'Pablito turns thirty 🎉',
    items: [
      { id: 'd09-centro', time: '10:00', type: 'plan', title: 'Centro + Hospicio Cabañas (murales de Orozco)', price: 'MX$160 (~8 CHF)', maps: maps('Hospicio Cabañas, Guadalajara'), signup: true },
      { id: 'd09-tortas', time: '13:00', type: 'food', title: 'Tortas ahogadas en "El Viejo"', price: '~5–10 CHF', desc: 'Pedir de cachete.', maps: maps('Tortas Ahogadas Enrique El Viejo, Guadalajara') },
      { id: 'd09-party', time: '17:00', type: 'party', title: '🎈 Fiesta: Terraza Jardín El Palomar', desc: 'Av. Adolfo López Mateos Sur 567. *Bring your booze* 🍾 Mariachi: ~MX$3.000–4.000 la hora entre los 8 (acordar precio antes).', maps: maps('Terraza Jardín El Palomar, Av. Adolfo López Mateos Sur 567, Guadalajara'), signup: true },
    ],
  },
  {
    date: '2026-10-10',
    city: 'gdl',
    title: 'Tlaquepaque y fiesta',
    items: [
      { id: 'd10-tlaque', time: 'Mediodía', type: 'plan', title: 'Tlaquepaque y El Parián', desc: 'Artesanía y mariachi. ~20–25 min en Uber.', maps: maps('El Parián, Tlaquepaque'), signup: true },
      { id: 'd10-patio', time: '15:00', type: 'food', title: 'Comer en El Patio (mariachi 15–16 h)', price: '~15–24 CHF', desc: 'Reservar para 8.', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/el-patio-tlaquepaque' }], maps: maps('Restaurante El Patio, Tlaquepaque') },
      { id: 'd10-clasico', time: '19:00', type: 'plan', title: 'Clásico Atlas – Chivas (si hay entradas)', price: '~25–163 CHF', desc: 'Estadio Jalisco. Fan ID obligatorio (fanliga.mx, vale el pasaporte).', links: [{ label: 'Fanki', url: 'https://fanki.co/mex/publications/ats-202627-partido-6' }], maps: maps('Estadio Jalisco, Guadalajara'), signup: true },
      { id: 'd10-chapu', time: 'Noche', type: 'party', title: 'Fiesta en Av. Chapultepec', desc: 'Terrazas y bares, Col. Americana.', maps: maps('Avenida Chapultepec, Colonia Americana, Guadalajara') },
    ],
  },
  {
    date: '2026-10-11',
    city: 'gdl',
    title: 'Día de tequila 🥃',
    items: [
      { id: 'd11-tour', time: '08:30', type: 'plan', title: 'Tour Tequila + Amatitán', price: '38 CHF (MX$790)', desc: '9,5 h: destilería artesanal, campos de agave, Cantaritos El Güero, +9 catas. Sale de La Minerva.', links: [viator('Viator', 'https://www.viator.com/es-ES/tours/Guadalajara/Full-Day-Guided-Tour-in-Amatitan-and-Tequila-with-Tasting/d5299-327370P1'), viator('Con fiesta en Cantaritos', 'https://www.viator.com/es-ES/tours/Guadalajara/Full-Day-Tequila-Tour-with-Tasting-in-Cantaritos/d5299-415326P2')], maps: maps('Glorieta La Minerva, Guadalajara'), signup: true },
      { id: 'd11-chill', type: 'free', title: 'o día tranqui: Centro, birria y siesta', desc: 'Birriería Las 9 Esquinas (Michelin) o Karne Garibaldi.', maps: maps('Birriería las 9 Esquinas, Guadalajara') },
      { id: 'd11-romeria', time: 'Noche', type: 'move', title: '⚠️ Empiezan cierres por la Romería de Zapopan', desc: 'Dejar maletas listas para el vuelo del lunes.' },
    ],
  },
  {
    date: '2026-10-12',
    city: 'baja',
    title: 'Vuelo a La Paz 🦭',
    items: [
      { id: 'd12-out', time: '10:30', type: 'move', title: 'Salir al aeropuerto de GDL (Romería: ¡con tiempo!)', desc: '~30–40 min normalmente; hoy puede ser el doble. Estar 2 h antes.' },
      { id: 'd12-fly', time: '13:53', type: 'fly', title: 'GDL → La Paz (Viva VB3222)', desc: 'Aterriza 14:32 hora de La Paz (1 h menos).' },
      { id: 'd12-car', time: '15:00', type: 'move', title: 'Recoger minivan en el aeropuerto', price: '~CHF 225 por 4 días (Hertz, 7 plazas)', desc: 'Dodge Grand Caravan o similar. Licencia + tarjeta de crédito del conductor.' },
      { id: 'd12-malecon', time: 'Atardecer', type: 'free', title: 'Malecón de La Paz al atardecer', maps: maps('Malecón de La Paz, Baja California Sur') },
    ],
  },
  {
    date: '2026-10-13',
    city: 'baja',
    title: 'Isla Espíritu Santo 🦭',
    items: [
      { id: 'd13-espiritu', time: '08:00', type: 'plan', title: 'Isla Espíritu Santo + snorkel con lobos marinos', price: '~95–120 CHF', desc: 'Día entero en lancha: Ensenada Grande, Los Islotes (lobos marinos, temporada sep–may) y comida en la playa. Se cancela con viento fuerte: dejar un día de margen.', links: [{ label: 'GetYourGuide', url: 'https://www.getyourguide.com/la-paz-mexico-l2930/sea-lion-tours-tc2167/' }], maps: maps('Isla Espíritu Santo, La Paz'), signup: true },
      { id: 'd13-rancho', time: '19:30', type: 'food', title: 'Tacos en Asadero Rancho Viejo', price: '~10–15 CHF', desc: 'Carne al mezquite, muy local.', maps: maps('Asadero Rancho Viejo, La Paz') },
    ],
  },
  {
    date: '2026-10-14',
    city: 'baja',
    title: 'Playa Balandra 🏖️',
    items: [
      { id: 'd14-balandra', time: '08:00', type: 'plan', title: 'Balandra, turno 08:00–12:00', price: 'MX$60–120 (~3–6 CHF)', desc: 'Cupo de 450 por turno: comprar el brazalete digital antes en CONANP. Sin alcohol ni bocinas. Subir al mirador y ver la Roca del Hongo. Casi sin señal.', links: [{ label: 'Brazalete CONANP', url: 'https://descubreanp.conanp.gob.mx/es/conanp/ANP?suri=9' }], maps: maps('Playa Balandra, La Paz'), signup: true },
      { id: 'd14-tecolote', time: '12:30', type: 'food', title: 'Mariscos en Playa El Tecolote', price: '~15–25 CHF', desc: 'Palapas a 10 min de Balandra.', maps: maps('Playa El Tecolote, La Paz') },
      { id: 'd14-shark', time: 'Opcional', type: 'plan', title: 'Tiburón ballena (si ya abrió la temporada)', price: '~105–165 CHF', desc: 'Suele empezar a finales de octubre: incierto. Alternativa: kayak en el manglar o atardecer en El Mogote.', links: [{ label: 'Explora Baja', url: 'https://explorabaja.com/tour/sea-lion-and-whale-shark-tour-la-paz/' }], signup: true },
      { id: 'd14-bismark', time: '19:30', type: 'food', title: 'Cena en Bismarkcito (Malecón)', price: '~20–30 CHF', desc: 'Mariscos desde 1968, tacos de marlín ahumado.', maps: maps('Bismarkcito, La Paz') },
    ],
  },
  {
    date: '2026-10-15',
    city: 'baja',
    spot: 'baja2',
    title: 'Todos Santos → San José del Cabo',
    items: [
      { id: 'd15-drive', time: '09:00', type: 'move', title: 'Manejar a Todos Santos (~1 h)', desc: 'Check-out en La Paz, gasolina antes de salir. Solo de día: ganado y topes.' },
      { id: 'd15-ts', time: '10:15', type: 'free', title: 'Pueblo Mágico de Todos Santos', desc: 'Misión, galerías, Hotel California. Opcional: Playa Los Cerritos (surf, nadar con cuidado).', maps: maps('Hotel California, Todos Santos') },
      { id: 'd15-jaza', time: '13:00', type: 'food', title: 'Comer en Jazamango o Huerta Los Tamarindos', price: '~35–60 CHF', desc: 'Cocina de huerto; reservar.', maps: maps('Jazamango, Todos Santos'), signup: true },
      { id: 'd15-sjc', time: '15:00', type: 'move', title: 'A San José del Cabo (~1 h 30)', desc: 'Llegar antes del anochecer.' },
      { id: 'd15-art', time: '18:30', type: 'free', title: 'Centro de San José: Plaza Mijares y Distrito del Arte', desc: 'El Art Walk oficial es de nov a jun, pero hay galerías y bares abiertos.', maps: maps('Plaza Mijares, San José del Cabo') },
    ],
  },
  {
    date: '2026-10-16',
    city: 'baja',
    spot: 'baja2',
    title: 'Cabo San Lucas: El Arco 🌵',
    items: [
      { id: 'd16-drive', time: '09:00', type: 'move', title: 'A Cabo San Lucas (~40 min)', desc: 'Estacionar en la marina.' },
      { id: 'd16-arco', time: '10:00', type: 'plan', title: 'Lancha a El Arco, Playa del Amor y lobos marinos', price: '~20–30 CHF', desc: 'Fondo de cristal o taxi acuático desde la marina / El Médano. Playa del Divorcio: NO nadar.', links: [{ label: 'GetYourGuide', url: 'https://www.getyourguide.com/cabo-san-lucas-l1037/' }], maps: maps('El Arco, Cabo San Lucas'), signup: true },
      { id: 'd16-medano', time: '12:00', type: 'free', title: 'Playa El Médano', desc: 'Apta para nadar, clubes de playa.', maps: maps('Playa El Médano, Cabo San Lucas') },
      { id: 'd16-flora', time: '18:00', type: 'food', title: 'Cena en Flora Farms (opcional)', price: '~50–80 CHF', desc: 'Reservar con semanas de antelación.', links: [{ label: 'Web', url: 'https://www.flora-farms.com/' }], maps: maps('Flora Farms, San José del Cabo'), signup: true },
    ],
  },
  {
    date: '2026-10-17',
    city: 'cdmx',
    title: 'Última noche en CDMX',
    items: [
      { id: 'd17-fly', time: 'Mañana', type: 'fly', title: 'Vuelo Los Cabos (SJD) → CDMX', warn: 'Falta comprar este vuelo. La van se recoge en La Paz: pedir devolución en SJD (one-way ~USD 100–250) o devolverla el 16.', desc: 'Llegar a SJD 2 h antes. CDMX va 1 h más que Baja.' },
      { id: 'd17-condesa', time: '15:00', type: 'free', title: 'Parque México, Av. Ámsterdam y Roma Norte', desc: 'Plaza Río de Janeiro, calle Colima, Mercado Roma.', maps: maps('Plaza Río de Janeiro, Roma Norte') },
      { id: 'd17-drinks', time: '18:30', type: 'party', title: 'Cocteles de despedida', desc: 'Licorería Limantour o una mezcalería.', maps: maps('Licorería Limantour, Roma Norte'), signup: true },
      { id: 'd17-dinner', time: '20:00', type: 'food', title: 'Cena de despedida', desc: 'Rosetta o Lardo (reservar), o tacos El Califa.', maps: maps('Rosetta, Colima 166, Roma Norte'), signup: true },
    ],
  },
  {
    date: '2026-10-18',
    city: 'home',
    title: 'Adiós México 🥲',
    items: [
      { id: 'd18-go', time: '07:00', type: 'move', title: 'Al AICM (estar 3 h antes, vuelo internacional)' },
      { id: 'd18-fly', time: '10:10', type: 'fly', title: 'CDMX → Madrid → Zúrich (AM27 · AM6946)', desc: 'Llegada lunes 19 a las 10:05.' },
    ],
  },
]

export type Place = { name: string; area: string; price: string; desc: string; tag: 'barato' | 'medio' | 'especial'; links?: Link[]; maps: string }

export const FOOD: Record<Exclude<CityId, 'zrh' | 'home'>, Place[]> = {
  cdmx: [
    { name: 'Los Cocuyos', area: 'Centro · Bib Gourmand', price: '~5–10 CHF', desc: 'Suadero, cabeza o campechano. 24 h.', tag: 'barato', maps: maps('Taquería Los Cocuyos, Ciudad de México') },
    { name: 'El Vilsito', area: 'Narvarte · Bib Gourmand', price: '~5–10 CHF', desc: 'Taller mecánico de día, taquería de noche. Pastor y gringas.', tag: 'barato', maps: maps('El Vilsito, Narvarte, Ciudad de México') },
    { name: 'Tacos del Valle', area: 'Roma Norte · Bib Gourmand', price: '~4–11 CHF', desc: 'Trompo, árabes y tijuanitas. Hasta la madrugada.', tag: 'barato', maps: maps('Tacos del Valle, Roma Norte') },
    { name: 'Contramar', area: 'Roma Norte · Bib Gourmand', price: '~48 CHF', desc: 'Tostadas de atún y pescado a la talla. Solo comidas (hasta 20 h).', tag: 'medio', maps: maps('Contramar, Roma Norte') },
    { name: 'Caracol de Mar', area: 'Condesa · Bib Gourmand', price: '~24+ CHF', desc: 'Pulpo al carbón y mariscos.', tag: 'medio', links: [{ label: 'OpenTable', url: 'https://www.opentable.com.mx/r/caracol-de-mar-ciudad-de-mexico' }], maps: maps('Caracol de Mar, Condesa') },
    { name: 'Azul Histórico', area: 'Centro · patio colonial', price: '~29–43 CHF', desc: 'Mole negro y sopa de tortilla.', tag: 'medio', maps: maps('Azul Histórico, Ciudad de México') },
    { name: 'Máximo', area: 'Roma Norte · 1 Michelin', price: 'menú ~181 CHF', desc: 'Menú degustación. Cierra domingo.', tag: 'especial', maps: maps('Máximo Bistrot, Roma Norte') },
    { name: 'Rosetta', area: 'Roma Norte · 1 Michelin', price: 'platos ~20–25 CHF', desc: 'Elena Reygadas. Para 6 llamar al +52 55 5533 7804.', tag: 'especial', maps: maps('Rosetta, Roma Norte') },
    { name: 'Expendio de Maíz', area: 'Roma Norte · 1 Michelin', price: '~24 CHF', desc: 'Sin carta, sin reservas, solo efectivo. Cierra lunes.', tag: 'especial', maps: maps('Expendio de Maíz, Roma Norte') },
  ],
  pvr: [
    { name: "Pancho's Takos", area: 'Zona Romántica · Michelin', price: '~7–10 CHF', desc: 'Al pastor. Efectivo, hay fila.', tag: 'barato', maps: maps("Pancho's Takos, Puerto Vallarta") },
    { name: 'Marisma Fish Taco', area: 'Zona Romántica', price: '~7–10 CHF', desc: 'Pescado y camarón capeado, marlín.', tag: 'barato', maps: maps('Marisma Fish Taco, Puerto Vallarta') },
    { name: 'Mariscos Cisneros', area: 'Zona Romántica', price: '~7–14 CHF', desc: 'Tostadas de ceviche y sopa de mariscos.', tag: 'barato', maps: maps('Mariscos Cisneros, Puerto Vallarta') },
    { name: 'The Blue Shrimp', area: 'Playa Los Muertos', price: '~15–24 CHF', desc: 'Camarón en todas sus formas.', tag: 'medio', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/r/the-blue-shrimp-puerto-vallarta' }], maps: maps('The Blue Shrimp, Puerto Vallarta') },
    { name: "Joe Jack's Fish Shack", area: 'Zona Romántica', price: 'hasta ~14 CHF', desc: 'Fish tacos y mojitos.', tag: 'medio', links: [{ label: 'Web', url: 'https://joejackspv.com/' }], maps: maps("Joe Jack's Fish Shack, Puerto Vallarta") },
    { name: 'Oyster Grill La Docena', area: 'Malecón', price: '~24+ CHF', desc: 'Ostiones y huachinango.', tag: 'medio', maps: maps('Oyster Grill La Docena, Puerto Vallarta') },
    { name: 'icú', area: 'Zona Romántica · Bib Gourmand', price: '~15–24 CHF', desc: 'Quesadilla de maíz azul con pulpo.', tag: 'especial', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/r/restaurante-icu-puerto-vallarta' }], maps: maps('icú restaurante, Puerto Vallarta') },
    { name: 'La Palapa', area: 'Playa Los Muertos', price: '~34–53 CHF', desc: 'Cena con los pies en la arena.', tag: 'especial', links: [{ label: 'Web', url: 'https://www.lapalapapv.com/' }], maps: maps('La Palapa, Puerto Vallarta') },
  ],
  gdl: [
    { name: 'Tortas Ahogadas "El Viejo"', area: 'Col. Americana', price: '~5–10 CHF', desc: '+70 años. Torta de cachete.', tag: 'barato', maps: maps('Tortas Ahogadas Enrique El Viejo, Guadalajara') },
    { name: 'Birriería Las 9 Esquinas', area: 'Centro · Michelin', price: 'barato', desc: 'Birria de chivo. Si vamos 8, llamar antes.', tag: 'barato', maps: maps('Birriería las 9 Esquinas, Guadalajara') },
    { name: 'Karne Garibaldi', area: 'Santa Tere', price: '~12–14 CHF', desc: 'Carne en su jugo (récord Guinness de rapidez).', tag: 'barato', maps: maps('Karne Garibaldi, Guadalajara') },
    { name: 'El Patio', area: 'Tlaquepaque', price: '~15–24 CHF', desc: 'Mariachi femenil de 15 a 16 h.', tag: 'medio', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/el-patio-tlaquepaque' }], maps: maps('Restaurante El Patio, Tlaquepaque') },
    { name: 'La Tequila', area: 'Av. México', price: '~15–24 CHF', desc: 'Molcajete y carta enorme de tequilas.', tag: 'medio', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/r/la-tequila-avenida-mexico-guadalajara' }], maps: maps('La Tequila, Avenida México, Guadalajara') },
    { name: 'Alcalde', area: 'Av. México · 1 Michelin', price: 'menú ~143 CHF', desc: 'N.º 15 Latin America’s 50 Best. Sala privada.', tag: 'especial', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/r/alcalde-guadalajara' }], maps: maps('Alcalde, Guadalajara') },
    { name: 'Xokol', area: 'Santa Tere · 1 Michelin', price: '~61 CHF', desc: 'Cocina de maíz, mesa comunal.', tag: 'especial', maps: maps('Xokol, Guadalajara') },
    { name: 'Hueso', area: 'Col. Americana', price: '~57 CHF', desc: 'Mesa comunal, menú MX$1.200.', tag: 'especial', links: [{ label: 'OpenTable', url: 'https://www.opentable.com/r/hueso-guadalajara' }], maps: maps('Hueso, Guadalajara') },
  ],
  baja: [
    { name: 'Tacos Hermanos González', area: 'La Paz', price: '~5–8 CHF', desc: 'Tacos de pescado y camarón capeado.', tag: 'barato', maps: maps('Tacos Hermanos González, La Paz') },
    { name: 'Asadero Rancho Viejo', area: 'La Paz', price: '~10–15 CHF', desc: 'Carne al mezquite, hasta tarde.', tag: 'barato', maps: maps('Asadero Rancho Viejo, La Paz') },
    { name: 'Heladería La Fuente', area: 'La Paz · Malecón', price: '~2–4 CHF', desc: 'Paletas de pitahaya y mango.', tag: 'barato', maps: maps('Heladería La Fuente, La Paz') },
    { name: 'Tacos Gardenias', area: 'Cabo San Lucas', price: '~6–10 CHF', desc: 'Pescado y camarón, local y barato.', tag: 'barato', maps: maps('Tacos Gardenias, Cabo San Lucas') },
    { name: 'Bismarkcito', area: 'La Paz · Malecón', price: '~20–30 CHF', desc: 'Mariscos desde 1968.', tag: 'medio', maps: maps('Bismarkcito, La Paz') },
    { name: 'La Lupita Taco & Mezcal', area: 'San José del Cabo', price: '~15–25 CHF', desc: 'Tacos creativos y mezcal.', tag: 'medio', maps: maps('La Lupita Taco Mezcal, San José del Cabo') },
    { name: 'Jazamango', area: 'Todos Santos', price: '~40–60 CHF', desc: 'Javier Plascencia, horno de leña.', tag: 'especial', maps: maps('Jazamango, Todos Santos') },
    { name: 'Flora Farms', area: 'San José del Cabo', price: '~50–80 CHF', desc: 'Granja-restaurante icónica.', tag: 'especial', links: [{ label: 'Web', url: 'https://www.flora-farms.com/' }], maps: maps('Flora Farms, San José del Cabo') },
  ],
}

export type Stay = { name: string; area: string; perNight: string; total?: string; desc: string; url: string; pick?: boolean }

export const STAYS: Record<Exclude<CityId, 'zrh' | 'home'>, Stay[]> = {
  cdmx: [
    { name: 'Airbnb de Jhoni', area: 'Condesa', perNight: '34 CHF/pers', total: '615 CHF (3 noches)', desc: '3 hab. · 2 baños · piscina en la azotea · billar', url: 'https://www.airbnb.ch/rooms/1759074283803085974?check_in=2026-10-03&check_out=2026-10-06&adults=6', pick: true },
    { name: 'Depa con alberca', area: 'Condesa (Insurgentes)', perNight: '33 CHF/pers', total: '592 CHF', desc: '3 hab. · piscina en la azotea · gimnasio', url: 'https://www.booking.com/hotel/mx/depto-con-alberca-zona-condesa.html?checkin=2026-10-03&checkout=2026-10-06&group_adults=6&selected_currency=CHF' },
    { name: 'Kukun Edition El Ángel', area: 'Reforma', perNight: '48 CHF/pers', total: '868 CHF', desc: 'Hotel 5★ 9,6 · 3 habitaciones', url: 'https://www.booking.com/hotel/mx/kukun-edition-el-angel.html?checkin=2026-10-03&checkout=2026-10-06&no_rooms=3&group_adults=6&selected_currency=CHF' },
  ],
  pvr: [
    { name: 'Avalon 907', area: 'Amapas (Zona Romántica)', perNight: '56 CHF/pers', total: '672 CHF (2 noches)', desc: '3 hab. · piscina privada + jacuzzi · vista', url: 'https://www.booking.com/hotel/mx/avalon-907-modern-spacious-9th-f-private-pool.html?checkin=2026-10-06&checkout=2026-10-08&group_adults=6&selected_currency=CHF', pick: true },
    { name: 'Hotel Patio Azul', area: 'Conchas Chinas', perNight: '35 CHF/pers', total: '416 CHF', desc: 'Boutique 9,3 · piscina, jacuzzi y spa · 3 hab.', url: 'https://www.booking.com/hotel/mx/hotelito-patio-azul.html?checkin=2026-10-06&checkout=2026-10-08&no_rooms=3&group_adults=6&selected_currency=CHF' },
    { name: 'Penthouse torre Península (el del cine)', area: 'Zona Hotelera', perNight: '?', desc: '5 hab. · cine privado · piscina frente al mar', url: 'https://www.airbnb.ch/rooms/1751934497596680246?check_in=2026-10-06&check_out=2026-10-08&adults=6' },
  ],
  gdl: [
    { name: 'Hospedarte Central (4 dobles)', area: 'Av. de la Paz', perNight: '19 CHF/pers', total: '608 CHF (4 noches, 8 pers.)', desc: '9,4 · elegir 4 "Deluxe Double". ⚠️ El vuelo es el 12: reservar 4 noches (8–12 oct).', url: 'https://www.booking.com/hotel/mx/hospedarte-central.html?checkin=2026-10-08&checkout=2026-10-12&no_rooms=4&group_adults=8&selected_currency=CHF', pick: true },
    { name: 'Ramé Hotel Boutique', area: 'Chapultepec', perNight: '39 CHF/pers', total: '938 CHF', desc: '5★ · piscina, spa y sauna', url: 'https://www.booking.com/hotel/mx/boutique-rame.html?checkin=2026-10-08&checkout=2026-10-12&no_rooms=4&group_adults=8&selected_currency=CHF' },
    { name: 'Depas de Flor (contacto de Pablo)', area: 'Airbnb', perNight: 'preguntar', desc: '2 depas de 2 hab. · piscina. Escribir de parte de la familia Morales/Covantes.', url: 'https://www.airbnb.ch/rooms/735447915679774242' },
  ],
  baja: [
    { name: 'Casa de 3 recámaras en La Paz (Airbnb)', area: 'La Paz · cerca del Malecón', perNight: '~25–45 CHF/pers', desc: '12–15 oct · 3 noches', url: 'https://www.airbnb.com/s/La-Paz--Baja-California-Sur--Mexico/homes?checkin=2026-10-12&checkout=2026-10-15&adults=6&min_bedrooms=3', pick: true },
    { name: 'Hotel Catedral La Paz', area: 'La Paz centro', perNight: '~40–55 CHF/pers', desc: 'Azotea con alberca, a 2 cuadras del Malecón.', url: 'https://www.booking.com/searchresults.html?ss=Hotel+Catedral+La+Paz&checkin=2026-10-12&checkout=2026-10-15&group_adults=6&no_rooms=3' },
    { name: 'Villa de 3 recámaras en San José (Airbnb)', area: 'San José del Cabo', perNight: '~35–60 CHF/pers', desc: '15–17 oct · cerca del aeropuerto SJD', url: 'https://www.airbnb.com/s/San-Jose-del-Cabo--Mexico/homes?checkin=2026-10-15&checkout=2026-10-17&adults=6&min_bedrooms=3', pick: true },
    { name: 'El Encanto Inn & Suites', area: 'San José del Cabo centro', perNight: '~50–75 CHF/pers', desc: 'Colonial con alberca.', url: 'https://www.booking.com/searchresults.html?ss=El+Encanto+Inn+San+Jose+del+Cabo&checkin=2026-10-15&checkout=2026-10-17&group_adults=6&no_rooms=3' },
  ],
}
