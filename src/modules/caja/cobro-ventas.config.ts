import type { Venta } from '../ventas/venta.types'
import { esUuidVenta } from '../ventas/venta-reglas'
export const rutaCobroVentas = '/caja/cobro-ventas'
export type RutaCobroVentas = { id?: string; detalle?: boolean; accion?: 'confirmar' | 'fiscal' | 'comprobante' }
export function reconocerRutaCobroVentas(ruta: string): RutaCobroVentas | null {
  if (ruta === rutaCobroVentas || ruta === rutaCobroVentas + '/') return {}
  const m = ruta.match(/^\/caja\/cobro-ventas\/([0-9a-f-]{36})(?:\/(cobrar|fiscal|comprobante))?\/?$/i)
  return m && esUuidVenta(m[1]!) ? { id: m[1], detalle: !m[2], accion: m[2] === 'cobrar' ? 'confirmar' : m[2] as RutaCobroVentas['accion'] } : null
}
export function puedeVerCobroVentas(permisos: readonly string[]) {
  return permisos.includes('VENTAS.VENTAS.VER') && permisos.includes('CAJA.MOVIMIENTOS.COBRAR')
}

export function estadoPreparacionCobro(e: Venta, ahora = Date.now()) {
  if (e.estado === 'CONFIRMADA') return 'Cobrada'
  if (e.estado === 'CANCELADA') return 'Cancelada'
  if (e.estado === 'ANULADA') return 'Anulada'
  if (e.estado === 'BORRADOR') return 'Por preparar'
  if (!e.expiraEn || !Number.isFinite(Date.parse(e.expiraEn)) || Date.parse(e.expiraEn) <= ahora) return 'Reserva vencida'
  return e.dispensacionEstado === 'VERIFICADA' ? 'Lista para cobrar' : 'Por verificar'
}

