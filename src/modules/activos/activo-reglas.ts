import type { CamposActivo, CamposTipo, Consulta, Entrega, SolicitudDetalle } from './activo.types'
export const etiqueta = (valor: string | null | undefined) => valor ? ({ SIN_DEVOLUCION: 'Revisada sin devolución', CON_DEVOLUCION: 'Revisada con devolución', CONFIRMADA_LEGACY: 'Confirmación histórica' }[valor] ?? valor.toLowerCase().replaceAll('_', ' ').replace(/^./, c => c.toUpperCase())) : 'Sin dato'
export const fechaActivo = (valor: string | null | undefined) => valor ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala' }).format(new Date(valor)) : 'Sin dato'
export const parametrosActivos = (c: Consulta | Record<string, unknown>) => { const q = new URLSearchParams(); for (const [k, v] of Object.entries(c)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); return q.toString() }
export function criteriosExportacion(c: Consulta, formato: 'pdf' | 'xlsx') { const { pagina: _pagina, tamanoPagina: _tamano, ...criterios } = c; return { ...criterios, formato } }
export function validarCampos(datos: CamposActivo | CamposTipo) {
  const errores: Record<string, string> = {}
  const campos = 'prefijo' in datos ? ['prefijo', 'nombre'] : ['sucursalId', 'tipoId', 'condicion', 'marca', 'modelo', 'descripcion']
  const valores: Record<string, string> = { ...datos }
  for (const campo of campos) if (!valores[campo]?.trim()) errores[campo] = 'Este campo es obligatorio.'
  if ('prefijo' in datos && datos.prefijo.trim() && !/^[A-Za-z][A-Za-z0-9_-]{0,19}$/.test(datos.prefijo.trim())) errores.prefijo = 'Usa hasta 20 caracteres: letras, números, guion o guion bajo; comienza con una letra.'
  for (const [campo, valor] of Object.entries(valores)) { const maximo = campo === 'descripcion' ? 1000 : campo === 'prefijo' ? 20 : 100; if (valor.trim().length > maximo) errores[campo] = `Máximo ${maximo} caracteres.` }
  return errores
}
export function entradaActivo(d: CamposActivo, version?: number) {
  const campos = { tipoId: d.tipoId, condicion: d.condicion, marca: d.marca.trim(), modelo: d.modelo.trim(), numeroSerie: d.numeroSerie.trim() || null, descripcion: d.descripcion.trim() }
  return version === undefined ? { ...campos, sucursalId: d.sucursalId } : { ...campos, version }
}
export const entradaTipo = (d: CamposTipo, version?: number) => ({ prefijo: d.prefijo.trim().toUpperCase(), nombre: d.nombre.trim(), descripcion: d.descripcion.trim() || null, ...(version === undefined ? {} : { version }) })
export function validarEntrega(sucursalId: string, empleadoId: string, entregas: Entrega[]) {
  const errores: Record<string, string> = {}
  if (!sucursalId) errores.sucursalId = 'Selecciona una sucursal.'
  if (!empleadoId) errores.empleadoId = 'Selecciona un empleado de la sucursal.'
  if (!entregas.length || entregas.length > 200) errores.detalles = 'Selecciona entre 1 y 200 activos.'
  if (new Set(entregas.map(e => e.activo.id)).size !== entregas.length) errores.detalles = 'No puedes repetir un activo.'
  entregas.forEach((e, i) => { if (!e.condicionEntrega) errores[`detalles.${i}.condicionEntrega`] = 'Registra la condición exacta de entrega.'; if (e.activo.sucursalId !== sucursalId || e.activo.situacion !== 'DISPONIBLE') errores.detalles = 'Todos los activos deben estar disponibles en la sucursal seleccionada.'; if (e.notasEntrega.trim().length > 1000) errores[`detalles.${i}.notasEntrega`] = 'Máximo 1000 caracteres.' })
  return errores
}
export const entradaEntrega = (sucursalId: string, empleadoId: string, entregas: Entrega[]) => ({ sucursalId, empleadoId, detalles: entregas.map(e => ({ activoId: e.activo.id, version: e.activo.version, condicionEntrega: e.condicionEntrega, notasEntrega: e.notasEntrega.trim() || null })) })
export function validarSolicitud(detalles: SolicitudDetalle[], permitidos: readonly string[]) {
  const errores: Record<string, string> = {}
  if (!detalles.length) errores.detalles = 'Selecciona al menos un activo.'
  if (new Set(detalles.map(d => d.asignacionDetalleId)).size !== detalles.length || detalles.some(d => !permitidos.includes(d.asignacionDetalleId))) errores.detalles = 'Selecciona únicamente activos que mantienes bajo custodia.'
  detalles.forEach(d => { if (!d.motivo.trim() || d.motivo.trim().length > 1000) errores[d.asignacionDetalleId] = 'Indica un motivo de 1 a 1000 caracteres.' })
  return errores
}
