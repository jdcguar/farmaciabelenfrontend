import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { useContextoCatalogo } from '../../modules/catalogos-farmacia/catalogo-contexto'
import { obtenerInventario } from '../../modules/inventario/inventario-api'
import { admiteFracciones, cantidadValida, mostrarCantidad, type ContextoCantidad } from './cantidad'

export function InputCantidad({ contexto, value = '', onChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { contexto: ContextoCantidad; value?: string; onChange?: (valor: string) => void }) {
  const { resolver } = useContextoCatalogo()
  const { unidadId, presentacionId, productoId, existenciaId } = contexto
  const clave = JSON.stringify([unidadId, presentacionId, productoId, existenciaId])
  const [precision, setPrecision] = useState<{ clave: string; decimales: boolean; error?: string } | null>(null)
  const [ultimoRechazo, setRechazo] = useState({ clave: '', mensaje: '' })
  const rechazo = ultimoRechazo.clave === clave ? ultimoRechazo.mensaje : ''
  const [revision, setRevision] = useState(0)
  const [enfocado, setEnfocado] = useState(false)
  useEffect(() => {
    let vigente = true
    async function cargar() {
      let id = unidadId
      if (!id) {
        let producto = productoId
        const presentacion = presentacionId || (existenciaId ? (await obtenerInventario('existencias', existenciaId)).presentacionId : undefined)
        if (!producto && presentacion) producto = (await resolver('presentaciones', presentacion)).productoId
        if (producto) id = (await resolver('productos', producto)).unidadBaseId
      }
      if (!id) { if (vigente) setPrecision({ clave, decimales: false }); return }
      const unidad = await resolver('unidades', id)
      if (vigente) setPrecision({ clave, decimales: admiteFracciones(unidad) })
    }
    void cargar().catch(() => { if (vigente) setPrecision({ clave, decimales: false, error: 'No se pudo consultar la precisión de la unidad.' }) })
    return () => { vigente = false }
  }, [clave, unidadId, presentacionId, productoId, existenciaId, resolver, revision])
  const actual = precision?.clave === clave ? precision : null
  const listo = !!actual && !actual.error
  const texto = enfocado && actual?.decimales || !cantidadValida(value, true) ? value : value ? mostrarCantidad(value) : ''
  const error = actual?.error ?? (!listo ? 'Espera la consulta de la unidad.' : value && !cantidadValida(value, actual.decimales) ? actual.decimales ? 'Cantidad inválida: usa hasta seis decimales.' : 'Esta unidad requiere una cantidad entera.' : '')
  const mensaje = error || rechazo
  return <><input {...props} type="text" value={texto} onFocus={() => setEnfocado(true)} onBlur={() => { setEnfocado(false); if (cantidadValida(value, actual?.decimales ?? false) && mostrarCantidad(value) !== value) onChange?.(mostrarCantidad(value)) }} inputMode={actual?.decimales ? 'decimal' : 'numeric'} readOnly={!listo || props.readOnly} maxLength={16} data-error-cantidad={texto || props.required ? error : ''} aria-invalid={Boolean(error && texto) || Boolean(rechazo) || props['aria-invalid']} aria-describedby={[props['aria-describedby'], `${props.id}-precision`].filter(Boolean).join(' ')} ref={input => { input?.setCustomValidity(texto || props.required ? error : '') }} onChange={e => {
    if (!listo) return
    const nuevo = e.target.value
    if (!(actual.decimales ? /^\d{0,9}(\.\d{0,6})?$/ : /^\d{0,9}$/).test(nuevo)) { setRechazo({ clave, mensaje: actual.decimales ? 'Usa números con punto y hasta seis decimales.' : 'Esta unidad solo acepta enteros, sin decimales.' }); return }
    setRechazo({ clave, mensaje: '' }); onChange?.(nuevo)
  }} /><small id={`${props.id}-precision`} role={mensaje && texto ? 'alert' : undefined}>{mensaje || (actual?.decimales ? 'Admite hasta seis decimales con punto.' : 'Cantidad entera, sin decimales.')}{actual?.error && <button type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button>}</small></>
}
