import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { Selector } from '../../../shared/components/selector/selector'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { NombreReferencia, SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { crearTraslado } from '../traslado-api'
import { permisoTraslado, prioridadesTraslado, tiposTraslado } from '../traslado.config'
import { claveParaContenido, entradaSolicitud, hoyGuatemala, lineaInicial, validarSolicitud } from '../traslado-reglas'
import type { DatosSolicitud, DetalleTraslado, ErroresTraslado, PrioridadTraslado, TipoTraslado } from '../traslado.types'
import { CampoTraslado, ErrorTraslado } from './traslado-campo'
import { enfocarError } from '../traslado-dom'
import { datosRelacionados, validarRelacionada } from '../traslado-incidencias-reglas'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import catalogo from '../../catalogos-farmacia/catalogos.module.css'
import styles from '../traslado.module.css'
const secciones = [{ id: 'traslado-ruta', titulo: 'Origen y destino' }, { id: 'traslado-solicitud', titulo: 'Datos de la solicitud' }, { id: 'traslado-lineas', titulo: 'Productos y cantidades' }]
export function TrasladoCrearView({ sesion, onNavegar, onCambiosPendientes, relacionada }: { sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void; relacionada?: { traslado: DetalleTraslado; modo: 'retorno' | 'complementario' } }) {
  const corporativo = sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO'), puedeVer = sesion.permisos.includes(permisoTraslado())
  const [datos, setDatos] = useState<DatosSolicitud>(() => relacionada ? { ...datosRelacionados(relacionada.traslado, sesion, relacionada.modo), fechaRequerida: hoyGuatemala() } : { origenSucursalId: '', destinoSucursalId: sesion.sucursal.id, tipo: 'ABASTECIMIENTO', prioridad: 'ORDINARIA', fechaRequerida: hoyGuatemala(), motivo: '' })
  const [lineas, setLineas] = useState(() => relacionada ? relacionada.traslado.lineas.map(l => ({ ...lineaInicial(), presentacionId: l.presentacionId, unidadId: l.unidadId, vidaUtilMinimaDias: String(l.vidaUtilMinimaDias) })) : [lineaInicial()]), [errores, setErrores] = useState<ErroresTraslado>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [creado, setCreado] = useState<DetalleTraslado | null>(null)
  const formulario = useRef<HTMLFormElement>(null), envio = useRef(false), idempotencia = useRef<{ contenido: string; clave: string } | null>(null)
  const [inicial] = useState(() => JSON.stringify({ datos, lineas })), sucio = JSON.stringify({ datos, lineas }) !== inicial
  useEffect(() => { onCambiosPendientes(sucio && !creado); return () => onCambiosPendientes(false) }, [creado, onCambiosPendientes, sucio])
  function cambiar(k: keyof DatosSolicitud, v: string) { setDatos(d => ({ ...d, [k]: v })); setErrores({}); setError(null) }
  function cambiarLinea(i: number, k: string, v: string) { setLineas(ls => ls.map((l, indice) => indice === i ? { ...l, [k]: v } : l)); setErrores({}); setError(null) }
  async function guardar() {
    if (envio.current || creado) return
    const fallos = { ...validarSolicitud(datos, lineas), ...(relacionada ? validarRelacionada(relacionada.traslado, datos, relacionada.modo) : {}) }; setErrores(fallos); setError(null)
    if (Object.keys(fallos).length) { setError('Revisa los campos señalados antes de guardar.'); enfocarError(formulario.current); return }
    const contenido = { ...entradaSolicitud(datos, lineas, ''), retornoDeId: relacionada?.modo === 'retorno' ? relacionada.traslado.id : null }
    idempotencia.current = claveParaContenido(idempotencia.current, contenido)
    envio.current = true; setGuardando(true)
    try { const r = await crearTraslado({ ...contenido, claveIdempotencia: idempotencia.current.clave }); onCambiosPendientes(false); setCreado(r) }
    catch (e: unknown) { setError(e); if (e instanceof ErrorApi) { setErrores(Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje]))); enfocarError(formulario.current) } }
    finally { envio.current = false; setGuardando(false) }
  }
  const volver = () => onNavegar(relacionada ? `/traslados/${relacionada.traslado.id}` : puedeVer ? '/traslados' : '/')
  const titulo = relacionada?.modo === 'retorno' ? 'Solicitar retorno' : relacionada ? 'Nuevo traslado complementario' : 'Nueva solicitud'
  const ayudaTipo = { ABASTECIMIENTO: 'El origen debe contar con una bodega central.', DEVOLUCION_INTERNA: 'El destino debe contar con una bodega central.', HORIZONTAL: 'Ambos puntos deben contar con bodegas de sucursal.', REDISTRIBUCION: 'Redistribución autorizada entre los puntos seleccionados.' }[datos.tipo]
  return <section className={`${form.paginaFormulario} ${catalogo.pagina}`}><header className={empleado.encabezadoPagina}><h1>{titulo}</h1><span className={empleado.indicadorFormulario}>Traslados · {sesion.sucursal.nombre}</span></header>
    <form onSubmitCapture={validarCantidadesAlEnviar} ref={formulario} className={form.formulario} noValidate onSubmit={e => { e.preventDefault(); void guardar() }} aria-busy={guardando}><ErrorTraslado error={error} /><div className={`${empleado.formulario} ${catalogo.formularioProducto}`}>
      <fieldset disabled={guardando || !!creado} className={empleado.panelPerfil}><legend>Solicitud de traslado</legend><div className={styles.identidad}><span aria-hidden="true"><IconoAccion nombre="agregar" /></span><strong>{tiposTraslado[datos.tipo]}</strong><p>Solicita productos a otro punto de atención.</p><p>{lineas.length} {lineas.length === 1 ? 'presentación' : 'presentaciones'}</p></div><NavegacionSecciones lateral className={empleado.navegacionFormulario} secciones={secciones} /></fieldset>
      <div className={catalogo.contenidoFormularioProducto}>
        {relacionada && <div className={styles.aviso}><strong>{relacionada.modo === 'retorno' ? 'Retorno de' : 'Referencia para el complementario'}: </strong><button type="button" className={styles.enlace} onClick={volver}>{relacionada.traslado.numero}</button><p>{relacionada.modo === 'retorno' ? 'Se crea un traslado independiente con los puntos invertidos. Solo puede prepararse stock apto y disponible; los productos en cuarentena requieren su proceso de Inventario.' : 'Se crea una solicitud independiente. Cuando complete su recepción y cierre, selecciónala al resolver la incidencia original para guardar la relación.'}</p><p>Revisa las presentaciones y captura las cantidades reales; las cantidades originales no se copian.</p></div>}
        <fieldset id="traslado-ruta" disabled={guardando || !!creado}><legend><span className={empleado.numeroSeccion}>01</span>Origen y destino</legend><p className={empleado.descripcionSeccion}>Indica desde dónde se enviarán los productos y dónde se necesitan.</p><div className={form.grillaDos}>
          <CampoTraslado nombre="origenSucursalId" etiqueta="Sucursal de origen" error={errores.origenSucursalId}><SelectorReferencia id="origenSucursalId" referencia="sucursales" value={datos.origenSucursalId} requerido error={errores.origenSucursalId} descripcionId="origenSucursalId-ayuda" onChange={v => cambiar('origenSucursalId', v)} disabled={guardando} /></CampoTraslado>
          <CampoTraslado nombre="destinoSucursalId" etiqueta="Sucursal de destino" error={errores.destinoSucursalId} ayuda={corporativo ? 'Punto que solicita los productos.' : 'Tu sucursal es el destino de la solicitud.'}><SelectorReferencia id="destinoSucursalId" referencia="sucursales" value={datos.destinoSucursalId} requerido error={errores.destinoSucursalId} descripcionId="destinoSucursalId-ayuda" soloSucursalActual={!corporativo} disabled={!corporativo || guardando} onChange={v => cambiar('destinoSucursalId', v)} /></CampoTraslado>
          <CampoTraslado nombre="tipo" etiqueta="Tipo de traslado" error={errores.tipo} ayuda={ayudaTipo}><Selector id="tipo" value={datos.tipo} required aria-invalid={!!errores.tipo} aria-describedby="tipo-ayuda" disabled={guardando} onValueChange={v => cambiar('tipo', v as TipoTraslado)}>{Object.entries(tiposTraslado).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Selector></CampoTraslado>
          <CampoTraslado nombre="prioridad" etiqueta="Prioridad" error={errores.prioridad}><Selector id="prioridad" value={datos.prioridad} required aria-invalid={!!errores.prioridad} aria-describedby="prioridad-ayuda" disabled={guardando} onValueChange={v => cambiar('prioridad', v as PrioridadTraslado)}>{Object.entries(prioridadesTraslado).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Selector></CampoTraslado>
        </div></fieldset>
        <fieldset id="traslado-solicitud" disabled={guardando || !!creado}><legend><span className={empleado.numeroSeccion}>02</span>Datos de la solicitud</legend><p className={empleado.descripcionSeccion}>Registra la fecha requerida y la necesidad que justifica el traslado.</p><div className={form.grillaDos}><CampoTraslado nombre="fechaRequerida" etiqueta="Fecha requerida" tipo="date" error={errores.fechaRequerida} value={datos.fechaRequerida} onChange={v => cambiar('fechaRequerida', v)} /><CampoTraslado nombre="motivo" etiqueta="Motivo" area maxLength={250} error={errores.motivo} ayuda="Entre 5 y 250 caracteres." value={datos.motivo} onChange={v => cambiar('motivo', v)} /></div></fieldset>
        <fieldset id="traslado-lineas" disabled={guardando || !!creado}><legend><span className={empleado.numeroSeccion}>03</span>Productos y cantidades</legend><p className={empleado.descripcionSeccion}>Incluye cada presentación una sola vez. Las cantidades se expresan en la unidad solicitada.</p><ErrorTraslado error={errores.lineas} /><div className={styles.lineas}>{lineas.map((l, i) => {
          const prefijo = `lineas.${i}.`
          return <div key={l.clave} className={styles.linea}><div className={styles.cabeceraLinea}><h3>Presentación {i + 1}</h3><button className={styles.enlace} type="button" disabled={guardando || lineas.length === 1} aria-label={`Quitar presentación ${i + 1}`} onClick={() => { setLineas(ls => ls.filter(x => x.clave !== l.clave)); setErrores({}) }}><IconoAccion nombre="cancelar" /> Quitar</button></div><div className={form.grillaDos}>
            <CampoTraslado nombre={prefijo + 'presentacionId'} etiqueta="Presentación" error={errores[prefijo + 'presentacionId']}><SelectorReferencia id={prefijo + 'presentacionId'} referencia="presentaciones" value={l.presentacionId} requerido error={errores[prefijo + 'presentacionId']} descripcionId={prefijo + 'presentacionId-ayuda'} disabled={guardando} onChange={v => cambiarLinea(i, 'presentacionId', v)} /></CampoTraslado>
            <CampoTraslado nombre={prefijo + 'unidadId'} etiqueta="Unidad solicitada" error={errores[prefijo + 'unidadId']} ayuda="Debe ser compatible con la unidad base del producto."><SelectorReferencia id={prefijo + 'unidadId'} referencia="unidades" value={l.unidadId} requerido error={errores[prefijo + 'unidadId']} descripcionId={prefijo + 'unidadId-ayuda'} disabled={guardando} onChange={v => cambiarLinea(i, 'unidadId', v)} /></CampoTraslado>
            <CampoTraslado nombre={prefijo + 'cantidad'} etiqueta="Cantidad solicitada" unidadCantidad={{ unidadId: l.unidadId }} value={l.cantidad} onChange={v => cambiarLinea(i, 'cantidad', v)} error={errores[prefijo + 'cantidad']} ayuda="La cantidad respeta la precisión de la unidad solicitada." />
            <CampoTraslado nombre={prefijo + 'vidaUtilMinimaDias'} etiqueta="Vida útil mínima (días)" tipo="number" value={l.vidaUtilMinimaDias} onChange={v => cambiarLinea(i, 'vidaUtilMinimaDias', v)} error={errores[prefijo + 'vidaUtilMinimaDias']} ayuda="0 permite la vida útil disponible, siempre sin vencimiento." />
          </div></div>
        })}</div><button className={form.botonSecundario} type="button" disabled={guardando || lineas.length >= 100} onClick={() => { setLineas(ls => [...ls, lineaInicial()]); setErrores({}) }}><IconoAccion nombre="agregar" />Agregar presentación</button></fieldset>
        <p className={styles.aviso}>Guardar crea la solicitud. La aprobación, la reserva y el movimiento de existencias se realizan en etapas posteriores.</p>
      </div><div className={empleado.accionesFormulario}><p><span aria-hidden="true">*</span> Campos obligatorios</p><div><button type="button" className={form.botonSecundario} disabled={guardando || !!creado} onClick={volver}>Cancelar</button><button type="submit" className={form.botonPrincipal} disabled={guardando || !!creado}><IconoAccion nombre="guardar" />{guardando ? 'Guardando…' : 'Guardar solicitud'}</button></div></div>
    </div></form>
    <ModalEstado abierto={!!creado} tipo="exito" titulo="Solicitud creada" mensaje={creado ? <>Se registró <strong>{creado.numero}</strong> para <NombreReferencia referencia="sucursales" id={creado.destinoSucursalId} />.{relacionada?.modo === 'complementario' && <p>La incidencia original sigue abierta. Relaciona este traslado al resolverla cuando esté cerrado y tenga recepción efectiva.</p>}</> : ''} textoAccionPrincipal={puedeVer ? 'Ver traslado' : 'Volver al inicio'} onAccionPrincipal={() => onNavegar(puedeVer && creado ? `/traslados/${creado.id}` : '/')} textoAccionSecundaria={relacionada ? 'Volver al traslado original' : puedeVer ? 'Volver al listado' : undefined} onAccionSecundaria={volver} onCerrar={volver} />
  </section>
}
