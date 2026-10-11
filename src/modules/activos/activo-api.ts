import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi, guardarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
import { rutaActivo } from './activo.config'
import { criteriosExportacion, entradaActivo, entradaEntrega, entradaTipo, parametrosActivos } from './activo-reglas'
import type { Asignacion, CamposActivo, CamposTipo, Consulta, Devolucion, EntradaRecepcion, EntradaRevision, Entrega, Paginado, PdfCreacion, Recurso, Registros, SolicitudDetalle } from './activo.types'
async function json<T>(ruta: string, method = 'GET', datos?: unknown, signal?: AbortSignal): Promise<T> { return (await solicitarApi<{ success: true; data: T }>(ruta, { method, datos, signal, sinCargaGlobal: method === 'GET' })).data }
export const listarActivos = <R extends Recurso>(recurso: R, consulta: Consulta, signal?: AbortSignal) => json<Paginado<Registros[R]>>(`${rutaActivo(recurso)}?${parametrosActivos(consulta)}`, 'GET', undefined, signal)
export const obtenerActivo = <R extends Recurso>(recurso: R, id: string, signal?: AbortSignal) => json<Registros[R]>(rutaActivo(recurso, id), 'GET', undefined, signal)
export const guardarActivo = (d: CamposActivo, registro?: Registros['activos']) => json<Registros['activos']>(rutaActivo('activos', registro?.id), registro ? 'PUT' : 'POST', entradaActivo(d, registro?.version))
export const guardarTipo = (d: CamposTipo, registro?: Registros['tipos']) => json<Registros['tipos']>(rutaActivo('tipos', registro?.id), registro ? 'PUT' : 'POST', entradaTipo(d, registro?.version))
export const crearAsignacion = (sucursalId: string, empleadoId: string, detalles: Entrega[]) => json<Asignacion & { pdf: PdfCreacion }>('/activos/asignaciones', 'POST', entradaEntrega(sucursalId, empleadoId, detalles))
export const revisarAsignacion = (id: string, datos: EntradaRevision) => json<{ asignacion: Asignacion; devolucion: Devolucion | null }>(`${rutaActivo('mis-activos', id)}/revision`, 'POST', datos)
export const solicitarDevolucion = (id: string, version: number, detalles: SolicitudDetalle[]) => json<Devolucion>(`${rutaActivo('mis-activos', id)}/devoluciones`, 'POST', { version, detalles })
export const recibirDevolucion = (id: string, datos: EntradaRecepcion) => json<Devolucion>(`${rutaActivo('devoluciones', id)}/recepcion`, 'PATCH', datos)
export const resolverDevolucion = (id: string, version: number, decision: 'APROBADA' | 'RECHAZADA', motivo: string) => json<Devolucion>(`${rutaActivo('devoluciones', id)}/resolucion`, 'PATCH', { version, decision, motivo: motivo.trim() })
export const accionActivo = (recurso: 'activos' | 'tipos', id: string, accion: 'baja' | 'mantenimiento' | 'inactivar', version: number, motivo: string) => json<Registros[typeof recurso]>(`${rutaActivo(recurso, id)}/${accion}`, 'PATCH', { version, motivo: motivo.trim() })
export const opcionesActivo = <T extends { id: string }>(recurso: 'sucursales' | 'tipos' | 'empleados' | 'disponibles', consulta: { pagina: number; tamanoPagina: number; busqueda?: string; sucursalId?: string }, signal: AbortSignal) => json<Paginado<T>>(`/activos/opciones/${recurso}?${parametrosActivos(consulta)}`, 'GET', undefined, signal)
export const auditoriaActivo = (recurso: Recurso, id: string, pagina: number, tamanoPagina: number, signal: AbortSignal) => json<Paginado<EventoAuditoria>>(`${rutaActivo(recurso, id)}/auditoria?${parametrosActivos({ pagina, tamanoPagina })}`, 'GET', undefined, signal)
export const historialActivo = (id: string, pagina: number, tamanoPagina: number, signal: AbortSignal) => json<Paginado<Asignacion>>(`${rutaActivo('activos', id)}/asignaciones?${parametrosActivos({ pagina, tamanoPagina })}`, 'GET', undefined, signal)
export const descargarPdfActivo = (recurso: Recurso, id: string, numero: string) => descargarArchivoApi(`${rutaActivo(recurso, id)}/pdf`, { nombreArchivoAlternativo: `${numero}.pdf` })
export const exportarActivos = (recurso: Recurso, consulta: Consulta, formato: 'pdf' | 'xlsx') => descargarArchivoApi(`${rutaActivo(recurso)}/exportaciones`, { method: 'POST', datos: criteriosExportacion(consulta, formato), nombreArchivoAlternativo: `${recurso}.${formato}` })
export function guardarPdfCreacion(pdf: Extract<PdfCreacion, { generado: true }>) { const binario = atob(pdf.contenidoBase64); guardarArchivoApi({ contenido: new Blob([Uint8Array.from(binario, c => c.charCodeAt(0))], { type: pdf.tipoMime }), nombreArchivo: pdf.nombreArchivo }) }
