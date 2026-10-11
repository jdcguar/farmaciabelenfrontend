import type { RecursoCompra, RecursoDocumento, AccionCompra } from './compra.types'
export const compras = {
  solicitudes: { titulo: 'Solicitudes', singular: 'solicitud', descripcion: 'Necesidades de compra por sucursal.', estados: ['SOLICITADA', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'CERRADA'] },
  cotizaciones: { titulo: 'Cotizaciones', singular: 'cotización', descripcion: 'Ofertas homologadas, comparación y adjudicación.', estados: ['REGISTRADA', 'ADJUDICADA'] },
  ordenes: { titulo: 'Órdenes', singular: 'orden', descripcion: 'Compromisos, revisiones y entregas autorizadas.', estados: ['BORRADOR', 'APROBADA', 'PARCIAL', 'RECHAZADA', 'CANCELADA', 'CERRADA', 'SUSTITUIDA'] },
  recepciones: { titulo: 'Recepciones', singular: 'recepción', descripcion: 'Inspección documental, física y técnica e ingreso.', estados: ['PEND_DOCUMENTAL', 'PEND_FISICA', 'PEND_TECNICA', 'INSPECCIONADA', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA'] },
  facturas: { titulo: 'Facturas', singular: 'factura', descripcion: 'Aceptación facturable y conciliación financiera.', estados: ['REGISTRADA', 'DIFERENCIA', 'VALIDADA', 'CANCELADA'] },
  obligaciones: { titulo: 'Obligaciones', singular: 'obligación', descripcion: 'Autorización para pago y retenciones.', estados: ['PENDIENTE', 'AUTORIZADA', 'RETENIDA', 'ANULADA'] },
  evaluaciones: { titulo: 'Evaluaciones', singular: 'evaluación', descripcion: 'Desempeño posterior a la recepción confirmada.', estados: ['CONFIRMADA'] },
} as const
export const recursosCompra = Object.keys(compras) as RecursoCompra[]
export const permisoCompra = (r: RecursoCompra, a = 'VER') => `COMPRAS.${r.toUpperCase()}.${a}`
export const rutaCompra = (r: RecursoCompra, id?: string) => `/compras/${r}${id ? `/${id}` : ''}`
export type RutaCompra = { recurso: RecursoCompra; modo: 'listado' | 'crear' | 'detalle' | 'revision' | 'comparacion' | 'inspeccion'; id?: string; etapa?: AccionCompra }
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
export function reconocerRutaCompra(path: string): RutaCompra | null {
  const m = path.match(new RegExp(`^/compras/(${recursosCompra.join('|')})(?:/(nuevo|${uuid}))?(?:/(revision|comparacion|documental|fisica|tecnica))?$`, 'i'))
  if (!m) return null
  const recurso = m[1]!.toLowerCase() as RecursoCompra, id = m[2], sub = m[3]
  if (id === 'nuevo') return recurso !== 'obligaciones' && !sub ? { recurso, modo: 'crear' } : null
  if (!id) return sub ? null : { recurso, modo: 'listado' }
  if (sub === 'revision') return recurso === 'ordenes' ? { recurso, id, modo: 'revision' } : null
  if (sub === 'comparacion') return recurso === 'solicitudes' ? { recurso, id, modo: 'comparacion' } : null
  if (sub) return recurso === 'recepciones' ? { recurso, id, modo: 'inspeccion', etapa: sub as AccionCompra } : null
  return { recurso, id, modo: 'detalle' }
}
export function puedeCrearCompra(r: RecursoCompra, permisos: readonly string[]) { return r !== 'obligaciones' && permisos.includes(permisoCompra(r, 'CREAR')) && (['solicitudes', 'recepciones'].includes(r) || permisos.includes('COMPRAS.ACCESO.CORPORATIVO')) }
export function puedeRutaCompra(r: RutaCompra, p: readonly string[]) {
  if (r.modo === 'crear') return puedeCrearCompra(r.recurso, p)
  if (r.modo === 'comparacion') return p.includes(permisoCompra('cotizaciones')) && p.includes('COMPRAS.ACCESO.CORPORATIVO')
  return p.includes(permisoCompra(r.recurso)) && (r.modo === 'revision' ? p.includes(permisoCompra('ordenes', 'REVISAR')) && p.includes('COMPRAS.ACCESO.CORPORATIVO') : r.modo === 'inspeccion' ? p.includes(permisoCompra('recepciones', r.etapa!.toUpperCase())) : true)
}
export const origenRecurso: Partial<Record<RecursoDocumento, RecursoDocumento>> = { cotizaciones: 'solicitudes', ordenes: 'cotizaciones', recepciones: 'ordenes', facturas: 'ordenes', evaluaciones: 'recepciones' }
