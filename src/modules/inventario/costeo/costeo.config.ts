export const recursosCosteo = {
  valoracion: { ruta: '/inventario/valoracion', titulo: 'Inventario valorado', grupo: 'inventario', permiso: 'INVENTARIO.VALORACION.VER', descripcion: 'Costo promedio y valor del inventario físico; tránsito separado.' },
  registros: { ruta: '/inventario/kardex-monetario', titulo: 'Kardex monetario', grupo: 'inventario', permiso: 'INVENTARIO.VALORACION.VER', descripcion: 'Valores históricos de entradas, salidas y valoraciones documentadas.' },
  reposiciones: { ruta: '/compras/costos-reposicion', titulo: 'Costos de reposición', grupo: 'compras', permiso: 'COMPRAS.REPOSICION.VER', descripcion: 'Costo neto por presentación, proveedor y vigencia de su evidencia.' },
  sugerencias: { ruta: '/catalogos/precios-vigentes/sugerencias', titulo: 'Precios sugeridos', grupo: 'catalogos', permiso: 'CATALOGOS.PRECIOS_VIGENTES.VER_SUGERENCIAS', descripcion: 'Mayor costo entre promedio y reposición; revisión antes de publicar.' },
  ventas: { ruta: '/ventas/costos', titulo: 'Costo de ventas', grupo: 'ventas', permiso: 'VENTAS.COSTOS.VER', descripcion: 'Costo histórico de lo vendido y compensaciones por anulación.' },
} as const
export type RecursoCosteo = keyof typeof recursosCosteo
export type FilaCosteo = Record<string, string | number | boolean | null> & { id: string; presentacionId: string; version: number }
export type ConsultaCosteo = { pagina: number; tamanoPagina: number; sucursalId?: string; presentacionId?: string; ventaId?: string; desde?: string; hasta?: string }
export type ResultadoCosteo = { items: FilaCosteo[]; pagina: number; tamanoPagina: number; total: number; totalPaginas: number; resumen?: { valorFisico?: string | null; valorTransito?: string | null; costoVentas?: string | null; registrosPendientes: number } }
export function reconocerRutaCosteo(ruta: string): RecursoCosteo | null {
  return (Object.keys(recursosCosteo) as RecursoCosteo[]).find(k => recursosCosteo[k].ruta === ruta.split('?')[0]) ?? null
}
export function puedeCosteo(recurso: RecursoCosteo, permisos: readonly string[]) {
  return permisos.includes(recursosCosteo[recurso].permiso) && (recurso !== 'reposiciones' || permisos.includes('COMPRAS.ACCESO.CORPORATIVO'))
}
export function fechaCosteo(dias = 0) {
  const xs = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const texto = ['year', 'month', 'day'].map(t => xs.find(p => p.type === t)!.value).join('-')
  const fecha = new Date(texto + 'T00:00:00Z'); fecha.setUTCDate(fecha.getUTCDate() + dias); return fecha.toISOString().slice(0, 10)
}
export function mostrarCosto(valor: unknown, moneda = false) {
  if (valor === null || valor === undefined || valor === '') return 'Pendiente'
  const s = String(valor)
  return moneda ? 'Q ' + s : s
}
