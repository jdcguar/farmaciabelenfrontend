import type { DatosFormulario, EntradaInventario, LineaMovimiento, TipoMovimiento, VistaInventario } from './inventario.types'

export const esDecimal = (valor: string, permiteCero = false) => /^\d{1,9}(\.\d{1,6})?$/.test(valor.trim()) && (permiteCero || /[1-9]/.test(valor))
export function fechaLocal(): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const v = (tipo: string) => p.find(p => p.type === tipo)?.value ?? ''
  return `${v('year')}-${v('month')}-${v('day')}`
}
export function fechaValida(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(`${valor}T00:00:00Z`)) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor
}
export const tipoEsEntrada = (tipo: string) => tipo === 'CARGA_INICIAL' || tipo === 'AJUSTE_POSITIVO'
export function lineaInicial(tipo: TipoMovimiento = 'REUBICACION'): LineaMovimiento {
  return { presentacionId: '', loteId: null, origenExistenciaId: null, destinoUbicacionId: null, unidadId: '', cantidad: '', costeUnitarioBase: null, condicionDestino: tipo === 'CUARENTENA' ? 'CUARENTENA' : tipo === 'BLOQUEO' ? 'BLOQUEADA' : 'APTA' }
}
export function entradaFormulario(vista: VistaInventario, d: DatosFormulario, lineas: LineaMovimiento[], clave: string): EntradaInventario {
  const comun = { sucursalId: d.sucursalId, referencia: d.referencia?.trim(), motivo: d.motivo?.trim(), evidencia: d.evidencia?.trim(), claveIdempotencia: clave }
  if (vista === 'lotes') return { presentacionId: d.presentacionId, numero: d.numero.trim(), fechaIngreso: d.fechaIngreso, fechaFabricacion: d.fechaFabricacion || null, fechaVencimiento: d.fechaVencimiento || null, proveedorId: d.proveedorId || null, referenciaOrigen: d.referenciaOrigen.trim() }
  if (vista === 'reservas') return { sucursalId: d.sucursalId, presentacionId: d.presentacionId, unidadId: d.unidadId, cantidad: d.cantidad.trim(), expiraEn: `${d.expiraEn}${d.expiraEn.length === 16 ? ':00' : ''}-06:00`, referencia: d.referencia.trim(), claveIdempotencia: clave }
  if (vista === 'bloqueos') return { sucursalId: d.sucursalId || null, alcance: d.alcance, objetivoId: d.objetivoId, clase: d.clase, motivo: d.motivo.trim(), evidencia: d.evidencia.trim() }
  if (vista === 'conteos') return { ...comun, ubicacionId: d.ubicacionId }
  const tipo = d.tipo as TipoMovimiento
  return { ...comun, tipo, fechaCorte: tipo === 'CARGA_INICIAL' ? d.fechaCorte : null, movimientoCorregidoId: d.movimientoCorregidoId || null,
    lineas: lineas.map(l => ({ presentacionId: l.presentacionId, loteId: l.loteId || null, unidadId: l.unidadId, cantidad: l.cantidad.trim(), costeUnitarioBase: l.costeUnitarioBase?.trim() || null,
      origenExistenciaId: tipoEsEntrada(tipo) ? null : l.origenExistenciaId || null,
      destinoUbicacionId: tipo === 'AJUSTE_NEGATIVO' ? null : l.destinoUbicacionId || null,
      condicionDestino: tipo === 'CUARENTENA' ? 'CUARENTENA' : tipo === 'BLOQUEO' ? 'BLOQUEADA' : l.condicionDestino })) }
}
export function erroresMovimiento(tipo: string, lineas: LineaMovimiento[]): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!lineas.length || lineas.length > 100) errores.lineas = 'Registra de 1 a 100 líneas.'
  lineas.forEach((l, i) => {
    const prefijo = `lineas.${i}.`
    if (!l.presentacionId) errores[prefijo + 'presentacionId'] = 'Selecciona una presentación.'
    if (!l.unidadId) errores[prefijo + 'unidadId'] = 'Selecciona la unidad de la cantidad.'
    if (!esDecimal(l.cantidad)) errores[prefijo + 'cantidad'] = 'Cantidad positiva, hasta 9 enteros y 6 decimales.'
    if (l.costeUnitarioBase && !esDecimal(l.costeUnitarioBase, true)) errores[prefijo + 'costeUnitarioBase'] = 'Coste desde cero, con hasta 6 decimales.'
    if (!tipoEsEntrada(tipo) && !l.origenExistenciaId) errores[prefijo + 'origenExistenciaId'] = 'Selecciona la existencia de origen.'
    if (tipo !== 'AJUSTE_NEGATIVO' && !l.destinoUbicacionId) errores[prefijo + 'destinoUbicacionId'] = 'Selecciona la ubicación de destino.'
  })
  return errores
}
export function textoCantidad(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato'
  if (typeof valor === 'number') return String(valor)
  // No convertir cantidades exactas a punto flotante.
  return valor.includes('.') ? valor.replace(/0+$/, '').replace(/\.$/, '') : valor
}
export const fechaHora = (valor: string | null | undefined) => valor ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala' }).format(new Date(valor)) : 'Sin dato'
