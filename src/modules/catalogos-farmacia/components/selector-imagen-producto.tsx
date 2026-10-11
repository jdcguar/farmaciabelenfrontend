import { useEffect, useRef, useState } from 'react'
import { construirUrlApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import { validarImagenProducto } from '../imagen-producto'
import { textoValor } from '../catalogo-reglas'
import type { RegistroCatalogo } from '../catalogo.types'
import styles from '../catalogos.module.css'

type Props = { archivo: File | null; registro: RegistroCatalogo | null; quitar: boolean; disabled: boolean; error: string | null; onArchivo: (archivo: File | null) => void; onQuitar: (quitar: boolean) => void; onError: (error: string | null) => void }
export function SelectorImagenProducto({ archivo, registro, quitar, disabled, error, onArchivo, onQuitar, onError }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [vistaPrevia, setVistaPrevia] = useState<{ archivo: File; url: string } | null>(null)
  const [fallida, setFallida] = useState('')
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia.url) }, [archivo, vistaPrevia])
  const previa = vistaPrevia?.archivo === archivo ? vistaPrevia?.url ?? '' : ''
  const actual = textoValor(registro?.imagenUrl)
  const origen = previa || (!quitar && actual ? `${construirUrlApi(actual)}?v=${registro?.version}` : '')
  const descartar = () => { onArchivo(null); setVistaPrevia(null); onError(null); if (entrada.current) entrada.current.value = '' }
  return <div className={`${empleado.selectorFoto} ${styles.selectorImagenProducto}`}>
    <div className={`${empleado.vistaPreviaFoto} ${styles.vistaPreviaProducto}`}>{origen && origen !== fallida ? <img src={origen} alt="Vista previa de la imagen del producto" crossOrigin={previa ? undefined : 'use-credentials'} onError={() => setFallida(origen)} /> : <IconoAccion nombre="sin-registros" />}</div>
    <div className={empleado.controlesFoto}>
      <p>Imagen opcional en JPG, PNG o WebP, de hasta 5 MB.</p>
      <input ref={entrada} className={empleado.entradaFoto} id="imagen-producto" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} aria-label="Seleccionar imagen del producto" aria-invalid={Boolean(error)} aria-describedby="imagen-producto-ayuda" onChange={(event) => {
        const seleccionada = event.target.files?.[0]
        if (!seleccionada) return
        const mensaje = validarImagenProducto(seleccionada)
        setVistaPrevia(mensaje ? null : { archivo: seleccionada, url: URL.createObjectURL(seleccionada) })
        onArchivo(mensaje ? null : seleccionada); onQuitar(false); onError(mensaje)
        if (mensaje) event.target.value = ''
      }} />
      <div className={empleado.accionesFoto}>
        <label className={empleado.botonSeleccionFoto} htmlFor="imagen-producto">{origen ? 'Cambiar imagen' : 'Seleccionar imagen'}</label>
        {(archivo || error) && <button type="button" disabled={disabled} onClick={descartar}>Descartar cambio</button>}
        {!archivo && actual && !quitar && <button type="button" disabled={disabled} onClick={() => { descartar(); onQuitar(true) }}>Eliminar imagen</button>}
        {quitar && <button type="button" disabled={disabled} onClick={() => onQuitar(false)}>Conservar imagen</button>}
      </div>
      <small id="imagen-producto-ayuda" className={error ? empleado.errorCampo : empleado.ayudaCampo} role={error ? 'alert' : undefined}>{error ?? (archivo ? `${archivo.name} · ${(archivo.size / 1024 / 1024).toFixed(2)} MB` : quitar ? 'La imagen se eliminará al guardar los cambios.' : actual ? 'Imagen actual del producto.' : 'No se ha seleccionado una imagen.')}</small>
    </div>
  </div>
}
