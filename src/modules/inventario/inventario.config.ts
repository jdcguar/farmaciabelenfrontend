import type { ConsultaInventario, RecursoInventario, TipoMovimiento, VistaInventario } from './inventario.types'

export const recursos: RecursoInventario[] = ['lotes', 'existencias', 'movimientos', 'kardex', 'reservas', 'bloqueos', 'cuarentenas', 'conteos']
export const grupoMovimiento = (tipo: TipoMovimiento) => tipo === 'CARGA_INICIAL' ? 'CARGA_INICIAL' : tipo.startsWith('AJUSTE_') ? 'AJUSTES' : tipo === 'BLOQUEO' ? 'BLOQUEOS' : tipo === 'CUARENTENA' ? 'CUARENTENA' : 'MOVIMIENTOS'
export const etiqueta = (valor: string) => ({ CARGA_INICIAL: 'Carga inicial', AJUSTE_POSITIVO: 'Ajuste positivo', AJUSTE_NEGATIVO: 'Ajuste negativo', REUBICACION: 'Reubicación', CUARENTENA: 'Cuarentena', BLOQUEO: 'Bloqueo parcial', APTA: 'Apta', BLOQUEADA: 'Bloqueada', PENDIENTE: 'Pendiente', CONFIRMADO: 'Confirmado', ANULADO: 'Anulado', ACTIVA: 'Activa', PREPARADA: 'Preparada', CANCELADA: 'Cancelada', EXPIRADA: 'Expirada', CONSUMIDA: 'Consumida', EN_TRANSITO: 'En tránsito', ACTIVO: 'Activo', LEVANTADO: 'Levantado', ABIERTA: 'Abierta', PARCIAL: 'Parcial', RESUELTA: 'Resuelta', ABIERTO: 'Abierto', CERRADO: 'Cerrado', CONCILIADO: 'Conciliado', CANCELADO: 'Cancelado', VIGENTE: 'Vigente', PROXIMO: 'Próximo', PREVENTIVO: 'Preventivo', CRITICO: 'Crítico', VENCIDO: 'Vencido', DESCONOCIDO: 'Sin fecha', OPERATIVO: 'Operativo', SANITARIO: 'Sanitario', PRODUCTO: 'Producto', LOTE: 'Lote', UBICACION: 'Ubicación', ENTRADA: 'Entrada', SALIDA: 'Salida' } as Record<string, string>)[valor] ?? valor.replaceAll('_', ' ')
export const tiposMovimiento: TipoMovimiento[] = ['CARGA_INICIAL', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'REUBICACION', 'BLOQUEO', 'CUARENTENA']
export type DefinicionInventario = { titulo: string; singular: string; grupo: string; descripcion: string; crear?: boolean; estados?: string[]; campos?: string[] }
export const vistas: Record<VistaInventario, DefinicionInventario> = {
  lotes: { titulo: 'Lotes', singular: 'lote', grupo: 'LOTES', crear: true, descripcion: 'Identificación, origen y fechas de los lotes.', campos: ['numero', 'presentacionId', 'fechaIngreso', 'fechaVencimiento', 'proveedorId'] },
  existencias: { titulo: 'Existencias por ubicación', singular: 'existencia', grupo: 'EXISTENCIAS', descripcion: 'Saldo físico y condición por presentación, lote y ubicación.', estados: ['APTA', 'BLOQUEADA', 'CUARENTENA'], campos: ['presentacionId', 'loteId', 'ubicacionId', 'condicion', 'cantidadBase'] },
  movimientos: { titulo: 'Movimientos', singular: 'movimiento', grupo: 'MOVIMIENTOS', crear: true, descripcion: 'Registra y confirma las operaciones que modifican las existencias.', estados: ['PENDIENTE', 'CONFIRMADO', 'ANULADO'], campos: ['referencia', 'tipo', 'estado', 'creadoEn'] },
  kardex: { titulo: 'Kardex', singular: 'registro', grupo: 'KARDEX', descripcion: 'Entradas, salidas y saldos confirmados por posición.', campos: ['presentacionId', 'loteId', 'ubicacionId', 'entradaBase', 'salidaBase', 'saldoBase', 'ocurridoEn'] },
  reservas: { titulo: 'Reservas de stock', singular: 'reserva', grupo: 'RESERVAS', crear: true, descripcion: 'Compromisos de stock y preparación por FEFO.', estados: ['ACTIVA', 'PREPARADA', 'CANCELADA', 'EXPIRADA', 'EN_TRANSITO', 'CONSUMIDA'], campos: ['referencia', 'presentacionId', 'cantidadBase', 'estado', 'expiraEn'] },
  bloqueos: { titulo: 'Bloqueos', singular: 'bloqueo', grupo: 'BLOQUEOS', crear: true, descripcion: 'Restringe productos, lotes o ubicaciones con causa y evidencia.', estados: ['ACTIVO', 'LEVANTADO'], campos: ['alcance', 'objetivoId', 'clase', 'estado', 'motivo'] },
  cuarentenas: { titulo: 'Cuarentena', singular: 'caso', grupo: 'CUARENTENA', descripcion: 'Existencias segregadas y seguimiento de los casos.', estados: ['ABIERTA', 'PARCIAL', 'RESUELTA'], campos: ['presentacionId', 'loteId', 'ubicacionId', 'cantidadBase', 'resueltoBase', 'estado'] },
  conteos: { titulo: 'Conteos físicos', singular: 'conteo', grupo: 'CONTEOS', crear: true, descripcion: 'Captura cantidades, cierra resultados y concilia diferencias.', estados: ['ABIERTO', 'CERRADO', 'CONCILIADO', 'CANCELADO'], campos: ['referencia', 'ubicacionId', 'estado', 'creadoEn'] },
  disponibilidad: { titulo: 'Disponibilidad', singular: 'consulta', grupo: 'DISPONIBILIDAD', descripcion: 'Consulta stock apto, reservado, disponible y restringido.' },
  fefo: { titulo: 'Selección FEFO', singular: 'consulta', grupo: 'DISPONIBILIDAD', descripcion: 'Consulta las posiciones que vencen primero para una cantidad requerida.' },
  vencimientos: { titulo: 'Vencimientos', singular: 'posición', grupo: 'VENCIMIENTOS', descripcion: 'Seguimiento de fechas y alertas sobre existencias físicas.', estados: ['VIGENTE', 'PROXIMO', 'PREVENTIVO', 'CRITICO', 'VENCIDO', 'DESCONOCIDO'], campos: ['presentacionId', 'numeroLote', 'ubicacionId', 'cantidadBase', 'fechaVencimiento', 'diasRestantes', 'estadoVencimiento'] },
  parametros: { titulo: 'Configurar alertas de vencimiento', singular: 'configuración', grupo: 'VENCIMIENTOS', descripcion: 'Umbrales corporativos de alerta, prevención y criticidad.' },
  ajustes: { titulo: 'Ajustes', singular: 'ajuste', grupo: 'AJUSTES', crear: true, descripcion: 'Consulta y registra correcciones positivas o negativas con motivo y evidencia.', estados: ['PENDIENTE', 'CONFIRMADO', 'ANULADO'], campos: ['referencia', 'tipo', 'estado', 'creadoEn'] },
  'carga-inicial': { titulo: 'Carga inicial', singular: 'carga inicial', grupo: 'CARGA_INICIAL', crear: true, descripcion: 'Consulta y registra el inventario de apertura con su fecha de corte.', estados: ['PENDIENTE', 'CONFIRMADO', 'ANULADO'], campos: ['referencia', 'fechaCorte', 'estado', 'creadoEn'] },
}
export const rutaInventario = (vista: VistaInventario) => `/inventario/${vista}`
export const permisoVista = (vista: VistaInventario) => vista === 'carga-inicial' || vista === 'ajustes' ? 'INVENTARIO.MOVIMIENTOS.VER' : `INVENTARIO.${vistas[vista].grupo}.${vista === 'fefo' ? 'FEFO' : 'VER'}`
export const consultaMovimientos = (consulta: ConsultaInventario, cargasIniciales: boolean, ajustes = false): ConsultaInventario => cargasIniciales ? { ...consulta, tipo: 'CARGA_INICIAL', grupoMovimiento: undefined } : ajustes ? { ...consulta, tipo: consulta.tipo === 'AJUSTE_POSITIVO' || consulta.tipo === 'AJUSTE_NEGATIVO' ? consulta.tipo : undefined, grupoMovimiento: 'AJUSTES' } : consulta
export const camposFiltro = (recurso: VistaInventario) => ({
  presentacion: ['lotes', 'existencias', 'movimientos', 'reservas', 'kardex', 'cuarentenas', 'vencimientos'].includes(recurso),
  ubicacion: ['existencias', 'conteos', 'kardex', 'cuarentenas', 'vencimientos'].includes(recurso),
  lote: ['lotes', 'existencias', 'kardex', 'cuarentenas', 'vencimientos'].includes(recurso),
})
export type RutaInventario = { vista: VistaInventario; modo: 'listado' | 'crear' | 'detalle' | 'resultados'; id?: string }
export function reconocerRutaInventario(ruta: string): RutaInventario | null {
  const partes = ruta.split('/').filter(Boolean)
  if (partes[0] !== 'inventario' || !(partes[1] in vistas)) return null
  const vista = partes[1] as VistaInventario
  if (partes.length === 2) return { vista, modo: 'listado' }
  if (partes.length === 3 && partes[2] === 'nuevo' && vistas[vista].crear) return { vista, modo: 'crear' }
  if (!recursos.includes(vista as RecursoInventario) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partes[2] ?? '')) return null
  if (partes.length === 3) return { vista, modo: 'detalle', id: partes[2] }
  if (partes.length === 4 && vista === 'conteos' && partes[3] === 'resultados') return { vista, modo: 'resultados', id: partes[2] }
  return null
}
export function puedeRuta(ruta: RutaInventario, permisos: readonly string[]): boolean {
  if (ruta.modo === 'resultados') return permisos.includes('INVENTARIO.CONTEOS.VER') && permisos.includes('INVENTARIO.CONTEOS.REGISTRAR')
  if (ruta.modo === 'crear' && ruta.vista === 'movimientos') return tiposMovimiento.some(t => permisos.includes(`INVENTARIO.${grupoMovimiento(t)}.CREAR`))
  return permisos.includes(ruta.modo === 'crear' ? `INVENTARIO.${vistas[ruta.vista].grupo}.CREAR` : permisoVista(ruta.vista))
}
export const etiquetasCampos: Record<string, string> = {
  numero: 'Número de lote', numeroLote: 'Lote', presentacionId: 'Presentación', sucursalId: 'Sucursal', ubicacionId: 'Ubicación', loteId: 'Lote', proveedorId: 'Proveedor', condicion: 'Condición', cantidadBase: 'Cantidad base', resueltoBase: 'Cantidad resuelta', tipo: 'Tipo de movimiento', estado: 'Estado', referencia: 'Referencia', motivo: 'Motivo', evidencia: 'Evidencia', creadoEn: 'Fecha de registro', fechaIngreso: 'Fecha de ingreso', fechaFabricacion: 'Fabricación', fechaVencimiento: 'Vencimiento', referenciaOrigen: 'Referencia de origen', alcance: 'Alcance', objetivoId: 'Registro bloqueado', clase: 'Clase de bloqueo', entradaBase: 'Entrada', salidaBase: 'Salida', saldoBase: 'Saldo', ocurridoEn: 'Fecha del movimiento', expiraEn: 'Expira el', diasRestantes: 'Días restantes', estadoVencimiento: 'Alerta', direccion: 'Dirección', secuencia: 'Secuencia', fechaCorte: 'Fecha de corte', confirmadoEn: 'Confirmado el', motivoAnulacion: 'Motivo de anulación', motivoCierre: 'Motivo de cierre', motivoLevantamiento: 'Motivo de levantamiento', levantadoEn: 'Levantado el', cerradoEn: 'Cerrado el', actualizadoEn: 'Última actualización', movimientoCorregidoId: 'Movimiento corregido', conteoId: 'Conteo asociado', existenciaId: 'Existencia', detalleId: 'Detalle de movimiento', movimientoId: 'Movimiento', cantidadAsignadaBase: 'Cantidad asignada', estadoEfectivo: 'Estado efectivo', version: 'Versión' }

