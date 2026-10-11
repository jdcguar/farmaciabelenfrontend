export type EstadoTraslado = 'SOLICITADO' | 'APROBADO' | 'RECHAZADO' | 'PREPARADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'CERRADO' | 'CANCELADO'
export type TipoTraslado = 'ABASTECIMIENTO' | 'DEVOLUCION_INTERNA' | 'HORIZONTAL' | 'REDISTRIBUCION'
export type PrioridadTraslado = 'ORDINARIA' | 'URGENTE' | 'EMERGENCIA'
export type AccionTraslado = 'aprobar' | 'rechazar' | 'cancelar' | 'cerrar' | 'habilitar-recepcion'
export type Traslado = {
  id: string; numero: string; tipo: TipoTraslado; prioridad: PrioridadTraslado; estado: EstadoTraslado
  origenSucursalId: string; destinoSucursalId: string; fechaRequerida: string; motivo: string; version: number
  creadoEn: string | null; creadoPorId: string | null; actualizadoEn: string | null; decididoPorId: string | null
  decididoEn: string | null; recepcionHabilitadaEn: string | null; recepcionHabilitadaPorId: string | null
  cerradoEn: string | null; motivoDecision: string | null; controlCompensatorio: string | null; retornoDeId: string | null
}
export type LineaTraslado = {
  id: string; orden: number; presentacionId: string; unidadId: string; descripcion: string; cantidad: string
  solicitadaBase: string; aprobadaBase: string; noDespachadaBase: string; factorNumerador: string; factorDenominador: string; vidaUtilMinimaDias: number
}
export type PendienteTraslado = { lineaId: string; porPrepararBase: string; preparadaBase: string; despachadaBase: string; recibidaBase: string; justificadaBase: string; enTransitoBase: string }
export type DespachoTraslado = {
  id: string; trasladoId: string; estado: 'PREPARADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'CANCELADO'; version: number; creadoEn: string | null; reservaHasta: string | null; despachadoEn: string | null; despachadoPorId: string | null
  moneda: 'GTQ'; movimientoId: string | null
  custodio: string | null; transporte: string | null; condiciones: string | null; evidencia: string | null; costeTransporte: string; motivoCancelacion: string | null
}
export type IncidenciaTraslado = {
  id: string; trasladoId: string; asignacionId: string | null; version: number; tipo: TipoIncidencia; estado: 'ABIERTA' | 'RESUELTA'; cantidadBase: string; descripcion: string; evidencia: string
  resolucion: ResolucionIncidencia | null; motivoResolucion: string | null; resueltaEn: string | null; resueltaPorId: string | null; trasladoRelacionadoId: string | null
}
export type DetalleTraslado = Traslado & { lineas: LineaTraslado[]; pendientes: PendienteTraslado[]; despachos: DespachoTraslado[]; incidencias: IncidenciaTraslado[] }
export type ConsultaTraslado = { pagina?: number; tamanoPagina?: number; origenSucursalId?: string; destinoSucursalId?: string; estado?: EstadoTraslado; prioridad?: PrioridadTraslado; desde?: string; hasta?: string }
export type Paginado<T> = { items: T[]; pagina: number; tamanoPagina: number; total: number; totalPaginas: number }
export type RecursoDocumentoTraslado = 'despachos' | 'recepciones'
export type ReferenciaDocumentoTraslado = { trasladoId: string; numeroTraslado: string; origenSucursalId: string; destinoSucursalId: string; prioridad: PrioridadTraslado }
export type DespachoListado = DespachoTraslado & ReferenciaDocumentoTraslado
export type RecepcionListado = RecepcionTraslado & ReferenciaDocumentoTraslado
export type DocumentoListado = DespachoListado | RecepcionListado
export type FiltrosDocumentoTraslado = Omit<ConsultaTraslado, 'estado'> & { trasladoId?: string; despachoId?: string }
export type ConsultaDocumentoTraslado = FiltrosDocumentoTraslado & { estado?: DespachoTraslado['estado'] | RecepcionTraslado['estado'] }
export type DatosSolicitud = { origenSucursalId: string; destinoSucursalId: string; tipo: TipoTraslado; prioridad: PrioridadTraslado; fechaRequerida: string; motivo: string }
export type LineaSolicitud = { clave: string; presentacionId: string; unidadId: string; cantidad: string; vidaUtilMinimaDias: string }
export type CreacionTraslado = DatosSolicitud & { claveIdempotencia: string; retornoDeId: string | null; lineas: { presentacionId: string; unidadId: string; cantidad: string; vidaUtilMinimaDias: number }[] }
export type DecisionTraslado = { version: number; motivo: string; controlCompensatorio: string | null; lineas?: { lineaId: string; cantidadAprobadaBase: string }[] }
export type ErroresTraslado = Record<string, string>
export type AsignacionTraslado = { id: string; despachoId: string; lineaId: string; existenciaId: string; reservaId: string; loteId: string | null; numeroLote: string | null; fechaVencimiento: string | null; cantidadBase: string; recibidaBase: string; justificadaBase: string; pendienteBase: string }
export type CustodiaTraslado = { id: string; despachoId: string; responsable: string; condiciones: string; evidencia: string; ocurridoEn: string | null; registradoPorId: string | null }
export type DetalleDespacho = DespachoTraslado & { asignaciones: AsignacionTraslado[]; custodias: CustodiaTraslado[] }
export type RecepcionTraslado = { id: string; despachoId: string; estado: 'REGISTRADA' | 'CONFIRMADA' | 'CANCELADA'; version: number; evidencia: string; creadoEn: string | null; confirmadaEn: string | null; confirmadaPorId: string | null; movimientoId: string | null; motivoCancelacion: string | null; controlCompensatorio: string | null }
export type LineaRecepcionTraslado = { id: string; asignacionId: string; numeroLoteObservado: string | null; vencimientoObservado: string | null; aceptadaBase: string; cuarentenaBase: string; rechazadaBase: string; destinoUbicacionId: string | null; cuarentenaUbicacionId: string | null; incidencia: string | null }
export type DetalleRecepcion = RecepcionTraslado & { lineas: LineaRecepcionTraslado[] }
export type PreparacionTraslado = { version: number; claveIdempotencia: string; reservaHasta: string; lineas: { lineaId: string; cantidadBase: string }[] }
export type ConfirmacionDespacho = { version: number; custodio: string; transporte: string; condiciones: string; evidencia: string; costeTransporte: string; controlCompensatorio: string | null }
export type RegistroRecepcion = { claveIdempotencia: string; evidencia: string; controlCompensatorio: string | null; lineas: Omit<LineaRecepcionTraslado, 'id'>[] }
export type BorradorPreparacion = { lineaId: string; incluir: boolean; cantidadBase: string }
export type BorradorRecepcion = { asignacionId: string; incluir: boolean; numeroLoteObservado: string; vencimientoObservado: string; aceptadaBase: string; cuarentenaBase: string; rechazadaBase: string; destinoUbicacionId: string; cuarentenaUbicacionId: string; incidencia: string }
export type ContextoDespacho = { traslado: DetalleTraslado; despacho: DetalleDespacho; recepciones: DetalleRecepcion[] }
export type ContextoRecepcion = ContextoDespacho & { recepcion: DetalleRecepcion }
export type TipoIncidencia = 'FALTANTE' | 'SOBRANTE' | 'DANO' | 'EMBALAJE' | 'PRODUCTO' | 'LOTE' | 'VENCIMIENTO' | 'CONSERVACION' | 'OTRA'
export type ResolucionIncidencia = 'ACLARADA' | 'FALTANTE_JUSTIFICADO' | 'TRASLADO_RELACIONADO'
export type RegistroIncidencia = { version: number; asignacionId: string | null; tipo: TipoIncidencia; cantidadBase: string; descripcion: string; evidencia: string }
export type ResolucionTraslado = { version: number; resolucion: ResolucionIncidencia; motivo: string; evidencia: string; trasladoRelacionadoId: string | null; controlCompensatorio: string | null }
export type ContextoIncidencia = { traslado: DetalleTraslado; incidencia: IncidenciaTraslado; asignacion: AsignacionTraslado | null; despacho: DetalleDespacho | null }
