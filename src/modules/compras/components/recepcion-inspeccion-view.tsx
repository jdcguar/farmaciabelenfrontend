import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { obtenerCompra, decidirCompra } from '../compra-api'
import { obtenerRegistro } from '../../catalogos-farmacia/catalogo-api'
import { lineaInicial, etiquetasAccion, accionesCompra } from '../compra-reglas'
import { rutaCompra } from '../compra.config'
import { entradaDecision, validarDecision } from '../compra-formulario'
import type { AccionCompra, DatosCompra, DetalleCompra, ErroresCompra, LineaFormulario } from '../compra.types'
import { Selector } from '../../../shared/components/selector/selector'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { CompraLineasFormulario } from './compra-lineas-formulario'
import { CampoCompra, ErrorCompra, EstadoCargaCompra } from './compra-campo'
import { erroresApi } from '../compra-error'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../compra.module.css'
export function RecepcionInspeccionView({ id, etapa, sesion, onNavegar, onCambiosPendientes }: { id: string; etapa: AccionCompra; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const [doc, setDoc] = useState<DetalleCompra | null>(null), [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState(-1), [errorCarga, setErrorCarga] = useState<unknown>(null), [bodegaId, setBodegaId] = useState<string | undefined>(), [errorBodega, setErrorBodega] = useState<unknown>(null)
  const [datos, setDatos] = useState<DatosCompra>({ evidencia: '', resultado: 'CONFORME' }), [lineas, setLineas] = useState<LineaFormulario[]>([]), [errores, setErrores] = useState<ErroresCompra>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [exito, setExito] = useState(false), [sucio, setSucio] = useState(false), [conflicto, setConflicto] = useState(false)
  const enviando = useRef(false), cargando = finalizada !== revision
  const [revisionBodega, setRevisionBodega] = useState(0)
  useEffect(() => { onCambiosPendientes(sucio && !exito); return () => onCambiosPendientes(false) }, [exito, onCambiosPendientes, sucio])
  useEffect(() => {
    const c = new AbortController()
    void obtenerCompra('recepciones', id, c.signal).then(r => { if (!c.signal.aborted) { setDoc(r); setLineas(r.lineas.map(l => ({ ...lineaInicial(l), destinoUbicacionId: r.ubicacionId ?? '' }))); setErrorCarga(null); setErrores({}); setDatos({ evidencia: '', resultado: 'CONFORME' }); setSucio(false); setConflicto(false) } }).catch((e: unknown) => { if (!c.signal.aborted) setErrorCarga(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(revision) }); return () => c.abort()
  }, [id, revision])
  useEffect(() => {
    if (etapa !== 'tecnica' || !doc?.ubicacionId) return
    if (!sesion.permisos.includes('CATALOGOS.UBICACIONES.VER')) return
    const c = new AbortController(); void obtenerRegistro('ubicaciones', doc.ubicacionId, c.signal).then(u => { if (!c.signal.aborted) { setBodegaId(typeof u.bodegaId === 'string' ? u.bodegaId : undefined); setErrorBodega(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setErrorBodega(e) }); return () => c.abort()
  }, [doc?.ubicacionId, etapa, revisionBodega, sesion.permisos])
  const razon = doc ? accionesCompra('recepciones', doc, sesion).find(a => a.accion === etapa)?.razon ?? 'No tienes permiso para esta inspección.' : ''
  const guardar = async () => {
    if (!doc || cargando || razon || conflicto || enviando.current) return
    const ee = validarDecision(etapa, datos, lineas, doc); setErrores(ee)
    if (Object.keys(ee).length) { setError('Revisa las cantidades, fechas y evidencias indicadas.'); document.getElementById(Object.keys(ee)[0]!)?.focus(); return }
    enviando.current = true; setGuardando(true); setError(null)
    try { await decidirCompra('recepciones', doc.id, etapa, entradaDecision(etapa, datos, lineas, doc.version)); setExito(true); setSucio(false); onCambiosPendientes(false) }
    catch (e) { setError(e); setErrores(erroresApi(e)); if (e instanceof ErrorApi && e.estadoHttp === 409) setConflicto(true) }
    finally { enviando.current = false; setGuardando(false) }
  }
  return <section className={form.paginaFormulario}><header className={form.encabezadoPagina}><h1>{etiquetasAccion[etapa]}</h1><button type="button" disabled={guardando} className={form.botonSecundario} onClick={() => onNavegar(rutaCompra('recepciones', id))}>Volver a recepción</button></header><EstadoCargaCompra cargando={cargando} error={errorCarga} onReintentar={() => setRevision(r => r + 1)} />
    {!cargando && !errorCarga && doc && <><p className={styles.numero}>{doc.numero} · versión {doc.version}</p><ErrorCompra error={razon} /><ErrorCompra error={error} />{conflicto && <div className={styles.aviso}>Otro usuario cambió la recepción. No se reenviará con una versión nueva.<button className={styles.enlace} type="button" onClick={() => { setError(null); setRevision(r => r + 1) }}>Recargar y reemplazar los datos de inspección para revisar</button></div>}
      <NavegacionSecciones secciones={[...(etapa === 'documental' ? [] : [{ id: 'inspeccion-lineas', titulo: 'Cantidades y hallazgos' }]), { id: 'inspeccion-evidencia', titulo: 'Evidencia de inspección' }]} />
      <form onSubmitCapture={validarCantidadesAlEnviar} className={form.formulario} noValidate onSubmit={e => { e.preventDefault(); void guardar() }}><fieldset disabled={guardando || !!razon || conflicto} id="inspeccion-lineas"><legend><span className={form.numeroSeccion}>01</span>{etapa === 'documental' ? 'Resultado documental' : 'Cantidades y hallazgos'}</legend>
        {etapa === 'documental' ? <CampoCompra nombre="resultado" etiqueta="Resultado" error={errores.resultado}><Selector id="resultado" value={datos.resultado!} onValueChange={v => { setDatos(d => ({ ...d, resultado: v })); setSucio(true) }}><option value="CONFORME">Conforme — continuar inspección física</option><option value="RECHAZADA">Rechazada — finalizar recepción sin ingreso</option></Selector></CampoCompra> : <>{etapa === 'tecnica' && <><p className={styles.aviso}>Aceptada + cuarentena + rechazada debe coincidir exactamente con la cantidad física de cada línea. Documenta motivo, destino y custodia de incidencias. Esta etapa no modifica stock.</p><ErrorCompra error={!sesion.permisos.includes('CATALOGOS.UBICACIONES.VER') ? 'Necesitas CATALOGOS.UBICACIONES.VER para consultar la bodega y seleccionar cuarentena.' : errorBodega} onReintentar={errorBodega ? () => setRevisionBodega(r => r + 1) : undefined} /></>}<CompraLineasFormulario recurso="recepciones" accion={etapa} lineas={lineas} onChange={l => { setLineas(l); setSucio(true) }} errores={errores} disponibles={doc.lineas} sucursalId={doc.sucursalId} bodegaId={bodegaId} destinoId={doc.ubicacionId ?? ''} /></>}
      </fieldset><fieldset disabled={guardando || !!razon || conflicto} id="inspeccion-evidencia"><legend><span className={form.numeroSeccion}>02</span>Evidencia</legend><CampoCompra nombre="evidencia" etiqueta="Evidencia de inspección" area maxLength={1000} value={datos.evidencia!} onChange={v => { setDatos(d => ({ ...d, evidencia: v })); setSucio(true) }} error={errores.evidencia} ayuda="Entre 5 y 1000 caracteres. Puedes añadir archivos en el detalle de la recepción." /></fieldset>
        <div className={form.accionesFormulario}><p role="status">{guardando ? 'Guardando inspección…' : 'La decisión y evidencia quedarán registradas.'}</p><div><button type="button" disabled={guardando} className={form.botonSecundario} onClick={() => onNavegar(rutaCompra('recepciones', id))}>Cancelar</button><button type="submit" disabled={guardando || !!razon || conflicto} className={form.botonPrincipal}>Guardar inspección</button></div></div>
      </form></>}
    <ModalEstado abierto={exito} tipo="exito" titulo="Inspección registrada" mensaje="La recepción se actualizó. Revisa el detalle para continuar con la siguiente etapa." textoAccionPrincipal="Ver recepción" onAccionPrincipal={() => onNavegar(rutaCompra('recepciones', id))} />
  </section>
}
