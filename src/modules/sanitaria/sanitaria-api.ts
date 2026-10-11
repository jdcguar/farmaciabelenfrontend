import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
import type { ConsultaSanitaria, DocumentoSanitario, PaginadoSanitario } from './sanitaria.types'
import type { VistaSanitaria, RecursoSanitario } from './sanitaria.config'
export function consultaSanitariaUrl(c: ConsultaSanitaria) { const q = new URLSearchParams(); for (const [k, v] of Object.entries(c)) if (v !== undefined && v !== '') q.set(k, String(v)); return q.toString() }
export async function leerSanitaria<T>(ruta: string, signal?: AbortSignal) { return (await solicitarApi<{ success: true; data: T }>(`/sanitaria${ruta}`, { signal })).data }
export async function escribirSanitaria(ruta: string, method: 'POST' | 'PATCH', datos: object) { return (await solicitarApi<{ success: true; data: Record<string, unknown> }>(`/sanitaria${ruta}`, { method, datos })).data }
export const listarSanitaria = (v: VistaSanitaria, c: ConsultaSanitaria, signal?: AbortSignal) => leerSanitaria<PaginadoSanitario>(`/${v}?${consultaSanitariaUrl(c)}`, signal)
export const obtenerSanitaria = (v: RecursoSanitario, id: string, signal?: AbortSignal) => leerSanitaria<DocumentoSanitario>(`/${v}/${encodeURIComponent(id)}`, signal)
export const auditoriaSanitaria = (v: RecursoSanitario, id: string, pagina: number, tamanoPagina: number, signal?: AbortSignal) => leerSanitaria<PaginadoSanitario<EventoAuditoria>>(`/${v}/${id}/auditoria?${consultaSanitariaUrl({ pagina, tamanoPagina })}`, signal)
export const impactoSanitaria = (id: string, signal?: AbortSignal) => leerSanitaria<Record<string, unknown>>(`/retiros/${id}/impacto`, signal)
export function exportarSanitaria(v: RecursoSanitario, c: ConsultaSanitaria, formato: 'pdf' | 'xlsx') { const { pagina: _p, tamanoPagina: _t, ...filtros } = c; return descargarArchivoApi(`/sanitaria/${v}/exportaciones`, { method: 'POST', datos: { filtros, formato }, nombreArchivoAlternativo: `sanitaria-${v}.${formato}` }) }
export function cargarAdjuntoSanitaria(v: RecursoSanitario, id: string, version: number, archivo: File) { const f = new FormData(); f.set('version', String(version)); f.set('archivo', archivo); return escribirSanitaria(`/${v}/${id}/adjuntos`, 'POST', f) }
export const descargarAdjuntoSanitaria = (v: RecursoSanitario, id: string, adjuntoId: string) => descargarArchivoApi(`/sanitaria/${v}/${id}/adjuntos/${adjuntoId}`, { nombreArchivoAlternativo: 'evidencia-sanitaria' })
