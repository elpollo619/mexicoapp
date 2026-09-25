export const GROUP_VIEWS = ['votar', 'juegos', 'fotos', 'cuates'] as const
export type GroupView = (typeof GROUP_VIEWS)[number]

export const INFO_VIEWS = ['moverse', 'propinas', 'lista', 'sos', 'tips', 'jerga', 'instalar'] as const
export type InfoView = (typeof INFO_VIEWS)[number]
