/** Avatares anime (public/avatars/<id>.jpg, 200×200). Quien no tiene, usa la máscara de luchador en SVG. */
const WITH_IMAGE = new Set(['cristian', 'bia', 'pipo', 'tania', 'jhoni', 'nicolas', 'pablo', 'invitado'])

export const avatarSrc = (id: string): string | null => (WITH_IMAGE.has(id) ? `${import.meta.env.BASE_URL}avatars/${id}.jpg` : null)
