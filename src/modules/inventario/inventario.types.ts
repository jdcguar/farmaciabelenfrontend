import type { Paginado } from '../catalogos-farmacia/catalogo.types'

export type RecursoInventario = 'lotes' | 'existencias' | 'movimientos' | 'kardex' | 'reservas' | 'bloqueos' | 'cuarentenas' | 'conteos'
export type VistaInventario = RecursoInventario | 'disponibilidad' | 'fefo' | 'vencimientos' | 'parametros' | 'ajustes' | 'carga-inicial'
export type TipoMovimiento = 'CARGA_INICIAL' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'REUBICACION' | 'BLOQUEO' | 'CUARENTENA'
export type Condicion = 'APTA' | 'BLOQUEADA' | 'CUARENTENA'
export type LineaMovimiento = {
  id?: string; presentacionId: string; loteId: string | null; origenExistenciaId: string | null
  destinoUbicacionId: string | null; condicionDestino: Condicion; unidadId: string; cantidad: string
  costeUnitarioBase: string | null; cantidadBase?: string; cantidadOriginal?: string; costeEstado?: string
  factorNumerador?: string; factorDenominador?: string
}
export type LineaConteo = { id: string; existenciaId: string; esperadaBase: string; contadaBase: string | null; diferenciaBase: string | null; evidencia: string | null }
export type Asignacion = { id: string; existenciaId: string; cantidadBase: string }
export type RegistroInventario = {
  id: string; version: number; creadoEn: string; creadoPorId: string | null; actualizadoEn: string | null
  sucursalId?: string | null; presentacionId?: string | null; ubicacionId?: string | null; loteId?: string | null
  numero?: string; fechaIngreso?: string; fechaFabricacion?: string | null; fechaVencimiento?: string | null
  proveedorId?: string | null; referenciaOrigen?: string; condicion?: Condicion; cantidadBase?: string
  estado?: string; tipo?: TipoMovimiento; referencia?: string; motivo?: string; evidencia?: string
  fechaCorte?: string | null; confirmadoEn?: string | null; confirmadoPorId?: string | null; motivoAnulacion?: string | null
  movimientoCorregidoId?: string | null; conteoId?: string | null; movimientoId?: string | null
  claveIdempotencia?: string; claveLote?: string; existenciaId?: string; detalleId?: string
  secuencia?: number; direccion?: string; entradaBase?: string; salidaBase?: string; saldoBase?: string; ocurridoEn?: string | null
  expiraEn?: string | null; cerradoEn?: string | null; motivoCierre?: string | null; estadoEfectivo?: string
  utilizable?: boolean; actualizadoEnConsulta?: string; cantidadAsignadaBase?: string; asignaciones?: Asignacion[]; incidencias?: { existenciaId: string; causas: string[] }[]
  alcance?: 'PRODUCTO' | 'LOTE' | 'UBICACION'; objetivoId?: string; clase?: 'OPERATIVO' | 'SANITARIO'
  levantadoEn?: string | null; motivoLevantamiento?: string | null; resueltoBase?: string
  lineas?: (LineaMovimiento | LineaConteo)[]; ajustes?: RegistroInventario[]
  numeroLote?: string | null; diasRestantes?: number | null; estadoVencimiento?: string
}
export type ConsultaInventario = {
  pagina?: number; tamanoPagina?: number; sucursalId?: string; presentacionId?: string; ubicacionId?: string
  loteId?: string; existenciaId?: string; estado?: string; desde?: string; hasta?: string; tipo?: TipoMovimiento; grupoMovimiento?: 'AJUSTES'
}
export type ResultadoListado = Paginado<RegistroInventario> & { actualizadoEn: string }
export type PosicionDisponible = RegistroInventario & { apta: boolean; libreAsignableBase: string; restricciones: string[] }
export type Disponibilidad = {
  sucursalId: string; presentacionId: string; productoId: string; unidadBaseId: string
  existenciaFisica: string; existenciaApta: string; reservada: string; reservaSobreStockApto: string; disponible: string
  cuarentena: string; restringida: string; vencida: string; actualizadoEn: string; posiciones: PosicionDisponible[]
}
export type Fefo = { cantidadBase: string; seleccion: { existenciaId: string; cantidadBase: string }[]; actualizadoEn: string }
export type ParametrosInventario = { id: string; version: number; alertaDias: number; preventivoDias: number; criticoDias: number; actualizadoEn: string | null }
export type DatosFormulario = Record<string, string>
export type AccionInventario = 'confirmar' | 'anular' | 'preparar' | 'cancelar' | 'levantar' | 'cerrar' | 'conciliar'
export type EntradaInventario = {
  sucursalId?: string | null; presentacionId?: string; numero?: string; fechaIngreso?: string
  fechaFabricacion?: string | null; fechaVencimiento?: string | null; proveedorId?: string | null; referenciaOrigen?: string
  tipo?: TipoMovimiento; claveIdempotencia?: string; referencia?: string; motivo?: string; evidencia?: string
  movimientoCorregidoId?: string | null; fechaCorte?: string | null; lineas?: LineaMovimiento[]
  unidadId?: string; cantidad?: string; expiraEn?: string; alcance?: string; objetivoId?: string; clase?: string; ubicacionId?: string
}
