import type { Recurso } from './activo.types'
export const condiciones = ['NUEVO', 'BUENO', 'REGULAR', 'MALO'] as const
export const situaciones = ['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'BAJA'] as const
export const estadosAsignacion = ['VIGENTE', 'PARCIAL', 'CERRADA'] as const
export const estadosDevolucion = ['SOLICITADA', 'RECIBIDA', 'APROBADA', 'RECHAZADA'] as const
export const recursosActivos: Recurso[] = ['activos', 'tipos', 'asignaciones', 'devoluciones', 'mis-activos', 'mis-devoluciones']
export const configActivos = {
  activos: { titulo: 'Activos Fijos', singular: 'activo', permiso: 'ACTIVOS', ver: 'VER', crear: 'CREAR', pantalla: 'activos-registro' },
  tipos: { titulo: 'Tipos de activo', singular: 'tipo de activo', permiso: 'TIPOS', ver: 'VER', crear: 'CREAR', pantalla: 'activos-tipos' },
  asignaciones: { titulo: 'Asignaciones', singular: 'asignación', permiso: 'ASIGNACIONES', ver: 'VER', crear: 'CREAR', pantalla: 'activos-asignaciones' },
  devoluciones: { titulo: 'Devoluciones', singular: 'devolución', permiso: 'ASIGNACIONES', ver: 'VER_DEVOLUCIONES', crear: '', pantalla: 'activos-devoluciones' },
  'mis-activos': { titulo: 'Mis activos', singular: 'asignación', permiso: 'ASIGNACIONES', ver: 'VER_PROPIAS', crear: '', pantalla: 'activos-propios' },
  'mis-devoluciones': { titulo: 'Mis devoluciones', singular: 'devolución', permiso: 'ASIGNACIONES', ver: 'VER_PROPIAS', crear: '', pantalla: 'activos-propios' },
} as const
export type RutaActivo = { recurso: Recurso; vista: 'listado' | 'crear' | 'editar' | 'detalle' | 'revision' | 'solicitar' | 'recibir' | 'resolver'; id?: string }
export const rutaActivo = (recurso: Recurso, id?: string) => (recurso === 'activos' ? '/activos' : `/activos/${recurso}`) + (id ? `/${encodeURIComponent(id)}` : '')
export const permisoActivo = (recurso: Recurso, accion?: string) => `ACTIVOS.${configActivos[recurso].permiso}.${accion ?? configActivos[recurso].ver}`
export function reconocerRutaActivo(camino: string): RutaActivo | null {
  const segmentos = camino.split(/[?#]/)[0]!.replace(/\/+$/, '').split('/').filter(Boolean)
  if (segmentos.shift() !== 'activos') return null
  const recurso: Recurso = recursosActivos.includes(segmentos[0] as Recurso) && segmentos[0] !== 'activos' ? segmentos.shift() as Recurso : 'activos'
  if (!segmentos.length) return { recurso, vista: 'listado' }
  if (segmentos[0] === 'nuevo' && segmentos.length === 1 && configActivos[recurso].crear) return { recurso, vista: 'crear' }
  const id = segmentos.shift()!
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null
  if (!segmentos.length) return { recurso, id, vista: 'detalle' }
  if (segmentos.length !== 1) return null
  const accion = segmentos[0]
  if (accion === 'editar' && ['activos', 'tipos'].includes(recurso)) return { recurso, id, vista: 'editar' }
  if (recurso === 'mis-activos' && (accion === 'revision' || accion === 'solicitar')) return { recurso, id, vista: accion }
  if (recurso === 'devoluciones' && (accion === 'recibir' || accion === 'resolver')) return { recurso, id, vista: accion }
  return null
}
export function puedeRutaActivo(ruta: RutaActivo, permisos: readonly string[]) {
  const requiere = [permisoActivo(ruta.recurso)]
  if (ruta.vista === 'crear') return permisos.includes(permisoActivo(ruta.recurso, 'CREAR'))
  const acciones: Partial<Record<RutaActivo['vista'], string>> = { editar: 'ACTUALIZAR', revision: 'CONFIRMAR_RECEPCION', solicitar: 'SOLICITAR_DEVOLUCION', recibir: 'RECIBIR_DEVOLUCION', resolver: 'APROBAR_DEVOLUCION' }
  const accion = acciones[ruta.vista]
  if (accion) requiere.push(permisoActivo(ruta.recurso, accion))
  return requiere.every(p => permisos.includes(p))
}
export function tituloRutaActivo(ruta: RutaActivo) {
  if (ruta.vista === 'listado') return configActivos[ruta.recurso].titulo
  if (ruta.vista === 'revision') return 'Revisión inicial'
  if (ruta.vista === 'solicitar') return 'Solicitar devolución'
  if (ruta.vista === 'recibir') return 'Registrar recepción'
  if (ruta.vista === 'resolver') return 'Resolver devolución'
  return `${ruta.vista === 'crear' ? 'Crear' : ruta.vista === 'editar' ? 'Editar' : 'Detalle de'} ${configActivos[ruta.recurso].singular}`
}
