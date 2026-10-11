import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi, obtenerArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
import type { AdjuntoVenta, BandejaCobroVenta, ConsultaCobroVenta, ConsultaVenta, ContingenciaVenta, DetalleVenta, IncidenciaVenta, PaginadoVenta, PoliticaVenta, ProductoVenta, RecetaPrivada, Venta } from './venta.types'
type Respuesta<T> = { success: true; data: T }
export function consultaVentaUrl(c: ConsultaVenta) { const q = new URLSearchParams(); for (const k of ['pagina','tamanoPagina','sucursalId','turnoId','clienteId','estado','fiscalEstado','desde','hasta','busqueda'] as const) if (c[k] !== undefined && c[k] !== '') q.set(k, String(c[k])); return q.toString() }
export async function leerVentaApi<T>(ruta: string, signal?: AbortSignal) { return (await solicitarApi<Respuesta<T>>(`/ventas${ruta}`, { signal })).data }
export async function escribirVentaApi<T = DetalleVenta>(ruta: string, method: 'POST' | 'PATCH', datos: object) { return (await solicitarApi<Respuesta<T>>(`/ventas${ruta}`, { method, datos })).data }
export const listarVentas = (c: ConsultaVenta, signal?: AbortSignal) => leerVentaApi<PaginadoVenta<Venta>>(`?${consultaVentaUrl(c)}`,signal)
export const obtenerVenta = (id: string, signal?: AbortSignal) => leerVentaApi<DetalleVenta>(`/${encodeURIComponent(id)}`,signal)
export const politicaVenta = (id: string, signal?: AbortSignal) => leerVentaApi<PoliticaVenta | null>(`/politicas/${encodeURIComponent(id)}`,signal)
export const buscarProductosVenta = (sucursalId: string, busqueda: string, pagina: number, signal?: AbortSignal) => leerVentaApi<PaginadoVenta<ProductoVenta>>(`/productos?${consultaVentaUrl({sucursalId,busqueda,pagina,tamanoPagina:20})}`,signal)
export const listarContingencias = (c: ConsultaVenta, signal?: AbortSignal) => leerVentaApi<PaginadoVenta<ContingenciaVenta>>(`/contingencias?${consultaVentaUrl({sucursalId:c.sucursalId,pagina:c.pagina,tamanoPagina:c.tamanoPagina})}`,signal)
export const obtenerContingencia = (id: string, signal?: AbortSignal) => leerVentaApi<ContingenciaVenta>(`/contingencias/${encodeURIComponent(id)}`,signal)
export const recetasVenta = (id: string, signal?: AbortSignal) => leerVentaApi<RecetaPrivada[]>(`/${encodeURIComponent(id)}/recetas`,signal)
export const adjuntosVenta = (id: string, signal?: AbortSignal) => leerVentaApi<AdjuntoVenta[]>(`/${encodeURIComponent(id)}/adjuntos`,signal)
export const incidenciasVenta = (id: string, signal?: AbortSignal) => leerVentaApi<IncidenciaVenta[]>(`/${encodeURIComponent(id)}/incidencias`,signal)
export const auditoriaVenta = (id: string, pagina: number, tamanoPagina: number, signal?: AbortSignal) => leerVentaApi<PaginadoVenta<EventoAuditoria>>(`/${encodeURIComponent(id)}/auditoria?${consultaVentaUrl({pagina,tamanoPagina})}`,signal)
export function exportarVentas(c: ConsultaVenta, formato: 'pdf' | 'xlsx') { const { pagina: _p, tamanoPagina: _t, ...filtros } = c; return descargarArchivoApi('/ventas/exportaciones',{method:'POST',datos:{claveIdempotencia:crypto.randomUUID(),filtros,formato},nombreArchivoAlternativo:`ventas.${formato}`}) }
export function exportarContingencias(c: ConsultaVenta, formato: 'pdf' | 'xlsx') { const filtros = c.sucursalId ? {sucursalId:c.sucursalId} : {}; return descargarArchivoApi('/ventas/contingencias/exportaciones',{method:'POST',datos:{claveIdempotencia:crypto.randomUUID(),filtros,formato},nombreArchivoAlternativo:`contingencias-manuales.${formato}`}) }
export function comprobanteVenta(id: string, datos: object) { return descargarArchivoApi(`/ventas/${encodeURIComponent(id)}/comprobante`,{method:'POST',datos,nombreArchivoAlternativo:'comprobante-interno.pdf'}) }
export function vistaPreviaComprobanteVenta(id: string, signal: AbortSignal) { return obtenerArchivoApi(`/ventas/${encodeURIComponent(id)}/comprobante`, {signal,nombreArchivoAlternativo:'comprobante-interno.pdf'}) }
export function generarComprobanteVenta(id: string, datos: object) { return obtenerArchivoApi(`/ventas/${encodeURIComponent(id)}/comprobante`, {method:'POST',datos,nombreArchivoAlternativo:'comprobante-interno.pdf'}) }
export function descargarAdjuntoVenta(id: string, adjuntoId: string) { return descargarArchivoApi(`/ventas/${encodeURIComponent(id)}/adjuntos/${encodeURIComponent(adjuntoId)}`,{nombreArchivoAlternativo:'evidencia'}) }
export function cargarAdjuntoVenta(id: string, version: number, recetaId: string, archivo: File) { const datos=new FormData(); datos.set('version',String(version)); if(recetaId) datos.set('recetaId',recetaId); datos.set('archivo',archivo); return escribirVentaApi<{adjuntoId:string;version:number}>(`/${encodeURIComponent(id)}/adjuntos`,'POST',datos) }

export function consultaCobroVentaUrl(c: ConsultaCobroVenta) { const q = new URLSearchParams(consultaVentaUrl(c)); if(c.vendedorId)q.set('vendedorId',c.vendedorId); return q.toString() }
export const listarCobrosVenta = (c: ConsultaCobroVenta, signal?: AbortSignal) => leerVentaApi<BandejaCobroVenta>(`/cobros?${consultaCobroVentaUrl(c)}`,signal)
