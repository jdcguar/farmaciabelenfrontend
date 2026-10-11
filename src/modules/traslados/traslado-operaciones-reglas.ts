import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { permisoTraslado } from './traslado.config'
import { esCantidad, esUuid, fechaValida, micro } from './traslado-reglas'
import type { BorradorPreparacion, BorradorRecepcion, ConfirmacionDespacho, ContextoDespacho, ContextoRecepcion, DetalleTraslado, ErroresTraslado, PreparacionTraslado, RegistroRecepcion } from './traslado.types'

export const trasladoOperable = (t: DetalleTraslado) => ['APROBADO', 'PREPARADO', 'EN_TRANSITO', 'RECIBIDO'].includes(t.estado)
export function permiteNodo(t: DetalleTraslado, s: SesionUsuario, accion: string, nodo: 'origen' | 'destino' | 'participante') {
  const autorizado = s.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO') || (nodo === 'participante' ? [t.origenSucursalId, t.destinoSucursalId].includes(s.sucursal.id) : s.sucursal.id === (nodo === 'origen' ? t.origenSucursalId : t.destinoSucursalId))
  return autorizado && s.permisos.includes(permisoTraslado(accion))
}
export const puedePreparar = (t: DetalleTraslado, s: SesionUsuario) => permiteNodo(t, s, 'PREPARAR', 'origen') && trasladoOperable(t) && t.pendientes.some(p => esCantidad(p.porPrepararBase))
export const puedeRegistrarRecepcion = (c: ContextoDespacho, s: SesionUsuario) => permiteNodo(c.traslado, s, 'RECIBIR', 'destino') && trasladoOperable(c.traslado) && c.despacho.estado === 'EN_TRANSITO' && c.despacho.asignaciones.some(a => esCantidad(a.pendienteBase))
export const puedeConfirmarRecepcion = (c: ContextoRecepcion, s: SesionUsuario) => permiteNodo(c.traslado, s, 'CONFIRMAR_RECEPCION', 'destino') && trasladoOperable(c.traslado) && c.despacho.estado === 'EN_TRANSITO' && c.recepcion.estado === 'REGISTRADA' && (c.despacho.despachadoPorId !== s.usuarioId || !!c.recepcion.controlCompensatorio)
export const reservaVigente = (hasta: string | null, ahora = Date.now()) => !!hasta && Number.isFinite(Date.parse(hasta)) && Date.parse(hasta) > ahora
export const reservaIso = (local: string) => `${local}:00-06:00`
const texto = (e: ErroresTraslado, campo: string, valor: string, min: number, max: number, requerido = true) => {
  if ((requerido || valor.trim()) && (valor.trim().length < min || valor.trim().length > max)) e[campo] = `Escribe entre ${min} y ${max} caracteres.`
}
export function validarPreparacion(t: DetalleTraslado, reserva: string, lineas: BorradorPreparacion[], ahora = Date.now()): ErroresTraslado {
  const e: ErroresTraslado = {}, elegidas = lineas.filter(l => l.incluir)
  if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(reserva) || !fechaValida(reserva.slice(0, 10)) || !reservaVigente(reservaIso(reserva), ahora)) e.reservaHasta = 'Indica una fecha y hora futura de Guatemala.'
  if (!elegidas.length || elegidas.length > 100) e.lineas = 'Selecciona entre 1 y 100 líneas para este despacho.'
  const vistas = new Set<string>()
  lineas.forEach((l, i) => {
    if (!l.incluir) return
    const k = `lineas.${i}.cantidadBase`, pendiente = t.pendientes.find(p => p.lineaId === l.lineaId)
    if (!esUuid(l.lineaId) || vistas.has(l.lineaId) || !pendiente) e[k] = 'La línea no está disponible en este traslado.'
    else if (!esCantidad(l.cantidadBase)) e[k] = 'Indica una cantidad positiva con hasta 6 decimales.'
    else if (micro(l.cantidadBase) > micro(pendiente.porPrepararBase)) e[k] = 'No puede superar el saldo aprobado por preparar.'
    vistas.add(l.lineaId)
  })
  return e
}
export const entradaPreparacion = (t: DetalleTraslado, reserva: string, lineas: BorradorPreparacion[], claveIdempotencia: string): PreparacionTraslado => ({ version: t.version, reservaHasta: reservaIso(reserva), claveIdempotencia, lineas: lineas.filter(l => l.incluir).map(l => ({ lineaId: l.lineaId, cantidadBase: l.cantidadBase.trim() })) })
export function validarSalida(d: Omit<ConfirmacionDespacho, 'version'>) {
  const e: ErroresTraslado = {}
  texto(e, 'custodio', d.custodio, 3, 150); texto(e, 'transporte', d.transporte, 3, 250)
  texto(e, 'condiciones', d.condiciones, 5, 500); texto(e, 'evidencia', d.evidencia, 5, 500); texto(e, 'controlCompensatorio', d.controlCompensatorio ?? '', 5, 500, false)
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(d.costeTransporte.trim())) e.costeTransporte = 'Indica un coste GTQ no negativo, hasta 13 enteros y 2 decimales.'
  return e
}
export function validarCustodia(d: { responsable: string; condiciones: string; evidencia: string }) { const e: ErroresTraslado = {}; texto(e, 'responsable', d.responsable, 3, 150); texto(e, 'condiciones', d.condiciones, 5, 500); texto(e, 'evidencia', d.evidencia, 5, 500); return e }
export function validarMotivo(motivo: string) { const e: ErroresTraslado = {}; texto(e, 'motivo', motivo, 5, 250); return e }
export function validarRegistroRecepcion(c: ContextoDespacho, lineas: BorradorRecepcion[], evidencia: string, control: string, actor: string) {
  const e: ErroresTraslado = {}, elegidas = lineas.filter(l => l.incluir), vistas = new Set<string>()
  texto(e, 'evidencia', evidencia, 5, 500); texto(e, 'controlCompensatorio', control, 5, 500, c.despacho.despachadoPorId === actor)
  if (!elegidas.length || elegidas.length > 100) e.lineas = 'Selecciona entre 1 y 100 asignaciones inspeccionadas.'
  lineas.forEach((l, i) => {
    if (!l.incluir) return
    const k = `lineas.${i}.`
    if (!esUuid(l.asignacionId) || vistas.has(l.asignacionId) || !c.despacho.asignaciones.some(a => a.id === l.asignacionId)) e[k + 'asignacionId'] = 'Asignación no disponible en este despacho.'
    vistas.add(l.asignacionId)
    if (l.numeroLoteObservado.trim().length > 80) e[k + 'numeroLoteObservado'] = 'Usa hasta 80 caracteres.'
    if (l.vencimientoObservado && !fechaValida(l.vencimientoObservado)) e[k + 'vencimientoObservado'] = 'Indica una fecha válida o deja vacío si no tiene vencimiento.'
    for (const campo of ['aceptadaBase', 'cuarentenaBase', 'rechazadaBase'] as const) if (!esCantidad(l[campo], true)) e[k + campo] = 'Cantidad no negativa con hasta 6 decimales.'
    if (!['aceptadaBase', 'cuarentenaBase', 'rechazadaBase'].some(campo => e[k + campo])) {
      if (micro(l.aceptadaBase) + micro(l.cuarentenaBase) + micro(l.rechazadaBase) <= 0n) e[k + 'aceptadaBase'] = 'Registra una cantidad recibida positiva; una falta total se documenta como incidencia.'
      if (micro(l.aceptadaBase) > 0n && !esUuid(l.destinoUbicacionId)) e[k + 'destinoUbicacionId'] = 'Selecciona almacenamiento del destino.'
      if (micro(l.cuarentenaBase) + micro(l.rechazadaBase) > 0n) {
        if (!esUuid(l.cuarentenaUbicacionId)) e[k + 'cuarentenaUbicacionId'] = 'Selecciona cuarentena del destino.'
        texto(e, k + 'incidencia', l.incidencia, 5, 500)
      }
    }
    if (!e[k + 'incidencia']) texto(e, k + 'incidencia', l.incidencia, 5, 500, false)
  })
  return e
}
export const entradaRecepcion = (lineas: BorradorRecepcion[], evidencia: string, control: string, claveIdempotencia: string): RegistroRecepcion => ({ claveIdempotencia, evidencia: evidencia.trim(), controlCompensatorio: control.trim() || null, lineas: lineas.filter(l => l.incluir).map(l => ({ asignacionId: l.asignacionId, numeroLoteObservado: l.numeroLoteObservado.trim().toUpperCase() || null, vencimientoObservado: l.vencimientoObservado || null, aceptadaBase: l.aceptadaBase.trim(), cuarentenaBase: l.cuarentenaBase.trim(), rechazadaBase: l.rechazadaBase.trim(), destinoUbicacionId: esCantidad(l.aceptadaBase) ? l.destinoUbicacionId || null : null, cuarentenaUbicacionId: esCantidad(l.cuarentenaBase) || esCantidad(l.rechazadaBase) ? l.cuarentenaUbicacionId || null : null, incidencia: l.incidencia.trim() || null })) })
export function diferenciasRecepcion(c: ContextoDespacho, lineas: RegistroRecepcion['lineas']) {
  return lineas.flatMap((l, i) => {
    const a = c.despacho.asignaciones.find(a => a.id === l.asignacionId), motivos: string[] = []
    if (!a) return [`Línea ${i + 1}: la asignación ya no está disponible.`]
    if (l.numeroLoteObservado !== a.numeroLote || l.vencimientoObservado !== a.fechaVencimiento) motivos.push('lote o vencimiento observado diferente')
    if (micro(l.aceptadaBase) + micro(l.cuarentenaBase) + micro(l.rechazadaBase) > micro(a.pendienteBase)) motivos.push('cantidad superior al saldo pendiente')
    return motivos.length ? [`Línea ${i + 1}: ${motivos.join('; ')}.`] : []
  })
}
