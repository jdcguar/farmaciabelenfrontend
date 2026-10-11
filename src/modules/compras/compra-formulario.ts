import type { DatosCompra, LineaFormulario, RecursoDocumento, CreacionRequest, DecisionRequest, AccionCompra, DetalleCompra, ErroresCompra } from './compra.types'
import { esDecimal, esUuid, fechaValida, hoyGuatemala, micro } from './compra-reglas'
const nulo = (v: string | undefined) => v?.trim() || null
const lote = (l: LineaFormulario) => ({ numeroLote: nulo(l.numeroLote), fechaVencimiento: nulo(l.fechaVencimiento), fechaFabricacion: nulo(l.fechaFabricacion) })
const comercial = (l: LineaFormulario) => ({ precio: l.precio.trim(), tasaImpuesto: l.tasaImpuesto.trim(), vidaUtilMinimaDias: Number(l.vidaUtilMinimaDias) })
export function entradaCreacion(r: RecursoDocumento, d: DatosCompra, l: LineaFormulario[], claveIdempotencia: string, version?: number): CreacionRequest {
  const comun = { claveIdempotencia, motivo: d.motivo!.trim() }
  switch (r) {
    case 'solicitudes': return { ...comun, sucursalId: d.sucursalId!, fechaRequerida: d.fechaRequerida!, prioridad: d.prioridad as 'ORDINARIA' | 'ALTA' | 'CRITICA', presupuestoEstimado: d.presupuestoEstimado!.trim(), lineas: l.map(x => ({ presentacionId: x.presentacionId, unidadId: x.unidadId, cantidad: x.cantidad.trim() })) }
    case 'cotizaciones': return { ...comun, solicitudId: d.origenId!, proveedorId: d.proveedorId!, documentoProveedor: d.documentoProveedor!.trim(), vigenteHasta: d.vigenteHasta!, fechaEntrega: d.fechaEntrega!, condiciones: d.condiciones!.trim(), monedaOrigen: nulo(d.monedaOrigen), tipoCambio: nulo(d.tipoCambio), fechaCambio: nulo(d.fechaCambio), lineas: l.map(x => ({ solicitudLineaId: x.origenLineaId, cantidad: x.cantidad.trim(), ...comercial(x) })) }
    case 'ordenes': {
      const o = { ...comun, ubicacionId: d.ubicacionId!, fechaEntrega: d.fechaEntrega!, costesAdicionales: d.costesAdicionales!.trim() }
      return version ? { ...o, version, lineas: l.map(x => ({ ordenLineaId: x.origenLineaId, cantidad: x.cantidad.trim(), ...comercial(x) })) } : { ...o, cotizacionId: d.origenId!, lineas: l.map(x => ({ cotizacionLineaId: x.origenLineaId, cantidad: x.cantidad.trim() })) }
    }
    case 'recepciones': return { ...comun, ordenId: d.origenId!, fecha: d.fecha!, documentoProveedor: d.documentoProveedor!.trim(), lineas: l.map(x => ({ ordenLineaId: x.origenLineaId, cantidad: x.cantidad.trim(), ...lote(x) })) }
    case 'facturas': return { ...comun, ordenId: d.origenId!, fecha: d.fecha!, vencimiento: d.vencimiento!, documentoProveedor: d.documentoProveedor!.trim(), costesAdicionales: d.costesAdicionales!.trim(), lineas: l.map(x => ({ recepcionLineaId: x.origenLineaId, cantidad: x.cantidad.trim(), precio: x.precio.trim(), tasaImpuesto: x.tasaImpuesto.trim() })) }
    case 'evaluaciones': return { ...comun, recepcionId: d.origenId!, evidencia: d.evidencia!.trim() }
  }
}
export function entradaDecision(accion: AccionCompra, d: DatosCompra, l: LineaFormulario[], version: number): DecisionRequest {
  const evidencia = d.evidencia!.trim()
  if (accion === 'confirmar') return { version }
  if (accion === 'documental') return { version, evidencia, resultado: d.resultado as 'CONFORME' | 'RECHAZADA' }
  if (accion === 'fisica') return { version, evidencia, lineas: l.map(x => ({ lineaId: x.origenLineaId, cantidad: x.cantidad.trim(), presentacionRecibidaId: nulo(x.presentacionRecibidaId), ...lote(x), incidencia: nulo(x.incidencia) })) }
  if (accion === 'tecnica') return { version, evidencia, lineas: l.map(x => ({ lineaId: x.origenLineaId, aceptada: x.aceptada.trim(), cuarentena: x.cuarentena.trim(), rechazada: x.rechazada.trim(), destinoUbicacionId: nulo(x.destinoUbicacionId), cuarentenaUbicacionId: nulo(x.cuarentenaUbicacionId), incidencia: nulo(x.incidencia) })) }
  if (accion === 'avisos') return { version, evidencia, fechaPrevista: d.fechaPrevista!, transporte: d.transporte!.trim(), condiciones: d.condiciones!.trim() }
  const comun = { version, evidencia, motivo: d.motivo!.trim() }
  return accion === 'autorizar-sobrante' ? { ...comun, lineas: l.map(x => ({ ordenLineaId: x.origenLineaId, cantidad: x.cantidad.trim() })) } : comun
}
function validador() {
  const errores: ErroresCompra = {}, hoy = hoyGuatemala()
  const texto = (k: string, v: string | undefined, min = 5, max = 1000) => { const t = v?.trim() ?? ''; if (t.length < min || t.length > max) errores[k] = `Escribe entre ${min} y ${max} caracteres.` }
  const id = (k: string, v: string | undefined) => { if (!v || !esUuid(v)) errores[k] = 'Selecciona una referencia válida.' }
  const decimal = (k: string, v: string | undefined, escala = 6, cero = false) => { if (!v || !esDecimal(v, escala, cero)) errores[k] = `Usa un decimal ${cero ? 'no negativo' : 'positivo'}, sin comas, con hasta ${15 - escala} enteros y ${escala} decimales.` }
  const fecha = (k: string, v: string | undefined, regla?: 'futura' | 'pasada') => { if (!v || !fechaValida(v)) errores[k] = 'Selecciona una fecha válida (AAAA-MM-DD).'; else if (regla === 'futura' && v < hoy) errores[k] = 'Debe ser hoy o una fecha futura.'; else if (regla === 'pasada' && v > hoy) errores[k] = 'No puede ser futura.' }
  const tasa = (k: string, v: string) => { decimal(k, v, 6, true); if (!errores[k] && micro(v) > 100000000n) errores[k] = 'La tasa no puede superar 100%.' }
  return { errores, texto, id, decimal, fecha, tasa }
}
export function validarCreacion(r: RecursoDocumento, d: DatosCompra, lineas: LineaFormulario[], origen?: DetalleCompra | null, revision = false): ErroresCompra {
  const { errores, texto, id, decimal, fecha, tasa } = validador()
  texto('motivo', d.motivo, 5, 500)
  if (r === 'solicitudes') { id('sucursalId', d.sucursalId); fecha('fechaRequerida', d.fechaRequerida, 'futura'); decimal('presupuestoEstimado', d.presupuestoEstimado, 2, true); if (!['ORDINARIA', 'ALTA', 'CRITICA'].includes(d.prioridad!)) errores.prioridad = 'Selecciona una prioridad.' }
  else if (!revision) id('origenId', d.origenId)
  if (r === 'cotizaciones') { id('proveedorId', d.proveedorId); fecha('vigenteHasta', d.vigenteHasta, 'futura'); fecha('fechaEntrega', d.fechaEntrega, 'futura'); texto('condiciones', d.condiciones); if (d.monedaOrigen) { if (!/^[A-Z]{3}$/.test(d.monedaOrigen)) errores.monedaOrigen = 'Usa tres letras mayúsculas.'; decimal('tipoCambio', d.tipoCambio); fecha('fechaCambio', d.fechaCambio, 'pasada') } else if (d.tipoCambio || d.fechaCambio) errores.monedaOrigen = 'Indica la moneda de origen o elimina los datos del cambio.' }
  if (r === 'ordenes') { id('ubicacionId', d.ubicacionId); fecha('fechaEntrega', d.fechaEntrega, 'futura') }
  if (r === 'recepciones' || r === 'facturas') fecha('fecha', d.fecha, 'pasada')
  if (r === 'facturas') { fecha('vencimiento', d.vencimiento); if (d.vencimiento! < d.fecha!) errores.vencimiento = 'El vencimiento debe ser igual o posterior a la fecha de factura.' }
  if (['ordenes', 'facturas'].includes(r)) decimal('costesAdicionales', d.costesAdicionales, 2, true)
  if (['cotizaciones', 'recepciones', 'facturas'].includes(r)) texto('documentoProveedor', d.documentoProveedor, 1, 100)
  if (r === 'evaluaciones') { texto('evidencia', d.evidencia); return errores }
  if (!lineas.length || lineas.length > 100) errores.lineas = 'Registra entre 1 y 100 líneas.'
  const usadas = new Set<string>()
  lineas.forEach((l, i) => {
    const k = (campo: string) => `lineas.${i}.${campo}`
    const key = r === 'solicitudes' ? `${l.presentacionId}:${l.unidadId}` : l.origenLineaId
    if (r !== 'recepciones' && usadas.has(key)) errores[k(r === 'solicitudes' ? 'presentacionId' : 'origenLineaId')] = 'La referencia está repetida.'
    usadas.add(key)
    if (r === 'solicitudes') { id(k('presentacionId'), l.presentacionId); id(k('unidadId'), l.unidadId) } else id(k('origenLineaId'), l.origenLineaId)
    decimal(k('cantidad'), l.cantidad)
    if (r === 'cotizaciones' || r === 'facturas' || revision) { decimal(k('precio'), l.precio, 2); tasa(k('tasaImpuesto'), l.tasaImpuesto) }
    if (r === 'cotizaciones' || revision) { if (!/^\d+$/.test(l.vidaUtilMinimaDias) || Number(l.vidaUtilMinimaDias) > 36500) errores[k('vidaUtilMinimaDias')] = 'Usa un entero entre 0 y 36500.' }
    if (r === 'recepciones') validarLote(l, i, d.fecha!, errores)
    const original = origen?.lineas.find(x => x.id === l.origenLineaId)
    if (original && ['cotizaciones', 'ordenes', 'facturas'].includes(r) && !revision && !errores[k('cantidad')] && micro(l.cantidad) > micro(original.cantidad)) errores[k('cantidad')] = r === 'facturas' ? 'La cantidad supera la aceptación disponible para facturar.' : 'La cantidad supera la línea de origen.'
  })
  return errores
}
function validarLote(l: LineaFormulario, i: number, fechaRecepcion: string, e: ErroresCompra) {
  const k = (c: string) => `lineas.${i}.${c}`
  if (l.numeroLote.trim().length > 80) e[k('numeroLote')] = 'Máximo 80 caracteres.'
  for (const c of ['fechaVencimiento', 'fechaFabricacion'] as const) if (l[c] && !fechaValida(l[c])) e[k(c)] = 'Selecciona una fecha válida.'
  if (l.fechaFabricacion && (l.fechaFabricacion > fechaRecepcion || l.fechaVencimiento && l.fechaFabricacion > l.fechaVencimiento)) e[k('fechaFabricacion')] = 'La fabricación no puede superar recepción o vencimiento.'
}
export function validarDecision(a: AccionCompra, d: DatosCompra, lineas: LineaFormulario[], doc?: DetalleCompra): ErroresCompra {
  const { errores, texto, id, decimal, fecha } = validador()
  if (a === 'confirmar') return errores
  texto('evidencia', d.evidencia)
  if (!['documental', 'fisica', 'tecnica', 'avisos'].includes(a)) texto('motivo', d.motivo, 5, 500)
  if (a === 'documental' && !['CONFORME', 'RECHAZADA'].includes(d.resultado!)) errores.resultado = 'Selecciona el resultado.'
  if (a === 'avisos') { fecha('fechaPrevista', d.fechaPrevista, 'futura'); texto('transporte', d.transporte, 5, 300); texto('condiciones', d.condiciones) }
  if (!['fisica', 'tecnica', 'autorizar-sobrante'].includes(a)) return errores
  if (!lineas.length || lineas.length > 100) errores.lineas = 'Registra entre 1 y 100 líneas.'
  if (a !== 'autorizar-sobrante' && (lineas.length !== doc?.lineas.length || new Set(lineas.map(l => l.origenLineaId)).size !== lineas.length || lineas.some(l => !doc?.lineas.some(x => x.id === l.origenLineaId)))) errores.lineas = 'Resuelve cada línea del documento exactamente una vez.'
  if (a === 'autorizar-sobrante' && (new Set(lineas.map(l => l.origenLineaId)).size !== lineas.length || lineas.some(l => !doc?.lineas.some(x => x.id === l.origenLineaId)))) errores.lineas = 'Selecciona líneas distintas de esta orden.'
  lineas.forEach((l, i) => {
    const k = (c: string) => `lineas.${i}.${c}`, original = doc?.lineas.find(x => x.id === l.origenLineaId)
    id(k('origenLineaId'), l.origenLineaId)
    if (a === 'autorizar-sobrante') { decimal(k('cantidad'), l.cantidad); return }
    if (a === 'fisica') {
      decimal(k('cantidad'), l.cantidad, 6, true); validarLote(l, i, doc!.fecha, errores)
      if (l.presentacionRecibidaId) id(k('presentacionRecibidaId'), l.presentacionRecibidaId)
      if (original && (esDecimal(l.cantidad, 6, true) && micro(l.cantidad) !== micro(original.cantidad) || l.numeroLote.trim() !== (original.numeroLote ?? '') || l.fechaFabricacion !== (original.fechaFabricacion ?? '') || l.fechaVencimiento !== (original.fechaVencimiento ?? '') || l.presentacionRecibidaId && l.presentacionRecibidaId !== original.presentacionId)) texto(k('incidencia'), l.incidencia)
    } else {
      for (const c of ['aceptada', 'cuarentena', 'rechazada'] as const) decimal(k(c), l[c], 6, true)
      if (['aceptada', 'cuarentena', 'rechazada'].every(c => !errores[k(c)]) && original) {
        if (micro(l.aceptada) + micro(l.cuarentena) + micro(l.rechazada) !== micro(original.cantidad)) errores[k('aceptada')] = 'Aceptada + cuarentena + rechazada debe coincidir exactamente con la cantidad física.'
        if (micro(l.aceptada)) { id(k('destinoUbicacionId'), l.destinoUbicacionId); if (l.destinoUbicacionId !== doc!.ubicacionId) errores[k('destinoUbicacionId')] = 'Usa el destino autorizado por la orden.' }
        if (micro(l.cuarentena)) id(k('cuarentenaUbicacionId'), l.cuarentenaUbicacionId)
        if (micro(l.cuarentena) || micro(l.rechazada)) texto(k('incidencia'), l.incidencia)
        if (original.presentacionObservadaId && original.presentacionObservadaId !== original.presentacionId && (micro(l.aceptada) || micro(l.cuarentena))) errores[k('aceptada')] = 'La presentación distinta debe rechazarse o tramitarse en otra orden.'
      }
    }
    if (l.incidencia) texto(k('incidencia'), l.incidencia)
  })
  return errores
}
