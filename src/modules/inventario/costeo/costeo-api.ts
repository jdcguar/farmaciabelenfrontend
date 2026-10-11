import { solicitarApi } from '../../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../../shared/api/descargar-archivo-api'
import { recursosCosteo, type RecursoCosteo, type ConsultaCosteo, type FilaCosteo, type ResultadoCosteo } from './costeo.config'
export async function listarCosteo(recurso: RecursoCosteo, consulta: ConsultaCosteo, signal?: AbortSignal) {
  const q = new URLSearchParams(); Object.entries(consulta).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)) })
  return (await solicitarApi<{ success: true; data: ResultadoCosteo }>(recursosCosteo[recurso].ruta + '?' + q, { signal })).data
}
export async function operarCosteo(recurso: 'valoracion' | 'reposiciones' | 'sugerencias', datos: unknown, aprobarId?: string) {
  const ruta = recursosCosteo[recurso].ruta + (aprobarId ? '/' + encodeURIComponent(aprobarId) + '/aprobar' : '')
  return (await solicitarApi<{ success: true; data: FilaCosteo }>(ruta, { method: aprobarId ? 'PATCH' : 'POST', datos })).data
}
export async function reposicionesParaSugerir(presentacionId: string, signal?: AbortSignal) {
  return (await solicitarApi<{ success: true; data: ResultadoCosteo }>(recursosCosteo.sugerencias.ruta + '/reposiciones?presentacionId=' + encodeURIComponent(presentacionId), { signal })).data
}
export async function exportarCosteo(recurso: RecursoCosteo, consulta: ConsultaCosteo, formato: 'pdf' | 'xlsx') {
  const { pagina: _p, tamanoPagina: _t, ...filtros } = consulta
  await descargarArchivoApi(recursosCosteo[recurso].ruta + '/exportaciones', { method: 'POST', datos: { ...filtros, formato }, nombreArchivoAlternativo: 'costeo-' + recurso + '.' + formato })
}
