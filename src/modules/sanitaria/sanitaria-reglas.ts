import type { Referencia } from '../catalogos-farmacia/catalogo.types'
import type { RecursoInventario } from '../inventario/inventario.types'
import { fechaRealVenta, instanteRealVenta, instanteVenta, esUuidVenta } from '../ventas/venta-reglas'
import type { AccionSanitaria, VistaSanitaria } from './sanitaria.config'
import { objetoSanitario, textoSanitario, type DatosSanitaria, type DocumentoSanitario } from './sanitaria.types'
export { fechaHoraVenta as fechaHoraSanitaria, esUuidVenta as esUuidSanitaria, hoyVenta as hoySanitaria, claveVenta as claveSanitaria } from '../ventas/venta-reglas'
export const fechaRealSanitaria = (v: string) => v >= '1900-01-01' && v <= '9999-12-31' && fechaRealVenta(v)
export const decimalSanitaria = (v: string, positivo = false) => /^\d{1,9}(\.\d{1,6})?$/.test(v) && (!positivo || /[1-9]/.test(v))
export function microSanitaria(v: string) { if (!decimalSanitaria(v)) throw Error('Cantidad inválida'); const [e, f = ''] = v.split('.'); return BigInt(e!) * 1000000n + BigInt(f.padEnd(6, '0')) }
export function saldoSanitaria(e: DocumentoSanitario) { const cantidad = textoSanitario(e, 'cantidadBase'), resuelto = textoSanitario(e, 'ejecutadaBase') || textoSanitario(e, 'resueltoBase') || '0'; if (!decimalSanitaria(cantidad) || !decimalSanitaria(resuelto)) return ''; const v = microSanitaria(cantidad) - microSanitaria(resuelto); return v < 0n ? '' : `${v / 1000000n}.${String(v % 1000000n).padStart(6, '0')}` }
export const fechaSanitaria = (v: string) => fechaRealVenta(v) ? v.split('-').reverse().join('/') : 'Sin fecha'
export type CampoSanitaria = { nombre: string; etiqueta: string; tipo?: 'area' | 'decimal' | 'cero' | 'fecha' | 'instante' | 'entero' | 'check'; opciones?: Record<string, string>; referencia?: Referencia; sanitario?: VistaSanitaria; inventario?: RecursoInventario; opcional?: boolean; min?: number; max?: number; ayuda?: string }
const campo = (nombre: string, etiqueta: string, extra: Partial<CampoSanitaria> = {}): CampoSanitaria => ({ nombre, etiqueta, ...extra })
const motivo = campo('motivo', 'Motivo de la operación', { tipo: 'area', min: 5, max: 250 }), evidencia = campo('evidencia', 'Referencia de evidencia', { tipo: 'area', min: 5, max: 500, ayuda: 'Identifica el documento, acta o informe que respalda esta operación.' })
const cantidad = campo('cantidadBase', 'Cantidad en unidad base', { tipo: 'decimal' })
const sucursal = campo('sucursalId', 'Sucursal', { referencia: 'sucursales' }), producto = campo('productoId', 'Producto', { referencia: 'productos' })
const resultado = campo('resultado', 'Resultado documentado', { tipo: 'area', min: 5, max: 500 })
export const criteriosCampos = ['identidad', 'integridad', 'conservacion', 'transporte', 'registro', 'riesgo'] as const
const conformes = { CONFORME: 'Conforme', NO_CONFORME: 'No conforme', NO_VERIFICADO: 'No verificado' }
const criterios: CampoSanitaria[] = [...criteriosCampos.map(k => campo(`criterios.${k}`, ({ identidad: 'Identidad del producto', integridad: 'Integridad', conservacion: 'Conservación', transporte: 'Transporte', registro: 'Registro sanitario', riesgo: 'Evaluación de riesgo' })[k], { opciones: k === 'riesgo' ? { ACEPTABLE: 'Aceptable', NO_ACEPTABLE: 'No aceptable', NO_VERIFICADO: 'No verificado' } : ['registro', 'transporte'].includes(k) ? { ...conformes, NO_APLICA: 'No aplica' } : conformes })), campo('criterios.observaciones', 'Observaciones técnicas', { tipo: 'area', min: 5, max: 2000 })]
export const camposControlados: CampoSanitaria[] = ['procedimiento', 'autorizacion', 'evidencia'].map(k => campo(`controlados.${k}`, ({ procedimiento: 'Procedimiento documentado', autorizacion: 'Autorización aplicable', evidencia: 'Evidencia del procedimiento' } as Record<string, string>)[k]!, { tipo: 'area', min: 5, max: 500 }))
const destino = campo('destinoUbicacionId', 'Ubicación de destino', { referencia: 'ubicaciones' })
export const umbralesSanitaria = ['informativoDias', 'preventivoDias', 'prioritarioDias', 'criticoDias', 'vidaUtilMinimaDias'] as const
export function camposSanitaria(a: AccionSanitaria, d: DatosSanitaria, _e: DocumentoSanitario | null): CampoSanitaria[] {
  const comunes = [motivo, evidencia]
  switch (a) {
    case 'crear-caso': return [campo('presentacionId', 'Presentación', { referencia: 'presentaciones', ayuda: 'Permite localizar la posición física a segregar.' }), campo('existenciaId', 'Posición física de origen', { inventario: 'existencias' }), cantidad, { ...destino, etiqueta: 'Ubicación de cuarentena' }, ...comunes]
    case 'adoptar': return comunes
    case 'evaluar': return [cantidad, campo('resultado', 'Dictamen técnico', { opciones: { APTO: 'Apto', NO_APTO: 'No apto', INVESTIGACION: 'En investigación' } }), ...criterios, ...comunes]
    case 'decidir': return [campo('evaluacionId', 'Evaluación que respalda la decisión', { sanitario: 'evaluaciones' }), campo('destino', 'Destino de las unidades', { opciones: { LIBERAR: 'Liberar', MANTENER: 'Mantener en cuarentena', DEVOLVER: 'Devolver al proveedor', BAJA: 'Baja', DESTRUIR: 'Destruir', ANALIZAR: 'Analizar', NOTIFICAR: 'Notificar' } }), cantidad, ...(d.destino === 'LIBERAR' ? [{ ...destino, etiqueta: 'Almacenamiento para liberación' }] : []), campo('costeUnitarioBase', 'Coste documentado por unidad base (GTQ)', { tipo: 'cero', opcional: true, ayuda: 'Deja vacío cuando esté pendiente. No se calcula una valoración automática.' }), ...(d.costeUnitarioBase?.trim() ? [campo('referenciaCoste', 'Referencia del coste documentado', { min: 5, max: 500, tipo: 'area' })] : []), ...comunes]
    case 'cerrar-caso': return [campo('saldoPendienteBase', 'Saldo pendiente documentado', { tipo: 'cero' }), resultado, ...comunes]
    case 'destruir': return [cantidad, campo('metodo', 'Método de destrucción', { min: 5, max: 250 }), campo('gestor', 'Gestor autorizado', { min: 5, max: 250 }), campo('lugar', 'Lugar de destrucción', { min: 5, max: 250 }), campo('ocurridoEn', 'Fecha y hora del hecho (Guatemala)', { tipo: 'instante' }), campo('responsables', 'Responsables y testigos', { tipo: 'area', min: 5, max: 500 }), campo('permisosAplicables', 'Permisos aplicables', { tipo: 'area', min: 5, max: 500 }), campo('acta', 'Referencia del acta', { min: 3, max: 150 }), evidencia]
    case 'crear-retiro': return [campo('alcance', 'Alcance del retiro', { opciones: { SUCURSAL: 'Sucursal', CORPORATIVO: 'Todas las sucursales' } }), ...(d.alcance === 'CORPORATIVO' ? [] : [sucursal]), producto, campo('loteId', 'Lote afectado', { inventario: 'lotes', opcional: true, ayuda: 'Sin lote, el retiro afecta todo el producto.' }), campo('referencia', 'Referencia del retiro', { min: 3, max: 150 }), ...comunes]
    case 'seguir': return [sucursal, campo('tipo', 'Tipo de seguimiento', { opciones: { CLIENTE: 'Cliente', INVENTARIO: 'Inventario', TRANSITO: 'Tránsito', INVESTIGACION: 'Investigación', NOTIFICACION: 'Notificación documentada' } }), campo('ventaId', 'Venta afectada', { opcional: true }), resultado, campo('ocurridoEn', 'Fecha y hora del hecho (Guatemala)', { tipo: 'instante' }), ...comunes]
    case 'cerrar-retiro': return [campo('conciliacion.inventarioRevisado', 'Existencias y reservas revisadas', { tipo: 'check' }), campo('conciliacion.transitoRevisado', 'Unidades en tránsito revisadas', { tipo: 'check' }), campo('conciliacion.ventasRevisadas', 'Ventas afectadas revisadas', { tipo: 'check' }), campo('conciliacion.noLocalizadaBase', 'Cantidad no localizada', { tipo: 'cero' }), { ...resultado, nombre: 'conciliacion.resultado' }, ...comunes]
    case 'resolver': return [...criterios, ...comunes]
    case 'sincronizar': return [sucursal]
    case 'atender': case 'cerrar-alerta': return [resultado, campo('casoId', 'Caso sanitario relacionado', { sanitario: 'casos', opcional: true }), campo('retiroId', 'Retiro relacionado', { sanitario: 'retiros', opcional: true }), ...comunes]
    case 'digitalizar': return [campo('presentacionId', 'Presentación', { referencia: 'presentaciones' }), campo('existenciaId', 'Posición física', { inventario: 'existencias' }), cantidad, { ...destino, etiqueta: 'Ubicación de cuarentena' }, campo('folio', 'Folio manual', { min: 3, max: 100 }), campo('ocurridoEn', 'Fecha y hora de inmovilización (Guatemala)', { tipo: 'instante' }), campo('etiqueta', 'Identificación física de las unidades', { min: 3, max: 150 }), ...comunes]
    case 'conciliar': return [campo('localizadaBase', 'Cantidad localizada', { tipo: 'cero' }), campo('noLocalizadaBase', 'Cantidad no localizada', { tipo: 'cero' }), resultado, ...comunes]
    case 'registro': return [producto, campo('numero', 'Referencia de registro sanitario', { min: 3, max: 150 }), campo('estado', 'Estado documentado', { opciones: { VIGENTE: 'Vigente', VERIFICACION: 'En verificación', SUSPENDIDO: 'Suspendido', CANCELADO: 'Cancelado' } }), campo('vigenteDesde', 'Vigente desde', { tipo: 'fecha' }), campo('vigenteHasta', 'Vigente hasta', { tipo: 'fecha' }), ...comunes]
    case 'corregir': return [campo('presentacionId', 'Presentación del lote', { referencia: 'presentaciones' }), campo('loteId', 'Lote a corregir', { inventario: 'lotes' }), campo('fechaNueva', 'Fecha de vencimiento corregida', { tipo: 'fecha' }), ...comunes]
    case 'politica': return [campo('alcancePolitica', 'Aplicar a', { opciones: { GLOBAL: 'Global', PRODUCTO: 'Producto', CATEGORIA: 'Categoría sanitaria', TIPO: 'Tipo de producto' } }), ...(d.alcancePolitica === 'PRODUCTO' ? [producto] : d.alcancePolitica === 'CATEGORIA' ? [campo('categoriaId', 'Categoría sanitaria', { sanitario: 'categorias' })] : d.alcancePolitica === 'TIPO' ? [campo('tipoProducto', 'Tipo de producto', { opciones: { MEDICAMENTO: 'Medicamento', AFIN: 'Producto afín' } })] : []), ...umbralesSanitaria.map(k => campo(`configuracion.${k}`, ({ informativoDias: 'Alerta informativa (días)', preventivoDias: 'Alerta preventiva (días)', prioritarioDias: 'Alerta prioritaria (días)', criticoDias: 'Alerta crítica (días)', vidaUtilMinimaDias: 'Vida útil mínima para liberar (días)' })[k], { tipo: 'entero' })), ...comunes]
    case 'categoria': return [campo('codigo', 'Código de categoría', { min: 2, max: 30 }), campo('nombre', 'Nombre de categoría', { min: 2, max: 150 }), ...comunes]
    case 'clasificacion': return [producto, campo('categoriaId', 'Categoría sanitaria', { sanitario: 'categorias' }), ...comunes]
    case 'adjuntar': return []
    default: return comunes
  }
}
export function datosInicialesSanitaria(a: AccionSanitaria, e: DocumentoSanitario | null, sucursalId: string): DatosSanitaria {
  const d: DatosSanitaria = { sucursalId, alcance: 'SUCURSAL', alcancePolitica: 'GLOBAL', cantidadBase: e ? (a === 'decidir' ? textoSanitario(e, 'cantidadDisponibleParaDecision') : '') || saldoSanitaria(e) : '', saldoPendienteBase: e ? saldoSanitaria(e) : '', 'conciliacion.noLocalizadaBase': '0', noLocalizadaBase: '0' }
  if (['registro', 'politica', 'categoria', 'clasificacion'].includes(a) && e) { for (const [k, v] of Object.entries(e)) if (typeof v === 'string' && !['motivo', 'evidencia'].includes(k)) d[k] = v; for (const [k, v] of Object.entries(objetoSanitario(e.configuracion))) d[`configuracion.${k}`] = String(v); d.alcancePolitica = e.productoId ? 'PRODUCTO' : e.categoriaId ? 'CATEGORIA' : e.tipoProducto ? 'TIPO' : 'GLOBAL' }
  if (a === 'conciliar' && e) d.localizadaBase = textoSanitario(e, 'localizadaBase')
  if (a === 'seguir' && e?.sucursalId) d.sucursalId = textoSanitario(e, 'sucursalId')
  return d
}
export function validarCamposSanitaria(cs: CampoSanitaria[], d: DatosSanitaria) {
  const errores: Record<string, string> = {}
  for (const c of cs) {
    const v = (d[c.nombre] ?? '').trim(); if (c.opcional && !v) continue
    if (c.tipo === 'check') { if (v !== 'true') errores[c.nombre] = 'Confirma la revisión documentada.' }
    else if (c.opciones) { if (!Object.hasOwn(c.opciones, v)) errores[c.nombre] = 'Selecciona una opción.' }
    else if (c.referencia || c.sanitario || c.inventario || c.nombre === 'ventaId') { if (!esUuidVenta(v)) errores[c.nombre] = 'Selecciona un registro válido.' }
    else if (c.tipo === 'decimal' || c.tipo === 'cero') { if (!decimalSanitaria(v, c.tipo === 'decimal')) errores[c.nombre] = 'Cantidad válida de hasta seis decimales.' }
    else if (c.tipo === 'entero') { if (!/^\d{1,4}$/.test(v) || Number(v) > 3650) errores[c.nombre] = 'Indica entre 0 y 3650 días.' }
    else if (c.tipo === 'fecha') { if (!fechaRealSanitaria(v)) errores[c.nombre] = 'Indica una fecha real entre 1900 y 9999.' }
    else if (c.tipo === 'instante') { if (!instanteRealVenta(v) || Date.parse(instanteVenta(v)) > Date.now()) errores[c.nombre] = 'Indica un hecho ocurrido, con hora de Guatemala.' }
    else if (v.length < (c.min ?? 3) || v.length > (c.max ?? 500)) errores[c.nombre] = `Escribe entre ${c.min ?? 3} y ${c.max ?? 500} caracteres.`
  }
  return errores
}
export function validarOperacionSanitaria(a: AccionSanitaria, d: DatosSanitaria, e: DocumentoSanitario | null, controlado: boolean) {
  const errores = validarCamposSanitaria([...camposSanitaria(a, d, e), ...(controlado ? camposControlados : [])], d)
  if (a === 'registro' && d.vigenteDesde! > d.vigenteHasta!) errores.vigenteHasta = 'La vigencia debe estar en orden.'
  if (a === 'categoria' && !/^[A-Za-z0-9_-]+$/.test(d.codigo ?? '')) errores.codigo = 'Usa letras, números, guiones o guiones bajos.'
  if (a === 'politica') { const dias = umbralesSanitaria.slice(0, 4).map(k => Number(d[`configuracion.${k}`])); if (dias.some((v, i) => i > 0 && v > dias[i - 1]!)) errores['configuracion.criticoDias'] = 'Los umbrales deben disminuir desde informativo hasta crítico.' }
  if (e && ['evaluar', 'decidir', 'destruir'].includes(a) && decimalSanitaria(d.cantidadBase ?? '')) { const saldo = a === 'decidir' && ['LIBERAR', 'BAJA', 'DESTRUIR', 'DEVOLVER'].includes(d.destino ?? '') ? textoSanitario(e, 'cantidadDisponibleParaDecision') : saldoSanitaria(e); if (saldo && microSanitaria(d.cantidadBase!) > microSanitaria(saldo)) errores.cantidadBase = 'La cantidad supera el saldo del documento.' }
  if (a === 'conciliar' && e && decimalSanitaria(d.localizadaBase ?? '') && decimalSanitaria(d.noLocalizadaBase ?? '')) { const h = objetoSanitario(e.caso); const cant = textoSanitario(h, 'cantidadBase'); if (cant && microSanitaria(d.localizadaBase!) + microSanitaria(d.noLocalizadaBase!) !== microSanitaria(cant)) errores.noLocalizadaBase = 'Las cantidades deben conciliar exactamente el folio.' }
  if (a === 'evaluar' && d.resultado === 'APTO') for (const k of criteriosCampos) { const v = d[`criterios.${k}`]; if (!(k === 'riesgo' ? v === 'ACEPTABLE' : ['transporte', 'registro'].includes(k) ? ['CONFORME', 'NO_APLICA'].includes(v ?? '') : v === 'CONFORME')) errores[`criterios.${k}`] = 'Un dictamen apto requiere conformidad y riesgo aceptable.' }
  return errores
}
export function entradaSanitaria(a: AccionSanitaria, d: DatosSanitaria, e: DocumentoSanitario | null, claveIdempotencia: string, controlado = false): Record<string, unknown> {
  const x: Record<string, unknown> = { claveIdempotencia }
  for (const c of camposSanitaria(a, d, e)) { if (['presentacionId', 'alcance', 'alcancePolitica'].includes(c.nombre)) continue; const v = (d[c.nombre] ?? '').trim(); if (c.opcional && !v) continue; const valor = c.tipo === 'instante' ? instanteVenta(v) : c.tipo === 'entero' ? Number(v) : c.tipo === 'check' ? v === 'true' : v; const [base, sub] = c.nombre.split('.'); if (sub) { x[base!] = { ...objetoSanitario(x[base!]), [sub]: valor } } else x[c.nombre] = valor }
  if (e && !['adoptar', 'resolver', 'corregir'].includes(a)) x.version = e.version
  if (['registro', 'politica', 'categoria', 'clasificacion'].includes(a)) x.version = e?.version ?? null
  if (a === 'categoria') x.id = e?.id ?? null
  if (a === 'adoptar') x.cuarentenaId = e!.id
  if (a === 'resolver') x.versionBloqueo = e!.version
  if (a === 'corregir') { delete x.loteId; x.versionLote = e!.version }
  if (a === 'crear-retiro' && d.alcance === 'CORPORATIVO') x.sucursalId = null
  if (a === 'decidir') { x.costeUnitarioBase ??= null; x.referenciaCoste ??= null }
  if (controlado) x.controlados = Object.fromEntries(camposControlados.map(c => [c.nombre.split('.')[1], d[c.nombre]!.trim()]))
  return x
}
export function endpointSanitaria(a: AccionSanitaria, vista: VistaSanitaria, id = ''): { ruta: string; method: 'POST' | 'PATCH' } {
  const patch: Partial<Record<AccionSanitaria, string>> = { 'cerrar-caso': `/casos/${id}/cerrar`, 'aprobar-decision': `/decisiones/${id}/aprobar`, 'cancelar-decision': `/decisiones/${id}/cancelar`, 'cerrar-retiro': `/retiros/${id}/cerrar`, 'aprobar-bloqueo': `/resoluciones-bloqueo/${id}/aprobar`, 'rechazar-bloqueo': `/resoluciones-bloqueo/${id}/rechazar`, atender: `/alertas/${id}/atender`, 'cerrar-alerta': `/alertas/${id}/cerrar`, conciliar: `/contingencias/${id}/conciliar`, 'aprobar-correccion': `/correcciones/${id}/aprobar`, 'rechazar-correccion': `/correcciones/${id}/rechazar` }
  const post: Partial<Record<AccionSanitaria, string>> = { 'crear-caso': '/casos', adoptar: '/casos', evaluar: `/casos/${id}/evaluaciones`, decidir: `/casos/${id}/decisiones`, destruir: `/bajas/${id}/destrucciones`, 'crear-retiro': '/retiros', seguir: `/retiros/${id}/seguimientos`, resolver: `/bloqueos/${id}/resoluciones`, sincronizar: '/alertas/sincronizar', digitalizar: '/contingencias/digitalizaciones', registro: '/registros', corregir: `/lotes/${id}/correcciones`, politica: '/politicas', categoria: '/categorias', clasificacion: '/clasificaciones', adjuntar: `/${vista}/${id}/adjuntos` }
  return patch[a] ? { ruta: patch[a]!, method: 'PATCH' } : { ruta: post[a]!, method: 'POST' }
}
export function destinoResultadoSanitaria(a: AccionSanitaria, vista: VistaSanitaria, respuesta: unknown, idOriginal = '') {
  const r = objetoSanitario(respuesta), anidado = a === 'evaluar' ? 'evaluacion' : a === 'decidir' || a.endsWith('-decision') ? 'decision' : a === 'destruir' ? 'destruccion' : a === 'digitalizar' || a === 'conciliar' ? 'contingencia' : a === 'seguir' ? 'seguimiento' : '', d = anidado && r[anidado] ? objetoSanitario(r[anidado]) : r
  const recurso = a === 'adoptar' || a === 'crear-caso' ? 'casos' : a === 'evaluar' ? 'evaluaciones' : a === 'decidir' || a.endsWith('-decision') ? 'decisiones' : a === 'destruir' ? 'destrucciones' : a === 'resolver' ? 'resoluciones-bloqueo' : a === 'corregir' ? 'correcciones' : a === 'seguir' ? 'seguimientos' : vista, id = a === 'adjuntar' ? idOriginal : textoSanitario(d, 'id')
  return `/sanitaria/${recurso}${id && esUuidVenta(id) ? '/' + id : ''}`
}
