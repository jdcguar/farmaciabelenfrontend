import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { fechaNegocio } from '../catalogo-reglas'
import { obtenerPrecioActual } from '../catalogo-api'
import { CatalogoCampo } from './catalogo-campo'
import { useContextoCatalogo } from '../catalogo-contexto'
import type { RegistroCatalogo } from '../catalogo.types'
import styles from '../catalogos.module.css'
export function ConsultaPrecioActual() {
  const { onNavegar } = useContextoCatalogo()
  const [abierto, setAbierto] = useState(false)
  const [presentacion, setPresentacion] = useState('')
  const [fecha, setFecha] = useState(fechaNegocio())
  const [registro, setRegistro] = useState<RegistroCatalogo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const controlador = useRef<AbortController | null>(null)
  useEffect(() => () => controlador.current?.abort(), [])
  const consultar = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (cargando) return
    if (!presentacion || !fecha) { setError('Selecciona la presentación y la fecha.'); return }
    controlador.current?.abort(); const abortar = new AbortController(); controlador.current = abortar
    setCargando(true); setError(null); setRegistro(null)
    try { const item = await obtenerPrecioActual(presentacion, fecha, abortar.signal); if (!abortar.signal.aborted) setRegistro(item) }
    catch (e: unknown) { if (!abortar.signal.aborted) setError(e instanceof ErrorApi ? e.message : 'No fue posible consultar el precio.') }
    finally { if (!abortar.signal.aborted) setCargando(false) }
  }
  return <>
    <button type="button" className={styles.botonHerramienta} aria-haspopup="dialog" onClick={() => setAbierto(true)}><IconoAccion nombre="buscar" />Consultar precio</button>
    <ModalEstado abierto={abierto} tipo="informacion" apariencia="formulario" titulo="Consultar precio vigente" onCerrar={() => setAbierto(false)} cargando={cargando} textoAccionPrincipal={cargando ? 'Consultando…' : 'Consultar precio'} onAccionPrincipal={() => void consultar()} mensaje={<div className={styles.panelHerramienta}>
    <p className={styles.ayudaHerramienta}>Selecciona una presentación y la fecha que deseas consultar.</p>
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.camposHerramienta} onSubmit={(e) => void consultar(e)} aria-busy={cargando}>
    <CatalogoCampo prefijo="consulta-" campo={{ clave: 'presentacion', etiqueta: 'Presentación', tipo: 'referencia', referencia: 'presentaciones', requerido: true }} valor={presentacion} disabled={cargando} onChange={(valor) => { setPresentacion(String(valor)); setRegistro(null); setError(null) }} />
    <CatalogoCampo prefijo="consulta-" campo={{ clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true }} valor={fecha} disabled={cargando} onChange={(valor) => { setFecha(String(valor)); setRegistro(null); setError(null) }} />
  </form>{error && <p role="alert">{error}</p>}{registro && <div role="status" className={styles.resultadoPrecio}><span>Precio vigente</span><strong>Q {String(registro.precio)}</strong><span>{registro.incluyeImpuestos ? 'Incluye impuestos' : 'No incluye impuestos'}</span><button className={styles.enlaceReferencia} type="button" onClick={() => onNavegar(`/catalogos/precios-vigentes/${registro.id}`)}>Ver {registro.codigo}</button></div>}</div>} />
  </>
}
