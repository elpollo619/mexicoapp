/** Contenido de los juegos para beber. Cada texto tiene versión "sin alcohol" cuando hace falta. */

export type KingsRule = { title: string; rule: string; sober: string }

export const KINGS_RULES: Record<string, KingsRule> = {
  A: { title: 'Cascada', rule: 'Todos empiezan a tomar al mismo tiempo. Nadie puede parar hasta que pare quien está a su derecha. Tú paras primero.', sober: 'Todos aplauden sin parar. Nadie puede parar hasta que pare quien está a su derecha. Tú paras primero.' },
  '2': { title: 'Tú bebes', rule: 'Elige a alguien: ¡que tome!', sober: 'Elige a alguien: ¡que haga un reto!' },
  '3': { title: 'Yo bebo', rule: 'Te tocó: toma tú.', sober: 'Te tocó: haz un reto tú.' },
  '4': { title: 'Piso', rule: 'Todos tocan el piso. El último en hacerlo toma.', sober: 'Todos tocan el piso. El último pierde un punto.' },
  '5': { title: 'Chicos', rule: 'Todos los chicos toman. 🍻', sober: 'Todos los chicos hacen 5 sentadillas.' },
  '6': { title: 'Chicas', rule: 'Todas las chicas toman. 🥂', sober: 'Todas las chicas hacen 5 sentadillas.' },
  '7': { title: 'Cielo', rule: 'Todos señalan al cielo. El último toma.', sober: 'Todos señalan al cielo. El último pierde un punto.' },
  '8': { title: 'Compañero', rule: 'Elige un compañero: cada vez que tú tomes, él/ella toma contigo (hasta el siguiente 8).', sober: 'Elige un compañero: cada vez que te toque un reto, él/ella lo hace contigo.' },
  '9': { title: 'Rima', rule: 'Di una palabra. En ronda, cada uno dice una que rime. El que se traba o repite, toma.', sober: 'Di una palabra. En ronda, cada uno dice una que rime. El que se traba pierde un punto.' },
  '10': { title: 'Categorías', rule: 'Elige una categoría (marcas de tequila, estados de México…). En ronda digan algo. El que se traba, toma.', sober: 'Elige una categoría (marcas de tequila, estados de México…). El que se traba pierde un punto.' },
  J: { title: 'Regla nueva', rule: 'Inventa una regla para el resto del juego (ej. no decir "güey"). Quien la rompa, toma.', sober: 'Inventa una regla para el resto del juego. Quien la rompa, pierde un punto.' },
  Q: { title: 'Preguntas', rule: 'Hazle una pregunta a alguien; debe responder con otra pregunta a un tercero. El que responde normal o se traba, toma.', sober: 'Solo se puede hablar con preguntas. El que responde normal, pierde un punto.' },
  K: { title: 'Copa del centro', rule: 'Echa un poco de tu bebida a la copa del centro. 🍷', sober: 'Echa un ingrediente (agua, limón, sal…) a la copa del centro.' },
}

export const KINGS_LAST: KingsRule = {
  title: '¡Cuarto rey!',
  rule: 'Se acabó: te toca tomarte la copa del centro. 😵 (O un trago de ella y el resto a la planta, con cabeza.)',
  sober: 'Se acabó: te toca probar la copa del centro (agua con limón y sal, suerte 😅).',
}

