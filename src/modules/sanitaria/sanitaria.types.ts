import type { SesionUsuario } from '../autenticacion/autenticacion.types'
export type DocumentoSanitario = { id: string; version: number; [campo: string]: unknown }
export type PaginadoSanitario<T = DocumentoSanitario> = { items: T[]; total: number; pagina: number; tamanoPagina: number; totalPaginas: number; actualizadoEn?: string }
export type ConsultaSanitaria = { pagina?: number; tamanoPagina?: number; sucursalId?: string; casoId?: string; productoId?: string; loteId?: string; retiroId?: string; categoriaId?: string; estado?: string; desde?: string; hasta?: string; orden?: 'vencimiento' | 'valor' }
export type DatosSanitaria = Record<string, string>
export type PropsSanitaria = { sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (v: boolean) => void }
export type AdjuntoSanitario = { id: string; nombre: string; tipoMime: string; bytes: number; sha256: string; creadoEn: string }
export const textoSanitario = (d: DocumentoSanitario | Record<string, unknown> | null | undefined, k: string): string => typeof d?.[k] === 'string' ? d[k] as string : ''
export const objetoSanitario = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
export const documentosSanitarios = (v: unknown): DocumentoSanitario[] => Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && typeof x.id === 'string') as DocumentoSanitario[] : []
