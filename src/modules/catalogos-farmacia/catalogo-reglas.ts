import { camposDe } from './catalogos.config'
import type { DatosFormulario, DefinicionCatalogo, EntradaCatalogo, PrincipioProducto, RegistroCatalogo } from './catalogo.types'
export const textoValor = (valor: unknown): string => typeof valor === 'string' ? valor : ''
export function fechaNegocio(): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const parte = (tipo: string) => partes.find((item) => item.type === tipo)?.value ?? ''
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}
export function composicionDe(datos: DatosFormulario): PrincipioProducto[] { return Array.isArray(datos.principiosActivos) ? datos.principiosActivos : [] }
export function datosIniciales(catalogo: DefinicionCatalogo, registro?: RegistroCatalogo): DatosFormulario {
  const datos: DatosFormulario = {}
  camposDe(catalogo).forEach((campo) => {
    const valor = registro?.[campo.clave]
    datos[campo.clave] = typeof valor === 'string' || typeof valor === 'boolean' ? valor : campo.inicial ?? (campo.tipo === 'booleano' ? false : campo.tipo === 'fecha' && campo.requerido ? fechaNegocio() : '')
  })
  if (catalogo.clave === 'productos') datos.principiosActivos = Array.isArray(registro?.principiosActivos) ? registro.principiosActivos : []
  return datos
}
export function entradaDe(catalogo: DefinicionCatalogo, datos: DatosFormulario): EntradaCatalogo {
  const entrada: EntradaCatalogo = {}
  camposDe(catalogo).forEach((campo) => {
    const valor = datos[campo.clave]
    entrada[campo.clave] = typeof valor === 'boolean' ? valor : textoValor(valor).trim() || null
  })
  entrada.codigo = textoValor(datos.codigo).trim().toUpperCase()
  for (const campo of ['nit', 'correo']) if (typeof entrada[campo] === 'string') entrada[campo] = campo === 'nit' ? entrada[campo].toUpperCase().replaceAll('-', '') : entrada[campo].toLowerCase()
  if (catalogo.clave === 'productos') entrada.principiosActivos = composicionDe(datos).map((item) => ({ ...item, concentracion: item.concentracion.trim() }))
  return entrada
}
export function validarFormulario(catalogo: DefinicionCatalogo, datos: DatosFormulario, editando = false): Record<string, string> {
  const errores: Record<string, string> = {}
  camposDe(catalogo).forEach((campo) => {
    if (campo.tipo === 'booleano') return
    const valor = textoValor(datos[campo.clave]).trim()
    if (campo.requerido && !valor) errores[campo.clave] = 'Completa este campo.'
    else if (valor && campo.minimo && valor.length < campo.minimo) errores[campo.clave] = `Escribe al menos ${campo.minimo} caracteres.`
    else if (campo.maximo && valor.length > campo.maximo) errores[campo.clave] = `Máximo ${campo.maximo} caracteres.`
    else if (campo.tipo === 'correo' && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) errores[campo.clave] = 'Escribe un correo válido.'
    else if (campo.tipo === 'decimal' && valor && (!new RegExp(`^\\d{1,${15 - campo.escala!}}(\\.\\d{1,${campo.escala}})?$`).test(valor) || !/[1-9]/.test(valor))) errores[campo.clave] = `Usa un valor positivo con hasta ${campo.escala} decimales y punto decimal.`
    else if (campo.tipo === 'fecha' && valor) {
      const fecha = new Date(`${valor}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor || valor < '1900-01-01') errores[campo.clave] = 'Selecciona una fecha válida.'
    }
  })
  if (!/^[A-Za-z0-9_-]{2,50}$/.test(textoValor(datos.codigo).trim())) errores.codigo = 'Usa de 2 a 50 letras, números, guiones o guiones bajos.'
  if (datos.vigenteDesde && datos.vigenteHasta && datos.vigenteDesde > datos.vigenteHasta) errores.vigenteHasta = 'La fecha final debe ser igual o posterior al inicio.'
  if (!editando && datos.vigenteDesde && datos.vigenteDesde < fechaNegocio()) errores.vigenteDesde = 'No se permiten vigencias retroactivas.'
  if (catalogo.clave === 'productos') {
    const principios = composicionDe(datos)
    if (datos.tipo === 'MEDICAMENTO') {
      if (!textoValor(datos.formaFarmaceutica).trim()) errores.formaFarmaceutica = 'Un medicamento requiere forma farmacéutica.'
      if (!textoValor(datos.concentracion).trim()) errores.concentracion = 'Un medicamento requiere concentración.'
      if (!principios.length) errores.principiosActivos = 'Agrega al menos un principio activo.'
      if (!datos.requiereLote || !datos.requiereVencimiento) errores.requiereLote = 'Los medicamentos requieren lote y vencimiento.'
    }
    if (datos.esControlado && !datos.requiereReceta) errores.requiereReceta = 'Un producto controlado requiere receta.'
    if (datos.requiereVencimiento && !datos.requiereLote) errores.requiereLote = 'El vencimiento requiere lote.'
    const ids = new Set<string>()
    principios.forEach((item, indice) => {
      if (!item.principioActivoId || ids.has(item.principioActivoId)) errores[`principiosActivos.${indice}.principioActivoId`] = 'Selecciona un principio activo sin repetirlo.'
      ids.add(item.principioActivoId)
      if (!item.concentracion.trim() || item.concentracion.length > 100) errores[`principiosActivos.${indice}.concentracion`] = 'Escribe una concentración de hasta 100 caracteres.'
    })
  }
  if (catalogo.clave === 'unidades' && ['CONTEO', 'EMPAQUE'].includes(String(datos.dimension)) && datos.admiteDecimales) errores.admiteDecimales = 'Las unidades de conteo y empaque no admiten decimales.'
  if (catalogo.clave === 'conversiones' && datos.unidadOrigenId && datos.unidadOrigenId === datos.unidadDestinoId) errores.unidadDestinoId = 'Elige una unidad distinta a la de origen.'
  if (catalogo.clave === 'proveedores' || catalogo.clave === 'clientes') {
    const nit = textoValor(datos.nit).trim().toUpperCase().replaceAll('-', '')
    if (nit && !/^(?:CF|\d{1,13}[\dK])$/.test(nit)) errores.nit = 'Escribe un NIT válido.'
    if (catalogo.clave === 'proveedores' && nit === 'CF') errores.nit = 'Un proveedor no puede usar NIT CF.'
    if (datos.dpi && !/^\d{13}$/.test(textoValor(datos.dpi))) errores.dpi = 'El DPI requiere 13 dígitos.'
    if (datos.direccion && catalogo.clave === 'clientes' && !datos.municipioId) errores.municipioId = 'Selecciona el municipio de la dirección.'
    if (catalogo.clave === 'clientes' && datos.tipo === 'GENERICO' && (nit !== 'CF' || ['dpi', 'telefono', 'correo', 'direccion', 'municipioId'].some((campo) => datos[campo]))) errores.nit = 'El cliente genérico usa CF y no admite datos personales.'
  }
  const barras = textoValor(datos.codigoBarras)
  if (barras && !/^[A-Za-z0-9-]{3,80}$/.test(barras)) errores.codigoBarras = 'Usa de 3 a 80 letras, números o guiones.'
  return errores
}
export function puedeEditarRegistro(clave: DefinicionCatalogo['clave'], registro: RegistroCatalogo): boolean {
  return registro.activo && (!(clave === 'conversiones' || clave === 'precios-vigentes') || textoValor(registro.vigenteDesde) > fechaNegocio())
}
export const puedeInactivarRegistro = (clave: DefinicionCatalogo['clave'], registro: RegistroCatalogo) => registro.activo && !(clave === 'clientes' && registro.tipo === 'GENERICO')
export function etiquetaValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  const texto = String(valor)
  return ['EN_EVALUACION', 'APROBADO', 'SUSPENDIDO'].includes(texto) ? texto.replaceAll('_', ' ').toLocaleLowerCase('es').replace(/^./, (letra) => letra.toUpperCase()) : texto
}