export const MAS_PROBABLE: string[] = [
  '…de perder el pasaporte en el viaje',
  '…de terminar cantando con el mariachi',
  '…de quedarse dormido en la lancha a Marietas',
  '…de enfermarse del estómago primero',
  '…de gastar todo el presupuesto en la primera semana',
  '…de hacerse un tatuaje en México',
  '…de pedir tacos a las 4 de la mañana',
  '…de perder el vuelo',
  '…de ligar en Guadalajara',
  '…de llorar en la fiesta de Pablo',
  '…de quemarse con el sol el primer día de playa',
  '…de subirse al ring en la lucha libre',
  '…de comprar un sombrero de charro',
  '…de volver con 5 kilos más',
  '…de quedarse a vivir en México',
  '…de pelearse con un taxista por el precio',
  '…de olvidar el bloqueador',
  '…de decir "ahorita" y no hacerlo nunca',
  '…de mandar audios de 5 minutos al grupo',
  '…de desaparecer en la fiesta y aparecer al día siguiente',
  '…de probar chapulines sin miedo',
  '…de pedir otra ronda cuando todos se quieren ir',
  '…de dormirse primero en la fiesta',
  '…de despertarse con cruda y aun así ir al tour',
  '…de hablar con acento mexicano al volver a Suiza',
  '…de pagar de más sin darse cuenta',
  '…de tomarse 200 fotos del mismo atardecer',
  '…de meterse al mar de noche',
  '…de perder las llaves del Airbnb',
  '…de hacerse amigo del mesero',
  '…de pedir la cuenta y que ya la haya pagado otro',
  '…de subir historias todo el viaje',
  '…de perderse en el mercado',
  '…de bailar arriba de una mesa',
  '…de enamorarse de un lobo marino',
  '…de llegar tarde a todo',
  '…de organizar el próximo viaje',
  '…de terminar el viaje sin un peso',
  '…de comerse el chile más picante del menú',
  '…de pedir una canción de Luis Miguel',
  '…de caerse en la playa Balandra',
  '…de olvidarse de la hora de check-out',
  '…de pedir perdón al día siguiente',
  '…de besar a alguien en la fiesta de Pablo',
  '…de ser el/la mejor luchador(a)',
  '…de quedarse sin batería en el peor momento',
  '…de terminar con un apodo mexicano',
  '…de hacer amistad con otro grupo de turistas',
  '…de reservar lo más caro sin preguntar',
  '…de hablarle en alemán a un mexicano',
  '…de ser el primero en bañarse en la alberca',
  '…de comprar 10 botellas de tequila para llevar',
  '…de manejar la van y decir "yo sé dónde es" (y no sabe)',
  '…de ganar la lotería mexicana',
]

export type ShotSlice = { emoji: string; label: string; text: string; sober: string; color: string }

export const SHOT_WHEEL: ShotSlice[] = [
  { emoji: '🍺', label: 'Tú tomas', text: 'Un trago para ti. ¡Salud!', sober: 'Haz 10 sentadillas.', color: '#d1006b' },
  { emoji: '🎯', label: 'Reparte 3', text: 'Reparte 3 tragos como quieras.', sober: 'Reparte 3 retos como quieras.', color: '#e89a0c' },
  { emoji: '🍻', label: 'Todos toman', text: '¡Todos toman! Brindis general.', sober: '¡Todos hacen un brindis con agua!', color: '#00857f' },
  { emoji: '🥃', label: 'Tequila', text: 'Shot de tequila (o medio, con cabeza).', sober: 'Shot de limón con sal. 🍋', color: '#c2410c' },
  { emoji: '😇', label: 'Salvado', text: 'Te salvaste esta vez.', sober: 'Te salvaste esta vez.', color: '#2f7d4f' },
  { emoji: '👈', label: 'Izquierda', text: 'Toma la persona a tu izquierda.', sober: 'La persona a tu izquierda hace un reto.', color: '#7b2cbf' },
  { emoji: '🔄', label: 'Cambio', text: 'Cambia de lugar con quien quieras.', sober: 'Cambia de lugar con quien quieras.', color: '#2563eb' },
  { emoji: '🎂', label: 'Brindis Pablo', text: '¡Brindis por Pablo! Todos toman.', sober: '¡Todos le cantan Las Mañanitas a Pablo!', color: '#c8322f' },
  { emoji: '🔥', label: 'Reto', text: 'El grupo te pone un reto. Si no lo haces, doble trago.', sober: 'El grupo te pone un reto.', color: '#e0457b' },
  { emoji: '🙊', label: 'Verdad', text: 'Responde una verdad. Si no, toma.', sober: 'Responde una verdad sin escapar.', color: '#0e7490' },
  { emoji: '🎲', label: 'Doble o nada', text: 'Gira otra vez: lo que salga, ¡doble!', sober: 'Gira otra vez: lo que salga, ¡doble!', color: '#b45309' },
  { emoji: '💧', label: 'Agua', text: 'Vaso de agua obligatorio. Tu hígado te lo agradece.', sober: 'Vaso de agua. Hidratación nivel pro.', color: '#0891b2' },
  { emoji: '👉', label: 'Derecha', text: 'Toma la persona a tu derecha.', sober: 'La persona a tu derecha hace un reto.', color: '#9333ea' },
  { emoji: '🎤', label: 'Canta', text: 'Canta el coro de una ranchera o toma 2.', sober: 'Canta el coro de una ranchera.', color: '#be185d' },
]

