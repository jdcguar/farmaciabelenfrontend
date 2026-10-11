import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { cajaConfig, operacionesRutaCaja, permisoCaja, type RutaCaja } from './caja.config'
import type { ErroresCaja, RegistroCaja, RecursoCaja } from './caja.types'
import { centavosCaja, enAlcanceCaja, esMontoCaja, esUuidCaja } from './caja-reglas'
export const textoCaja = (d: Record<string, unknown> | null, campo: string) => typeof d?.[campo] === 'string' ? d[campo] as string : ''
export const etiquetaRegistroCaja = (d: RegistroCaja) => textoCaja(d, 'codigo') ? `${textoCaja(d, 'codigo')} · ${textoCaja(d, 'nombre')}` : textoCaja(d, 'numero') || `${textoCaja(d, 'tipo') || textoCaja(d, 'fechaNegocio') || d.id}${textoCaja(d, 'importe') ? ` · Q ${textoCaja(d, 'importe')}` : ''}`
export type CampoOperacionCaja = { nombre: string; etiqueta: string; tipo?: 'texto' | 'area' | 'monto' | 'uuid' | 'fecha' | 'instante' | 'booleano' | 'lista'; opcional?: boolean; max?: number; cero?: boolean; opciones?: Record<string, string>; recurso?: RecursoCaja | 'usuarios' | 'sucursales'; estados?: string[]; ayuda?: string; personal?: boolean }
export type OperacionCaja = { titulo: string; permiso: string; metodo: 'POST' | 'PATCH' | 'PUT'; ruta: string; resultado: RecursoCaja; campos: CampoOperacionCaja[]; control?: boolean; conteo?: boolean; tiempo?: boolean; horario?: boolean; aviso: string }
const motivo: CampoOperacionCaja = { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'area', max: 250 }
const evidencia: CampoOperacionCaja = { nombre: 'evidencia', etiqueta: 'Evidencia', tipo: 'area', max: 500, ayuda: 'Referencia del acta o comprobante y descripción del control realizado.' }
const explicacion: CampoOperacionCaja = { nombre: 'explicacion', etiqueta: 'Explicación de la diferencia', tipo: 'area', opcional: true, max: 500 }
const turno: CampoOperacionCaja = { nombre: 'turnoId', etiqueta: 'Turno', tipo: 'uuid', recurso: 'turnos', estados: ['ABIERTO'] }
const sucursal: CampoOperacionCaja = { nombre: 'sucursalId', etiqueta: 'Sucursal', tipo: 'uuid', recurso: 'sucursales' }
const usuario = (nombre: string, etiqueta: string, personal = false): CampoOperacionCaja => ({ nombre, etiqueta, tipo: 'uuid', recurso: 'usuarios', personal })
const importe: CampoOperacionCaja = { nombre: 'importe', etiqueta: 'Importe GTQ', tipo: 'monto' }
const referencia: CampoOperacionCaja = { nombre: 'referencia', etiqueta: 'Referencia', max: 100 }
const lista = (nombre: string, etiqueta: string, recurso: RecursoCaja, estados: string[], opcional = false): CampoOperacionCaja => ({ nombre, etiqueta, tipo: 'lista', recurso, estados, opcional, ayuda: 'Selecciona cada documento una vez. Máximo 100.' })
export function obtenerOperacionCaja(r: RutaCaja): OperacionCaja | null {
  const id = r.id ?? '', recurso = r.recurso, a = r.operacion ?? '', crear = r.modo === 'crear'
  const base = (titulo: string, campos: CampoOperacionCaja[], aviso: string, extra: Partial<OperacionCaja> = {}): OperacionCaja => ({ titulo, campos, aviso, permiso: crear ? permisoCaja(recurso, cajaConfig[recurso].crear) : operacionesRutaCaja[recurso]?.[a] ?? '', metodo: crear ? 'POST' : 'PATCH', ruta: crear ? `/${recurso}` : `/${recurso}/${id}/${a}`, resultado: recurso, ...extra })
  if (crear) {
    if (recurso === 'cajas') return base('Crear caja', [sucursal, { nombre: 'codigo', etiqueta: 'Código', max: 30 }, { nombre: 'nombre', etiqueta: 'Nombre de caja', max: 150 }, { nombre: 'tipo', etiqueta: 'Tipo', opciones: { VENTAS: 'Caja de ventas' } }], 'Crea una caja de ventas para la sucursal. Los fondos de caja chica se administran desde Caja y flujo de efectivo > Caja chica.')
    if (recurso === 'turnos') return base('Abrir turno', [{ nombre: 'cajaId', etiqueta: 'Caja disponible', tipo: 'uuid', recurso: 'cajas', estados: ['DISPONIBLE'] }, { nombre: 'remesaFondoId', etiqueta: 'Remesa para el fondo', tipo: 'uuid', recurso: 'remesas', estados: ['RETIRADO', 'CAJA_FUERTE'], opcional: true, ayuda: 'Para relevo: remesa de cierre/retiro disponible que coincide con el fondo contado.' }, evidencia], 'Acepta personalmente el fondo contado. El fondo inicial se conserva separado de las ventas.', { conteo: true, tiempo: true })
    if (recurso === 'movimientos') return base('Registrar movimiento', [turno, { nombre: 'tipo', etiqueta: 'Tipo de movimiento', opciones: { INGRESO_EXTRAORDINARIO: 'Ingreso extraordinario', EGRESO_CAJA_CHICA: 'Egreso de caja chica' } }, importe, motivo, referencia, evidencia], 'Se crea un movimiento registrado. El saldo cambia al confirmarlo; los gastos corresponden a caja chica.', { tiempo: true })
    if (recurso === 'arqueos') return base('Preparar arqueo', [turno, { nombre: 'tipo', etiqueta: 'Tipo de arqueo', opciones: { ORDINARIO: 'Ordinario', CIEGO: 'Ciego', SORPRESIVO: 'Sorpresivo', INCIDENCIA: 'Por incidencia' } }, usuario('responsableId', 'Responsable del conteo')], 'El arqueo congela nuevos movimientos hasta que el responsable introduzca personalmente el conteo.')
    if (recurso === 'depositos') return base('Preparar depósito', [sucursal, usuario('responsableId', 'Responsable del depósito'), lista('remesaIds', 'Remesas a depositar', 'remesas', ['CAJA_FUERTE', 'EN_TRANSITO']), { nombre: 'banco', etiqueta: 'Banco', max: 150 }, { nombre: 'cuenta', etiqueta: 'Cuenta bancaria', max: 100 }], 'Las remesas quedan reservadas bajo custodia del responsable. Preparar no equivale a depositar.')
    if (recurso === 'rendiciones') return base('Declarar rendición', [turno, usuario('repartidorId', 'Repartidor que declara', true), lista('cobroIds', 'Cobros contra entrega', 'cobros-repartidor', ['CUSTODIA'], true), lista('remesaIds', 'Fondos de cambio', 'remesas', ['CAJA_FUERTE'], true), evidencia, explicacion], 'Declara personalmente el efectivo entregado. Los cobros y fondos quedan reservados hasta recibir o cancelar la rendición.', { conteo: true })
    if (recurso === 'cierres-diarios') return base('Consolidar día de sucursal', [sucursal, { nombre: 'fechaNegocio', etiqueta: 'Día operativo', tipo: 'fecha' }, evidencia, { nombre: 'justificacionPendientes', etiqueta: 'Aceptación de investigaciones pendientes', tipo: 'area', opcional: true, max: 500 }], 'Requiere todos los turnos cerrados. Las investigaciones pendientes exigen aceptación expresa. Guarda una consolidación histórica del día.')
    return null
  }
  if (r.modo !== 'operacion') return null
  if (recurso === 'cajas' && a === 'estado') return base('Cambiar estado de caja', [{ nombre: 'estado', etiqueta: 'Estado', opciones: cajaConfig.cajas.estados }, motivo, evidencia], 'Una caja suspendida no acepta nuevos movimientos. Para inactivarla deben estar cerrados todos sus turnos.', { control: true })
  if (recurso === 'turnos') {
    if (a === 'cierre') return base('Solicitar cierre de turno', [usuario('custodioId', 'Receptor designado de los valores'), evidencia, explicacion], 'El cajero responsable introduce su conteo. El turno queda pendiente de aprobación y la diferencia conserva su investigación.', { control: false, conteo: true, tiempo: true, metodo: 'POST', resultado: 'cierres' })
    if (a === 'retiros') return base('Retirar o transferir valores', [{ nombre: 'tipo', etiqueta: 'Destino de los valores', opciones: { RETIRO: 'Retiro a custodia', TRANSFERENCIA: 'Transferencia a otra caja', FONDO_CAMBIO: 'Fondo de cambio para repartidor' } }, importe, usuario('receptorId', 'Receptor designado'), { nombre: 'destinoTurnoId', etiqueta: 'Turno destino', tipo: 'uuid', recurso: 'turnos', estados: ['ABIERTO'], opcional: true, ayuda: 'Obligatorio únicamente para transferencia.' }, { nombre: 'bolsa', etiqueta: 'Bolsa', max: 100 }, { nombre: 'sello', etiqueta: 'Sello', max: 100 }, motivo, evidencia], 'El retiro reduce el saldo de caja y crea una remesa bajo custodia. Otra persona debe aceptar formalmente los valores.', { control: true, tiempo: true, metodo: 'POST', resultado: 'remesas' })
    if (['cobros', 'reintegros', 'anulaciones-venta'].includes(a)) return base(a === 'cobros' ? 'Cobrar venta' : a === 'reintegros' ? 'Reintegrar devolución' : 'Anular cobro de venta', [a === 'cobros' ? { nombre: 'ventaId', etiqueta: 'Venta autorizada', tipo: 'uuid' } : a === 'reintegros' ? { nombre: 'devolucionId', etiqueta: 'Devolución aprobada', tipo: 'uuid' } : { nombre: 'anulacionId', etiqueta: 'Anulación autorizada', tipo: 'uuid' }, ...(a === 'cobros' ? [{ nombre: 'efectivoRecibido', etiqueta: 'Efectivo recibido GTQ', tipo: 'monto' as const }] : [motivo]), evidencia], a === 'reintegros' ? 'El reintegro requiere el módulo de Devoluciones y un documento real aprobado; su integración continúa pendiente.' : 'El cobro y la anulación se originan en Ventas junto con sus efectos de inventario. Aquí solo se admite el documento real autorizado y se impide duplicar el movimiento.', { metodo: 'POST', ruta: `/${a}`, resultado: 'movimientos', tiempo: true })
  }
  if (recurso === 'movimientos') {
    if (a === 'correccion') return base('Corregir movimiento manual', [{ nombre: 'importeCorrecto', etiqueta: 'Importe correcto GTQ', tipo: 'monto', cero: true }, referencia, motivo, evidencia], 'Conserva el original y crea la compensación y la sustitución en una transacción. Cero permite compensación total.', { control: true, metodo: 'POST', tiempo: true })
    return base(a === 'confirmar' ? 'Confirmar movimiento' : 'Cancelar movimiento registrado', [motivo, evidencia], a === 'confirmar' ? 'Comprueba el efectivo y la evidencia antes de confirmar. Egresos e ingresos superiores al umbral requieren otro aprobador.' : 'Cancela únicamente el movimiento registrado. Los confirmados conservan su historia.', { control: true, horario: a === 'confirmar' })
  }
  if (recurso === 'arqueos') return a === 'contar' ? base('Introducir conteo de arqueo', [evidencia, explicacion], 'El responsable introduce personalmente el efectivo por denominación. Toda diferencia requiere explicación.', { conteo: true, tiempo: true }) : base('Aprobar arqueo', [motivo, evidencia], 'Las diferencias requieren un aprobador distinto del responsable del conteo.', { control: true })
  if (recurso === 'cierres') return base(a === 'aprobar' ? 'Aprobar cierre' : 'Reabrir cierre autorizado', [...(a === 'aprobar' ? [{ nombre: 'investigacion', etiqueta: 'Aprobar con investigación pendiente', tipo: 'booleano' as const }] : []), motivo, evidencia], a === 'aprobar' ? 'Acepta el conteo y su diferencia. El cajero no aprueba su propia diferencia. La custodia posterior requiere aceptación formal.' : 'Conserva la revisión anterior. Solo se admite sin consolidación, turno posterior ni transferencia de custodia.', { control: true, resultado: a === 'reabrir' ? 'turnos' : 'cierres' })
  if (recurso === 'remesas') {
    if (a === 'custodia') return base('Entregar custodia', [usuario('receptorId', 'Nuevo receptor'), { nombre: 'ubicacion', etiqueta: 'Ubicación de entrega', opciones: { CAJA_FUERTE: 'Caja fuerte', EN_TRANSITO: 'En tránsito' } }, { nombre: 'transporte', etiqueta: 'Transporte y condiciones', max: 250 }, motivo, evidencia], 'La entrega queda pendiente hasta la aceptación personal del receptor. Los valores conservan su importe original.', { control: true, metodo: 'POST', resultado: 'custodias' })
    return base(a === 'aceptar' ? 'Aceptar remesa' : 'Retornar retiro no entregado', [...(a === 'retorno' ? [{ nombre: 'turnoDestinoId', etiqueta: 'Turno de retorno', tipo: 'uuid' as const, recurso: 'turnos' as const, estados: ['ABIERTO'] }] : []), motivo, evidencia], 'Cuenta los valores personalmente. Una diferencia genera incidencia y conserva la custodia anterior, sin ingreso automático.', { control: true, conteo: true, tiempo: a === 'retorno', horario: a === 'aceptar', metodo: a === 'retorno' ? 'POST' : 'PATCH' })
  }
  if (recurso === 'custodias') return base('Aceptar entrega de custodia', [motivo, evidencia], 'Solo el receptor designado puede aceptar personalmente. Si el conteo difiere, se conserva la entrega pendiente.', { control: true, conteo: true, horario: true })
  if (recurso === 'depositos') return base(a === 'registrar' ? 'Registrar entrega bancaria' : a === 'confirmar' ? 'Verificar depósito' : 'Cancelar preparación de depósito', [...(a === 'registrar' ? [{ nombre: 'depositado', etiqueta: 'Importe realmente depositado GTQ', tipo: 'monto' as const, cero: true }, { nombre: 'fechaDeposito', etiqueta: 'Fecha bancaria', tipo: 'fecha' as const }, referencia, explicacion] : a === 'confirmar' ? [{ nombre: 'aceptarDiferencia', etiqueta: 'Aceptar expresamente la diferencia bancaria', tipo: 'booleano' as const }] : []), motivo, evidencia], a === 'confirmar' ? 'El transportista y quien registró el depósito no pueden verificarlo. Una diferencia requiere aceptación expresa y conserva el importe histórico.' : a === 'registrar' ? 'Registra banco, referencia y efectivo real. Toda diferencia requiere explicación y genera incidencia.' : 'Solo una preparación sin registro bancario puede cancelarse; libera las remesas y restaura su estado previo.', { control: true })
  if (recurso === 'rendiciones') return base(a === 'confirmar' ? 'Recibir rendición' : 'Cancelar rendición registrada', [motivo, evidencia], a === 'confirmar' ? 'El cajero receptor debe ser distinto del repartidor. Ingresa solo el efectivo declarado y mantiene cobros, fondo y diferencia separados.' : 'Libera las reservas de cobros y fondos. No modifica una rendición confirmada.', { control: true, tiempo: a === 'confirmar' })
  if (recurso === 'incidencias') return base('Resolver incidencia', [{ nombre: 'resolucion', etiqueta: 'Resolución documentada', tipo: 'area', max: 500 }, motivo, evidencia], 'Una persona distinta del autor documenta la resolución. Resolver la incidencia no modifica el saldo ni los movimientos.', { control: true })
  return null
}
export function puedeOperacionDocumentoCaja(r: RutaCaja, d: RegistroCaja, s: SesionUsuario, turnoRelacionado?: RegistroCaja | null) {
  const o = obtenerOperacionCaja(r); if (!o || !s.permisos.includes(o.permiso) || !(enAlcanceCaja(d.sucursalId, s) || r.recurso === 'remesas' && r.operacion === 'aceptar' && !!turnoRelacionado && enAlcanceCaja(turnoRelacionado.sucursalId, s))) return false
  const a = r.operacion, estado = textoCaja(d, 'estado'), id = s.usuarioId, propio = d.creadoPorId === id, responsable = textoCaja(d, 'responsableId') === id
  if (r.recurso === 'cajas') return a === 'estado'
  if (r.recurso === 'turnos') return estado === 'ABIERTO' && (a === 'cierre' ? textoCaja(d, 'cajeroId') === id : textoCaja(d, 'cajeroId') === id || s.permisos.includes('CAJA.ACCESO.OPERAR_OTRO_CAJERO'))
  if (r.recurso === 'movimientos') {
    if (a === 'correccion') return estado === 'CONFIRMADO' && !textoCaja(d, 'compensacionId') && ['INGRESO_EXTRAORDINARIO', 'EGRESO_CAJA_CHICA'].includes(textoCaja(d, 'tipo')) && !propio
    if (estado !== 'REGISTRADO') return false
    if (a !== 'confirmar' || !propio) return true
    const p = turnoRelacionado?.politica as { extraordinarioUmbral?: string } | undefined
    return textoCaja(d, 'direccion') !== 'SALIDA' && !!p?.extraordinarioUmbral && esMontoCaja(textoCaja(d, 'importe')) && esMontoCaja(p.extraordinarioUmbral) && centavosCaja(textoCaja(d, 'importe')) <= centavosCaja(p.extraordinarioUmbral)
  }
  if (r.recurso === 'arqueos') return a === 'contar' ? estado === 'PENDIENTE' && responsable : estado === 'CONTADO' && (textoCaja(d, 'diferencia') === '0.00' || !responsable)
  if (r.recurso === 'cierres') return a === 'reabrir' ? ['APROBADO', 'INVESTIGACION'].includes(estado) : estado === 'PENDIENTE' && (textoCaja(d, 'diferencia') === '0.00' || !propio && !!turnoRelacionado && textoCaja(turnoRelacionado, 'cajeroId') !== id)
  if (r.recurso === 'remesas') return a === 'aceptar' ? estado === 'RETIRADO' && textoCaja(d, 'receptorId') === id && textoCaja(d, 'custodioId') !== id : a === 'retorno' ? estado === 'RETIRADO' && textoCaja(d, 'custodioId') === id && textoCaja(d, 'tipo') !== 'CIERRE' && !textoCaja(d, 'depositoId') && !textoCaja(d, 'rendicionId') : ['CAJA_FUERTE', 'EN_TRANSITO'].includes(estado) && textoCaja(d, 'custodioId') === id && !['TRANSFERENCIA', 'FONDO_CAMBIO'].includes(textoCaja(d, 'tipo')) && !textoCaja(d, 'depositoId')
  if (r.recurso === 'custodias') return estado === 'PENDIENTE' && textoCaja(d, 'receptorId') === id && textoCaja(d, 'entregadoPorId') !== id
  if (r.recurso === 'depositos') return a === 'cancelar' ? estado === 'PREPARADO' : a === 'registrar' ? estado === 'PREPARADO' && responsable : estado === 'REGISTRADO' && !responsable && textoCaja(d, 'registradoPorId') !== id
  if (r.recurso === 'rendiciones') return estado === 'REGISTRADA' && (a === 'confirmar' ? textoCaja(d, 'repartidorId') !== id : textoCaja(d, 'repartidorId') === id || s.permisos.includes('CAJA.ACCESO.OPERAR_OTRO_CAJERO'))
  return r.recurso === 'incidencias' && estado === 'ABIERTA' && !propio
}
export type BorradorOperacionCaja = Record<string, string | boolean | string[]>
export function camposOperacionCaja(o: OperacionCaja, s: SesionUsuario): CampoOperacionCaja[] {
  return [...o.campos, ...(o.tiempo && s.permisos.includes('CAJA.ACCESO.CONTINGENCIA') ? [{ nombre: 'ocurridoEn', etiqueta: 'Fecha y hora real del formulario físico (Guatemala)', tipo: 'instante' as const, opcional: true }, { nombre: 'folioContingencia', etiqueta: 'Folio físico correlativo', opcional: true, max: 100 }] : []), ...((o.tiempo || o.horario) && s.permisos.includes('CAJA.ACCESO.FUERA_HORARIO') ? [{ nombre: 'autorizacionHorario', etiqueta: 'Justificación autorizada fuera de horario', tipo: 'area' as const, opcional: true, max: 500 }] : [])]
}
export function fechaValidaCaja(v: string) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v }
export function validarCamposCaja(campos: CampoOperacionCaja[], d: BorradorOperacionCaja): ErroresCaja {
  const e: ErroresCaja = {}
  for (const c of campos) {
    const v = d[c.nombre], t = typeof v === 'string' ? v.trim() : ''
    if (c.tipo === 'booleano') { if (typeof v !== 'boolean') e[c.nombre] = 'Indica tu decisión.'; continue }
    if (c.tipo === 'lista') { if (!Array.isArray(v) || (!c.opcional && !v.length) || v.length > 100 || new Set(v).size !== v.length || v.some(x => !esUuidCaja(x))) e[c.nombre] = 'Selecciona documentos únicos (máximo 100).'; continue }
    if (c.opcional && !t) continue
    if (c.tipo === 'uuid') { if (!esUuidCaja(t)) e[c.nombre] = 'Selecciona un registro válido.' }
    else if (c.tipo === 'monto') { if (!esMontoCaja(t, !c.cero)) e[c.nombre] = 'Usa un importe GTQ exacto con hasta 2 decimales.' }
    else if (c.tipo === 'fecha') { if (!fechaValidaCaja(t)) e[c.nombre] = 'Indica una fecha real.' }
    else if (c.tipo === 'instante') { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t) || !fechaValidaCaja(t.slice(0, 10)) || !/T([01]\d|2[0-3]):[0-5]\d$/.test(t) || new Date(`${t}:00-06:00`) > new Date()) e[c.nombre] = 'Indica una fecha y hora real de Guatemala que no sea futura.' }
    else if (c.opciones) { if (!(t in c.opciones)) e[c.nombre] = 'Selecciona una opción.' }
    else if (t.length < (c.nombre === 'codigo' ? 2 : 3) || t.length > (c.max ?? 500)) e[c.nombre] = `Escribe entre ${c.nombre === 'codigo' ? 2 : 3} y ${c.max ?? 500} caracteres.`
  }
  if (d.ocurridoEn && (typeof d.folioContingencia !== 'string' || d.folioContingencia.trim().length < 3)) e.folioContingencia = 'El formulario físico requiere un folio correlativo.'
  if (d.tipo === 'TRANSFERENCIA' && !esUuidCaja(String(d.destinoTurnoId ?? ''))) e.destinoTurnoId = 'Selecciona un turno destino para la transferencia.'
  if (d.tipo && d.tipo !== 'TRANSFERENCIA' && d.destinoTurnoId) e.destinoTurnoId = 'El turno destino corresponde únicamente a una transferencia.'
  if (d.codigo && !/^[A-Za-z0-9_-]{2,30}$/.test(String(d.codigo).trim())) e.codigo = 'Usa letras, números, guiones o guiones bajos.'
  if ('cobroIds' in d && Array.isArray(d.cobroIds) && Array.isArray(d.remesaIds) && !d.cobroIds.length && !d.remesaIds.length) e.cobroIds = 'Selecciona al menos un cobro o fondo.'
  return e
}
export function entradaOperacionCaja(o: OperacionCaja, campos: CampoOperacionCaja[], d: BorradorOperacionCaja, id: string, version: number, claveIdempotencia: string, denominaciones?: { valor: string; cantidad: number }[]) {
  const datos: Record<string, unknown> = { claveIdempotencia }
  for (const c of campos) { const v = d[c.nombre]; if (c.opcional && (v === undefined || v === '')) continue; datos[c.nombre] = typeof v === 'string' ? c.tipo === 'instante' ? `${v}:00-06:00` : v.trim() : v }
  if (o.control || id && o.conteo) datos.version = version
  if (denominaciones) datos.denominaciones = denominaciones
  if (['/cobros', '/reintegros', '/anulaciones-venta'].includes(o.ruta)) datos.turnoId = id
  if (typeof datos.codigo === 'string') datos.codigo = datos.codigo.toUpperCase()
  return datos
}
