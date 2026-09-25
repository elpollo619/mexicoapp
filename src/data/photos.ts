import credits from './photo-credits.json'
import type { CityId } from './trip'

const CREDITS = credits as Record<string, string>

export type PhotoKey =
  | 'cdmx' | 'angel' | 'cdmxair' | 'teotihuacan' | 'marietas' | 'gdl' | 'tequila'
  | 'tlaquepaque' | 'espiritu' | 'arco' | 'todossantos'

/** URL de la foto (solo si se descargó), con fallback en cadena */
export function photo(...keys: PhotoKey[]): { src: string; credit: string } | null {
  for (const k of keys) {
    if (CREDITS[k]) return { src: `${import.meta.env.BASE_URL}img/${k}.webp`, credit: CREDITS[k] }
  }
  return null
}

export const CITY_PHOTO: Record<CityId, PhotoKey[]> = {
  zrh: ['cdmxair', 'cdmx'],
  cdmx: ['cdmx', 'angel', 'cdmxair'],
  pvr: ['marietas', 'cdmxair'],
  gdl: ['gdl', 'tlaquepaque', 'tequila'],
  baja: ['arco', 'espiritu', 'todossantos'],
  home: ['cdmxair', 'angel'],
}

/** Foto especial por día (si no, la de la ciudad) */
export const DAY_PHOTO: Record<string, PhotoKey[]> = {
  '2026-10-03': ['angel', 'cdmx'],
  '2026-10-04': ['cdmx'],
  '2026-10-05': ['teotihuacan', 'cdmx'],
  '2026-10-06': ['marietas'],
  '2026-10-07': ['marietas'],
  '2026-10-08': ['tequila', 'gdl'],
  '2026-10-09': ['gdl'],
  '2026-10-10': ['tlaquepaque', 'gdl'],
  '2026-10-11': ['tequila', 'gdl'],
  '2026-10-12': ['espiritu', 'arco'],
  '2026-10-13': ['espiritu', 'arco'],
  '2026-10-14': ['espiritu', 'arco'],
  '2026-10-15': ['todossantos', 'arco'],
  '2026-10-16': ['arco'],
  '2026-10-17': ['angel', 'cdmx'],
  '2026-10-18': ['cdmxair'],
}

export const ALL_CREDITS = CREDITS
