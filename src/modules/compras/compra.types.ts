import type { Paginado, EventoAuditoria } from '../catalogos-farmacia/catalogo.types'
export type { Paginado, EventoAuditoria }
export const recursosDocumento = ['solicitudes', 'cotizaciones', 'ordenes', 'recepciones', 'facturas', 'evaluaciones'] as const
export type RecursoDocumento = typeof recursosDocumento[number]
export type RecursoCompra = RecursoDocumento | 'obligaciones'
export type ConsultaCompra = { pagina?: number; tamanoPagina?: number; sucursalId?: string; proveedorId?: string; origenId?: string; estado?: string; desde?: string; hasta?: string }
export type DocumentoCompra = {
  id: string; tipo: 'SOLICITUD' | 'COTIZACION' | 'ORDEN' | 'RECEPCION' | 'FACTURA' | 'EVALUACION'; numero: string; estado: string
  sucursalId: string; proveedorId: string | null; proveedorNombre: string | null; origenId: string | null; revisionDeId: string | null; ubicacionId: string | null
  fecha: string; fechaRequerida: string | null; vigenteHasta: string | null; prioridad: 'ORDINARIA' | 'ALTA' | 'CRITICA'; motivo: string; condiciones: string | null
  moneda: string; monedaOrigen: string | null; tipoCambio: string | null; fechaCambio: string | null; importe: string; costesAdicionales: string; documentoProveedor: string | null
  decididoPorId: string | null; decididoEn: string | null; evidencia: string | null; version: number; creadoPorId: string; creadoEn: string; actualizadoEn: string | null
}
export type LineaCompra = {
  id: string; origenLineaId: string | null; orden: number; presentacionId: string; descripcion: string; presentacionObservadaId: string | null; unidadId: string
  cantidad: string; cantidadDeclarada: string; cantidadBase: string; factorNumerador: string; factorDenominador: string; precio: string; tasaImpuesto: string; total: string; vidaUtilMinimaDias: number
  loteId: string | null; numeroLote: string | null; fechaVencimiento: string | null; fechaFabricacion: string | null
  aceptada: string; cuarentena: string; rechazada: string; cancelada: string; destinoUbicacionId: string | null; cuarentenaUbicacionId: string | null; incidencia: string | null
}
export type ObligacionCompra = { id: string; facturaId: string; importe: string; vencimiento: string; estado: string; motivo: string; autorizadoPorId: string | null; autorizadoEn: string | null; version: number }
export type ObligacionListado = ObligacionCompra & { facturaNumero: string; sucursalId: string; proveedorId: string | null }
export type DetalleCompra = DocumentoCompra & {
  lineas: LineaCompra[]; inspecciones: { id: string; etapa: string; resultado: string; evidencia: string; responsableId: string; ocurridoEn: string }[]
  adjuntos: { id: string; nombre: string; tipoMime: string; tamano: number; url: string }[]
  pendientes?: { lineaId: string; autorizadaBase: string; recibidaBase: string; canceladaBase: string; pendienteBase: string }[]
  avisos?: { id: string; fechaPrevista: string; transporte: string; condiciones: string; evidencia: string; responsableId: string }[]
  excepciones?: { id: string; lineaId: string; adicionalBase: string; motivo: string; evidencia: string; responsableId: string; creadoEn: string }[]
  obligacion?: ObligacionCompra; ingreso?: { id: string; movimientoId: string } | null
}
export type ComparacionCompra = { solicitud: DetalleCompra; cotizaciones: DetalleCompra[]; evaluadoEn: string }
export type AccionCompra = 'aprobar' | 'rechazar' | 'cancelar' | 'cerrar' | 'adjudicar' | 'validar' | 'conciliar' | 'confirmar' | 'documental' | 'fisica' | 'tecnica' | 'autorizar-sobrante' | 'avisos' | 'autorizar' | 'retener' | 'anular'
export type AccionRequest = { version: number; motivo: string; evidencia: string }
export type Comercial = { precio: string; tasaImpuesto: string; vidaUtilMinimaDias: number }
export type SolicitudRequest = { sucursalId: string; claveIdempotencia: string; motivo: string; fechaRequerida: string; prioridad: DocumentoCompra['prioridad']; presupuestoEstimado: string; lineas: { presentacionId: string; unidadId: string; cantidad: string }[] }
export type CotizacionRequest = { solicitudId: string; proveedorId: string; claveIdempotencia: string; documentoProveedor: string; vigenteHasta: string; fechaEntrega: string; condiciones: string; motivo: string; monedaOrigen: string | null; tipoCambio: string | null; fechaCambio: string | null; lineas: ({ solicitudLineaId: string; cantidad: string } & Comercial)[] }
export type OrdenRequest = { cotizacionId: string; claveIdempotencia: string; ubicacionId: string; fechaEntrega: string; motivo: string; costesAdicionales: string; lineas: { cotizacionLineaId: string; cantidad: string }[] }
export type RevisionRequest = Omit<OrdenRequest, 'cotizacionId' | 'lineas'> & { version: number; lineas: ({ ordenLineaId: string; cantidad: string } & Comercial)[] }
export type LoteRequest = { numeroLote: string | null; fechaVencimiento: string | null; fechaFabricacion: string | null }
export type RecepcionRequest = { ordenId: string; claveIdempotencia: string; fecha: string; motivo: string; documentoProveedor: string; lineas: ({ ordenLineaId: string; cantidad: string } & LoteRequest)[] }
export type FacturaRequest = { ordenId: string; claveIdempotencia: string; fecha: string; vencimiento: string; documentoProveedor: string; motivo: string; costesAdicionales: string; lineas: { recepcionLineaId: string; cantidad: string; precio: string; tasaImpuesto: string }[] }
export type EvaluacionRequest = { recepcionId: string; claveIdempotencia: string; motivo: string; evidencia: string }
export type CreacionRequest = SolicitudRequest | CotizacionRequest | OrdenRequest | RevisionRequest | RecepcionRequest | FacturaRequest | EvaluacionRequest
export type DocumentalRequest = { version: number; evidencia: string; resultado: 'CONFORME' | 'RECHAZADA' }
export type FisicaRequest = { version: number; evidencia: string; lineas: ({ lineaId: string; presentacionRecibidaId: string | null; cantidad: string; incidencia: string | null } & LoteRequest)[] }
export type TecnicaRequest = { version: number; evidencia: string; lineas: { lineaId: string; aceptada: string; cuarentena: string; rechazada: string; destinoUbicacionId: string | null; cuarentenaUbicacionId: string | null; incidencia: string | null }[] }
export type SobranteRequest = AccionRequest & { lineas: { ordenLineaId: string; cantidad: string }[] }
export type AvisoRequest = { version: number; fechaPrevista: string; transporte: string; condiciones: string; evidencia: string }
export type DecisionRequest = AccionRequest | DocumentalRequest | FisicaRequest | TecnicaRequest | SobranteRequest | AvisoRequest | { version: number }
export type DatosCompra = Record<string, string>
export type LineaFormulario = { clave: string; origenLineaId: string; descripcion: string; presentacionId: string; unidadId: string; cantidad: string; precio: string; tasaImpuesto: string; vidaUtilMinimaDias: string; numeroLote: string; fechaVencimiento: string; fechaFabricacion: string; presentacionRecibidaId: string; aceptada: string; cuarentena: string; rechazada: string; destinoUbicacionId: string; cuarentenaUbicacionId: string; incidencia: string }
export type ErroresCompra = Record<string, string>
