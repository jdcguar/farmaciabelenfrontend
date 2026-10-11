import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { adjuntarCompra, descargarAdjunto } from '../compra-api'
import type { DetalleCompra, RecursoDocumento } from '../compra.types'
import { permisoCompra } from '../compra.config'
import { CampoCompra, ErrorCompra } from './compra-campo'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../compra.module.css'
export function CompraAdjuntos({ recurso, doc, permisos, onActualizado, onRecargar, onOcupado, onCambiosPendientes }: { recurso: RecursoDocumento; doc: DetalleCompra; permisos: readonly string[]; onActualizado: (d: DetalleCompra) => void; onRecargar: () => void; onOcupado: (v: boolean) => void; onCambiosPendientes: (v: boolean) => void }) {
  const [archivo, setArchivo] = useState<File | null>(null), [error, setError] = useState<unknown>(null), [conflicto, setConflicto] = useState(false), [guardando, setGuardando] = useState(false), [mensaje, setMensaje] = useState(''), entrada = useRef<HTMLInputElement>(null), enviando = useRef(false)
  useEffect(() => { onCambiosPendientes(!!archivo); return () => onCambiosPendientes(false) }, [archivo, onCambiosPendientes])
  const cargar = async () => {
    if (!archivo || enviando.current || conflicto) return
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(archivo.type) || archivo.size > 10 * 1024 * 1024 || archivo.size === 0) { setError('Selecciona un archivo PDF, PNG o JPEG de hasta 10 MB, con contenido.'); return }
    enviando.current = true; setGuardando(true); onOcupado(true); setError(null); setMensaje('')
    try { const r = await adjuntarCompra(recurso, doc.id, doc.version, archivo); setArchivo(null); if (entrada.current) entrada.current.value = ''; onActualizado(r); setMensaje('Adjunto guardado. La versión del documento se actualizó.') }
    catch (e) { setError(e); if (e instanceof ErrorApi && e.codigo === 'INVENTARIO_MODIFICADO') setConflicto(true) }
    finally { enviando.current = false; setGuardando(false); onOcupado(false) }
  }
  return <article id="compra-adjuntos" className={`${gestion.tarjetaDetalle} ${styles.panel}`}><h2>Adjuntos</h2><p className={styles.intro}>PDF, PNG o JPEG; hasta 10 MB por archivo y 30 archivos por documento. Añadir evidencia actualiza la versión, incluso en documentos finales.</p><ErrorCompra error={error} />{mensaje && <p role="status" className={styles.aviso}>{mensaje}</p>}{conflicto && <button type="button" className={form.botonSecundario} onClick={() => { setArchivo(null); setConflicto(false); setError(null); if (entrada.current) entrada.current.value = ''; onRecargar() }}>Recargar documento y revisar antes de adjuntar</button>}
    <ul className={styles.lista}>{doc.adjuntos.map(a => <li key={a.id}><div className={styles.barra}><span>{a.nombre} · {Math.ceil(a.tamano / 1024)} KB</span><button type="button" className={styles.enlace} disabled={guardando} onClick={async () => { try { await descargarAdjunto(recurso, doc.id, a) } catch (e) { setError(e) } }}>Descargar {a.nombre}</button></div></li>)}</ul>{!doc.adjuntos.length && <p>Sin archivos adjuntos.</p>}
    {permisos.includes(permisoCompra(recurso, 'ADJUNTAR')) && <form onSubmitCapture={validarCantidadesAlEnviar} onSubmit={e => { e.preventDefault(); void cargar() }}><CampoCompra nombre="archivo-compra" etiqueta="Archivo de evidencia" requerido={false}><input id="archivo-compra" type="file" ref={entrada} accept="application/pdf,image/png,image/jpeg" disabled={guardando || conflicto || doc.adjuntos.length >= 30} onChange={e => { setArchivo(e.target.files?.[0] ?? null); setMensaje('') }} /></CampoCompra><button type="submit" className={form.botonSecundario} disabled={guardando || !archivo || conflicto || doc.adjuntos.length >= 30}>Adjuntar archivo</button>{archivo && !guardando && <button type="button" className={styles.enlace} onClick={() => { setArchivo(null); if (entrada.current) entrada.current.value = '' }}>Descartar selección</button>}</form>}
  </article>
}
