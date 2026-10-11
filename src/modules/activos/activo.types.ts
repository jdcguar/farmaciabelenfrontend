import type { SesionUsuario } from '../autenticacion/autenticacion.types'
export type Condicion = 'NUEVO' | 'BUENO' | 'REGULAR' | 'MALO'
export type Situacion = 'DISPONIBLE' | 'ASIGNADO' | 'MANTENIMIENTO' | 'BAJA'
export type EstadoAsignacion = 'VIGENTE' | 'PARCIAL' | 'CERRADA'
export type Revision = 'PENDIENTE' | 'SIN_DEVOLUCION' | 'CON_DEVOLUCION' | 'CONFIRMADA_LEGACY'
export type EstadoDevolucion = 'SOLICITADA' | 'RECIBIDA' | 'APROBADA' | 'RECHAZADA'
export type Referencia = { id: string; codigo?: string; prefijo?: string; nombre: string }
export type Traza = { version: number; creadoEn: string | null; creadoPorId: string | null; actualizadoEn: string | null; actualizadoPorId: string | null }
export type TipoActivo = Traza & { id: string; prefijo: string; nombre: string; descripcion: string | null; activo: boolean; inactivadoEn: string | null; motivoInactivacion: string | null }
export type Activo = Traza & { id: string; codigo: string; sucursalId: string; sucursal: Referencia; tipoId: string; tipo: Referencia; condicion: Condicion; marca: string; modelo: string; numeroSerie: string | null; descripcion: string; situacion: Situacion; inactivadoEn: string | null; motivoInactivacion: string | null }
export type DetalleAsignacion = { id: string; activoId: string; orden: number; codigo: string; tipoNombre: string; marca: string; modelo: string; numeroSerie: string | null; descripcion: string; condicionEntrega: Condicion; notasEntrega: string | null; estado: 'ASIGNADO' | 'DEVUELTO'; devueltoEn: string | null; condicionDevolucion: Condicion | null; version: number }
export type Asignacion = Traza & { id: string; numero: string; sucursalId: string; sucursal: Referencia; empleadoId: string; empleado: Referencia; responsableNombre: string; estado: EstadoAsignacion; revision: Revision; revisadoEn: string | null; cerradoEn: string | null; pdfDisponible: boolean; detalles: DetalleAsignacion[] }
export type DetalleDevolucion = { id: string; asignacionDetalleId: string; motivo: string; condicionRecibida: Condicion | null; notasRecepcion: string | null; activo: DetalleAsignacion; version: number }
export type Devolucion = Traza & { id: string; numero: string; asignacionId: string; acta: string; empleado: Referencia; sucursal: Referencia; estado: EstadoDevolucion; solicitanteNombre: string; recibidoEn: string | null; receptorNombre: string | null; observaciones: string | null; resueltoEn: string | null; resolutorNombre: string | null; motivoResolucion: string | null; pdfDisponible: boolean; detalles: DetalleDevolucion[] }
export type Paginado<T> = { items: T[]; pagina: number; tamanoPagina: number; total: number; totalPaginas: number }
export type Recurso = 'activos' | 'tipos' | 'asignaciones' | 'devoluciones' | 'mis-activos' | 'mis-devoluciones'
export type Registro = Activo | TipoActivo | Asignacion | Devolucion
export type Registros = { activos: Activo; tipos: TipoActivo; asignaciones: Asignacion; devoluciones: Devolucion; 'mis-activos': Asignacion; 'mis-devoluciones': Devolucion }
export type Consulta = { pagina?: number; tamanoPagina?: number; busqueda?: string; direccion?: 'asc' | 'desc'; orden?: string; sucursalId?: string; tipoId?: string; condicion?: Condicion; situacion?: Situacion; activo?: boolean; estado?: EstadoAsignacion | EstadoDevolucion; desde?: string; hasta?: string; asignacionId?: string }
export type CamposActivo = { sucursalId: string; tipoId: string; condicion: Condicion | ''; marca: string; modelo: string; numeroSerie: string; descripcion: string }
export type CamposTipo = { prefijo: string; nombre: string; descripcion: string }
export type Entrega = { activo: Activo; condicionEntrega: Condicion | ''; notasEntrega: string }
export type SolicitudDetalle = { asignacionDetalleId: string; motivo: string }
export type EntradaRevision = { version: number; decision: 'SIN_DEVOLUCION' } | { version: number; decision: 'SOLICITAR_DEVOLUCION'; detalles: SolicitudDetalle[] }
export type EntradaRecepcion = { version: number; observaciones: string; detalles: { detalleId: string; condicionRecibida: Condicion; notasRecepcion: string }[] }
export type PdfCreacion = { generado: true; rutaDescarga: string; nombreArchivo: string; tipoMime: string; contenidoBase64: string } | { generado: false; rutaDescarga: string; codigo: string; mensaje: string }
export type ContextoActivo = { sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (pendientes: boolean) => void }