/**
 * Cartas del modo Fiesta. Placeholders: {A}, {B} = jugadores al azar distintos.
 * `virus` = regla que dura unas rondas y luego se anuncia su fin.
 */
export type FiestaCard =
  | { type: 'regla' | 'reto' | 'voto' | 'todos'; text: string }
  | { type: 'virus'; text: string; end: string }

export const FIESTA: FiestaCard[] = [
  { type: 'todos', text: 'Todos los que ya hayan estado en México antes, toman 2.' },
  { type: 'todos', text: 'El último que llegó a la fiesta toma 2.' },
  { type: 'todos', text: 'Todos los que traen algo rosa, toman 1.' },
  { type: 'todos', text: 'Quien tenga menos batería en el celular, toma 2. ¡Muestren!' },
  { type: 'todos', text: 'Todos los que tienen pasaporte suizo toman 1. Los de pasaporte español, 2. 🇨🇭🇪🇸' },
  { type: 'todos', text: 'Quien haya dormido menos anoche reparte 3 tragos.' },
  { type: 'todos', text: 'Todos los que ya se quemaron con el sol en este viaje, toman 1.' },
  { type: 'todos', text: 'Los que hayan probado chapulines reparten 2. Los que no, toman 1.' },
  { type: 'todos', text: 'El más alto del grupo toma 1. El más bajito reparte 2.' },
  { type: 'todos', text: 'Cuenten del 1 al 20 en grupo, uno por uno, sin orden. Si dos hablan a la vez, ambos toman.' },
  { type: 'todos', text: 'Todos los que tengan pareja en este viaje, brindan y toman 1. 💑' },
  { type: 'todos', text: 'Quien tenga la foto más reciente con un taco en su galería, reparte 3.' },
  { type: 'todos', text: '¡Brindis por Pablo! Todos toman 1. 🎂' },
  { type: 'todos', text: 'Quien haya gastado más hoy, toma 1. Quien menos, reparte 1.' },
  { type: 'todos', text: 'Waterfall mexicano: todos toman hasta que {A} pare.' },
  { type: 'todos', text: 'Todos a la cuenta de 3 señalan a quien peor baila. El más señalado toma 2.' },
  { type: 'regla', text: '{A}, reparte 3 tragos entre quien quieras.' },
  { type: 'regla', text: '{A} y {B}, piedra, papel o tijera. El que pierde toma 2.' },
  { type: 'regla', text: '{A}, di 5 estados de México en 10 segundos o toma 3.' },
  { type: 'regla', text: '{A}, di 5 marcas de tequila en 10 segundos o toma 2.' },
  { type: 'regla', text: '{A}, imita a {B}. Si el grupo adivina, {B} toma. Si no, tú.' },
  { type: 'regla', text: '{A} y {B} son compañeros de trago hasta el final del juego. 🤝' },
  { type: 'regla', text: '{A}, elige a alguien para un duelo de miradas. El que se ríe primero, toma.' },
  { type: 'regla', text: '{A}, cuenta un chiste. Si nadie se ríe, toma 2.' },
  { type: 'regla', text: '{A}, di una palabra en suizo alemán. {B} tiene que adivinar qué significa o toma.' },
  { type: 'regla', text: '{A}, si alguna vez perdiste un vuelo, toma 3. Si no, reparte 1.' },
  { type: 'regla', text: '{A}, categorías: comida mexicana. Empiezas tú, a la derecha. El que se traba toma.' },
  { type: 'regla', text: '{A}, categorías: canciones de mariachi. El que se traba toma.' },
  { type: 'regla', text: '{A}, rima con "tequila". El que no encuentra rima toma.' },
  { type: 'regla', text: '{A}, pulso con {B}. El perdedor toma 2. 💪' },
  { type: 'regla', text: '{A}, adivina el color de ojos de {B} sin mirar. Si fallas, toma.' },
  { type: 'regla', text: '{A}, di algo que nunca hayas hecho. Todos los que sí lo hayan hecho, toman.' },
  { type: 'regla', text: '{A}, elige: tomas 2 o le das tu celular a {B} por 1 minuto.' },
  { type: 'regla', text: '{A}, nombra a todos los del grupo con su apellido. Por cada error, 1 trago.' },
  { type: 'regla', text: '{A}, ¿quién pagó la cuenta más grande del viaje? Si no sabes, toma.' },
  { type: 'regla', text: '{A} decide quién toma 2. Sin explicaciones. 😈' },
  { type: 'regla', text: '{A}, di "tres tristes tigres tragaban trigo en un trigal" 3 veces rápido o toma.' },
  { type: 'regla', text: '{A} y {B}: cuenten al mismo tiempo cuántos días lleva el viaje. Si no coinciden, ambos toman.' },
  { type: 'reto', text: '{A}, pídele al mesero (o a alguien) que te enseñe una palabra mexicana. Si no te atreves, toma 2.' },
  { type: 'reto', text: '{A}, haz tu mejor grito de mariachi. ¡Ay ay ay! O toma 2.' },
  { type: 'reto', text: '{A}, manda un audio a tu mamá diciendo "Te quiero, güey". O toma 3.' },
  { type: 'reto', text: '{A}, baila 20 segundos una cumbia sin música. O toma 2.' },
  { type: 'reto', text: '{A}, haz la entrada de luchador a la fiesta. Nombre de lucha incluido.' },
  { type: 'reto', text: '{A}, da un discurso de 30 segundos para el cumple de Pablo. 🎂' },
  { type: 'reto', text: '{A}, deja que {B} te ponga un apodo para el resto de la noche.' },
  { type: 'reto', text: '{A}, háblale a {B} como si fueras un vendedor del mercado. O toma 2.' },
  { type: 'reto', text: '{A}, canta "Cielito lindo" con {B}. Si no se saben la letra, ambos toman.' },
  { type: 'reto', text: '{A}, muestra tu último mensaje de WhatsApp. O toma 3.' },
  { type: 'reto', text: '{A}, pon la canción que elija {B} y baílala. O toma 2.' },
  { type: 'reto', text: '{A}, di tres cosas bonitas de {B}. Con sentimiento. 🥹' },
  { type: 'reto', text: '{A}, imita un lobo marino de Espíritu Santo. 🦭' },
  { type: 'reto', text: '{A}, masaje de hombros de 30 segundos a {B}.' },
  { type: 'reto', text: '{A}, habla con acento chilango hasta tu próximo turno.' },
  { type: 'reto', text: '{A}, sube una historia con la foto que elija el grupo. O toma 3.' },
  { type: 'reto', text: '{A}, prepárale una bebida a {B} (con o sin alcohol, tú eliges).' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién es el más probable de perder el pasaporte? El más votado toma 2.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién cuenta los peores chistes? Toma 2.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién es el más tacaño del viaje? Toma 2. 💸' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién sería el mejor guía turístico? Reparte 3.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién se enferma del estómago primero? Toma 1 (por prevención).' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién tiene más cara de narco? 🕶️ Toma 2.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién llega tarde a todo? Toma 2.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién sería el mejor luchador? Reparte 2.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién se duerme primero hoy? Toma 1 ahora que puede.' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién organiza mejor los viajes? Reparte 3. 🙌' },
  { type: 'voto', text: 'A la cuenta de 3: ¿quién habla más en el grupo de WhatsApp? Toma 2.' },
  { type: 'voto', text: '{A} vs {B}: ¿quién baila mejor? El grupo vota. El que pierde, toma 2.' },
  { type: 'voto', text: '{A} vs {B}: ¿quién aguanta más el picante? El grupo vota. El que pierde, toma.' },
  { type: 'virus', text: '🦠 VIRUS: {A} no puede decir "güey". Cada vez que lo diga, toma.', end: '🦠 Fin del virus: {A} ya puede decir "güey" otra vez, güey.' },
  { type: 'virus', text: '🦠 VIRUS: nadie puede decir nombres. Quien diga un nombre, toma.', end: '🦠 Fin del virus: ya pueden decir nombres.' },
  { type: 'virus', text: '🦠 VIRUS: {A} es el/la rey/reina del pulgar. Cuando ponga el pulgar en la mesa, el último en copiarlo toma.', end: '🦠 Fin del virus: {A} ya no es rey/reina del pulgar.' },
  { type: 'virus', text: '🦠 VIRUS: todos deben tomar con la mano izquierda. Quien use la derecha, toma otra vez.', end: '🦠 Fin del virus: ya pueden usar la mano derecha.' },
  { type: 'virus', text: '🦠 VIRUS: {A} y {B} solo pueden hablarse cantando.', end: '🦠 Fin del virus: {A} y {B} ya pueden hablar normal.' },
  { type: 'virus', text: '🦠 VIRUS: {A} es el/la mesero/a: sirve las bebidas de todos.', end: '🦠 Fin del virus: {A} ya no es mesero/a. ¡Propina!' },
  { type: 'virus', text: '🦠 VIRUS: prohibido decir "no". Quien lo diga, toma.', end: '🦠 Fin del virus: ya se puede decir "no".' },
  { type: 'virus', text: '🦠 VIRUS: cada vez que alguien diga "tequila", todos gritan "¡salud!". El último, toma.', end: '🦠 Fin del virus: se acabó el "¡salud!".' },
  { type: 'virus', text: '🦠 VIRUS: {A} tiene que terminar cada frase con "…carnal".', end: '🦠 Fin del virus: {A} ya no tiene que decir "carnal", carnal.' },
  { type: 'virus', text: '🦠 VIRUS: nadie puede señalar con el dedo. Quien lo haga, toma.', end: '🦠 Fin del virus: ya pueden señalar.' },
  { type: 'virus', text: '🦠 VIRUS: {A} es la sombra de {B}: cada vez que {B} tome, {A} también.', end: '🦠 Fin del virus: {A} ya no es la sombra de {B}.' },
  { type: 'virus', text: '🦠 VIRUS: todos hablan en inglés. Quien diga algo en español, toma.', end: '🦠 Fin del virus: back to español.' },
  { type: 'todos', text: '💧 Pausa técnica: todos toman un vaso de agua. Sin excusas.' },
  { type: 'todos', text: '💧 Ronda de agua: el que no tome agua ahora, toma 2 en la próxima.' },
  { type: 'todos', text: 'Selfie grupal ahora mismo. Quien salga con los ojos cerrados, toma.' },
  { type: 'todos', text: 'Todos los que ya dijeron "ahorita" hoy, toman 1.' },
  { type: 'todos', text: 'El que tenga el vaso más lleno reparte 2. El más vacío, toma 1 (¡a rellenar!).' },
]

/** Cambia el vocabulario de beber por retos/puntos para el modo sin alcohol */
export function sober(text: string): string {
  return text
    .replace(/toma la copa/gi, 'prueba la copa')
    .replace(/\btoman (\d+)/gi, 'hacen $1 sentadillas')
    .replace(/\btoma (\d+)/gi, 'pierde $1 puntos')
    .replace(/\breparte (\d+) tragos?/gi, 'reparte $1 retos')
    .replace(/\breparten (\d+)/gi, 'reparten $1 retos')
    .replace(/\breparte (\d+)/gi, 'reparte $1 retos')
    .replace(/\btoman\b/gi, 'hacen un reto')
    .replace(/\btoma\b/gi, 'pierde un punto')
    .replace(/\btomas\b/gi, 'haces un reto')
    .replace(/\btomar\b/gi, 'aplaudir')
    .replace(/\bbeber\b/gi, 'jugar')
    .replace(/doble trago/gi, 'doble reto')
    .replace(/compañeros de trago/gi, 'compañeros de reto')
    .replace(/\btrago\b/gi, 'reto')
}
