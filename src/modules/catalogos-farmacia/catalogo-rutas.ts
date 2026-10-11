import { catalogos } from './catalogos.config'
import type { ClaveCatalogo } from './catalogo.types'
export type VistaCatalogo = 'listado' | 'crear' | 'detalle' | 'editar'
export function reconocerRutaCatalogo(ruta: string): { clave: ClaveCatalogo; vista: VistaCatalogo; id?: string; permiso: string } | null {
  const coincidencia = ruta.match(/^\/catalogos\/([^/]+)(?:\/([^/]+))?(\/editar)?\/?$/)
  if (!coincidencia || !Object.prototype.hasOwnProperty.call(catalogos, coincidencia[1])) return null
  const clave = coincidencia[1] as ClaveCatalogo
  const id = coincidencia[2]
  if (coincidencia[3] && (!id || id === 'nuevo')) return null
  const vista = id === 'nuevo' ? 'crear' : coincidencia[3] ? 'editar' : id ? 'detalle' : 'listado'
  return { clave, vista, id: id === 'nuevo' ? undefined : id, permiso: `CATALOGOS.${catalogos[clave].permiso}.${vista === 'crear' ? 'CREAR' : vista === 'editar' ? 'ACTUALIZAR' : 'VER'}` }
}
