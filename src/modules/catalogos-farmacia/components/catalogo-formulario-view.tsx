import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import { actualizarImagenProducto, eliminarImagenProducto, guardarRegistro, listarCatalogo, obtenerRegistro } from '../catalogo-api'
import { composicionDe, datosIniciales, entradaDe, puedeEditarRegistro, textoValor, validarFormulario } from '../catalogo-reglas'
import { rutaCatalogo, seccionesDe } from '../catalogos.config'
import type { DefinicionCatalogo, RegistroCatalogo, ValorFormulario } from '../catalogo.types'
import { CatalogoCampo } from './catalogo-campo'
import { useContextoCatalogo } from '../catalogo-contexto'
import { NombreReferencia } from './referencia-catalogo'
import styles from '../catalogos.module.css'
import { SelectorImagenProducto } from './selector-imagen-producto'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
type Props = { catalogo: DefinicionCatalogo; id?: string; onCambiosPendientes: (pendientes: boolean) => void }
export function CatalogoFormularioView({ catalogo, id, onCambiosPendientes }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const [registro, setRegistro] = useState<RegistroCatalogo | null>(null)
  const [inicial, setInicial] = useState(() => {
    const datos = datosIniciales(catalogo)
    if (catalogo.clave === 'bodegas') datos.sucursalId = sesion.sucursal.id
    return datos
  })
  const [datos, setDatos] = useState(inicial)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [finalizada, setFinalizada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState<RegistroCatalogo | null>(null)
  const [imagen, setImagen] = useState<File | null>(null)
  const [quitarImagen, setQuitarImagen] = useState(false)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)
  const [falloGuardarImagen, setFalloGuardarImagen] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [productoEnUso, setProductoEnUso] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<RegistroCatalogo | null>(null)
  const ref = useRef<HTMLFormElement>(null)
  const secciones = useMemo(() => seccionesDe(catalogo), [catalogo])
  const pendientes = (JSON.stringify(datos) !== JSON.stringify(inicial) || Boolean(imagen) || quitarImagen) && !guardado
  const claveSolicitud = `${id ?? ''}:${revision}`
  const cargando = Boolean(id && finalizada !== claveSolicitud)
  const productoId = textoValor(datos.productoId)
  useEffect(() => {
    if (catalogo.clave !== 'presentaciones' || !productoId || !sesion.permisos.includes('CATALOGOS.PRODUCTOS.VER')) return
    const controlador = new AbortController()
    void obtenerRegistro('productos', productoId, controlador.signal).then((item) => { if (!controlador.signal.aborted) setProductoSeleccionado(item) }).catch(() => { /* La validación definitiva se realiza al guardar. */ })
    return () => controlador.abort()
  }, [catalogo.clave, productoId, sesion.permisos])
  useEffect(() => { onCambiosPendientes(pendientes) }, [onCambiosPendientes, pendientes])
  useEffect(() => () => onCambiosPendientes(false), [onCambiosPendientes])
  useEffect(() => {
    if (!id) return
    const abortar = new AbortController()
    void obtenerRegistro(catalogo.clave, id, abortar.signal).then((item) => {
      if (abortar.signal.aborted) return
      setRegistro(item); const valores = datosIniciales(catalogo, item); setInicial(valores); setDatos(valores); setError(null)
    }).catch((e: unknown) => { if (!abortar.signal.aborted) setError(e instanceof ErrorApi ? e.message : 'No fue posible cargar el registro.') }).finally(() => { if (!abortar.signal.aborted) setFinalizada(claveSolicitud) })
    if (catalogo.clave === 'productos' && sesion.permisos.includes('CATALOGOS.PRESENTACIONES.VER')) void listarCatalogo('presentaciones', { pagina: 1, tamanoPagina: 1, productoId: id, activo: true }, abortar.signal).then((items) => { if (!abortar.signal.aborted) setProductoEnUso(items.total > 0) }).catch(() => { /* El servidor conserva la validación si no puede verificarse la dependencia. */ })
    return () => abortar.abort()
  }, [catalogo, claveSolicitud, id, sesion.permisos])
  const cambiar = (campo: string, valor: ValorFormulario) => {
    setDatos((actual) => {
      const siguiente = { ...actual, [campo]: valor }
      if (catalogo.clave === 'unidades' && campo === 'dimension' && ['CONTEO', 'EMPAQUE'].includes(String(valor))) siguiente.admiteDecimales = false
      if (catalogo.clave === 'clientes' && campo === 'tipo' && valor === 'GENERICO') {
        siguiente.nit = 'CF'
        for (const clave of ['dpi', 'telefono', 'correo', 'direccion', 'municipioId']) siguiente[clave] = ''
      }
      return siguiente
    }); setErrores({})
  }
  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (guardando) return
    if (errorImagen) { document.getElementById('imagen-producto')?.focus(); return }
    const validacion = validarFormulario(catalogo, datos, Boolean(id))
    setErrores(validacion)
    if (Object.keys(validacion).length) {
      const campo = Object.keys(validacion)[0]
      const control = ref.current?.querySelector<HTMLElement>(`[id="${campo}"]`)
      if (control) control.focus()
      else ref.current?.querySelector<HTMLElement>('[data-resumen-errores]')?.focus()
      return
    }
    setGuardando(true); setError(null)
    try {
      let item = await guardarRegistro(catalogo.clave, entradaDe(catalogo, datos), registro ?? undefined)
      setRegistro(item); setInicial(datos); onCambiosPendientes(false)
      try {
        if (catalogo.clave === 'productos' && imagen) item = await actualizarImagenProducto(item, imagen)
        else if (catalogo.clave === 'productos' && quitarImagen && item.imagenUrl) item = await eliminarImagenProducto(item)
        setImagen(null); setQuitarImagen(false); setFalloGuardarImagen(null)
      } catch (errorArchivo: unknown) {
        setFalloGuardarImagen(errorArchivo instanceof ErrorApi ? errorArchivo.message : 'No fue posible guardar el cambio de imagen.')
      }
      setRegistro(item); setGuardado(item)
    }
    catch (e: unknown) {
      setError(e instanceof ErrorApi ? e.message : 'No fue posible guardar el registro.')
      if (e instanceof ErrorApi) setErrores(Object.fromEntries(e.detalles.map((detalle) => [detalle.campo, detalle.mensaje])))
    } finally { setGuardando(false) }
  }
  const reintentarImagen = async () => {
    if (!guardado || guardando) return
    setGuardando(true)
    try {
      let item = guardado
      // Reintenta únicamente la imagen con la versión guardada; nunca repite la creación.
      if (imagen) item = await actualizarImagenProducto(item, imagen)
      else if (quitarImagen && item.imagenUrl) item = await eliminarImagenProducto(item)
      setGuardado(item); setRegistro(item); setImagen(null); setQuitarImagen(false); setFalloGuardarImagen(null)
    } catch (e: unknown) { setFalloGuardarImagen(e instanceof ErrorApi ? e.message : 'No fue posible guardar el cambio de imagen.') }
    finally { setGuardando(false) }
  }
  const puedeVer = sesion.permisos.includes(`CATALOGOS.${catalogo.permiso}.VER`)
  const volver = () => onNavegar(puedeVer ? id ? `${rutaCatalogo(catalogo.clave)}/${id}` : rutaCatalogo(catalogo.clave) : '/')
  const verGuardado = () => onNavegar(puedeVer ? `${rutaCatalogo(catalogo.clave)}/${guardado?.id}` : '/')
  if (cargando || id && !registro) return <section className={formulario.estadoCargaFormulario} aria-busy={cargando}><h1>{cargando ? 'Cargando información…' : 'No fue posible abrir el registro'}</h1>{error && <p role="alert">{error}</p>}<div>{!cargando && <button type="button" onClick={() => setRevision((r) => r + 1)}>Reintentar</button>}<button type="button" onClick={volver}>Volver</button></div></section>
  if (registro && !puedeEditarRegistro(catalogo.clave, registro)) return <section className={formulario.estadoCargaFormulario}><h1>Este registro no admite edición</h1><p>{registro.activo ? 'La vigencia ya comenzó. Conserva el historial y registra un nuevo periodo.' : 'El registro está inactivo.'}</p><button type="button" onClick={volver}>Ver detalle</button></section>
  const principio = composicionDe(datos)
  const esProducto = catalogo.clave === 'productos'
  const apariencia = esProducto ? empleado : formulario
  const acciones = <div className={apariencia.accionesFormulario}><p><span>*</span> Campos obligatorios</p><div><button className={apariencia.botonSecundario} type="button" onClick={volver} disabled={guardando}><IconoAccion nombre="cancelar" className={apariencia.iconoBoton} />Cancelar</button><button className={apariencia.botonPrincipal} type="submit" disabled={guardando}><IconoAccion nombre="guardar" className={apariencia.iconoBoton} />{guardando ? 'Guardando…' : 'Guardar'}</button></div></div>
  const descripcionesProducto = ['Código, nombre y descripción del producto.', 'Tipo, laboratorio y unidad base del producto.', 'Composición y concentración de cada principio activo.', 'Trazabilidad, dispensación y condiciones de conservación.']
  const clinicos = ['tipo', 'formaFarmaceutica', 'concentracion', 'laboratorioId', 'unidadBaseId', 'requiereLote', 'requiereVencimiento']
  return <section className={`${formulario.paginaFormulario} ${styles.pagina}`}>
    <header className={apariencia.encabezadoPagina}><h1>{id ? 'Editar' : 'Crear'} {catalogo.singular}</h1>{id && <span className={apariencia.indicadorFormulario}>{registro?.codigo} · {registro?.nombre}</span>}</header>
    {error && <div className={`${formulario.alertaError} ${styles.error}`} role="alert"><p>{error}</p></div>}
    {productoEnUso && <p className={styles.aviso}>La identidad farmacéutica y la trazabilidad se conservan porque existen presentaciones activas.</p>}
    <form onSubmitCapture={validarCantidadesAlEnviar} className={formulario.formulario} ref={ref} onSubmit={(e) => void guardar(e)} noValidate aria-busy={guardando}>
      {Object.keys(errores).length > 0 && <div className={styles.aviso} role="alert" tabIndex={-1} data-resumen-errores>Revisa los campos indicados antes de guardar. {errores.principiosActivos}</div>}
      <div className={esProducto ? `${empleado.formulario} ${styles.formularioProducto}` : formulario.layoutFormulario}>
        {esProducto ? <fieldset className={empleado.panelPerfil} disabled={guardando}>
          <legend>Imagen de referencia</legend>
          {sesion.permisos.includes('CATALOGOS.PRODUCTOS.ACTUALIZAR') ? <SelectorImagenProducto archivo={imagen} registro={registro} quitar={quitarImagen} disabled={guardando} error={errorImagen} onArchivo={setImagen} onQuitar={setQuitarImagen} onError={setErrorImagen} /> : <p className={styles.aviso}>La carga de imagen requiere el permiso de actualizar productos.</p>}
          <NavegacionSecciones lateral className={empleado.navegacionFormulario} secciones={secciones.map((s, i) => ({ id: `catalogo-seccion-${i}`, titulo: s.titulo }))} />
        </fieldset> : <NavegacionSecciones lateral secciones={secciones.map((s, i) => ({ id: `catalogo-seccion-${i}`, titulo: s.titulo }))} />}
        <div className={esProducto ? styles.contenidoFormularioProducto : formulario.contenidoFormulario}>
        {secciones.map((seccion, indice) => <fieldset key={seccion.titulo} disabled={guardando} id={`catalogo-seccion-${indice}`}>
          <legend><span className={apariencia.numeroSeccion}>{String(indice + 1).padStart(2, '0')}</span>{seccion.titulo}</legend>
          {esProducto && <p className={empleado.descripcionSeccion}>{descripcionesProducto[indice]}</p>}
          {seccion.ayuda && <p className={styles.aviso}>{seccion.ayuda}</p>}
          {catalogo.clave === 'presentaciones' && indice === 1 && productoSeleccionado?.id === productoId && <p className={styles.aviso}>Unidad base del producto: <NombreReferencia referencia="unidades" id={textoValor(productoSeleccionado.unidadBaseId)} />. {productoSeleccionado.permiteFraccionamiento ? 'El producto permite fraccionamiento.' : 'El producto no permite fraccionamiento.'}</p>}
          <div className={formulario.grillaDos}>{seccion.campos.map((campo) => <CatalogoCampo unidadCantidad={catalogo.clave === 'presentaciones' && campo.clave === 'cantidadBase' ? { productoId } : undefined} key={campo.clave} campo={campo} valor={datos[campo.clave]} error={errores[campo.clave]} onChange={(valor) => cambiar(campo.clave, valor)}
            soloSucursalActual={(catalogo.clave === 'bodegas' || catalogo.clave === 'ubicaciones') && !sesion.permisos.includes(`CATALOGOS.${catalogo.permiso}.CORPORATIVO`)}
            disabled={catalogo.clave === 'unidades' && campo.clave === 'admiteDecimales' && ['CONTEO', 'EMPAQUE'].includes(textoValor(datos.dimension)) || guardando || Boolean(id && campo.inmutable) || catalogo.clave === 'proveedores' && campo.clave === 'nit' && registro?.estadoHomologacion === 'APROBADO' || productoEnUso && (clinicos.includes(campo.clave) || campo.clave === 'permiteFraccionamiento' && registro?.permiteFraccionamiento === true) || catalogo.clave === 'clientes' && datos.tipo === 'GENERICO' && ['nit', 'dpi', 'telefono', 'correo', 'direccion', 'municipioId'].includes(campo.clave)} />)}</div>
          {seccion.composicion && <div className={styles.composicion}>
            {principio.map((item, i) => <div className={styles.filaComposicion} key={i}>
              <CatalogoCampo campo={{ clave: `principiosActivos.${i}.principioActivoId`, etiqueta: `Principio activo ${i + 1}`, tipo: 'referencia', referencia: 'principios-activos', requerido: true }} valor={item.principioActivoId} error={errores[`principiosActivos.${i}.principioActivoId`]} disabled={productoEnUso || guardando} onChange={(valor) => cambiar('principiosActivos', principio.map((p, j) => j === i ? { ...p, principioActivoId: textoValor(valor) } : p))} />
              <CatalogoCampo campo={{ clave: `principiosActivos.${i}.concentracion`, etiqueta: 'Concentración del principio', maximo: 100, requerido: true }} valor={item.concentracion} error={errores[`principiosActivos.${i}.concentracion`]} disabled={productoEnUso || guardando} onChange={(valor) => cambiar('principiosActivos', principio.map((p, j) => j === i ? { ...p, concentracion: textoValor(valor) } : p))} />
              <button type="button" className={formulario.botonSecundario} disabled={productoEnUso || guardando} aria-label={`Quitar principio activo ${i + 1}`} onClick={() => cambiar('principiosActivos', principio.filter((_, j) => j !== i))}>Quitar</button>
            </div>)}
            {!principio.length && <p className={formulario.ayudaCampo}>Aún no hay principios activos registrados.</p>}
            <button type="button" className={formulario.botonSecundario} disabled={productoEnUso || guardando || principio.length >= 20} onClick={() => cambiar('principiosActivos', [...principio, { principioActivoId: '', concentracion: '' }])}><IconoAccion nombre="agregar" className={formulario.iconoBoton} />Agregar principio activo</button>
          </div>}
        </fieldset>)}
        {!esProducto && acciones}
      </div>{esProducto && acciones}</div>
    </form>
    <ModalEstado abierto={Boolean(guardado)} tipo={falloGuardarImagen ? 'advertencia' : 'exito'} titulo={falloGuardarImagen ? 'Producto guardado; imagen pendiente' : 'Registro guardado'} mensaje={falloGuardarImagen ? <><p>Los datos del producto ya están guardados, pero el cambio de imagen no se completó.</p><p>{falloGuardarImagen}</p></> : `La información de ${catalogo.singular} fue guardada correctamente.`} textoAccionPrincipal={falloGuardarImagen ? 'Continuar sin cambiar imagen' : puedeVer ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={verGuardado} onCerrar={verGuardado} textoAccionSecundaria={falloGuardarImagen ? 'Reintentar imagen' : undefined} onAccionSecundaria={falloGuardarImagen ? () => void reintentarImagen() : undefined} cargando={guardando} />
  </section>
}
