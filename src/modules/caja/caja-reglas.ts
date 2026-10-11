import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import type { ConfiguracionCaja, ConteoCaja, DatosAperturaCaja, DatosNuevaCaja, DatosPoliticaCaja, ErroresCaja, PoliticaCaja } from './caja.types'
export const esUuidCaja = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
export const esMontoCaja = (v: string, positivo = false) => /^\d{1,13}(\.\d{1,2})?$/.test(v.trim()) && (!positivo || /[1-9]/.test(v))
export function centavosCaja(v: string) { if (!esMontoCaja(v)) throw new Error('Importe inválido.'); const [e, f = ''] = v.trim().split('.'); return BigInt(e!) * 100n + BigInt(f.padEnd(2, '0')) }
export function decimalCaja(n: bigint) { const a = n < 0n ? -n : n; return `${n < 0n ? '-' : ''}${a / 100n}.${String(a % 100n).padStart(2, '0')}` }
export const dineroCaja = (v: string) => /^-?\d+(\.\d{1,2})?$/.test(v) ? `Q ${v}` : 'Sin dato'
export const fechaHoraCaja = (v: string | null) => v && !Number.isNaN(Date.parse(v)) ? new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'Sin registro'
export const corporativoCaja = (s: SesionUsuario) => s.permisos.includes('CAJA.ACCESO.CORPORATIVO')
export const enAlcanceCaja = (sucursalId: string, s: SesionUsuario) => corporativoCaja(s) || sucursalId === s.sucursal.id
export const puedeEditarPoliticaCaja = (sucursalId: string, s: SesionUsuario) => s.permisos.includes('CAJA.POLITICAS.VER') && s.permisos.includes('CAJA.POLITICAS.CONFIGURAR') && enAlcanceCaja(sucursalId, s)
export function claveCaja(anterior: { contenido: string; clave: string } | null, datos: unknown) { const contenido = JSON.stringify(datos); return anterior?.contenido === contenido ? anterior : { contenido, clave: crypto.randomUUID() } }
export function configuracionVaciaCaja(): ConfiguracionCaja { return { corte: '', apertura: '', cierre: '', permiteTurnosSimultaneos: false, fondoMaximo: '', saldoMaximo: '', reintegroMaximo: '', extraordinarioUmbral: '', diferenciaUmbral: '', denominaciones: [] } }
function longitud(v: string, min: number, max: number) { return v.trim().length >= min && v.trim().length <= max }
export function validarPoliticaCaja(d: DatosPoliticaCaja): ErroresCaja {
  const e: ErroresCaja = {}, p = d.configuracion
  if (!esUuidCaja(d.sucursalId)) e.sucursalId = 'Selecciona una sucursal.'
  if (!longitud(d.motivo, 3, 250)) e.motivo = 'Escribe entre 3 y 250 caracteres.'
  for (const k of ['corte', 'apertura', 'cierre'] as const) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[k])) e[k] = 'Indica una hora válida.'
  for (const k of ['fondoMaximo', 'saldoMaximo', 'reintegroMaximo', 'extraordinarioUmbral', 'diferenciaUmbral'] as const) if (!esMontoCaja(p[k], k === 'saldoMaximo')) e[k] = 'Usa un importe GTQ con hasta 2 decimales y 13 enteros.'
  if (!e.fondoMaximo && !e.saldoMaximo && centavosCaja(p.fondoMaximo) > centavosCaja(p.saldoMaximo)) e.fondoMaximo = 'El fondo no puede superar el saldo máximo.'
  if (!p.denominaciones.length || p.denominaciones.length > 30) e.denominaciones = 'Indica entre 1 y 30 denominaciones autorizadas.'
  p.denominaciones.forEach((v, i) => { if (!esMontoCaja(v, true)) e[`denominaciones.${i}`] = 'Indica una denominación positiva con hasta 2 decimales.' })
  if (!p.denominaciones.some(v => !esMontoCaja(v, true)) && new Set(p.denominaciones.map(v => centavosCaja(v).toString())).size !== p.denominaciones.length) e.denominaciones = 'No repitas denominaciones.'
  return e
}
export function entradaPoliticaCaja(d: DatosPoliticaCaja, version: number, claveIdempotencia: string) {
  const p = d.configuracion
  return { claveIdempotencia, sucursalId: d.sucursalId, version, motivo: d.motivo.trim(), configuracion: { corte: p.corte, apertura: p.apertura, cierre: p.cierre, permiteTurnosSimultaneos: p.permiteTurnosSimultaneos, fondoMaximo: p.fondoMaximo.trim(), saldoMaximo: p.saldoMaximo.trim(), reintegroMaximo: p.reintegroMaximo.trim(), extraordinarioUmbral: p.extraordinarioUmbral.trim(), diferenciaUmbral: p.diferenciaUmbral.trim(), denominaciones: p.denominaciones.map(v => v.trim()) } }
}
export function validarNuevaCaja(d: DatosNuevaCaja): ErroresCaja { const e: ErroresCaja = {}; if (!esUuidCaja(d.sucursalId)) e.sucursalId = 'Selecciona una sucursal.'; if (!/^[A-Za-z0-9_-]{2,30}$/.test(d.codigo.trim())) e.codigo = 'Usa 2–30 letras, números, guiones o guiones bajos.'; if (!longitud(d.nombre, 3, 150)) e.nombre = 'Escribe entre 3 y 150 caracteres.'; if (!['VENTAS', 'CHICA'].includes(d.tipo)) e.tipo = 'Selecciona el tipo de caja.'; return e }
export function entradaNuevaCaja(d: DatosNuevaCaja, claveIdempotencia: string) { return { claveIdempotencia, sucursalId: d.sucursalId, codigo: d.codigo.trim().toUpperCase(), nombre: d.nombre.trim(), tipo: d.tipo } }
export function totalConteoCaja(ls: ConteoCaja[]) { return ls.reduce((s, l) => s + centavosCaja(l.valor) * BigInt(l.cantidad), 0n) }
export function validarAperturaCaja(d: DatosAperturaCaja, ls: ConteoCaja[], p: PoliticaCaja | null, s: SesionUsuario, ahora = new Date()): ErroresCaja {
  const e: ErroresCaja = {}
  if (!esUuidCaja(d.cajaId)) e.cajaId = 'Selecciona una caja.'
  if (!p) e.cajaId = 'Carga la caja y su política antes de abrir el turno.'
  if (!longitud(d.evidencia, 3, 500)) e.evidencia = 'Documenta el conteo y aceptación del fondo (3–500 caracteres).'
  if (d.remesaFondoId && !esUuidCaja(d.remesaFondoId)) e.remesaFondoId = 'Usa el UUID de una remesa disponible.'
  if (!ls.length || ls.length > 30) e.denominaciones = 'Carga las denominaciones de la política.'
  ls.forEach((l, i) => { if (!/^\d{1,9}$/.test(l.cantidad) || Number(l.cantidad) > 100000000) e[`denominaciones.${i}.cantidad`] = 'Usa una cantidad entera entre 0 y 100000000.'; if (!esMontoCaja(l.valor, true) || !p?.configuracion.denominaciones.some(v => centavosCaja(v) === centavosCaja(l.valor))) e[`denominaciones.${i}.valor`] = 'Denominación no autorizada.' })
  if (!Object.keys(e).some(k => k.startsWith('denominaciones')) && p && totalConteoCaja(ls) > centavosCaja(p.configuracion.fondoMaximo)) e.denominaciones = 'El fondo excede el límite de la sucursal.'
  if (d.ocurridoEn) {
    if (!s.permisos.includes('CAJA.ACCESO.CONTINGENCIA')) e.ocurridoEn = 'No tienes permiso para digitalizar un formulario físico.'
    const fecha = d.ocurridoEn.slice(0, 10), real = Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha
    if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(d.ocurridoEn) || !real || Number.isNaN(Date.parse(`${d.ocurridoEn}:00-06:00`)) || new Date(`${d.ocurridoEn}:00-06:00`) > ahora) e.ocurridoEn = 'Indica una fecha y hora real de Guatemala que no sea futura.'
    if (!longitud(d.folioContingencia, 3, 100)) e.folioContingencia = 'La digitalización requiere un folio de 3–100 caracteres.'
  }
  if (d.autorizacionHorario && (!s.permisos.includes('CAJA.ACCESO.FUERA_HORARIO') || !longitud(d.autorizacionHorario, 3, 500))) e.autorizacionHorario = 'Se requiere permiso y una justificación de 3–500 caracteres.'
  return e
}
export function entradaAperturaCaja(d: DatosAperturaCaja, ls: ConteoCaja[], claveIdempotencia: string) { return { claveIdempotencia, cajaId: d.cajaId, denominaciones: ls.map(l => ({ valor: l.valor, cantidad: Number(l.cantidad) })), evidencia: d.evidencia.trim(), ...(d.remesaFondoId ? { remesaFondoId: d.remesaFondoId } : {}), ...(d.ocurridoEn ? { ocurridoEn: `${d.ocurridoEn}:00-06:00`, folioContingencia: d.folioContingencia.trim() } : {}), ...(d.autorizacionHorario.trim() ? { autorizacionHorario: d.autorizacionHorario.trim() } : {}) } }
