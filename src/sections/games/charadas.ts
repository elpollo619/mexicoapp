/** Palabras para "Charadas": se actúan o se describen sin decir la palabra. */
export type Deck = { id: string; emoji: string; title: string; words: string[] }

export const CHARADAS: Deck[] = [
  {
    id: 'comida',
    emoji: '🌮',
    title: 'Comida y bebida',
    words: [
      'Tacos al pastor', 'Mezcal', 'Guacamole', 'Chilaquiles', 'Elote con mayonesa', 'Pozole', 'Tequila con sal y limón', 'Michelada',
      'Mole poblano', 'Churros', 'Torta ahogada', 'Chile en nogada', 'Tlayuda', 'Esquites', 'Horchata', 'Cochinita pibil',
      'Tamales', 'Quesadilla', 'Agua de jamaica', 'Aguachile', 'Pan dulce', 'Cerveza con limón', 'Salsa picante', 'Nopales',
    ],
  },
  {
    id: 'lugares',
    emoji: '🗺️',
    title: 'Lugares y cultura',
    words: [
      'Lucha libre', 'Mariachi', 'Pirámides de Teotihuacan', 'Ángel de la Independencia', 'Bellas Artes', 'Arco de Cabo San Lucas',
      'Frida Kahlo', 'Día de Muertos', 'Malecón de Puerto Vallarta', 'Ballet Folklórico', 'Trajinera de Xochimilco', 'Sombrero charro',
      'Piñata', 'Catrina', 'Lotería', 'Pirámide del Sol', 'Metro de la Ciudad de México', 'Ballena jorobada', 'Tequila (el pueblo)',
      'Alebrije', 'Cenote', 'Zócalo', 'Chapultepec', 'Playa de Los Muertos',
    ],
  },
  {
    id: 'frases',
    emoji: '🗣️',
    title: 'Jerga mexicana',
    words: [
      '¡Órale!', 'No manches', '¿Qué onda, güey?', 'Está padrísimo', 'Chido', 'Ahorita', 'Mande', 'Echar la hueva', 'Estar crudo',
      'Ni modo', 'Chamba', 'Cuate', '¡Aguas!', 'Qué padre', 'Neta', 'Aventón', 'Chela', 'Fresa', 'Ándale', 'Hasta la madre',
    ],
  },
  {
    id: 'viaje',
    emoji: '✈️',
    title: 'El viaje',
    words: [
      'Vuelo con escala en Madrid', 'Maleta de 23 kilos', 'Uber que no llega', 'Tarjeta que no pasa', 'Pedir la cuenta', 'Cambio de pesos a francos',
      'Bloqueador solar', 'Insolación', 'Sacar la foto del ticket', 'Llegar a la casa a las 5 a. m.', 'Perder el pasaporte', 'Turbulencia',
      'Migración', 'Dividir la cuenta entre 7', 'Llevar la cuenta de propinas', 'Dormir en el avión', 'Cargador sin batería', 'Guía turístico',
    ],
  },
]
