import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
import type { Caja, ConfiguracionCaja, ConsultaCaja, ContextoAperturaCaja, PaginadoCaja, PoliticaCaja, RecursoCaja, RegistroCaja, TurnoCaja } from './caja.types'
type Respuesta<T> = { success: true; data: T }
export function generarComprobanteMovimiento(id: string, claveIdempotencia: string) { return descargarArchivoApi(`/caja/movimientos/${encodeURIComponent(id)}/comprobante`, {method:'POST',datos:{claveIdempotencia,motivo:'Generar comprobante de venta',evidencia:'Solicitud desde Movimientos de Caja'},nombreArchivoAlternativo:'comprobante-venta.pdf'}) }
export function consultaCajaUrl(c: ConsultaCaja) {
  const q = new URLSearchParams()
  for (const k of ['pagina', 'tamanoPagina', 'sucursalId', 'estado', 'cajaId', 'turnoId', 'desde', 'hasta'] as const) if (c[k] !== undefined && c[k] !== '') q.set(k, String(c[k]))
  return q.toString()
}
export async function listarCaja<T extends RegistroCaja = RegistroCaja>(recurso: RecursoCaja, consulta: ConsultaCaja, signal?: AbortSignal) {
  return (await solicitarApi<Respuesta<PaginadoCaja<T>>>(`/caja/${recurso}?${consultaCajaUrl(consulta)}`, { signal })).data
}
export async function obtenerCaja<T extends RegistroCaja = RegistroCaja>(recurso: RecursoCaja, id: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<T>>(`/caja/${recurso}/${encodeURIComponent(id)}`, { signal })).data }
export async function guardarPoliticaCaja(datos: { claveIdempotencia: string; sucursalId: string; version: number; configuracion: ConfiguracionCaja; motivo: string }) { return (await solicitarApi<Respuesta<PoliticaCaja>>('/caja/politicas', { method: 'PUT', datos })).data }
export async function crearCaja(datos: { claveIdempotencia: string; sucursalId: string; codigo: string; nombre: string; tipo: Caja['tipo'] }) { return (await solicitarApi<Respuesta<Caja>>('/caja/cajas', { method: 'POST', datos })).data }
export async function abrirCaja(datos: { claveIdempotencia: string; cajaId: string; denominaciones: { valor: string; cantidad: number }[]; evidencia: string; remesaFondoId?: string; ocurridoEn?: string; folioContingencia?: string; autorizacionHorario?: string }) { return (await solicitarApi<Respuesta<TurnoCaja>>('/caja/turnos', { method: 'POST', datos })).data }
export async function cambiarEstadoCaja(id: string, datos: { claveIdempotencia: string; version: number; estado: Caja['estado']; motivo: string; evidencia: string }) { return (await solicitarApi<Respuesta<Caja>>(`/caja/cajas/${encodeURIComponent(id)}/estado`, { method: 'PATCH', datos })).data }
export async function contextoAperturaCaja(cajaId: string, signal?: AbortSignal): Promise<ContextoAperturaCaja> {
  const caja = await obtenerCaja<Caja>('cajas', cajaId, signal)
  const r = await listarCaja<PoliticaCaja>('politicas', { sucursalId: caja.sucursalId, pagina: 1, tamanoPagina: 50 }, signal)
  if (r.items.length !== 1) throw new Error('La sucursal debe tener una configuración de Caja antes de abrir el turno.')
  return { caja, politica: r.items[0]! }
}
export async function auditoriaCaja(recurso: RecursoCaja, id: string, pagina: number, tamanoPagina: number, signal?: AbortSignal) { return (await solicitarApi<Respuesta<PaginadoCaja<EventoAuditoria>>>(`/caja/${recurso}/${encodeURIComponent(id)}/auditoria?${consultaCajaUrl({ pagina, tamanoPagina })}`, { signal })).data }
export function exportarCaja(recurso: RecursoCaja, consulta: ConsultaCaja, formato: 'pdf' | 'xlsx') {
  const filtros = Object.fromEntries(new URLSearchParams(consultaCajaUrl(consulta)))
  delete filtros.pagina; delete filtros.tamanoPagina
  return descargarArchivoApi(`/caja/${recurso}/exportaciones`, { method: 'POST', datos: { formato, filtros }, nombreArchivoAlternativo: `caja-${recurso}.${formato}` })
}
export async function operarCaja(ruta: string, method: 'POST' | 'PATCH' | 'PUT', datos: object) { return (await solicitarApi<Respuesta<RegistroCaja | { aceptada: boolean; remesa?: RegistroCaja; incidencia?: RegistroCaja } | { originalId: string; compensacion: RegistroCaja; correcto: RegistroCaja | null }>>(`/caja${ruta}`, { method, datos })).data }
export type ConsolidadoCaja = { moneda: 'GTQ'; desde: string; hasta: string; generadoEn: string; naturaleza: string; flujoNetoOperativo: string; movimientos: { sucursalId: string; tipo: string; direccion: string; importe: string; cantidad: number }[]; custodiaActual: { sucursalId: string; estado: string; importe: string }[]; cobrosEnRepartidor: { sucursalId: string; repartidorId: string; importe: string }[]; efectivoEnCaja: { sucursalId: string; importe: string }[]; depositadoEnPeriodo: { sucursalId: string; importe: string }[]; ventasContraEntrega: { sucursalId: string; importe: string }[]; diferenciasAbiertas: { sucursalId: string; cantidad: number; faltantes: string; sobrantes: string }[] }
export async function consolidadoCaja(c: { sucursalId?: string; desde: string; hasta: string }, signal?: AbortSignal) { return (await solicitarApi<Respuesta<ConsolidadoCaja>>(`/caja/consolidado?${consultaCajaUrl(c)}`, { signal })).data }
export async function contextoConteoArqueoCaja(id: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<{ arqueoId: string; version: number; sucursalId: string; turnoId: string; denominaciones: string[] }>>(`/caja/arqueos/${encodeURIComponent(id)}/contexto-conteo`, { signal })).data }
