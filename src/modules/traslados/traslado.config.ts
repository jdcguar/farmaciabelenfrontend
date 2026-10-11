import type { AccionTraslado, EstadoTraslado, PrioridadTraslado, TipoTraslado } from './traslado.types'
export const estadosTraslado: Record<EstadoTraslado, string> = { SOLICITADO: 'Solicitado', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', PREPARADO: 'Preparado', EN_TRANSITO: 'En tránsito', RECIBIDO: 'Recibido', CERRADO: 'Cerrado', CANCELADO: 'Cancelado' }
export const tiposTraslado: Record<TipoTraslado, string> = { ABASTECIMIENTO: 'Abastecimiento', DEVOLUCION_INTERNA: 'Devolución interna', HORIZONTAL: 'Entre sucursales', REDISTRIBUCION: 'Redistribución' }
export const prioridadesTraslado: Record<PrioridadTraslado, string> = { ORDINARIA: 'Ordinaria', URGENTE: 'Urgente', EMERGENCIA: 'Emergencia' }
export const accionesTraslado: Record<AccionTraslado, string> = { aprobar: 'Aprobar solicitud', rechazar: 'Rechazar solicitud', cancelar: 'Cancelar traslado', cerrar: 'Cerrar traslado', 'habilitar-recepcion': 'Habilitar recepción' }
export const permisoTraslado = (accion = 'VER') => `TRASLADOS.OPERACIONES.${accion}`
export const estadosDespacho = { PREPARADO: 'Preparado', EN_TRANSITO: 'En tránsito', RECIBIDO: 'Recibido', CANCELADO: 'Cancelado' }
export const estadosRecepcion = { REGISTRADA: 'Registrada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada' }
export type RutaTraslado = { modo: 'listado' | 'despachos' | 'recepciones' | 'crear' | 'detalle' | 'preparar' | 'despacho' | 'recibir' | 'recepcion' | 'incidencia' | 'resolver' | 'justificar' | 'retorno' | 'complementario'; id?: string; incidenciaId?: string }
export const titulosRutaTraslado: Record<RutaTraslado['modo'], string> = { listado: 'Traslados', despachos: 'Despachos', recepciones: 'Recepciones', crear: 'Nueva solicitud de traslado', detalle: 'Detalle del traslado', preparar: 'Preparación de despacho', despacho: 'Detalle del despacho', recibir: 'Registrar recepción', recepcion: 'Detalle de recepción', incidencia: 'Registrar incidencia', resolver: 'Resolver incidencia', justificar: 'Justificar faltante', retorno: 'Solicitar retorno', complementario: 'Nuevo traslado complementario' }
export function reconocerRutaTraslado(ruta: string): RutaTraslado | null {
  if (ruta === '/traslados') return { modo: 'listado' }
  if (ruta === '/traslados/despachos') return { modo: 'despachos' }
  if (ruta === '/traslados/recepciones') return { modo: 'recepciones' }
  if (ruta === '/traslados/nuevo') return { modo: 'crear' }
  const uuid = '([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})'
  const incidencia = ruta.match(new RegExp(`^/traslados/${uuid}/incidencias/nueva$`, 'i'))
  if (incidencia) return { modo: 'incidencia', id: incidencia[1]! }
  const resolver = ruta.match(new RegExp(`^/traslados/${uuid}/incidencias/${uuid}/(resolver|justificar)$`, 'i'))
  if (resolver) return { modo: resolver[3] as 'resolver' | 'justificar', id: resolver[1]!, incidenciaId: resolver[2]! }
  const relacionada = ruta.match(new RegExp(`^/traslados/${uuid}/(retorno|complementario)$`, 'i'))
  if (relacionada) return { modo: relacionada[2] as 'retorno' | 'complementario', id: relacionada[1]! }
  const preparar = ruta.match(new RegExp(`^/traslados/${uuid}/preparar$`, 'i'))
  if (preparar) return { modo: 'preparar', id: preparar[1]! }
  const recibir = ruta.match(new RegExp(`^/traslados/despachos/${uuid}/recepciones/nueva$`, 'i'))
  if (recibir) return { modo: 'recibir', id: recibir[1]! }
  const despacho = ruta.match(new RegExp(`^/traslados/despachos/${uuid}$`, 'i'))
  if (despacho) return { modo: 'despacho', id: despacho[1]! }
  const recepcion = ruta.match(new RegExp(`^/traslados/recepciones/${uuid}$`, 'i'))
  if (recepcion) return { modo: 'recepcion', id: recepcion[1]! }
  const m = ruta.match(/^\/traslados\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i)
  return m ? { modo: 'detalle', id: m[1]! } : null
}
export const puedeRutaTraslado = (ruta: RutaTraslado, permisos: readonly string[]) => {
  if (ruta.modo === 'crear') return permisos.includes(permisoTraslado('CREAR'))
  const acciones: Partial<Record<RutaTraslado['modo'], string>> = { preparar: 'PREPARAR', recibir: 'RECIBIR', incidencia: 'INCIDENCIAS', resolver: 'RESOLVER_INCIDENCIA', justificar: 'RESOLVER_INCIDENCIA', retorno: 'CREAR', complementario: 'CREAR' }
  const accion = acciones[ruta.modo]
  return permisos.includes(permisoTraslado()) && (!accion || permisos.includes(permisoTraslado(accion))) && (ruta.modo !== 'justificar' || permisos.includes('TRASLADOS.ACCESO.CORPORATIVO'))
}
