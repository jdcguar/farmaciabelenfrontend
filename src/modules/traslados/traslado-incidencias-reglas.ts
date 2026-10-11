import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { permiteNodo } from './traslado-operaciones-reglas'
import { esCantidad, esUuid, micro } from './traslado-reglas'
import type { ContextoIncidencia, DatosSolicitud, DetalleDespacho, DetalleTraslado, ErroresTraslado, IncidenciaTraslado, RegistroIncidencia, ResolucionIncidencia, ResolucionTraslado, TipoIncidencia } from './traslado.types'

export const tiposIncidencia: Record<TipoIncidencia, string> = { FALTANTE: 'Faltante', SOBRANTE: 'Sobrante', DANO: 'Daño', EMBALAJE: 'Embalaje', PRODUCTO: 'Producto', LOTE: 'Lote', VENCIMIENTO: 'Vencimiento', CONSERVACION: 'Conservación', OTRA: 'Otra' }
export const resolucionesIncidencia: Record<ResolucionIncidencia, string> = { ACLARADA: 'Aclarada', FALTANTE_JUSTIFICADO: 'Faltante justificado', TRASLADO_RELACIONADO: 'Traslado relacionado' }
export const admiteIncidencias = (t: DetalleTraslado) => ['PREPARADO', 'EN_TRANSITO', 'RECIBIDO'].includes(t.estado)
export const puedeIncidencia = (t: DetalleTraslado, s: SesionUsuario) => admiteIncidencias(t) && permiteNodo(t, s, 'INCIDENCIAS', 'participante')
export const puedeResolver = (t: DetalleTraslado, i: IncidenciaTraslado, s: SesionUsuario) => admiteIncidencias(t) && i.estado === 'ABIERTA' && permiteNodo(t, s, 'RESOLVER_INCIDENCIA', 'participante')
export const puedeJustificar = (t: DetalleTraslado, i: IncidenciaTraslado, s: SesionUsuario) => puedeResolver(t, i, s) && i.tipo === 'FALTANTE' && !!i.asignacionId && esCantidad(i.cantidadBase) && s.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO')
export const puedeRetorno = (t: DetalleTraslado, s: SesionUsuario) => t.despachos.some(d => !!d.despachadoEn) && permiteNodo(t, s, 'CREAR', 'origen')
export const puedeComplementario = (t: DetalleTraslado, s: SesionUsuario) => admiteIncidencias(t) && permiteNodo(t, s, 'CREAR', 'participante')
function texto(e: ErroresTraslado, campo: string, valor: string, max: number, requerido = true) { if ((requerido || valor.trim()) && (valor.trim().length < 5 || valor.trim().length > max)) e[campo] = `Registra entre 5 y ${max} caracteres.` }
export function validarIncidencia(t: DetalleTraslado, datos: RegistroIncidencia, despacho: DetalleDespacho | null): ErroresTraslado {
  const e: ErroresTraslado = {}
  if (!Object.hasOwn(tiposIncidencia, datos.tipo)) e.tipo = 'Selecciona un tipo de incidencia.'
  if (!esCantidad(datos.cantidadBase, true)) e.cantidadBase = 'Usa una cantidad no negativa, con hasta 6 decimales.'
  const asignacion = despacho?.trasladoId === t.id ? despacho.asignaciones.find(a => a.id === datos.asignacionId) : undefined
  if (datos.asignacionId && (!esUuid(datos.asignacionId) || !asignacion)) e.asignacionId = 'Selecciona una asignación de este traslado.'
  if (datos.tipo === 'FALTANTE') {
    if (!asignacion || despacho?.estado !== 'EN_TRANSITO') e.asignacionId = 'El faltante requiere una asignación de un despacho en tránsito.'
    if (!esCantidad(datos.cantidadBase)) e.cantidadBase = 'El faltante debe tener una cantidad positiva.'
    else if (asignacion && micro(datos.cantidadBase) > micro(asignacion.pendienteBase)) e.cantidadBase = 'El faltante supera el saldo pendiente de la asignación.'
  }
  texto(e, 'descripcion', datos.descripcion, 500); texto(e, 'evidencia', datos.evidencia, 500)
  return e
}
export function errorRelacionado(c: ContextoIncidencia, rel: DetalleTraslado): string | null {
  const t = c.traslado, i = c.incidencia
  if (rel.id === t.id || rel.estado !== 'CERRADO') return 'Selecciona otro traslado cerrado.'
  if (!((rel.origenSucursalId === t.origenSucursalId && rel.destinoSucursalId === t.destinoSucursalId) || (rel.origenSucursalId === t.destinoSucursalId && rel.destinoSucursalId === t.origenSucursalId))) return 'El traslado debe corresponder a los mismos puntos, en el mismo sentido o en sentido inverso.'
  const producto = c.asignacion ? t.lineas.find(l => l.id === c.asignacion!.lineaId)?.presentacionId : null
  if (i.asignacionId && !producto) return 'No se pudo verificar el producto de la asignación original.'
  const recibida = rel.pendientes.filter(p => !producto || rel.lineas.find(l => l.id === p.lineaId)?.presentacionId === producto).reduce((s, p) => s + micro(p.recibidaBase), 0n)
  return recibida <= 0n || recibida < micro(i.cantidadBase) ? 'El traslado relacionado no tiene recepción efectiva suficiente del producto observado.' : null
}
export function validarResolucion(c: ContextoIncidencia, datos: ResolucionTraslado, s: SesionUsuario, rel: DetalleTraslado | null): ErroresTraslado {
  const e: ErroresTraslado = {}, i = c.incidencia
  if (!Object.hasOwn(resolucionesIncidencia, datos.resolucion)) e.resolucion = 'Selecciona una resolución.'
  if (!puedeResolver(c.traslado, i, s)) e.resolucion = 'La incidencia no admite resolución con este estado o acceso.'
  texto(e, 'motivo', datos.motivo, 250); texto(e, 'evidencia', datos.evidencia, 500); texto(e, 'controlCompensatorio', datos.controlCompensatorio ?? '', 500, false)
  if (datos.resolucion === 'FALTANTE_JUSTIFICADO') {
    if (!puedeJustificar(c.traslado, i, s)) e.resolucion = 'Solo el alcance corporativo puede justificar una incidencia de faltante asignada.'
    else if (!c.asignacion || c.despacho?.estado !== 'EN_TRANSITO' || micro(i.cantidadBase) > micro(c.asignacion.pendienteBase)) e.resolucion = 'El faltante ya no está pendiente en tránsito. Actualiza y revisa la incidencia.'
  }
  if (datos.resolucion === 'TRASLADO_RELACIONADO') {
    if (!datos.trasladoRelacionadoId || !esUuid(datos.trasladoRelacionadoId) || rel?.id !== datos.trasladoRelacionadoId) e.trasladoRelacionadoId = 'Selecciona y verifica un traslado relacionado.'
    else { const error = errorRelacionado(c, rel); if (error) e.trasladoRelacionadoId = error }
  } else if (datos.trasladoRelacionadoId) e.trasladoRelacionadoId = 'Esta resolución no admite un traslado relacionado.'
  return e
}
export function datosRelacionados(t: DetalleTraslado, s: SesionUsuario, modo: 'retorno' | 'complementario'): DatosSolicitud {
  const inverso = modo === 'retorno' || !s.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO') && s.sucursal.id === t.origenSucursalId
  return { origenSucursalId: inverso ? t.destinoSucursalId : t.origenSucursalId, destinoSucursalId: inverso ? t.origenSucursalId : t.destinoSucursalId, tipo: modo === 'retorno' ? t.tipo === 'ABASTECIMIENTO' ? 'DEVOLUCION_INTERNA' : t.tipo === 'DEVOLUCION_INTERNA' ? 'ABASTECIMIENTO' : t.tipo : inverso ? 'REDISTRIBUCION' : t.tipo, prioridad: t.prioridad, fechaRequerida: '', motivo: '' }
}
export function validarRelacionada(t: DetalleTraslado, d: DatosSolicitud, modo: 'retorno' | 'complementario'): ErroresTraslado {
  const inverso = d.origenSucursalId === t.destinoSucursalId && d.destinoSucursalId === t.origenSucursalId, directo = d.origenSucursalId === t.origenSucursalId && d.destinoSucursalId === t.destinoSucursalId
  return (modo === 'retorno' ? inverso && t.despachos.some(x => !!x.despachadoEn) : inverso || directo) ? {} : { origenSucursalId: modo === 'retorno' ? 'El retorno debe invertir los puntos de un traslado despachado.' : 'El complementario debe conservar los puntos originales, en el mismo sentido o en sentido inverso.' }
}
