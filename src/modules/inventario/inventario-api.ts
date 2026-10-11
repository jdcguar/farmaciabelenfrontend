import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import { consultaUrl } from '../catalogos-farmacia/catalogo-api'
import type { EventoAuditoria, Paginado } from '../catalogos-farmacia/catalogo.types'
import type { AccionInventario, ConsultaInventario, Disponibilidad, EntradaInventario, Fefo, ParametrosInventario, RecursoInventario, RegistroInventario, ResultadoListado } from './inventario.types'

type Respuesta<T> = { success: true; data: T }
export async function consultarInventario<T>(ruta: string, parametros: object = {}, signal?: AbortSignal): Promise<T> {
  return (await solicitarApi<Respuesta<T>>(`/inventario/${ruta}?${consultaUrl(parametros)}`, { signal })).data
}
export const listarInventario = (recurso: RecursoInventario | 'vencimientos', consulta: ConsultaInventario, signal?: AbortSignal) => consultarInventario<ResultadoListado>(recurso, consulta, signal)
export const obtenerInventario = (recurso: RecursoInventario, id: string, signal?: AbortSignal) => consultarInventario<RegistroInventario>(`${recurso}/${encodeURIComponent(id)}`, {}, signal)
export async function crearInventario(recurso: 'lotes' | 'movimientos' | 'reservas' | 'bloqueos' | 'conteos', datos: EntradaInventario): Promise<RegistroInventario> {
  return (await solicitarApi<Respuesta<RegistroInventario>>(`/inventario/${recurso}`, { method: 'POST', datos })).data
}
export async function ejecutarAccion(recurso: RecursoInventario, id: string, accion: AccionInventario, datos: { version: number; motivo?: string; evidencia?: string; vidaUtilMinimaDias?: number }) {
  return (await solicitarApi<Respuesta<RegistroInventario>>(`/inventario/${recurso}/${encodeURIComponent(id)}/${accion}`, { method: 'PATCH', datos })).data
}
export async function registrarConteo(id: string, version: number, lineas: { existenciaId: string | null; presentacionId?: string; loteId: string | null; condicion: string; cantidad: string; evidencia: string }[]) {
  return (await solicitarApi<Respuesta<RegistroInventario>>(`/inventario/conteos/${encodeURIComponent(id)}/resultados`, { method: 'PUT', datos: { version, lineas } })).data
}
export async function expirarReservas(sucursalId: string) {
  return (await solicitarApi<Respuesta<{ expiradas: number; limiteLote: number }>>('/inventario/reservas/expirar', { method: 'POST', datos: { sucursalId } })).data
}
export const consultarDisponibilidad = (datos: { sucursalId: string; presentacionId: string }, signal?: AbortSignal) => consultarInventario<Disponibilidad>('disponibilidad', datos, signal)
export const consultarFefo = ({ sucursalId, presentacionId, unidadId, cantidad, vidaUtilMinimaDias }: { sucursalId: string; presentacionId: string; unidadId: string; cantidad: string; vidaUtilMinimaDias: number }, signal?: AbortSignal) => consultarInventario<Fefo>('fefo', { sucursalId, presentacionId, unidadId, cantidad: cantidad.trim(), vidaUtilMinimaDias }, signal)
export const obtenerParametros = (signal?: AbortSignal) => consultarInventario<ParametrosInventario>('parametros', {}, signal)
export async function guardarParametros(datos: { version: number; alertaDias: number; preventivoDias: number; criticoDias: number; motivo: string }) {
  return (await solicitarApi<Respuesta<ParametrosInventario>>('/inventario/parametros', { method: 'PUT', datos })).data
}
export const auditoriaInventario = (recurso: RecursoInventario, id: string, datos: { pagina: number; tamanoPagina: number; fecha?: string; orden?: string; direccion?: string }, signal?: AbortSignal) => consultarInventario<Paginado<EventoAuditoria>>(`${recurso}/${encodeURIComponent(id)}/auditoria`, datos, signal)
export async function exportarInventario(recurso: RecursoInventario, datos: ConsultaInventario, formato: 'pdf' | 'xlsx') {
  const { pagina: _pagina, tamanoPagina: _tamanoPagina, ...filtros } = datos
  await descargarArchivoApi(`/inventario/${recurso}/exportaciones`, { method: 'POST', datos: { ...filtros, formato }, nombreArchivoAlternativo: `inventario-${recurso}.${formato}` })
}
