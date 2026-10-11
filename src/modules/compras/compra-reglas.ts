import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { permisoCompra } from './compra.config'
import type { AccionCompra, RecursoCompra, DocumentoCompra, ObligacionCompra, LineaCompra, LineaFormulario } from './compra.types'
export const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
export function hoyGuatemala() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map(t => p.find(v => v.type === t)?.value).join('-')
}
export function fechaValida(v: string) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '1900-01-01' && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v }
export function esDecimal(v: string, escala = 6, cero = false) { return new RegExp(`^\\d{1,${15 - escala}}(\\.\\d{1,${escala}})?$`).test(v.trim()) && (cero || /[1-9]/.test(v)) }
export function micro(v: string, escala = 6) { const [e = '0', f = ''] = v.trim().split('.'); return BigInt(e) * 10n ** BigInt(escala) + BigInt(f.padEnd(escala, '0')) }
export function decimalTexto(v: bigint, escala = 6) { if (v < 0n) return '0'; const t = v.toString().padStart(escala + 1, '0'); return `${t.slice(0, -escala)}.${t.slice(-escala)}` }
export function cantidadTexto(v: string) { return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') }
export function dinero(v: string) { const [e, f = ''] = v.split('.'); return `Q ${e!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${f.padEnd(2, '0')}` }
export const fechaHora = (v: string | null) => v ? new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—'
export const etiquetasEstado: Record<string, string> = { SOLICITADA: 'Solicitada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', CANCELADA: 'Cancelada', CERRADA: 'Cerrada', REGISTRADA: 'Registrada', ADJUDICADA: 'Adjudicada', BORRADOR: 'Borrador', PARCIAL: 'Parcial', SUSTITUIDA: 'Sustituida', PEND_DOCUMENTAL: 'Pendiente documental', PEND_FISICA: 'Pendiente física', PEND_TECNICA: 'Pendiente técnica', INSPECCIONADA: 'Inspeccionada', CONFIRMADA: 'Confirmada', DIFERENCIA: 'Con diferencias', VALIDADA: 'Validada', PENDIENTE: 'Pendiente', AUTORIZADA: 'Autorizada para pago', RETENIDA: 'Retenida', ANULADA: 'Anulada' }
export const etiquetasAccion: Record<AccionCompra, string> = { aprobar: 'Aprobar', rechazar: 'Rechazar', cancelar: 'Cancelar documento', cerrar: 'Cerrar con justificación', adjudicar: 'Adjudicar', validar: 'Validar factura', conciliar: 'Conciliar diferencias', confirmar: 'Confirmar ingreso', documental: 'Inspección documental', fisica: 'Inspección física', tecnica: 'Inspección técnica', 'autorizar-sobrante': 'Autorizar sobrantes', avisos: 'Registrar aviso', autorizar: 'Autorizar para pago', retener: 'Retener', anular: 'Anular obligación y factura' }
const estadosAccion: Partial<Record<RecursoCompra, Partial<Record<AccionCompra, readonly string[]>>>> = {
  solicitudes: { aprobar: ['SOLICITADA'], rechazar: ['SOLICITADA'], cancelar: ['SOLICITADA'], cerrar: ['APROBADA'] }, cotizaciones: { adjudicar: ['REGISTRADA'] },
  ordenes: { aprobar: ['BORRADOR'], rechazar: ['BORRADOR'], cancelar: ['BORRADOR', 'APROBADA'], cerrar: ['APROBADA', 'PARCIAL'], 'autorizar-sobrante': ['APROBADA', 'PARCIAL'], avisos: ['APROBADA', 'PARCIAL'] },
  recepciones: { documental: ['PEND_DOCUMENTAL'], fisica: ['PEND_FISICA'], tecnica: ['PEND_TECNICA'], confirmar: ['INSPECCIONADA'], cancelar: ['PEND_DOCUMENTAL', 'PEND_FISICA', 'PEND_TECNICA', 'INSPECCIONADA'] },
  facturas: { validar: ['REGISTRADA'], conciliar: ['DIFERENCIA'], cancelar: ['REGISTRADA', 'DIFERENCIA'] }, obligaciones: { autorizar: ['PENDIENTE', 'AUTORIZADA', 'RETENIDA'], retener: ['PENDIENTE', 'AUTORIZADA', 'RETENIDA'], anular: ['PENDIENTE', 'AUTORIZADA', 'RETENIDA'] },
}
export function accionesCompra(r: RecursoCompra, d: DocumentoCompra | ObligacionCompra, s: SesionUsuario, factura?: DocumentoCompra) {
  const corp = s.permisos.includes('COMPRAS.ACCESO.CORPORATIVO'), doc = 'creadoPorId' in d ? d : factura
  return Object.entries(estadosAccion[r] ?? {}).flatMap(([a, estados]) => {
    const accion = a as AccionCompra, permiso = accion === 'autorizar-sobrante' ? 'AUTORIZAR_SOBRANTE' : accion === 'avisos' ? 'AVISAR' : accion.toUpperCase()
    if (!s.permisos.includes(permisoCompra(r, permiso)) || r !== 'recepciones' && !(r === 'solicitudes' && accion === 'cancelar') && !corp) return []
    const independiente = r === 'solicitudes' && accion !== 'cancelar' || r === 'cotizaciones' || r === 'ordenes' && ['aprobar', 'rechazar', 'autorizar-sobrante'].includes(accion) || r === 'facturas' && accion !== 'cancelar' || r === 'obligaciones' && accion === 'autorizar'
    const razon = doc && !corp && doc.sucursalId !== s.sucursal.id ? 'Fuera del alcance de tu sucursal.' : !estados!.includes(d.estado) ? `No corresponde al estado ${etiquetasEstado[d.estado] ?? d.estado}.` : independiente && !doc ? 'Se requiere consultar la factura para comprobar independencia del creador.' : independiente && doc?.creadoPorId === s.usuarioId ? 'Requiere otro usuario autorizado, distinto del creador.' : r === 'cotizaciones' && doc?.vigenteHasta && doc.vigenteHasta < hoyGuatemala() ? 'La cotización está vencida.' : ''
    return [{ accion, razon }]
  })
}
export function lineaInicial(origen?: LineaCompra): LineaFormulario { return { clave: crypto.randomUUID(), origenLineaId: origen?.id ?? '', descripcion: origen?.descripcion ?? '', presentacionId: origen?.presentacionId ?? '', unidadId: origen?.unidadId ?? '', cantidad: origen?.cantidad ?? '', precio: origen?.precio ?? '', tasaImpuesto: origen?.tasaImpuesto ?? '0', vidaUtilMinimaDias: String(origen?.vidaUtilMinimaDias ?? 0), numeroLote: origen?.numeroLote ?? '', fechaVencimiento: origen?.fechaVencimiento ?? '', fechaFabricacion: origen?.fechaFabricacion ?? '', presentacionRecibidaId: origen?.presentacionObservadaId ?? '', aceptada: origen?.cantidad ?? '0', cuarentena: '0', rechazada: '0', destinoUbicacionId: '', cuarentenaUbicacionId: '', incidencia: origen?.incidencia ?? '' } }
export function claveParaContenido(previo: { contenido: string; clave: string } | null, datos: unknown) { const contenido = JSON.stringify(datos); return previo?.contenido === contenido ? previo : { contenido, clave: crypto.randomUUID() } }
