import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { FondoCajaChica, LiquidacionCajaChica, PaginaFinanzas } from './presupuestos.types'
export async function listarCajaChica<T extends FondoCajaChica | LiquidacionCajaChica>(recurso: 'fondos' | 'liquidaciones', consulta: string, signal?: AbortSignal) { return (await solicitarApi<{ data: PaginaFinanzas<T> }>(`/caja-chica/${recurso}?${consulta}`, { signal })).data }
export async function descargarComprobante(sucursalId: string, movimientoId: string, nombre: string) { await descargarArchivoApi(`/sucursales/${sucursalId}/caja-chica/movimientos/${movimientoId}/comprobante`, { nombreArchivoAlternativo: nombre }) }
export async function consultarFinanzas<T>(sucursalId: string, ruta: string, signal?: AbortSignal): Promise<T> { return (await solicitarApi<{ success: true; data: T }>(`/sucursales/${encodeURIComponent(sucursalId)}/${ruta}`, { signal })).data }
export async function operarFinanzas<T>(sucursalId: string, ruta: string, datos: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<T> { return (await solicitarApi<{ success: true; data: T }>(`/sucursales/${encodeURIComponent(sucursalId)}/${ruta}`, { method, datos })).data }
