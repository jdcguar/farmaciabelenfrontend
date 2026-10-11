export type UnidadCantidad = { dimension?: string; admiteDecimales?: boolean }
export type ContextoCantidad = { unidadId?: string; presentacionId?: string; productoId?: string; existenciaId?: string }

export function admiteFracciones(unidad: UnidadCantidad): boolean {
  return ['MASA', 'VOLUMEN'].includes(unidad.dimension ?? '') && unidad.admiteDecimales === true
}
export function mostrarCantidad(valor: unknown): string {
  if ((typeof valor !== 'string' && typeof valor !== 'number') || valor === '') return 'Sin dato'
  return String(valor).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}
export function cantidadValida(valor: string, decimales: boolean): boolean {
  return (decimales ? /^\d{1,9}(\.\d{1,6})?$/ : /^\d{1,9}(\.0{1,6})?$/).test(valor.trim())
}
