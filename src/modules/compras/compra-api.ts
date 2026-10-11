import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { RespuestaApi } from '../autenticacion/autenticacion.types'
import { micro, decimalTexto } from './compra-reglas'
import type { RecursoCompra, RecursoDocumento, ConsultaCompra, Paginado, DocumentoCompra, DetalleCompra, ObligacionCompra, ObligacionListado, EventoAuditoria, ComparacionCompra, CreacionRequest, DecisionRequest, AccionCompra } from './compra.types'
const ruta = (recurso: RecursoCompra, id?: string) => `/compras/${recurso}${id ? `/${encodeURIComponent(id)}` : ''}`
export function consultaCompraUrl(c: ConsultaCompra) {
  const q = new URLSearchParams()
  // La lista permitida evita enviar búsqueda, orden u otros filtros ajenos al contrato.
  for (const k of ['pagina', 'tamanoPagina', 'sucursalId', 'proveedorId', 'origenId', 'estado', 'desde', 'hasta'] as const) if (c[k] !== undefined && c[k] !== '') q.set(k, String(c[k]))
  return q.toString()
}
export async function listarCompras(recurso: RecursoDocumento, consulta: ConsultaCompra, signal?: AbortSignal) {
  return (await solicitarApi<RespuestaApi<Paginado<DocumentoCompra>>>(`${ruta(recurso)}?${consultaCompraUrl(consulta)}`, { signal })).data
}
export async function listarObligaciones(consulta: ConsultaCompra, signal?: AbortSignal) {
  return (await solicitarApi<RespuestaApi<Paginado<ObligacionListado>>>(`${ruta('obligaciones')}?${consultaCompraUrl(consulta)}`, { signal })).data
}
export async function obtenerCompra(recurso: RecursoDocumento, id: string, signal?: AbortSignal) { return (await solicitarApi<RespuestaApi<DetalleCompra>>(ruta(recurso, id), { signal })).data }
export async function obtenerObligacion(id: string, signal?: AbortSignal) { return (await solicitarApi<RespuestaApi<ObligacionCompra>>(ruta('obligaciones', id), { signal })).data }
export async function crearCompra(recurso: RecursoDocumento, datos: CreacionRequest, revisionId?: string) {
  return (await solicitarApi<RespuestaApi<DetalleCompra>>(revisionId ? `${ruta('ordenes', revisionId)}/revisiones` : ruta(recurso), { method: 'POST', datos })).data
}
export async function decidirCompra(recurso: RecursoDocumento, id: string, accion: AccionCompra, datos: DecisionRequest) {
  return (await solicitarApi<RespuestaApi<DetalleCompra>>(`${ruta(recurso, id)}/${accion}`, { method: accion === 'avisos' ? 'POST' : 'PATCH', datos })).data
}
// El id de esta URL identifica la factura; la versión pertenece a la obligación.
export async function decidirObligacion(facturaId: string, accion: 'autorizar' | 'retener' | 'anular', datos: DecisionRequest) {
  return (await solicitarApi<RespuestaApi<ObligacionCompra>>(`${ruta('facturas', facturaId)}/obligacion/${accion}`, { method: 'PATCH', datos })).data
}
export async function compararCompra(id: string, signal?: AbortSignal) { return (await solicitarApi<RespuestaApi<ComparacionCompra>>(`${ruta('solicitudes', id)}/comparacion`, { signal })).data }
export async function auditoriaCompra(recurso: RecursoCompra, id: string, pagina: number, tamanoPagina: number, signal?: AbortSignal) { return (await solicitarApi<RespuestaApi<Paginado<EventoAuditoria>>>(`${ruta(recurso, id)}/auditoria?${consultaCompraUrl({ pagina, tamanoPagina })}`, { signal })).data }
export async function adjuntarCompra(recurso: RecursoDocumento, id: string, version: number, archivo: File) {
  const datos = new FormData(); datos.append('archivo', archivo); datos.append('version', String(version))
  return (await solicitarApi<RespuestaApi<DetalleCompra>>(`${ruta(recurso, id)}/adjuntos`, { method: 'POST', datos })).data
}
export function descargarAdjunto(recurso: RecursoDocumento, id: string, adjunto: { id: string; nombre: string }) { return descargarArchivoApi(`${ruta(recurso, id)}/adjuntos/${encodeURIComponent(adjunto.id)}`, { nombreArchivoAlternativo: adjunto.nombre }) }
export function generarSolicitudPdf(id: string) {
  return generarCompraPdf('solicitudes', id)
}
export function generarCompraPdf(recurso: Exclude<RecursoCompra, 'evaluaciones'>, id: string) {
  const nombres = { solicitudes: 'solicitud', cotizaciones: 'cotizacion', ordenes: 'orden', recepciones: 'recepcion', facturas: 'factura', obligaciones: 'obligacion' }
  return descargarArchivoApi(`${ruta(recurso, id)}/pdf`, { method: 'GET', nombreArchivoAlternativo: `${nombres[recurso]}-${id}.pdf` })
}
export function exportarCompra(recurso: RecursoDocumento, consulta: ConsultaCompra, formato: 'pdf' | 'xlsx') {
  const { pagina: _pagina, tamanoPagina: _tamano, ...filtros } = Object.fromEntries(new URLSearchParams(consultaCompraUrl(consulta)))
  return descargarArchivoApi(`${ruta(recurso)}/exportaciones`, { method: 'POST', datos: { ...filtros, formato }, nombreArchivoAlternativo: `compras-${recurso}.${formato}` })
}
export async function todosDocumentos(recurso: RecursoDocumento, consulta: ConsultaCompra, signal?: AbortSignal) {
  const items: DocumentoCompra[] = []
  for (let pagina = 1; ; pagina++) {
    const r = await listarCompras(recurso, { ...consulta, pagina, tamanoPagina: 200 }, signal); items.push(...r.items)
    if (pagina >= r.totalPaginas) return items
  }
}
export async function lineasFacturables(ordenId: string, signal?: AbortSignal) {
  const [recepciones, facturas] = await Promise.all([todosDocumentos('recepciones', { origenId: ordenId, estado: 'CONFIRMADA' }, signal), todosDocumentos('facturas', { origenId: ordenId }, signal)])
  const recibidas = await Promise.all(recepciones.map(r => obtenerCompra('recepciones', r.id, signal)))
  const emitidas = await Promise.all(facturas.filter(f => ['REGISTRADA', 'DIFERENCIA', 'VALIDADA'].includes(f.estado)).map(f => obtenerCompra('facturas', f.id, signal)))
  const usadas = new Map<string, bigint>()
  for (const f of emitidas) for (const l of f.lineas) if (l.origenLineaId) usadas.set(l.origenLineaId, (usadas.get(l.origenLineaId) ?? 0n) + micro(l.cantidad))
  return recibidas.flatMap(r => r.lineas.map(l => ({ ...l, descripcion: `${l.descripcion} · ${r.documentoProveedor ?? r.numero} · lote ${l.numeroLote ?? 'sin lote'}`, cantidad: decimalTexto(micro(l.aceptada) - (usadas.get(l.id) ?? 0n)) }))).filter(l => micro(l.cantidad) > 0n)
}
