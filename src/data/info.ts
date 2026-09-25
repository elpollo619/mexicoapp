export type Ride = { city: string; route: string; uber?: [number, number]; taxi?: [number, number]; minutes: string; tip: string }

/** Precios en MXN por coche (UberX = máx. 4 personas). Para 6: UberXL (~1,8–2×) o 2 coches. */
export const RIDES: Ride[] = [
  { city: 'CDMX', route: 'AICM → Condesa', uber: [190, 320], taxi: [410, 500], minutes: '30–60', tip: 'Uber recoge en los puntos marcados de llegadas; UberXL ~370–550. Taxi autorizado: se paga en la taquilla dentro de la terminal. Para 6, pedir camioneta (~650–800). Nunca taxis ofrecidos en pasillos.' },
  { city: 'CDMX', route: 'AIFA (Santa Lucía) → Condesa', uber: [650, 900], taxi: [850, 1100], minutes: '75–110', tip: 'UberXL ~900–1.300. Alternativa: Tren Suburbano AIFA–Buenavista (~1 h) + Uber corto.' },
  { city: 'CDMX', route: 'Condesa → Teotihuacán', uber: [600, 1000], taxi: [900, 1400], minutes: '60–90', tip: 'Volver por app es difícil: mejor tour o chofer por el día (~MX$2.000–3.000).' },
  { city: 'Vallarta', route: 'Aeropuerto PVR → Zona Romántica', uber: [250, 400], taxi: [420, 560], minutes: '25–40', tip: 'Uber no recoge en la terminal: cruzar el puente peatonal a la carretera. Taxi de aeropuerto con boleto en taquilla (tarifa fija).' },
  { city: 'Vallarta', route: 'Zona Romántica → Marina Vallarta', uber: [150, 250], taxi: [200, 320], minutes: '20–35', tip: 'Taxis sin taxímetro: acordar el precio antes. Bus urbano ~MX$12–15.' },
  { city: 'Guadalajara', route: 'Aeropuerto GDL → Col. Americana', uber: [250, 400], taxi: [400, 550], minutes: '30–50', tip: 'Taxi autorizado con tarifa fija por zona. Tráfico fuerte 18–20 h. El lunes 12 (Romería) el doble.' },
  { city: 'Guadalajara', route: 'Col. Americana → Tlaquepaque', uber: [120, 200], taxi: [180, 280], minutes: '20–30', tip: 'Bajar en Jardín Hidalgo. DiDi suele ser algo más barato.' },
  { city: 'La Paz', route: 'Aeropuerto LAP → Malecón', uber: [150, 250], taxi: [350, 600], minutes: '15–25', tip: 'Uber/DiDi no recogen dentro del aeropuerto. Con la minivan no hace falta.' },
  { city: 'La Paz', route: 'La Paz → Playa Balandra', uber: [250, 400], taxi: [350, 500], minutes: '25–30', tip: 'Mejor en auto propio: casi sin señal para pedir el regreso.' },
  { city: 'La Paz', route: 'La Paz → Todos Santos (auto)', taxi: [1500, 2200], minutes: '60–75', tip: '~80 km. Gasolina minivan ~MX$250–350.' },
  { city: 'La Paz', route: 'La Paz → Cabo San Lucas (auto)', taxi: [2500, 3500], minutes: '120–150', tip: '~155 km. Gasolina ~MX$450–600. No manejar de noche.' },
  { city: 'Los Cabos', route: 'Aeropuerto SJD → San José centro', uber: [250, 400], taxi: [1100, 1300], minutes: '20–25', tip: 'Uber NO puede recoger en SJD (multan). Transfer reservado ~USD 55–70 la van, o caminar a la carretera. Dejar pasajeros con Uber sí se puede.' },
  { city: 'Los Cabos', route: 'Aeropuerto SJD → Cabo San Lucas', uber: [600, 900], taxi: [1600, 2000], minutes: '40–50', tip: 'Transfer privado reservado ~USD 85 la van de 6.' },
]

