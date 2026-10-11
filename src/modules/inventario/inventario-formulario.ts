import type { Campo } from './components/inventario-campo'
import type { DatosFormulario, LineaMovimiento, VistaInventario } from './inventario.types'
import { erroresMovimiento, esDecimal, fechaLocal, fechaValida } from './inventario-reglas'

const sucursal: Campo = { clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales', requerido: true }
const presentacion: Campo = { clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones', requerido: true }
const referencia: Campo = { clave: 'referencia', etiqueta: 'Referencia del documento', requerido: true, minimo: 2, maximo: 150 }
const motivo: Campo = { clave: 'motivo', etiqueta: 'Motivo', tipo: 'area', requerido: true, minimo: 5, maximo: 250 }
const evidencia: Campo = { clave: 'evidencia', etiqueta: 'Evidencia o justificante', tipo: 'area', requerido: true, minimo: 5, maximo: 500 }
export function camposFormulario(vista: VistaInventario, datos: DatosFormulario, corporativo: boolean): Campo[] {
  if (vista === 'lotes') return [presentacion, { clave: 'numero', etiqueta: 'Número de lote', requerido: true, maximo: 80 }, { clave: 'fechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', requerido: true }, { clave: 'fechaFabricacion', etiqueta: 'Fecha de fabricación', tipo: 'fecha' }, { clave: 'fechaVencimiento', etiqueta: 'Fecha de vencimiento', tipo: 'fecha', ayuda: 'Obligatoria al ingresar medicamentos y productos con control de vencimiento.' }, { clave: 'proveedorId', etiqueta: 'Proveedor de origen', referencia: 'proveedores' }, { clave: 'referenciaOrigen', etiqueta: 'Referencia de origen', requerido: true, minimo: 2, maximo: 150 }]
  if (vista === 'reservas') return [sucursal, presentacion, { clave: 'unidadId', etiqueta: 'Unidad de la cantidad', referencia: 'unidades', requerido: true }, { clave: 'cantidad', etiqueta: 'Cantidad a reservar', tipo: 'decimal', requerido: true, ayuda: 'Respeta la precisión de la unidad seleccionada. Se convierte a unidades base en el servidor.' }, { clave: 'expiraEn', etiqueta: 'Fecha y hora de expiración', tipo: 'hora', requerido: true, ayuda: 'Hora de Guatemala (UTC−06:00).' }, referencia]
  if (vista === 'bloqueos') return [{ ...sucursal, requerido: !corporativo, ayuda: corporativo ? 'Sin sucursal: bloqueo corporativo. Las ubicaciones siempre requieren sucursal.' : undefined }, { clave: 'alcance', etiqueta: 'Alcance del bloqueo', tipo: 'opciones', requerido: true, opciones: ['PRODUCTO', 'LOTE', 'UBICACION'].map(valor => ({ valor, etiqueta: valor === 'PRODUCTO' ? 'Producto' : valor === 'LOTE' ? 'Lote' : 'Ubicación' })) }, { clave: 'objetivoId', etiqueta: 'Registro a bloquear', requerido: true, ...(datos.alcance === 'LOTE' ? { inventario: 'lotes' as const } : { referencia: datos.alcance === 'UBICACION' ? 'ubicaciones' as const : 'productos' as const }) }, { clave: 'clase', etiqueta: 'Clase de bloqueo', tipo: 'opciones', requerido: true, opciones: [{ valor: 'OPERATIVO', etiqueta: 'Operativo' }, { valor: 'SANITARIO', etiqueta: 'Sanitario' }], ayuda: 'Los bloqueos sanitarios requieren la etapa de evaluación para su liberación.' }, motivo, evidencia]
  if (vista === 'conteos') return [sucursal, { clave: 'bodegaId', etiqueta: 'Bodega', referencia: 'bodegas', requerido: true }, { clave: 'ubicacionId', etiqueta: 'Ubicación a contar', referencia: 'ubicaciones', requerido: true }, referencia, motivo, evidencia]
  return [sucursal, referencia, ...(datos.tipo === 'CARGA_INICIAL' ? [{ clave: 'fechaCorte', etiqueta: 'Fecha de corte del inventario inicial', tipo: 'fecha' as const, requerido: true, ayuda: 'Debe ser igual o anterior a hoy.' }] : []), ...(datos.tipo?.startsWith('AJUSTE_') ? [{ clave: 'movimientoCorregidoId', etiqueta: 'Movimiento que se corrige (opcional)', inventario: 'movimientos' as const }] : []), motivo, evidencia]
}
export function validarCampos(campos: Campo[], datos: DatosFormulario): Record<string, string> {
  const errores: Record<string, string> = {}
  for (const c of campos) {
    const valor = datos[c.clave]?.trim() ?? ''
    if (!valor && c.requerido) { errores[c.clave] = 'Completa este campo.'; continue }
    if (!valor) continue
    if (c.minimo && valor.length < c.minimo) errores[c.clave] = `Escribe al menos ${c.minimo} caracteres.`
    if (c.maximo && valor.length > c.maximo) errores[c.clave] = `Máximo ${c.maximo} caracteres.`
    if (c.tipo === 'fecha' && !fechaValida(valor)) errores[c.clave] = 'Fecha inválida.'
    if (c.tipo === 'decimal' && !esDecimal(valor)) errores[c.clave] = 'Cantidad positiva con hasta 9 enteros y 6 decimales.'
    if (c.tipo === 'entero' && (!/^\d+$/.test(valor) || Number(valor) > 36500)) errores[c.clave] = 'Usa un número entero entre 0 y 36500.'
  }
  return errores
}
export function validarFormulario(vista: VistaInventario, datos: DatosFormulario, lineas: LineaMovimiento[], corporativo: boolean) {
  const errores = validarCampos(camposFormulario(vista, datos, corporativo), datos)
  if (vista === 'lotes' && datos.fechaFabricacion && datos.fechaVencimiento && datos.fechaFabricacion > datos.fechaVencimiento) errores.fechaVencimiento = 'El vencimiento no puede ser anterior a la fabricación.'
  if (vista === 'reservas' && (!Number.isFinite(Date.parse(`${datos.expiraEn}-06:00`)) || Date.parse(`${datos.expiraEn}-06:00`) <= Date.now())) errores.expiraEn = 'La expiración debe estar en el futuro.'
  if (vista === 'bloqueos' && datos.alcance === 'UBICACION' && !datos.sucursalId) errores.sucursalId = 'El bloqueo de una ubicación requiere sucursal.'
  if (['movimientos', 'ajustes', 'carga-inicial'].includes(vista)) {
    Object.assign(errores, erroresMovimiento(datos.tipo, lineas))
    if (datos.tipo === 'CARGA_INICIAL' && datos.fechaCorte > fechaLocal()) errores.fechaCorte = 'La fecha de corte no puede estar en el futuro.'
  }
  return errores
}
