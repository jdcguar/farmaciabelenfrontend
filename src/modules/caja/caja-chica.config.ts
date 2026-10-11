import { esUuidCaja } from './caja-reglas'

export const permisoVerCajaChica = 'ORGANIZACION.SUCURSALES.LIQUIDACIONES_VER'
export type RutaCajaChica = { modo: 'fondos' | 'liquidaciones' | 'detalle'; sucursalId?: string; id?: string }
export function reconocerRutaCajaChica(ruta: string): RutaCajaChica | null {
  if (ruta === '/caja/chica') return { modo: 'fondos' }
  if (ruta === '/caja/liquidaciones') return { modo: 'liquidaciones' }
  const detalle = /^\/caja\/liquidaciones\/([^/]+)\/([^/]+)$/.exec(ruta)
  if (detalle && esUuidCaja(detalle[1]!) && esUuidCaja(detalle[2]!)) return { modo: 'detalle', sucursalId: detalle[1]!, id: detalle[2]! }
  const liquidaciones = /^\/caja\/liquidaciones\/([^/]+)$/.exec(ruta)
  if (liquidaciones && esUuidCaja(liquidaciones[1]!)) return { modo: 'liquidaciones', sucursalId: liquidaciones[1]! }
  const coincidencia = /^\/caja\/chica\/([^/]+)$/.exec(ruta)
  return coincidencia && esUuidCaja(coincidencia[1]!) ? { modo: 'fondos', sucursalId: coincidencia[1]! } : null
}

export function puedeVerCajaChica(permisos: readonly string[], sucursalActual: string, sucursalId?: string) {
  return permisos.includes(permisoVerCajaChica) && (!sucursalId || sucursalId === sucursalActual || permisos.includes('ORGANIZACION.SUCURSALES.FINANZAS_CORPORATIVO'))
}
