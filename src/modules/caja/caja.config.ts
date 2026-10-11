import type { RecursoCaja } from './caja.types'
export const recursosCaja: RecursoCaja[] = ['politicas', 'cajas', 'turnos', 'movimientos', 'arqueos', 'cierres', 'remesas', 'custodias', 'depositos', 'cobros-repartidor', 'rendiciones', 'incidencias', 'cierres-diarios']
type ConfigRecursoCaja = { titulo: string; singular: string; grupo: string; crear: string; accion: string; estados: Record<string, string> }
export const cajaConfig: Record<RecursoCaja, ConfigRecursoCaja> = {
  politicas: { titulo: 'Configuración de caja', singular: 'configuración', grupo: 'POLITICAS', crear: 'CONFIGURAR', accion: 'Configurar sucursal', estados: {} },
  cajas: { titulo: 'Cajas', singular: 'caja', grupo: 'CAJAS', crear: 'CREAR', accion: 'Crear caja', estados: { DISPONIBLE: 'Disponible', SUSPENDIDA: 'Suspendida', INACTIVA: 'Inactiva' } },
  turnos: { titulo: 'Turnos de caja', singular: 'turno', grupo: 'TURNOS', crear: 'ABRIR', accion: 'Abrir turno', estados: { ABIERTO: 'Abierto', CIERRE_PENDIENTE: 'Pendiente de cierre', CERRADO: 'Cerrado' } },
  movimientos: { titulo: 'Movimientos', singular: 'movimiento', grupo: 'MOVIMIENTOS', crear: 'CREAR', accion: 'Registrar movimiento', estados: { REGISTRADO: 'Registrado', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' } },
  arqueos: { titulo: 'Arqueos', singular: 'arqueo', grupo: 'ARQUEOS', crear: 'CREAR', accion: 'Preparar arqueo', estados: { PENDIENTE: 'Pendiente de conteo', CONTADO: 'Contado', APROBADO: 'Aprobado' } },
  cierres: { titulo: 'Cierres de turno', singular: 'cierre', grupo: 'CIERRES', crear: '', accion: '', estados: { PENDIENTE: 'Pendiente de aprobación', APROBADO: 'Aprobado', INVESTIGACION: 'En investigación', REABIERTO: 'Reabierto' } },
  remesas: { titulo: 'Remesas', singular: 'remesa', grupo: 'CUSTODIA', crear: '', accion: '', estados: { RETIRADO: 'Retirado', CAJA_FUERTE: 'Caja fuerte', EN_TRANSITO: 'En tránsito', RECIBIDO: 'Recibido', PEND_DEPOSITO: 'Pendiente de depósito', DEPOSITADO: 'Depositado', CANCELADO: 'Cancelado' } },
  custodias: { titulo: 'Cadena de custodia', singular: 'custodia', grupo: 'CUSTODIA', crear: '', accion: '', estados: { PENDIENTE: 'Pendiente de aceptación', ACEPTADA: 'Aceptada' } },
  depositos: { titulo: 'Depósitos', singular: 'depósito', grupo: 'DEPOSITOS', crear: 'PREPARAR', accion: 'Preparar depósito', estados: { PREPARADO: 'Preparado', REGISTRADO: 'Registrado en banco', CONFIRMADO: 'Confirmado', DIFERENCIA: 'Con diferencia', CANCELADO: 'Cancelado' } },
  'cobros-repartidor': { titulo: 'Cobros de repartidores', singular: 'cobro', grupo: 'RENDICIONES', crear: '', accion: '', estados: { CUSTODIA: 'Bajo custodia', RENDIDO: 'Rendido' } },
  rendiciones: { titulo: 'Rendiciones', singular: 'rendición', grupo: 'RENDICIONES', crear: 'REGISTRAR', accion: 'Declarar rendición', estados: { REGISTRADA: 'Registrada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada' } },
  incidencias: { titulo: 'Incidencias de caja', singular: 'incidencia', grupo: 'INCIDENCIAS', crear: '', accion: '', estados: { ABIERTA: 'Abierta', RESUELTA: 'Resuelta' } },
  'cierres-diarios': { titulo: 'Cierres diarios', singular: 'cierre diario', grupo: 'CIERRES', crear: 'CONSOLIDAR', accion: 'Consolidar día', estados: { CERRADO: 'Cerrado' } },
}
export const permisoCaja = (recurso: RecursoCaja, accion = 'VER') => `CAJA.${cajaConfig[recurso].grupo}.${accion}`
export const tiposCaja = { VENTAS: 'Caja de ventas', CHICA: 'Caja chica' } as const
export const rutaCaja = (recurso: RecursoCaja) => `/caja/${recurso}`
export type RutaCaja = { recurso: RecursoCaja; modo: 'listado' | 'crear' | 'detalle' | 'editar' | 'operacion' | 'consolidado'; id?: string; operacion?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function reconocerRutaCaja(ruta: string): RutaCaja | null {
  if (ruta === '/caja' || ruta === '/caja/consolidado') return { recurso: 'cierres', modo: 'consolidado' }
  const [base, recurso, id, accion, extra] = ruta.replace(/^\//, '').split('/')
  if (base !== 'caja' || !recursosCaja.includes(recurso as RecursoCaja) || extra !== undefined) return null
  const r = recurso as RecursoCaja
  if (!id) return { recurso: r, modo: 'listado' }
  if (id === 'nuevo' && !accion && cajaConfig[r].crear) return { recurso: r, modo: 'crear' }
  if (!uuid.test(id)) return null
  if (!accion) return { recurso: r, modo: 'detalle', id }
  if (r === 'politicas' && accion === 'editar') return { recurso: r, modo: 'editar', id }
  return operacionesRutaCaja[r]?.[accion] ? { recurso: r, modo: 'operacion', id, operacion: accion } : null
}
export const operacionesRutaCaja: Partial<Record<RecursoCaja, Record<string, string>>> = {
  cajas: { estado: 'CAJA.CAJAS.ACTUALIZAR' },
  turnos: { cierre: 'CAJA.TURNOS.CERRAR', retiros: 'CAJA.CUSTODIA.RETIRAR', cobros: 'CAJA.MOVIMIENTOS.COBRAR', reintegros: 'CAJA.MOVIMIENTOS.REINTEGRAR', 'anulaciones-venta': 'CAJA.MOVIMIENTOS.ANULAR_VENTA' },
  movimientos: { confirmar: 'CAJA.MOVIMIENTOS.CONFIRMAR', cancelar: 'CAJA.MOVIMIENTOS.CANCELAR', correccion: 'CAJA.MOVIMIENTOS.CORREGIR' },
  arqueos: { contar: 'CAJA.ARQUEOS.CONTAR', aprobar: 'CAJA.ARQUEOS.APROBAR' },
  cierres: { aprobar: 'CAJA.CIERRES.APROBAR', reabrir: 'CAJA.CIERRES.REABRIR' },
  remesas: { aceptar: 'CAJA.CUSTODIA.ACEPTAR', retorno: 'CAJA.CUSTODIA.RETORNAR', custodia: 'CAJA.CUSTODIA.ENTREGAR' },
  custodias: { aceptar: 'CAJA.CUSTODIA.ACEPTAR' },
  depositos: { registrar: 'CAJA.DEPOSITOS.REGISTRAR', confirmar: 'CAJA.DEPOSITOS.CONFIRMAR', cancelar: 'CAJA.DEPOSITOS.CANCELAR' },
  rendiciones: { confirmar: 'CAJA.RENDICIONES.CONFIRMAR', cancelar: 'CAJA.RENDICIONES.CANCELAR' },
  incidencias: { resolver: 'CAJA.INCIDENCIAS.RESOLVER' },
}
export function puedeRutaCaja(ruta: RutaCaja, permisos: readonly string[]) {
  const ver = permisos.includes(permisoCaja(ruta.recurso))
  if (ruta.modo === 'crear') return !!cajaConfig[ruta.recurso].crear && permisos.includes(permisoCaja(ruta.recurso, cajaConfig[ruta.recurso].crear)) && (ruta.recurso !== 'turnos' || permisos.includes(permisoCaja('cajas')) && permisos.includes(permisoCaja('politicas')))
  if (ruta.modo === 'operacion') return ver && permisos.includes(operacionesRutaCaja[ruta.recurso]?.[ruta.operacion ?? ''] ?? '')
  return ver && (ruta.modo !== 'editar' || permisos.includes(permisoCaja('politicas', 'CONFIGURAR')))
}
export function tituloRutaCaja(ruta: RutaCaja) {
  return ruta.modo === 'consolidado' ? 'Flujo de efectivo' : ruta.modo === 'listado' ? cajaConfig[ruta.recurso].titulo : ruta.modo === 'crear' ? cajaConfig[ruta.recurso].accion : ruta.modo === 'editar' ? 'Editar configuración de caja' : ruta.modo === 'operacion' ? `${ruta.operacion?.replaceAll('-', ' ')} · ${cajaConfig[ruta.recurso].singular}` : `Detalle de ${cajaConfig[ruta.recurso].singular}`
}