export const EMERGENCY = [
  { label: 'Emergencias (policía, ambulancia, bomberos)', value: '911', tel: '911' },
  { label: 'Embajada de Suiza en CDMX', value: '+52 55 9178 4370', tel: '+525591784370', note: 'Paseo de las Palmas 405, piso 11, Lomas de Chapultepec' },
  { label: 'Helpline DFAE 24 h', value: '+41 800 24-7-365', tel: '+41800247365', note: 'o +41 58 465 33 33 · app Travel Admin' },
  { label: 'Consulado de España CDMX (24 h)', value: '55 4246 8136', tel: '+525542468136', note: 'Galileo 114, Polanco' },
  { label: 'Consulado de España Guadalajara (24 h)', value: '33 3116 4272', tel: '+523331164272', note: 'Cubre Jalisco y Vallarta' },
  { label: 'Ángeles Verdes (asistencia en carretera)', value: '078', tel: '078' },
]

export const MONEY_TIPS = [
  'Pagar SIEMPRE en pesos: si la terminal pregunta "¿CHF o pesos?", elegir pesos.',
  'Cajeros de banco (BBVA, Banorte, Santander, Banamex), de día y dentro de un local.',
  'Efectivo para taquerías, peajes, taxis acuáticos y Playa Escondida (MX$600).',
  'Propina 10–15 % en restaurantes (mirar si ya viene en la cuenta). En Uber, opcional.',
  'Gasolineras: verificar que la bomba esté en 0 y contar los billetes en voz alta.',
]

export const SAFETY = [
  'De noche, solo Uber/DiDi o taxi de sitio. Nada de taxis de la calle.',
  'Temporada de huracanes del Pacífico hasta el 30 nov: revisar nhc.noaa.gov y smn.conagua.gob.mx los días antes.',
  'Tours en lancha se cancelan con viento u oleaje: devuelven el dinero o cambian fecha.',
  'En carretera: solo de día y por autopista de cuota. Retenes militares son normales: pasaporte y contrato de renta a mano.',
  'Playas del Pacífico en Los Cabos (Divorcio, Solmar) tienen corrientes peligrosas: nadar en El Médano, Chileno o Santa María.',
  'Agua solo embotellada. En restaurantes turísticos el hielo suele ser purificado.',
  'CDMX está a 2.240 m: tomar agua y tranquilo con el alcohol el primer día.',
]

export const WEATHER_NORMS = [
  { city: 'CDMX', temp: '11–23 °C', note: 'Chubascos por la tarde. Chamarra para la noche.' },
  { city: 'Vallarta', temp: '24–32 °C', note: 'Calor y humedad. Bloqueador y repelente.' },
  { city: 'Guadalajara', temp: '15–27 °C', note: 'Agradable, fresco de noche.' },
  { city: 'La Paz / Cabos', temp: '21–33 °C', note: 'Soleado, mar a 28 °C. UV muy alto.' },
]

