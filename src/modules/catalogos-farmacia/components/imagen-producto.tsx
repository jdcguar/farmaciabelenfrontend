import { useState } from 'react'
import { construirUrlApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { textoValor } from '../catalogo-reglas'
import type { RegistroCatalogo } from '../catalogo.types'
import styles from '../catalogos.module.css'
import empleado from '../../empleados/components/empleado-gestion.module.css'

export function ImagenProducto({ registro, detalle = false }: { registro: RegistroCatalogo; detalle?: boolean }) {
  const url = textoValor(registro.imagenUrl)
  const origen = url ? `${construirUrlApi(url)}?v=${registro.version}` : ''
  const [fallida, setFallida] = useState('')
  return <span className={detalle ? `${empleado.fotoDetalle} ${styles.imagenProductoDetalle}` : styles.imagenProducto}>
    {origen && fallida !== origen ? <img src={origen} crossOrigin="use-credentials" alt={`Imagen de referencia de ${registro.nombre}`} loading={detalle ? 'eager' : 'lazy'} onError={() => setFallida(origen)} /> : detalle ? <span aria-label={origen ? 'Imagen no disponible' : 'Sin imagen de referencia'}>{registro.nombre.slice(0, 2).toUpperCase()}</span> : <IconoAccion nombre="sin-registros" />}
  </span>
}
