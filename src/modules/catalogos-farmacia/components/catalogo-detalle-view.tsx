import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { useEffect, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import gestionBase from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import empleado from '../../empleados/components/empleado-gestion.module.css'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import { obtenerRegistro } from '../catalogo-api'
import { etiquetaValor, fechaNegocio, puedeEditarRegistro, puedeInactivarRegistro, textoValor } from '../catalogo-reglas'
import { rutaCatalogo, seccionesDe } from '../catalogos.config'
import type { DefinicionCatalogo, RegistroCatalogo } from '../catalogo.types'
import { CatalogoAuditoria } from './catalogo-auditoria'
import { CatalogoOperacionModal, type OperacionCatalogo } from './catalogo-operacion-modal'
import { NombreReferencia } from './referencia-catalogo'
import { useContextoCatalogo } from '../catalogo-contexto'
import styles from '../catalogos.module.css'
import { ImagenProducto } from './imagen-producto'
const fechaHora = (valor: string | null) => valor ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala' }).format(new Date(valor)) : 'Sin registro'
export function CatalogoDetalleView({ catalogo, id }: { catalogo: DefinicionCatalogo; id: string }) {
  const esProducto = catalogo.clave === 'productos'
  const gestion = esProducto ? empleado : gestionBase
  const { sesion, onNavegar } = useContextoCatalogo()
  const [registro, setRegistro] = useState<RegistroCatalogo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finalizada, setFinalizada] = useState('')
  const [revision, setRevision] = useState(0)
  const [operacion, setOperacion] = useState<OperacionCatalogo | null>(null)
  const [exito, setExito] = useState('')
  const claveSolicitud = `${catalogo.clave}:${id}:${revision}`
  const cargando = finalizada !== claveSolicitud
  useEffect(() => {
    const controlador = new AbortController()
    void obtenerRegistro(catalogo.clave, id, controlador.signal).then((item) => { if (!controlador.signal.aborted) { setRegistro(item); setError(null) } }).catch((e: unknown) => { if (!controlador.signal.aborted) setError(e instanceof ErrorApi ? e.message : 'No fue posible cargar el registro.') }).finally(() => { if (!controlador.signal.aborted) setFinalizada(claveSolicitud) })
    return () => controlador.abort()
  }, [catalogo.clave, claveSolicitud, id])
  const permiso = `CATALOGOS.${catalogo.permiso}`
  const actualizar = sesion.permisos.includes(`${permiso}.ACTUALIZAR`)
  const verAuditoria = sesion.permisos.includes(`${permiso}.VER_AUDITORIA`)
  const volver = () => onNavegar(rutaCatalogo(catalogo.clave))
  if (cargando || error || !registro) return <section className={gestion.errorPagina} aria-busy={cargando}><h1>{cargando ? 'Cargando información…' : 'No fue posible abrir el registro'}</h1>{error && <p role="alert">{error}</p>}<div>{!cargando && <button type="button" onClick={() => setRevision((r) => r + 1)}>Reintentar</button>}<button type="button" onClick={volver}>Volver al listado</button></div></section>
  const secciones = seccionesDe(catalogo)
  const tipoProducto = secciones.flatMap((seccion) => seccion.campos).find((campo) => campo.clave === 'tipo')?.opciones?.find((opcion) => opcion.valor === registro.tipo)?.etiqueta ?? etiquetaValor(registro.tipo)
  const principios = Array.isArray(registro.principiosActivos) ? registro.principiosActivos : []
  const vigente = catalogo.clave === 'precios-vigentes' && registro.activo && textoValor(registro.vigenteDesde) <= fechaNegocio() && (!registro.vigenteHasta || textoValor(registro.vigenteHasta) >= fechaNegocio())
  const puedeCerrar = catalogo.clave === 'precios-vigentes' && actualizar && registro.activo && (!registro.vigenteHasta || textoValor(registro.vigenteHasta) > fechaNegocio())
  return <section className={`${gestion.pagina} ${styles.pagina}`}>
    <header className={gestionBase.filaCabecera}><button type="button" className={styles.enlaceReferencia} onClick={volver}>← Volver a {catalogo.titulo.toLocaleLowerCase('es')}</button><button type="button" className={formulario.botonSecundario} onClick={() => setRevision((r) => r + 1)}>Actualizar datos</button></header>
    {exito && <p className={styles.aviso} role="status">{exito}</p>}
    <div className={gestion.detalleLayout}><header className={gestion.cabeceraDetalle}><div className={esProducto ? empleado.perfilEmpleado : gestion.perfilRol}>{esProducto ? <ImagenProducto registro={registro} detalle /> : <span className={gestion.iconoRol} aria-hidden="true">{registro.nombre.slice(0, 2).toUpperCase()}</span>}<div><p>{esProducto ? `Producto ${registro.codigo}` : registro.codigo}</p><h1>{registro.nombre}</h1><span className={`${gestion.estado} ${registro.activo ? gestion.activo : gestion.inactivo} ${styles.estado}`}>{registro.activo ? 'Activo' : 'Inactivo'}</span>{catalogo.clave === 'precios-vigentes' && <p>{vigente ? 'Vigente hoy' : registro.activo && textoValor(registro.vigenteDesde) > fechaNegocio() ? 'Vigencia futura' : 'Fuera de vigencia'}</p>}{catalogo.clave === 'proveedores' && <p>Homologación: {etiquetaValor(registro.estadoHomologacion)}</p>}</div></div>
    {esProducto && <div className={empleado.resumenPerfil}><span>Tipo de producto</span><strong>{tipoProducto}</strong><span>Unidad base</span><strong><NombreReferencia referencia="unidades" id={textoValor(registro.unidadBaseId)} /></strong></div>}
    <div className={gestion.accionesCabecera}>
      {actualizar && puedeEditarRegistro(catalogo.clave, registro) && <button type="button" className={gestion.botonEditar} onClick={() => onNavegar(`${rutaCatalogo(catalogo.clave)}/${id}/editar`)}><IconoAccion nombre="editar" />Editar información</button>}
      {sesion.permisos.includes(`${permiso}.INACTIVAR`) && puedeInactivarRegistro(catalogo.clave, registro) && <button type="button" className={esProducto ? empleado.botonEstado : gestion.botonPeligro} onClick={() => setOperacion('inactivar')}><IconoAccion nombre="estado" />Desactivar registro</button>}
      {catalogo.clave === 'proveedores' && registro.activo && sesion.permisos.includes(`${permiso}.HOMOLOGAR`) && <button type="button" className={gestion.botonEditar} onClick={() => setOperacion('homologar')}>Cambiar homologación</button>}
      {puedeCerrar && <button type="button" className={gestion.botonEditar} onClick={() => setOperacion('cerrar')}>Cerrar vigencia</button>}
    </div></header><div className={gestion.detalleContenido}>
      <NavegacionSecciones className={esProducto ? empleado.navegacionDetalle : undefined} secciones={[...secciones.map((seccion, i) => ({ id: `detalle-seccion-${i}`, titulo: seccion.titulo })), { id: 'detalle-control', titulo: 'Control del registro' }, ...(verAuditoria ? [{ id: 'detalle-auditoria', titulo: 'Auditoría' }] : [])]} />
      {esProducto && <div className={empleado.encabezadoExpediente}><p>Ficha del producto</p><h2>Información general</h2></div>}
      <div className={gestion.grillaDetalle}>{secciones.map((seccion, i) => <article key={seccion.titulo} className={gestion.tarjetaDetalle} id={`detalle-seccion-${i}`}><h2><span className={gestion.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{seccion.titulo}</h2>
        <dl>{seccion.campos.map((campo) => <div key={campo.clave} className={campo.tipo === 'area' ? gestion.datoCompleto : ''}><dt>{campo.etiqueta}</dt><dd>{campo.referencia ? <NombreReferencia referencia={campo.referencia} id={textoValor(registro[campo.clave])} /> : campo.clave === 'cantidadBase' ? mostrarCantidad(registro[campo.clave]) : campo.clave === 'precio' ? `Q ${textoValor(registro.precio)}` : campo.opciones ? campo.opciones.find((item) => item.valor === registro[campo.clave])?.etiqueta ?? etiquetaValor(registro[campo.clave]) : etiquetaValor(registro[campo.clave])}</dd></div>)}</dl>
        {seccion.composicion && (principios.length ? <dl>{principios.map((principio) => <div className={gestion.datoCompleto} key={principio.principioActivoId}><dt>Principio activo</dt><dd><NombreReferencia referencia="principios-activos" id={principio.principioActivoId} /> · {principio.concentracion}</dd></div>)}</dl> : <p className={gestion.sinDato}>Sin principios activos.</p>)}
      </article>)}<article className={gestion.tarjetaDetalle} id="detalle-control"><h2><span className={gestion.numeroSeccion}>{String(secciones.length + 1).padStart(2, '0')}</span>Control del registro</h2><dl><div><dt>Creado</dt><dd>{fechaHora(registro.creadoEn)}</dd></div><div><dt>Actualizado</dt><dd>{fechaHora(registro.actualizadoEn)}</dd></div><div><dt>Desactivado</dt><dd>{fechaHora(registro.inactivadoEn)}</dd></div><div><dt>Versión</dt><dd>{registro.version}</dd></div>{!registro.activo && <div className={gestion.datoCompleto}><dt>Motivo de desactivación</dt><dd>{registro.motivoInactivacion ?? 'Sin motivo registrado'}</dd></div>}</dl></article></div>
      {verAuditoria && <div id="detalle-auditoria"><CatalogoAuditoria catalogo={catalogo} registroId={id} revision={registro.version} /></div>}
    </div></div>
    {operacion && <CatalogoOperacionModal key={`${id}-${operacion}-${registro.version}`} catalogo={catalogo} registro={registro} operacion={operacion} onCerrar={() => setOperacion(null)} onCompletado={() => { setExito('La operación se completó correctamente.'); setOperacion(null); setRevision((r) => r + 1) }} />}
  </section>
}
