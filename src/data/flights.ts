export type Flight = {
  id: string
  /** Hora local de salida/llegada, formato ISO sin zona (hora del aeropuerto) */
  dep: string
  arr: string
  from: string
  fromName: string
  to: string
  toName: string
  airline: string
  numbers: string
  who: string[]
  status: 'comprado' | 'pendiente'
  bags?: string
  price?: string
  bookedBy?: string
  notes?: string
  custom?: boolean
}

const CORE6 = ['cristian', 'bia', 'pipo', 'tania', 'jhoni', 'nicolas']

/** Vuelos sacados de las reservas compartidas en el chat. Sin PNR ni PIN (el código es público). */
export const FLIGHTS: Flight[] = [
  {
    id: 'f-zrh-mex',
    dep: '2026-10-02T15:35',
    arr: '2026-10-03T03:15',
    from: 'ZRH',
    fromName: 'Zúrich',
    to: 'MEX',
    toName: 'Ciudad de México (AICM)',
    airline: 'Swiss + Aeroméxico',
    numbers: 'LX324 · AM8',
    who: ['pipo', 'jhoni', 'nicolas'],
    status: 'comprado',
    notes: '1 escala · 19 h 40 min. Llegan de madrugada: Airbnb con caja de llaves.',
  },
  {
    id: 'f-cris-bia-in',
    dep: '2026-10-03T00:00',
    arr: '2026-10-03T00:00',
    from: '???',
    fromName: 'Por confirmar',
    to: 'NLU',
    toName: 'CDMX · AIFA (Santa Lucía)',
    airline: 'Por confirmar',
    numbers: '—',
    who: ['cristian', 'bia'],
    status: 'pendiente',
    notes: 'Llegan el 3 al "otro aeropuerto". Editen la hora aquí cuando la tengan. AIFA → Condesa ~1–1½ h.',
  },
  {
    id: 'f-tania-in',
    dep: '2026-10-04T06:32',
    arr: '2026-10-04T09:21',
    from: 'PUJ',
    fromName: 'Punta Cana',
    to: 'NLU',
    toName: 'CDMX · AIFA (Santa Lucía)',
    airline: 'Arajet',
    numbers: 'DM7104',
    who: ['tania'],
    status: 'comprado',
    bags: '23 kg facturado',
    notes: 'AIFA → Condesa ~1 h en auto, 1½ h en bus/tren.',
  },
  {
    id: 'f-mex-pvr',
    dep: '2026-10-06T16:05',
    arr: '2026-10-06T17:35',
    from: 'MEX',
    fromName: 'Ciudad de México (AICM)',
    to: 'PVR',
    toName: 'Puerto Vallarta',
    airline: 'Volaris',
    numbers: 'Y4 4282',
    who: CORE6,
    status: 'comprado',
    bags: 'Por persona: 1 personal + 1 de mano (17 kg) + 1 facturada (25 kg). Embarque prioritario.',
    price: 'CHF 598 (6 personas)',
    bookedBy: 'cristian',
    notes: 'Cambio posible pagando diferencia; reembolso si se cancela. Salir de la Condesa ~13:00.',
  },
  {
    id: 'f-gdl-lap',
    dep: '2026-10-12T13:53',
    arr: '2026-10-12T14:32',
    from: 'GDL',
    fromName: 'Guadalajara T1',
    to: 'LAP',
    toName: 'La Paz (BCS)',
    airline: 'Viva Aerobus',
    numbers: 'VB3222',
    who: CORE6,
    status: 'comprado',
    bags: 'Por persona: 1 personal + 1 de mano (15 kg) + 25 kg facturado.',
    bookedBy: 'pipo',
    notes: '⚠️ Lunes 12 = Romería de Zapopan: cierran calles desde la noche del domingo. Salir con mucho tiempo. La Paz va 1 h menos que Guadalajara.',
  },
  {
    id: 'f-baja-mex',
    dep: '2026-10-17T00:00',
    arr: '2026-10-17T00:00',
    from: 'SJD',
    fromName: 'Los Cabos / La Paz',
    to: 'MEX',
    toName: 'Ciudad de México',
    airline: 'Por comprar',
    numbers: '—',
    who: CORE6,
    status: 'pendiente',
    notes: 'Falta comprar. Idea: 16 o 17 oct para dormir la última noche en CDMX.',
  },
  {
    id: 'f-mex-zrh',
    dep: '2026-10-18T10:10',
    arr: '2026-10-19T10:05',
    from: 'MEX',
    fromName: 'Ciudad de México (AICM)',
    to: 'ZRH',
    toName: 'Zúrich',
    airline: 'Aeroméxico + Air Europa',
    numbers: 'AM27 · AM6946 (vía Madrid)',
    who: ['pipo', 'jhoni', 'nicolas', 'tania'],
    status: 'comprado',
    notes: 'Escala en Madrid 2 h 50 min (llegada MAD 05:00, sale 07:50). Estar en el AICM a las 07:10.',
  },
]

/** Zona horaria por aeropuerto (para las cuentas regresivas) */
export const AIRPORT_TZ: Record<string, string> = {
  ZRH: 'Europe/Zurich',
  MEX: 'America/Mexico_City',
  NLU: 'America/Mexico_City',
  PVR: 'America/Mexico_City',
  GDL: 'America/Mexico_City',
  LAP: 'America/Mazatlan',
  SJD: 'America/Mazatlan',
  PUJ: 'America/Santo_Domingo',
  TLC: 'America/Mexico_City',
  OAX: 'America/Mexico_City',
  MTY: 'America/Monterrey',
  BJX: 'America/Mexico_City',
  CUN: 'America/Cancun',
  MID: 'America/Merida',
  TIJ: 'America/Tijuana',
  CUL: 'America/Mazatlan',
  MZT: 'America/Mazatlan',
  MAD: 'Europe/Madrid',
  GVA: 'Europe/Zurich',
  BSL: 'Europe/Zurich',
  LIS: 'Europe/Lisbon',
  OPO: 'Europe/Lisbon',
  BOG: 'America/Bogota',
  MDE: 'America/Bogota',
  CLO: 'America/Bogota',
  PTY: 'America/Panama',
  JFK: 'America/New_York',
  MIA: 'America/New_York',
  LAX: 'America/Los_Angeles',
}
