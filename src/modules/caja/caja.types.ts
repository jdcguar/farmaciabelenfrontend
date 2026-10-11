export type RecursoCaja = 'politicas' | 'cajas' | 'turnos' | 'movimientos' | 'arqueos' | 'cierres' | 'remesas' | 'custodias' | 'depositos' | 'cobros-repartidor' | 'rendiciones' | 'incidencias' | 'cierres-diarios'
export type ConfiguracionCaja = {
  corte: string; apertura: string; cierre: string; permiteTurnosSimultaneos: boolean
  fondoMaximo: string; saldoMaximo: string; reintegroMaximo: string; extraordinarioUmbral: string; diferenciaUmbral: string; denominaciones: string[]
}
export type DenominacionCaja = { valor: string; cantidad: number }
export type DocumentoCaja = {
  id: string; moneda: 'GTQ'; version: number; creadoEn: string; creadoPorId: string | null; sucursalId: string
}
export type PoliticaCaja = DocumentoCaja & { configuracion: ConfiguracionCaja }
export type Caja = DocumentoCaja & { codigo: string; nombre: string; tipo: 'VENTAS' | 'CHICA'; estado: 'DISPONIBLE' | 'SUSPENDIDA' | 'INACTIVA' }
export type TurnoCaja = DocumentoCaja & {
  cajaId: string; cajeroId: string; estado: 'ABIERTO' | 'CIERRE_PENDIENTE' | 'CERRADO'; fechaNegocio: string; abiertoEn: string
  fondo: string; denominaciones: DenominacionCaja[]; politica: ConfiguracionCaja; cierreId: string | null; folioContingencia: string | null; saldoTeorico?: string
}
export type RegistroCaja = DocumentoCaja & { [campo: string]: unknown }
export type PaginadoCaja<T> = { items: T[]; pagina: number; tamanoPagina: number; total: number; totalPaginas: number }
export type ConsultaCaja = { pagina?: number; tamanoPagina?: number; sucursalId?: string; estado?: string; cajaId?: string; turnoId?: string; desde?: string; hasta?: string }
export type ErroresCaja = Record<string, string>
export type DatosPoliticaCaja = { sucursalId: string; motivo: string; configuracion: ConfiguracionCaja }
export type DatosNuevaCaja = { sucursalId: string; codigo: string; nombre: string; tipo: Caja['tipo'] }
export type DatosAperturaCaja = { cajaId: string; remesaFondoId: string; evidencia: string; ocurridoEn: string; folioContingencia: string; autorizacionHorario: string }
export type ConteoCaja = { valor: string; cantidad: string }
export type ContextoAperturaCaja = { caja: Caja; politica: PoliticaCaja }
