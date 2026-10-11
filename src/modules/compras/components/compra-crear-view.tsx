import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { crearCompra, obtenerCompra, lineasFacturables } from '../compra-api'
import { compras, origenRecurso, permisoCompra, rutaCompra } from '../compra.config'
import { claveParaContenido, lineaInicial, hoyGuatemala, esUuid } from '../compra-reglas'
import { entradaCreacion, validarCreacion } from '../compra-formulario'
import type { DatosCompra, DetalleCompra, ErroresCompra, LineaCompra, LineaFormulario, RecursoDocumento } from '../compra.types'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { Selector } from '../../../shared/components/selector/selector'
import { SelectorReferencia, NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { SelectorDocumento } from './selector-documento'
import { CampoCompra, ErrorCompra, EstadoCargaCompra } from './compra-campo'
import { erroresApi } from '../compra-error'
import { CompraLineasFormulario } from './compra-lineas-formulario'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../compra.module.css'
const estadosOrigen: Partial<Record<RecursoDocumento, string[]>> = { cotizaciones: ['APROBADA'], ordenes: ['ADJUDICADA'], recepciones: ['APROBADA', 'PARCIAL'], facturas: ['APROBADA', 'PARCIAL', 'CERRADA'], evaluaciones: ['CONFIRMADA'] }
export function CompraCrearView({ recurso, revisionId, consulta, sesion, onNavegar, onCambiosPendientes }: { recurso: RecursoDocumento; revisionId?: string; consulta: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const hoy = hoyGuatemala(), corporativo = sesion.permisos.includes('COMPRAS.ACCESO.CORPORATIVO'), origenTipo = revisionId ? 'ordenes' : origenRecurso[recurso]
  const origenInicial = new URLSearchParams(consulta).get('origenId') ?? ''
  const [datos, setDatos] = useState<DatosCompra>({ sucursalId: sesion.sucursal.id, origenId: revisionId ?? (esUuid(origenInicial) ? origenInicial : ''), prioridad: 'ORDINARIA', motivo: '', evidencia: '', fechaRequerida: hoy, fecha: hoy, vencimiento: hoy, fechaEntrega: hoy, vigenteHasta: hoy, presupuestoEstimado: '0.00', costesAdicionales: '0.00', ubicacionId: '', proveedorId: '', documentoProveedor: '', condiciones: '', monedaOrigen: '', tipoCambio: '', fechaCambio: '' })
  const [lineas, setLineas] = useState<LineaFormulario[]>(recurso === 'solicitudes' ? [lineaInicial()] : []), [disponibles, setDisponibles] = useState<LineaCompra[]>([]), [origen, setOrigen] = useState<DetalleCompra | null>(null)
  const [errores, setErrores] = useState<ErroresCompra>({}), [error, setError] = useState<unknown>(null), [errorOrigen, setErrorOrigen] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [creado, setCreado] = useState<DetalleCompra | null>(null), [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState(''), [sucio, setSucio] = useState(false), [conflicto, setConflicto] = useState(false)
  const idempotencia = useRef<{ contenido: string; clave: string } | null>(null), enviando = useRef(false)
  const origenId = datos.origenId!, claveOrigen = JSON.stringify({ origenTipo, origenId, revision }), necesitaOrigen = !!origenTipo, cargandoOrigen = necesitaOrigen && !!origenId && claveOrigen !== finalizada
  const faltaLectura = origenTipo && !sesion.permisos.includes(permisoCompra(origenTipo)) ? `Se requiere ${permisoCompra(origenTipo)} para preparar este documento.` : recurso === 'facturas' && (!sesion.permisos.includes(permisoCompra('recepciones')) || !sesion.permisos.includes(permisoCompra('facturas'))) ? 'Se requieren COMPRAS.RECEPCIONES.VER y COMPRAS.FACTURAS.VER para determinar la aceptación aún facturable.' : null
  useEffect(() => { onCambiosPendientes(sucio && !creado); return () => onCambiosPendientes(false) }, [creado, onCambiosPendientes, sucio])
  useEffect(() => {
    if (!origenTipo || !origenId || faltaLectura) return
    const c = new AbortController()
    void obtenerCompra(origenTipo, origenId, c.signal).then(async r => {
      const ll = recurso === 'facturas' ? await lineasFacturables(r.id, c.signal) : r.lineas
      if (c.signal.aborted) return
      setOrigen(r); setDisponibles(ll); setLineas(ll.slice(0, 100).map(l => ({ ...lineaInicial(l), precio: recurso === 'cotizaciones' ? '' : l.precio })))
      if (revisionId) setDatos(prev => ({ ...prev, ubicacionId: r.ubicacionId ?? '', fechaEntrega: r.fechaRequerida ?? hoyGuatemala(), costesAdicionales: r.costesAdicionales }))
      setErrorOrigen(null)
    }).catch((e: unknown) => { if (!c.signal.aborted) { setErrorOrigen(e); setOrigen(null); setDisponibles([]) } }).finally(() => { if (!c.signal.aborted) setFinalizada(claveOrigen) })
    return () => c.abort()
  }, [claveOrigen, faltaLectura, origenId, origenTipo, recurso, revisionId])
  const cambiar = (k: string, v: string) => { setSucio(true); setDatos(d => ({ ...d, [k]: v })); setErrores(e => ({ ...e, [k]: '' })); if (k === 'origenId') { setOrigen(null); setLineas([]); setDisponibles([]) } }
  const campo = (k: string, etiqueta: string, opciones: { tipo?: string; requerido?: boolean; area?: boolean; maxLength?: number; ayuda?: string; min?: string; max?: string } = {}) => <CampoCompra nombre={k} etiqueta={etiqueta} value={datos[k] ?? ''} onChange={v => cambiar(k, v)} error={errores[k]} {...opciones} />
  const origenInvalido = origen && (revisionId ? origen.estado !== 'APROBADA' : !estadosOrigen[recurso]?.includes(origen.estado))
  const bloqueado = guardando || !!faltaLectura || cargandoOrigen || !!errorOrigen || !!origenInvalido || necesitaOrigen && !origen || conflicto
  const guardar = async (e?: FormEvent) => {
    e?.preventDefault(); if (enviando.current || bloqueado) return
    const validacion = validarCreacion(recurso, datos, lineas, recurso === 'facturas' && origen ? { ...origen, lineas: disponibles } : origen, !!revisionId); setErrores(validacion)
    if (Object.keys(validacion).length) { setError('Revisa los campos indicados.'); document.getElementById(Object.keys(validacion)[0]!)?.focus(); return }
    const base = entradaCreacion(recurso, datos, lineas, 'pendiente', revisionId ? origen!.version : undefined)
    const clave = claveParaContenido(idempotencia.current, base); idempotencia.current = clave
    enviando.current = true; setGuardando(true); setError(null)
    try { const r = await crearCompra(recurso, { ...base, claveIdempotencia: clave.clave }, revisionId); setCreado(r); setSucio(false); onCambiosPendientes(false) }
    catch (err) { setError(err); setErrores(erroresApi(err)); if (err instanceof ErrorApi && err.codigo === 'INVENTARIO_MODIFICADO') setConflicto(true) }
    finally { enviando.current = false; setGuardando(false) }
  }
  const volver = () => onNavegar(revisionId ? rutaCompra('ordenes', revisionId) : sesion.permisos.includes(permisoCompra(recurso)) ? rutaCompra(recurso) : '/')
  return <section className={form.paginaFormulario}><header className={form.encabezadoPagina}><h1>{revisionId ? 'Revisar orden' : `Nueva ${compras[recurso].singular}`}</h1><button type="button" className={form.botonSecundario} disabled={guardando} onClick={volver}>Volver</button></header>
    <ErrorCompra error={error} /><ErrorCompra error={faltaLectura} />{conflicto && <div className={styles.aviso}>La versión cambió. Recarga y revisa la orden antes de volver a enviar.<button type="button" className={styles.enlace} onClick={() => { setConflicto(false); setRevision(r => r + 1) }}>Recargar origen y reemplazar líneas</button></div>}
    {revisionId && <p className={styles.aviso}>Se crea un nuevo borrador. Aprobarlo sustituye la orden anterior. Solo se permite antes del suministro y sin otra revisión pendiente.</p>}
    <div className={form.layoutFormulario}><NavegacionSecciones lateral secciones={[{ id: 'compra-datos', titulo: 'Documento y destino' }, ...(recurso === 'evaluaciones' ? [] : [{ id: 'compra-lineas', titulo: 'Líneas de compra' }]), { id: 'compra-justificacion', titulo: 'Justificación' }]} />
      <form onSubmitCapture={validarCantidadesAlEnviar} className={form.formulario} onSubmit={e => void guardar(e)} noValidate><fieldset id="compra-datos" disabled={guardando}><legend><span className={form.numeroSeccion}>01</span>Documento y destino</legend><div className={form.grillaDos}>
        {recurso === 'solicitudes' && <><CampoCompra nombre="sucursalId" etiqueta="Sucursal solicitante" error={errores.sucursalId}><SelectorReferencia id="sucursalId" referencia="sucursales" value={datos.sucursalId!} requerido soloSucursalActual={!corporativo} onChange={v => cambiar('sucursalId', v)} error={errores.sucursalId} descripcionId="sucursalId-ayuda" /></CampoCompra>{campo('fechaRequerida', 'Fecha requerida', { tipo: 'date', min: hoy })}<CampoCompra nombre="prioridad" etiqueta="Prioridad" error={errores.prioridad}><Selector id="prioridad" value={datos.prioridad!} onValueChange={v => cambiar('prioridad', v)}><option value="ORDINARIA">Ordinaria</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></Selector></CampoCompra>{campo('presupuestoEstimado', 'Presupuesto estimado (GTQ)', { ayuda: 'Alta y crítica mantienen los mismos controles de aprobación.' })}</>}
        {origenTipo && !revisionId && <CampoCompra nombre="origenId" etiqueta={recurso === 'evaluaciones' ? 'Recepción confirmada' : `Documento de origen (${compras[origenTipo].singular})`} error={errores.origenId} ayuda="Los documentos se cargan por páginas. Las opciones en otro estado no se pueden seleccionar."><SelectorDocumento id="origenId" recurso={origenTipo} value={origenId} estados={estadosOrigen[recurso]} error={errores.origenId} onChange={v => cambiar('origenId', v)} /></CampoCompra>}
        {origen && <div><strong className={styles.numero}>{origen.numero}</strong><p><NombreReferencia referencia="sucursales" id={origen.sucursalId} /></p>{origen.proveedorNombre && <p>{origen.proveedorNombre}</p>}</div>}
        {recurso === 'cotizaciones' && <><CampoCompra nombre="proveedorId" etiqueta="Proveedor homologado" error={errores.proveedorId}><SelectorReferencia id="proveedorId" referencia="proveedores" value={datos.proveedorId!} requerido criterios={{ estadoHomologacion: 'APROBADO' }} onChange={v => cambiar('proveedorId', v)} error={errores.proveedorId} descripcionId="proveedorId-ayuda" /></CampoCompra>{campo('vigenteHasta', 'Vigente hasta', { tipo: 'date', min: hoy })}{campo('fechaEntrega', 'Entrega ofrecida', { tipo: 'date', min: hoy })}{campo('condiciones', 'Condiciones comerciales y conservación', { area: true, maxLength: 1000 })}{campo('monedaOrigen', 'Moneda de origen (opcional)', { requerido: false, maxLength: 3, ayuda: 'Tres letras mayúsculas. Todos los precios se declaran en GTQ.' })}{campo('tipoCambio', 'Tipo de cambio', { requerido: false })}{campo('fechaCambio', 'Fecha del cambio', { requerido: false, tipo: 'date', max: hoy })}</>}
        {recurso === 'ordenes' && <><CampoCompra nombre="ubicacionId" etiqueta="Ubicación autorizada de entrega" error={errores.ubicacionId}><SelectorReferencia id="ubicacionId" referencia="ubicaciones" value={datos.ubicacionId!} requerido disabled={!origen} criterios={{ sucursalId: origen?.sucursalId, tipo: 'ALMACENAMIENTO' }} onChange={v => cambiar('ubicacionId', v)} error={errores.ubicacionId} descripcionId="ubicacionId-ayuda" /></CampoCompra>{campo('fechaEntrega', 'Entrega comprometida', { tipo: 'date', min: hoy })}</>}
        {['recepciones', 'facturas'].includes(recurso) && campo('fecha', recurso === 'recepciones' ? 'Fecha de recepción' : 'Fecha de factura', { tipo: 'date', max: hoy })}
        {recurso === 'facturas' && campo('vencimiento', 'Vencimiento de factura', { tipo: 'date', min: datos.fecha })}
        {['ordenes', 'facturas'].includes(recurso) && campo('costesAdicionales', 'Costes adicionales (GTQ)')}
        {['cotizaciones', 'recepciones', 'facturas'].includes(recurso) && campo('documentoProveedor', 'Referencia del documento del proveedor', { maxLength: 100 })}
      </div><EstadoCargaCompra cargando={cargandoOrigen} error={errorOrigen} onReintentar={() => setRevision(r => r + 1)} />{origenInvalido && <ErrorCompra error="El estado del origen ya no permite esta operación. Selecciona otro documento o vuelve a su detalle." />}</fieldset>
      {recurso !== 'evaluaciones' && <fieldset id="compra-lineas" disabled={bloqueado}><legend><span className={form.numeroSeccion}>02</span>Líneas de compra</legend>{recurso === 'facturas' && <p className={styles.aviso}>Solo se factura aceptación confirmada sin compromiso previo. Cuarentena y rechazo no autorizan pago. El servidor verifica nuevamente las cantidades.</p>}{recurso === 'recepciones' && <p className={styles.aviso}>Registrar e inspeccionar no modifica inventario. Puedes recibir parcialmente y añadir distintos lotes de una misma línea.</p>}{recurso === 'facturas' && origen && !disponibles.length && !cargandoOrigen && !errorOrigen && <p role="status">La orden no tiene aceptación disponible para facturar.</p>}<p className={styles.intro}>Hasta 100 líneas por documento.{disponibles.length > 100 && ' Se prepararon las primeras 100 disponibles. Puedes quitar líneas y seleccionar otras del origen.'}</p><CompraLineasFormulario recurso={recurso} revision={!!revisionId} lineas={lineas} onChange={l => { setLineas(l); setSucio(true) }} errores={errores} disponibles={disponibles} sucursalId={origen?.sucursalId ?? datos.sucursalId!} /></fieldset>}
      <fieldset id="compra-justificacion" disabled={guardando}><legend><span className={form.numeroSeccion}>{recurso === 'evaluaciones' ? '02' : '03'}</span>Justificación</legend>{campo('motivo', 'Motivo de la operación', { area: true, maxLength: 500 })}{recurso === 'evaluaciones' && <>{campo('evidencia', 'Evidencia del desempeño', { area: true, maxLength: 1000 })}<p className={styles.aviso}>La evaluación es única e inmutable. El servidor calcula puntualidad, incidencias e importe aceptado; no modifica homologación.</p></>}</fieldset>
      <div className={form.accionesFormulario}><p aria-live="polite">{guardando ? 'Guardando documento…' : '* Campos obligatorios. Importes finales calculados por el servidor.'}</p><div><button type="button" className={form.botonSecundario} disabled={guardando} onClick={volver}>Cancelar</button><button type="submit" className={form.botonPrincipal} disabled={!!bloqueado}>{revisionId ? 'Crear revisión' : 'Guardar documento'}</button></div></div>
    </form></div>
    <ModalEstado abierto={!!creado} tipo="exito" titulo="Documento registrado" mensaje={creado ? `${creado.numero}. La operación se guardó correctamente.` : ''} textoAccionPrincipal={sesion.permisos.includes(permisoCompra(recurso)) ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={() => creado && onNavegar(sesion.permisos.includes(permisoCompra(recurso)) ? rutaCompra(recurso, creado.id) : '/')} />
  </section>
}
