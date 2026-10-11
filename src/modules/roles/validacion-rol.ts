import type { DetalleErrorApi } from '../../shared/api/cliente-api'

export type DatosFormularioRol = {
  codigo: string
  nombre: string
  descripcion: string
}

export type ErroresFormularioRol = Partial<Record<keyof DatosFormularioRol | 'permisosIds', string>>

export function erroresDesdeDetallesRol(detalles: readonly DetalleErrorApi[]): ErroresFormularioRol {
  const errores: ErroresFormularioRol = {}
  for (const detalle of detalles) {
    const campo = detalle.campo.split('.')[0]
    if (campo === 'codigo' || campo === 'nombre' || campo === 'descripcion' || campo === 'permisosIds') {
      const mensajes = new Set([...(errores[campo] ? [errores[campo]] : []), detalle.mensaje])
      errores[campo] = [...mensajes].join(' ')
    }
  }
  return errores
}

export function validarFormularioRol(datos: DatosFormularioRol): ErroresFormularioRol {
  const errores: ErroresFormularioRol = {}
  const codigo = datos.codigo.trim()
  const nombre = datos.nombre.trim()

  if (codigo.length < 2) errores.codigo = 'El código debe contener al menos 2 caracteres.'
  else if (codigo.length > 50) errores.codigo = 'El código no puede superar 50 caracteres.'
  else if (!/^[A-Za-z0-9_]+$/.test(codigo)) {
    errores.codigo = 'Utiliza solamente letras, números y guion bajo.'
  }

  if (nombre.length < 2) errores.nombre = 'El nombre debe contener al menos 2 caracteres.'
  else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar 100 caracteres.'

  if (datos.descripcion.trim().length > 250) {
    errores.descripcion = 'La descripción no puede superar 250 caracteres.'
  }

  return errores
}
