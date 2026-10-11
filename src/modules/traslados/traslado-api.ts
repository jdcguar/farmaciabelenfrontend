import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
import type { AccionTraslado, ConsultaTraslado, CreacionTraslado, DecisionTraslado, DetalleTraslado, Paginado, Traslado } from './traslado.types'
import type { ConfirmacionDespacho, ContextoDespacho, ContextoRecepcion, DetalleDespacho, DetalleRecepcion, PreparacionTraslado, RegistroRecepcion } from './traslado.types'
import type { ContextoIncidencia, DetalleTraslado as DocumentoTraslado, RegistroIncidencia, ResolucionTraslado } from './traslado.types'
import type { ConsultaDocumentoTraslado, DocumentoListado, RecursoDocumentoTraslado } from './traslado.types'
type Respuesta<T> = { success: true; data: T }
export function generarComprobanteTrasladoPdf(recurso: 'traslados' | RecursoDocumentoTraslado, id: string) {
  const ruta = recurso === 'traslados' ? `/traslados/${encodeURIComponent(id)}` : `/traslados/${recurso}/${encodeURIComponent(id)}`
  return descargarArchivoApi(`${ruta}/pdf`, { method: 'GET', nombreArchivoAlternativo: `comprobante-${recurso}-${id}.pdf` })
}
export function consultaDocumentoUrl(c: ConsultaDocumentoTraslado) {
  const q = new URLSearchParams()
  for (const k of ['pagina', 'tamanoPagina', 'origenSucursalId', 'destinoSucursalId', 'estado', 'prioridad', 'trasladoId', 'despachoId', 'desde', 'hasta'] as const) if (c[k] !== undefined && c[k] !== '') q.set(k, String(c[k]))
  return q.toString()
}
export async function listarDocumentosTraslado(recurso: RecursoDocumentoTraslado, c: ConsultaDocumentoTraslado, signal?: AbortSignal) { return (await solicitarApi<Respuesta<Paginado<DocumentoListado>>>(`/traslados/${recurso}?${consultaDocumentoUrl(c)}`, { signal })).data }
export function exportarDocumentosTraslado(recurso: RecursoDocumentoTraslado, c: ConsultaDocumentoTraslado, formato: 'pdf' | 'xlsx') {
  const filtros = Object.fromEntries(new URLSearchParams(consultaDocumentoUrl(c))); delete filtros.pagina; delete filtros.tamanoPagina
  return descargarArchivoApi(`/traslados/${recurso}/exportaciones`, { method: 'POST', datos: { ...filtros, formato }, nombreArchivoAlternativo: `traslados-${recurso}.${formato}` })
}
export function consultaTrasladoUrl(c: ConsultaTraslado) {
  const q = new URLSearchParams()
  for (const k of ['pagina', 'tamanoPagina', 'origenSucursalId', 'destinoSucursalId', 'estado', 'prioridad', 'desde', 'hasta'] as const) if (c[k] !== undefined && c[k] !== '') q.set(k, String(c[k]))
  return q.toString()
}
export async function listarTraslados(c: ConsultaTraslado, signal?: AbortSignal) { return (await solicitarApi<Respuesta<Paginado<Traslado>>>(`/traslados?${consultaTrasladoUrl(c)}`, { signal })).data }
export async function obtenerTraslado(id: string, signal?: AbortSignal) {
  const respuesta = await solicitarApi<Respuesta<DetalleTraslado>>(`/traslados/${encodeURIComponent(id)}`, { signal })
  return respuesta.data
}
export async function crearTraslado(datos: CreacionTraslado) { return (await solicitarApi<Respuesta<DetalleTraslado>>('/traslados', { method: 'POST', datos })).data }
export async function decidirTraslado(id: string, accion: AccionTraslado, datos: DecisionTraslado) { return (await solicitarApi<Respuesta<DetalleTraslado>>(`/traslados/${encodeURIComponent(id)}/${accion}`, { method: 'PATCH', datos })).data }
export function exportarTraslados(c: ConsultaTraslado, formato: 'pdf' | 'xlsx') {
  const filtros = Object.fromEntries(new URLSearchParams(consultaTrasladoUrl(c))); delete filtros.pagina; delete filtros.tamanoPagina
  return descargarArchivoApi('/traslados/exportaciones', { method: 'POST', datos: { ...filtros, formato }, nombreArchivoAlternativo: `traslados.${formato}` })
}
export async function auditoriaTraslado(id: string, pagina: number, tamanoPagina: number, signal?: AbortSignal) { return (await solicitarApi<Respuesta<Paginado<EventoAuditoria>>>(`/traslados/${encodeURIComponent(id)}/auditoria?${consultaTrasladoUrl({ pagina, tamanoPagina })}`, { signal })).data }
const hijo = (recurso: 'despachos' | 'recepciones', id: string) => `/traslados/${recurso}/${encodeURIComponent(id)}`
export async function prepararDespacho(id: string, datos: PreparacionTraslado) { return (await solicitarApi<Respuesta<DetalleDespacho>>(`/traslados/${encodeURIComponent(id)}/despachos`, { method: 'POST', datos })).data }
export async function obtenerDespacho(id: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<DetalleDespacho>>(hijo('despachos', id), { signal })).data }
export async function obtenerRecepcion(id: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<DetalleRecepcion>>(hijo('recepciones', id), { signal })).data }
export async function listarRecepciones(id: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<DetalleRecepcion[]>>(`${hijo('despachos', id)}/recepciones`, { signal })).data }
export async function despacharTraslado(id: string, datos: ConfirmacionDespacho) { return (await solicitarApi<Respuesta<DetalleDespacho>>(`${hijo('despachos', id)}/despachar`, { method: 'PATCH', datos })).data }
export async function cancelarDespacho(id: string, datos: DecisionTraslado) { return (await solicitarApi<Respuesta<DetalleDespacho>>(`${hijo('despachos', id)}/cancelar`, { method: 'PATCH', datos })).data }
export async function registrarCustodia(id: string, datos: { version: number; responsable: string; condiciones: string; evidencia: string }) { return (await solicitarApi<Respuesta<DetalleDespacho>>(`${hijo('despachos', id)}/custodia`, { method: 'POST', datos })).data }
export async function registrarRecepcion(id: string, datos: RegistroRecepcion) { return (await solicitarApi<Respuesta<DetalleRecepcion>>(`${hijo('despachos', id)}/recepciones`, { method: 'POST', datos })).data }
export async function confirmarRecepcion(id: string, version: number) { return (await solicitarApi<Respuesta<DetalleRecepcion>>(`${hijo('recepciones', id)}/confirmar`, { method: 'PATCH', datos: { version } })).data }
export async function cancelarRecepcion(id: string, datos: DecisionTraslado) { return (await solicitarApi<Respuesta<DetalleRecepcion>>(`${hijo('recepciones', id)}/cancelar`, { method: 'PATCH', datos })).data }
export async function obtenerContextoDespacho(id: string, signal?: AbortSignal): Promise<ContextoDespacho> {
  const despacho = await obtenerDespacho(id, signal)
  const [traslado, recepciones] = await Promise.all([obtenerTraslado(despacho.trasladoId, signal), listarRecepciones(id, signal)])
  return { despacho, traslado, recepciones }
}
export async function obtenerContextoRecepcion(id: string, signal?: AbortSignal): Promise<ContextoRecepcion> {
  const recepcion = await obtenerRecepcion(id, signal)
  return { ...await obtenerContextoDespacho(recepcion.despachoId, signal), recepcion }
}
export async function registrarIncidencia(id: string, datos: RegistroIncidencia) { return (await solicitarApi<Respuesta<DetalleTraslado>>(`/traslados/${encodeURIComponent(id)}/incidencias`, { method: 'POST', datos })).data }
export async function resolverIncidencia(id: string, datos: ResolucionTraslado) { return (await solicitarApi<Respuesta<DetalleTraslado>>(`/traslados/incidencias/${encodeURIComponent(id)}/resolver`, { method: 'PATCH', datos })).data }
export async function obtenerContextoIncidencia(id: string, incidenciaId: string, signal?: AbortSignal): Promise<ContextoIncidencia> {
  const traslado: DocumentoTraslado = await obtenerTraslado(id, signal), incidencia = traslado.incidencias.find(i => i.id === incidenciaId)
  if (!incidencia) throw new Error('La incidencia no pertenece a este traslado o ya no está disponible.')
  if (incidencia.asignacionId) {
    // El DTO no expone el despacho de la incidencia. Consultar en grupos limitados, sin cargar todas las guías a la vez.
    for (let inicio = 0; inicio < traslado.despachos.length; inicio += 4) {
      signal?.throwIfAborted()
      const guias = await Promise.all(traslado.despachos.slice(inicio, inicio + 4).map(d => obtenerDespacho(d.id, signal)))
      for (const despacho of guias) {
        const asignacion = despacho.asignaciones.find(a => a.id === incidencia.asignacionId)
        if (asignacion) return { traslado, incidencia, asignacion, despacho }
      }
    }
    throw new Error('No se encontró la asignación de la incidencia. Actualiza el traslado antes de continuar.')
  }
  return { traslado, incidencia, asignacion: null, despacho: null }
}
