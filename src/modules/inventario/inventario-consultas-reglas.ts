import { esDecimal } from './inventario-reglas'

export function validarConsultaStock(datos: { sucursalId: string; presentacionId: string; unidadId: string; cantidad: string; dias: string }, fefo: boolean) {
  const errores: Record<string, string> = {}
  if (!datos.sucursalId) errores.sucursalId = 'Selecciona una sucursal.'
  if (!datos.presentacionId) errores.presentacionId = 'Selecciona una presentación.'
  if (fefo) {
    if (!datos.unidadId) errores.unidadId = 'Selecciona la unidad de la cantidad.'
    if (!esDecimal(datos.cantidad)) errores.cantidad = 'Usa una cantidad positiva con hasta nueve enteros y seis decimales.'
    if (!/^\d+$/.test(datos.dias) || Number(datos.dias) > 36500) errores.dias = 'Usa días enteros entre 0 y 36500.'
  }
  return errores
}
export function validarUmbrales(datos: { alertaDias: string; preventivoDias: string; criticoDias: string; motivo: string }) {
  const errores: Record<string, string> = {}
  for (const c of ['alertaDias', 'preventivoDias', 'criticoDias'] as const) {
    if (!/^\d+$/.test(datos[c]) || Number(datos[c]) > 36500) errores[c] = 'Usa días enteros entre 0 y 36500.'
  }
  if (!errores.alertaDias && !errores.preventivoDias && Number(datos.alertaDias) < Number(datos.preventivoDias)) errores.alertaDias = 'Alerta debe ser mayor o igual a preventivo.'
  if (!errores.preventivoDias && !errores.criticoDias && Number(datos.preventivoDias) < Number(datos.criticoDias)) errores.preventivoDias = 'Preventivo debe ser mayor o igual a crítico.'
  if (datos.motivo.trim().length < 5 || datos.motivo.trim().length > 250) errores.motivo = 'Escribe un motivo de 5 a 250 caracteres.'
  return errores
}
