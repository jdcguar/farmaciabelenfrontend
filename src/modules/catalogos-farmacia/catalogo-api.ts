import { solicitarApi } from '../../shared/api/cliente-api'
import { descargarArchivoApi } from '../../shared/api/descargar-archivo-api'
import type { ClaveCatalogo, ConsultaAuditoria, ConsultaCatalogo, EntradaCatalogo, EventoAuditoria, OpcionReferencia, Paginado, Referencia, RegistroCatalogo } from './catalogo.types'
type Respuesta<T> = { success: true; data: T }
const ruta = (clave: ClaveCatalogo) => `/catalogos/${clave}`
export function consultaUrl(parametros: object): string {
  const consulta = new URLSearchParams()
  Object.entries(parametros).forEach(([clave, valor]: [string, unknown]) => {
    if (valor !== undefined && valor !== null && valor !== '') consulta.set(clave, String(valor))
  })
  return consulta.toString()
}
export async function listarCatalogo(clave: ClaveCatalogo, parametros: ConsultaCatalogo, signal?: AbortSignal) {
  return (await solicitarApi<Respuesta<Paginado<RegistroCatalogo>>>(`${ruta(clave)}?${consultaUrl(parametros)}`, { signal })).data
}
export async function obtenerRegistro(clave: ClaveCatalogo, id: string, signal?: AbortSignal) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta(clave)}/${encodeURIComponent(id)}`, { signal })).data
}
export async function guardarRegistro(clave: ClaveCatalogo, datos: EntradaCatalogo, registro?: RegistroCatalogo) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(registro ? `${ruta(clave)}/${registro.id}` : ruta(clave), { method: registro ? 'PUT' : 'POST', datos: registro ? { ...datos, version: registro.version } : datos })).data
}
export async function actualizarImagenProducto(registro: RegistroCatalogo, imagen: File) {
  const formulario = new FormData()
  formulario.append('version', String(registro.version)); formulario.append('imagen', imagen)
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta('productos')}/${registro.id}/imagen`, { method: 'PUT', datos: formulario })).data
}
export async function eliminarImagenProducto(registro: RegistroCatalogo) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta('productos')}/${registro.id}/imagen`, { method: 'DELETE', datos: { version: registro.version } })).data
}
export async function inactivarRegistro(clave: ClaveCatalogo, registro: RegistroCatalogo, motivo: string) {
  await solicitarApi<null>(`${ruta(clave)}/${registro.id}/inactivar`, { method: 'PATCH', datos: { version: registro.version, motivo } })
}
export async function homologarProveedor(registro: RegistroCatalogo, estado: string, motivo: string) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta('proveedores')}/${registro.id}/homologacion`, { method: 'PATCH', datos: { version: registro.version, estado, motivo } })).data
}
export async function cerrarPrecio(registro: RegistroCatalogo, vigenteHasta: string, motivo: string) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta('precios-vigentes')}/${registro.id}/cerrar-vigencia`, { method: 'PATCH', datos: { version: registro.version, vigenteHasta, motivo } })).data
}
export async function obtenerPrecioActual(presentacionId: string, fecha: string, signal?: AbortSignal) {
  return (await solicitarApi<Respuesta<RegistroCatalogo>>(`${ruta('precios-vigentes')}/actual/${encodeURIComponent(presentacionId)}?${consultaUrl({ fecha })}`, { signal })).data
}
export async function listarAuditoria(clave: ClaveCatalogo, id: string, parametros: ConsultaAuditoria, signal?: AbortSignal) {
  return (await solicitarApi<Respuesta<Paginado<EventoAuditoria>>>(`${ruta(clave)}/${id}/auditoria?${consultaUrl(parametros)}`, { signal })).data
}
export async function exportarCatalogo(clave: ClaveCatalogo, parametros: ConsultaCatalogo, formato: 'pdf' | 'xlsx') {
  const { pagina: _pagina, tamanoPagina: _tamanoPagina, ...criterios } = parametros
  await descargarArchivoApi(`${ruta(clave)}/exportaciones`, { method: 'POST', datos: { ...criterios, formato }, nombreArchivoAlternativo: `${clave}.${formato}` })
}
export type CriteriosReferencia = Pick<ConsultaCatalogo, 'sucursalId' | 'bodegaId' | 'productoId' | 'presentacionId' | 'tipo' | 'estadoHomologacion'>
export async function listarReferencias(referencia: Exclude<Referencia, 'municipios'>, busqueda: string, pagina: number, signal?: AbortSignal, criterios: CriteriosReferencia = {}): Promise<Paginado<OpcionReferencia>> {
  if (referencia === 'sucursales') return (await solicitarApi<Respuesta<Paginado<OpcionReferencia>>>(`/sucursales/mantenimiento?${consultaUrl({ pagina, tamanoPagina: 50, busqueda, estados: 'ACTIVO', orden: 'nombre', direccion: 'asc' })}`, { signal })).data
  return listarCatalogo(referencia, { ...criterios, pagina, tamanoPagina: 50, busqueda, activo: true, orden: 'nombre', direccion: 'asc' }, signal)
}
export async function obtenerReferencia(referencia: Exclude<Referencia, 'municipios'>, id: string, signal?: AbortSignal): Promise<OpcionReferencia> {
  if (referencia === 'sucursales') return (await solicitarApi<Respuesta<OpcionReferencia>>(`/sucursales/${encodeURIComponent(id)}`, { signal })).data
  return obtenerRegistro(referencia, id, signal)
}
export async function cargarMunicipios(signal?: AbortSignal): Promise<OpcionReferencia[]> {
  const departamentos = (await solicitarApi<Respuesta<OpcionReferencia[]>>('/ubicaciones/departamentos', { signal })).data
  const resultados = await Promise.all(departamentos.map(async (departamento) => {
    const municipios = (await solicitarApi<Respuesta<Array<{ id: string; codigo: string; nombre: string }>>>(`/ubicaciones/departamentos/${departamento.id}/municipios`, { signal })).data
    // Los endpoints geográficos ya devuelven únicamente registros activos.
    return municipios.map((item) => ({ ...item, activo: true, nombre: `${item.nombre} · ${departamento.nombre}` }))
  }))
  return resultados.flat().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