export const CHECKLIST: { id: string; group: string; label: string }[] = [
  { id: 'b-airbnb-cdmx', group: 'Reservar ya', label: 'Airbnb de Jhoni · CDMX (3–6 oct)' },
  { id: 'b-pvr', group: 'Reservar ya', label: 'Alojamiento Vallarta (6–8 oct)' },
  { id: 'b-gdl', group: 'Reservar ya', label: 'Guadalajara 8–12 oct (¡4 noches!)' },
  { id: 'b-van', group: 'Reservar ya', label: 'Van Vallarta → Guadalajara (8 oct)' },
  { id: 'b-marietas', group: 'Reservar ya', label: 'Marietas + Playa Escondida (mié 7)' },
  { id: 'b-cena', group: 'Reservar ya', label: 'Mesa para 8 · cena de cumple (jue 8)' },
  { id: 'b-frida', group: 'Reservar ya', label: 'Casa Azul (si vamos)' },
  { id: 'b-baja-flight', group: 'Reservar ya', label: 'Vuelo Los Cabos → CDMX (16/17 oct)' },
  { id: 'b-baja-stay', group: 'Reservar ya', label: 'Alojamiento La Paz + San José del Cabo' },
  { id: 'b-hertz', group: 'Reservar ya', label: 'Minivan La Paz (devolución en SJD)' },
  { id: 'b-balandra', group: 'Reservar ya', label: 'Brazaletes Balandra (CONANP)' },
  { id: 'b-last-night', group: 'Reservar ya', label: 'Hotel última noche CDMX (17 oct)' },
  { id: 'b-teo', group: 'Antes del 1 de octubre', label: 'Teotihuacán (lun 5)' },
  { id: 'b-lucha', group: 'Antes del 1 de octubre', label: 'Lucha libre (sáb 3)' },
  { id: 'b-bio', group: 'Antes del 1 de octubre', label: 'Bioluminiscencia o velero (mié 7)' },
  { id: 'b-espiritu', group: 'Antes del 1 de octubre', label: 'Tour Espíritu Santo (mar 13)' },
  { id: 'b-tequila', group: 'Antes del 1 de octubre', label: 'Tour Tequila (dom 11)' },
  { id: 'p-cash', group: 'Antes de salir (cada uno)', label: 'Pesos en efectivo' },
  { id: 'p-esim', group: 'Antes de salir (cada uno)', label: 'eSIM / datos en el celular' },
  { id: 'p-insurance', group: 'Antes de salir (cada uno)', label: 'Seguro de viaje (con clima/cancelación)' },
  { id: 'p-dfae', group: 'Antes de salir (cada uno)', label: 'Registrarse en Travel Admin (DFAE)' },
  { id: 'p-license', group: 'Antes de salir (cada uno)', label: 'Licencia de conducir (quien maneje) + tarjeta de crédito' },
  { id: 'p-maps', group: 'Antes de salir (cada uno)', label: 'Mapas sin conexión (CDMX, Vallarta, GDL, Baja)' },
  { id: 'p-passport', group: 'Antes de salir (cada uno)', label: 'Pasaporte (el mismo con el que se compró el vuelo)' },
  { id: 'p-app', group: 'Antes de salir (cada uno)', label: 'Instalar esta app en la pantalla de inicio 😎' },
]

export const PACKING = [
  'Traje de baño ×2', 'Bloqueador biodegradable', 'Repelente', 'Chamarra ligera (CDMX de noche)',
  'Sandalias + tenis', 'Lentes de sol y gorra', 'Adaptador: en México es tipo A/B (como EE. UU.)',
  'Botella reutilizable', 'Medicinas básicas (estómago 😅)', 'Ropa para la fiesta de Pablo 🎉',
]

export const SLANG: { word: string; meaning: string }[] = [
  { word: 'Güey / wey', meaning: 'Amigo, tío, parce. "¿Qué onda, güey?"' },
  { word: '¿Qué onda?', meaning: '¿Qué tal? ¿Qué pasa?' },
  { word: 'Chido / padre', meaning: 'Genial, bacano' },
  { word: 'Neta', meaning: 'La verdad. "¿Neta?" = ¿en serio?' },
  { word: 'Chela', meaning: 'Cerveza' },
  { word: 'Ahorita', meaning: 'Ahora… o en 5 minutos… o nunca 🤷' },
  { word: 'No manches', meaning: '¡No puede ser! ¡Qué fuerte!' },
  { word: 'Chamba', meaning: 'Trabajo' },
  { word: 'Lana', meaning: 'Dinero' },
  { word: 'Cruda', meaning: 'Resaca (guayabo)' },
  { word: 'Antro', meaning: 'Discoteca' },
  { word: 'Aguas', meaning: '¡Cuidado!' },
  { word: 'Órale', meaning: '¡Dale! / ¡Wow!' },
  { word: 'Chamarra', meaning: 'Chaqueta' },
  { word: 'Camión', meaning: 'Bus' },
  { word: 'Popote', meaning: 'Pajita, pitillo' },
  { word: 'Chilango / tapatío', meaning: 'De CDMX / de Guadalajara' },
  { word: 'Está cañón', meaning: 'Está difícil / muy fuerte' },
  { word: '¿Mande?', meaning: '¿Perdón? ¿Qué dijiste?' },
  { word: 'Me late', meaning: 'Me gusta, me parece bien' },
  { word: 'Qué oso', meaning: 'Qué vergüenza' },
  { word: 'Fresa', meaning: 'Pijo, gomelo' },
  { word: 'Pedo', meaning: 'Borracho… o problema ("¿Qué pedo?")' },
  { word: 'Tianguis', meaning: 'Mercado callejero' },
]
