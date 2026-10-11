import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { permisoTraslado } from './traslado.config'
import type { AccionTraslado, CreacionTraslado, DatosSolicitud, DecisionTraslado, DetalleTraslado, ErroresTraslado, LineaSolicitud } from './traslado.types'
export const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
export function fechaValida(v: string) { const d = new Date(`${v}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '1900-01-01' && v <= '9999-12-31' && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v }
export function hoyGuatemala() { const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); return ['year', 'month', 'day'].map(t => p.find(v => v.type === t)?.value).join('-') }
export const esCantidad = (v: string, cero = false) => /^\d{1,9}(\.\d{1,6})?$/.test(v.trim()) && (cero || /[1-9]/.test(v))
export function micro(v: string) { const [e = '0', f = ''] = v.trim().split('.'); return BigInt(e) * 1000000n + BigInt(f.padEnd(6, '0')) }
export const cantidadTexto = (v: string) => v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
export const fechaHora = (v: string | null) => v ? new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'Sin registro'
export function lineaInicial(): LineaSolicitud { return { clave: crypto.randomUUID(), presentacionId: '', unidadId: '', cantidad: '', vidaUtilMinimaDias: '' } }
export function claveParaContenido(previo: { contenido: string; clave: string } | null, datos: unknown) { const contenido = JSON.stringify(datos); return previo?.contenido === contenido ? previo : { contenido, clave: crypto.randomUUID() } }
export function validarSolicitud(d: DatosSolicitud, lineas: LineaSolicitud[]): ErroresTraslado {
  const e: ErroresTraslado = {}
  if (!esUuid(d.origenSucursalId)) e.origenSucursalId = 'Selecciona la sucursal de origen.'
  if (!esUuid(d.destinoSucursalId)) e.destinoSucursalId = 'Selecciona la sucursal de destino.'
  else if (d.destinoSucursalId === d.origenSucursalId) e.destinoSucursalId = 'Origen y destino deben ser diferentes.'
  if (!['ABASTECIMIENTO', 'DEVOLUCION_INTERNA', 'HORIZONTAL', 'REDISTRIBUCION'].includes(d.tipo)) e.tipo = 'Selecciona un tipo válido.'
  if (!['ORDINARIA', 'URGENTE', 'EMERGENCIA'].includes(d.prioridad)) e.prioridad = 'Selecciona una prioridad válida.'
  if (!fechaValida(d.fechaRequerida)) e.fechaRequerida = 'Indica una fecha válida.'
  if (d.motivo.trim().length < 5 || d.motivo.trim().length > 250) e.motivo = 'Escribe entre 5 y 250 caracteres.'
  if (!lineas.length || lineas.length > 100) e.lineas = 'Incluye entre 1 y 100 presentaciones.'
  const vistas = new Set<string>()
  lineas.forEach((l, i) => {
    const k = `lineas.${i}.`
    if (!esUuid(l.presentacionId)) e[k + 'presentacionId'] = 'Selecciona una presentación.'
    else if (vistas.has(l.presentacionId)) e[k + 'presentacionId'] = 'La presentación ya está incluida; ajusta su cantidad.'
    vistas.add(l.presentacionId)
    if (!esUuid(l.unidadId)) e[k + 'unidadId'] = 'Selecciona la unidad solicitada.'
    if (!esCantidad(l.cantidad)) e[k + 'cantidad'] = 'Cantidad positiva: hasta 9 enteros y 6 decimales, usando punto.'
    if (!/^\d{1,5}$/.test(l.vidaUtilMinimaDias) || Number(l.vidaUtilMinimaDias) > 36500) e[k + 'vidaUtilMinimaDias'] = 'Indica días enteros entre 0 y 36500.'
  })
  return e
}
export function entradaSolicitud(d: DatosSolicitud, lineas: LineaSolicitud[], claveIdempotencia: string): CreacionTraslado {
  return { origenSucursalId: d.origenSucursalId, destinoSucursalId: d.destinoSucursalId, tipo: d.tipo, prioridad: d.prioridad, fechaRequerida: d.fechaRequerida, motivo: d.motivo.trim(), claveIdempotencia, retornoDeId: null,
    lineas: lineas.map(l => ({ presentacionId: l.presentacionId, unidadId: l.unidadId, cantidad: l.cantidad.trim(), vidaUtilMinimaDias: Number(l.vidaUtilMinimaDias) })) }
}
export function accionesDisponibles(d: DetalleTraslado, s: SesionUsuario) {
  const corporativo = s.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO'), origen = corporativo || s.sucursal.id === d.origenSucursalId, destino = corporativo || s.sucursal.id === d.destinoSucursalId
  const participante = origen || destino, abiertas = ['APROBADO', 'PREPARADO', 'EN_TRANSITO', 'RECIBIDO'].includes(d.estado)
  const posibles: AccionTraslado[] = []
  if (d.estado === 'SOLICITADO' && origen) posibles.push('aprobar', 'rechazar')
  if (participante && ['SOLICITADO', 'APROBADO', 'PREPARADO'].includes(d.estado) && !d.despachos.some(x => x.despachadoEn)) posibles.push('cancelar')
  if (destino && abiertas && !d.recepcionHabilitadaEn) posibles.push('habilitar-recepcion')
  if (origen && abiertas && !d.incidencias.some(i => i.estado === 'ABIERTA') && !d.despachos.some(x => x.estado === 'EN_TRANSITO')) posibles.push('cerrar')
  return posibles.filter(a => s.permisos.includes(permisoTraslado(a.toUpperCase().replaceAll('-', '_'))))
}
export function validarDecision(accion: AccionTraslado, doc: DetalleTraslado, motivo: string, control: string, cantidades: Record<string, string>, actor: string): ErroresTraslado {
  const e: ErroresTraslado = {}
  if (motivo.trim().length < 5 || motivo.trim().length > 250) e.motivo = 'Escribe entre 5 y 250 caracteres.'
  if (control.trim() && (control.trim().length < 5 || control.trim().length > 500)) e.controlCompensatorio = 'Escribe entre 5 y 500 caracteres.'
  if (accion === 'aprobar' && doc.creadoPorId === actor && !control.trim()) e.controlCompensatorio = 'Documenta el control compensatorio (5 a 500 caracteres) para aprobar tu propia solicitud.'
  if (accion === 'aprobar') {
    let total = 0n
    for (const l of doc.lineas) {
      const v = cantidades[l.id] ?? ''
      if (!esCantidad(v, true)) e[l.id] = 'Indica una cantidad no negativa con hasta 6 decimales.'
      else if (micro(v) > micro(l.solicitadaBase)) e[l.id] = 'No puede superar la cantidad solicitada en unidad base.'
      else total += micro(v)
    }
    if (total === 0n) e.lineas = 'Aprueba al menos una cantidad positiva; para rechazar todo usa Rechazar solicitud.'
  }
  return e
}
export function entradaDecision(accion: AccionTraslado, doc: DetalleTraslado, motivo: string, control: string, cantidades: Record<string, string>): DecisionTraslado {
  return { version: doc.version, motivo: motivo.trim(), controlCompensatorio: control.trim() || null, ...(accion === 'aprobar' ? { lineas: doc.lineas.map(l => ({ lineaId: l.id, cantidadAprobadaBase: cantidades[l.id]!.trim() })) } : {}) }
}
