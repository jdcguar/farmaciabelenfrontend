import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useMemo, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { BotonExportar } from '../../../shared/components/boton-exportar'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { PaginacionTabla, TablaDatos, type ColumnaTabla, type ColumnFiltersState, type SortingState } from '../../../shared/components/tabla-datos'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import { exportarCatalogo, listarCatalogo } from '../catalogo-api'
import { camposDe, rutaCatalogo } from '../catalogos.config'
import { etiquetaValor, puedeEditarRegistro, puedeInactivarRegistro, textoValor } from '../catalogo-reglas'
import type { ConsultaCatalogo, DefinicionCatalogo, Paginado, RegistroCatalogo } from '../catalogo.types'
import { FiltrosCatalogo } from './filtros-catalogo'
import { CatalogoOperacionModal } from './catalogo-operacion-modal'
import { NombreReferencia } from './referencia-catalogo'
import { useContextoCatalogo } from '../catalogo-contexto'
import { ConsultaPrecioActual } from './consulta-precio-actual'
import { ImagenProducto } from './imagen-producto'
import styles from '../catalogos.module.css'
type Props = { catalogo: DefinicionCatalogo }
export function CatalogoListadoView({ catalogo }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const [resultado, setResultado] = useState<Paginado<RegistroCatalogo> | null>(null)
  const [pagina, setPagina] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(50)
  const [entrada, setEntrada] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<ColumnFiltersState>([{ id: 'estado', value: ['ACTIVO'] }])
  const [adicionales, setAdicionales] = useState<Record<string, string>>({})
  const [ordenamiento, setOrdenamiento] = useState<SortingState>([{ id: 'nombre', desc: false }])
  const [error, setError] = useState<string | null>(null)
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [finalizada, setFinalizada] = useState('')
  const [aInactivar, setAInactivar] = useState<RegistroCatalogo | null>(null)
  const [exito, setExito] = useState('')
  const basePermiso = `CATALOGOS.${catalogo.permiso}`
  const puedeCrear = sesion.permisos.includes(`${basePermiso}.CREAR`)
  const puedeEditar = sesion.permisos.includes(`${basePermiso}.ACTUALIZAR`)
  const puedeInactivar = sesion.permisos.includes(`${basePermiso}.INACTIVAR`)
  const cambiarFiltros = (siguientes: ColumnFiltersState) => {
    const nombre = siguientes.find((filtro) => filtro.id === 'nombre')?.value
    if (textoValor(nombre) && nombre !== filtros.find((filtro) => filtro.id === 'nombre')?.value) { setEntrada(''); setBusqueda('') }
    setFiltros(siguientes); setPagina(1)
  }
  useEffect(() => {
    if (entrada.trim() === busqueda) return
    const timer = window.setTimeout(() => { setBusqueda(entrada.trim()); setPagina(1) }, 400)
    return () => window.clearTimeout(timer)
  }, [busqueda, entrada])
  const parametros = useMemo<ConsultaCatalogo>(() => {
    const estado = filtros.find((f) => f.id === 'estado')?.value
    const nombre = filtros.find((f) => f.id === 'nombre')?.value
    const filtroCodigo = filtros.find((f) => f.id === 'codigo')?.value
    const activo = Array.isArray(estado) && estado.length === 1 ? estado[0] === 'ACTIVO' : undefined
    const orden = ordenamiento[0]
    return { pagina, tamanoPagina, activo, busqueda: textoValor(nombre) || textoValor(filtroCodigo) || busqueda || undefined, orden: orden?.id === 'codigo' || orden?.id === 'estado' ? orden.id : 'nombre', direccion: orden?.desc ? 'desc' : 'asc', ...Object.fromEntries(Object.entries(adicionales).filter(([, valor]) => valor !== '')) }
  }, [adicionales, busqueda, filtros, ordenamiento, pagina, tamanoPagina])
  const clave = JSON.stringify({ parametros, revision })
  const cargando = finalizada !== clave
  useEffect(() => {
    const controlador = new AbortController()
    void listarCatalogo(catalogo.clave, parametros, controlador.signal).then((items) => {
      if (controlador.signal.aborted) return
      if (pagina > Math.max(1, items.totalPaginas)) { setPagina(Math.max(1, items.totalPaginas)); return }
      setResultado(items); setError(null)
    }).catch((e: unknown) => { if (!controlador.signal.aborted) setError(e instanceof ErrorApi ? e.message : 'No fue posible cargar el catálogo.') }).finally(() => { if (!controlador.signal.aborted) setFinalizada(clave) })
    return () => controlador.abort()
  }, [catalogo.clave, clave, pagina, parametros])
  const columnas = useMemo<ColumnaTabla<RegistroCatalogo>[]>(() => [
    { id: 'codigo', titulo: 'Código', obtenerValor: (item) => item.codigo, ordenable: true, celda: (item) => <strong>{item.codigo}</strong> },
    { id: 'nombre', titulo: 'Nombre', obtenerValor: (item) => item.nombre, ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Buscar en el catálogo', placeholder: 'Nombre o código' }, celda: (item) => <div className={catalogo.clave === 'productos' ? styles.identidadProducto : undefined}>{catalogo.clave === 'productos' && <ImagenProducto registro={item} />}<div className={gestion.identidadRol}><strong>{item.nombre}</strong>{catalogo.clave !== 'clientes' && item.descripcion && <small>{item.descripcion}</small>}</div></div> },
    ...catalogo.columnas.map((id): ColumnaTabla<RegistroCatalogo> => {
      const campo = camposDe(catalogo).find((item) => item.clave === id)
      return { id, titulo: campo?.etiqueta ?? (id === 'estadoHomologacion' ? 'Homologación' : id), obtenerValor: (item) => item[id], celda: (item) => campo?.referencia ? <NombreReferencia referencia={campo.referencia} id={textoValor(item[id])} /> : id === 'cantidadBase' ? mostrarCantidad(item[id]) : id === 'precio' ? <span className={styles.valor}>Q {textoValor(item[id])}</span> : campo?.opciones ? campo.opciones.find((opcion) => opcion.valor === item[id])?.etiqueta ?? etiquetaValor(item[id]) : etiquetaValor(item[id]) }
    }),
    { id: 'estado', titulo: 'Estado', obtenerValor: (item) => item.activo, ordenable: true, filtro: { tipo: 'opciones', etiqueta: 'Estado del registro', buscable: false, opciones: [{ valor: 'ACTIVO', etiqueta: 'Activo' }, { valor: 'INACTIVO', etiqueta: 'Inactivo' }] }, celda: (item) => <span className={`${gestion.estado} ${item.activo ? gestion.activo : gestion.inactivo} ${styles.estado}`}>{item.activo ? 'Activo' : 'Inactivo'}</span> },
    { id: 'acciones', titulo: 'Acciones', tituloSoloLectores: true, obtenerValor: () => '', celda: (item) => <div className={`${gestion.accionesFila} ${styles.acciones}`}>
      <button type="button" title="Ver detalle" aria-label={`Ver ${item.nombre}`} onClick={() => onNavegar(`${rutaCatalogo(catalogo.clave)}/${item.id}`)}><IconoAccion nombre="ver" /></button>
      {puedeEditar && puedeEditarRegistro(catalogo.clave, item) && <button type="button" title="Editar" aria-label={`Editar ${item.nombre}`} onClick={() => onNavegar(`${rutaCatalogo(catalogo.clave)}/${item.id}/editar`)}><IconoAccion nombre="editar" /></button>}
      {puedeInactivar && puedeInactivarRegistro(catalogo.clave, item) && <button type="button" className={gestion.accionPeligro} title="Desactivar" aria-label={`Desactivar ${item.nombre}`} onClick={() => setAInactivar(item)}><IconoAccion nombre="estado" /></button>}
    </div> },
  ], [catalogo, onNavegar, puedeEditar, puedeInactivar])
  const limpiar = () => { setEntrada(''); setBusqueda(''); setFiltros([]); setAdicionales({}); setPagina(1) }
  const hayCriterios = Boolean(parametros.busqueda || parametros.activo !== undefined || Object.values(adicionales).some(Boolean))
  const exportar = async (formato: 'pdf' | 'xlsx') => { setErrorExportacion(null); try { await exportarCatalogo(catalogo.clave, parametros, formato) } catch (e: unknown) { setErrorExportacion(e instanceof ErrorApi ? e.message : 'No fue posible exportar el catálogo.') } }
  return <section className={`${gestion.pagina} ${styles.pagina}`} aria-labelledby="catalogo-titulo">
    <header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1 id="catalogo-titulo">{catalogo.titulo}</h1><div className={gestion.accionesListado}>{catalogo.clave === 'precios-vigentes' && sesion.permisos.includes('CATALOGOS.PRECIOS_VIGENTES.VER_SUGERENCIAS') && <button type="button" className={gestion.botonPrimario} onClick={() => onNavegar('/catalogos/precios-vigentes/sugerencias')}>Revisar sugerencias</button>}<BotonExportar onExportar={exportar} deshabilitado={cargando || !resultado?.total || Boolean(error)} />{puedeCrear && <button type="button" className={gestion.botonPrimario} onClick={() => onNavegar(`${rutaCatalogo(catalogo.clave)}/nuevo`)}>+ Nuevo registro</button>}</div></div></header>
    {exito && <p className={styles.aviso} role="status">{exito}</p>}
    <HerramientasListado filtros={filtros} onFiltrosChange={cambiarFiltros} total={!cargando && !error ? resultado?.total : undefined} unidadSingular={catalogo.singular} unidadPlural={catalogo.titulo.toLocaleLowerCase('es')} acciones={catalogo.filtros.length > 0 || catalogo.clave === 'precios-vigentes' ? <div className={styles.accionesHerramientas}>
      {catalogo.filtros.length > 0 && <FiltrosCatalogo catalogo={catalogo} valores={adicionales} soloSucursalActual={(catalogo.clave === 'bodegas' || catalogo.clave === 'ubicaciones') && !sesion.permisos.includes(`${basePermiso}.CORPORATIVO`)} onAplicar={(valores) => { setAdicionales(valores); setPagina(1) }} />}
      {catalogo.clave === 'precios-vigentes' && <ConsultaPrecioActual />}
    </div> : undefined}>
      <form onSubmitCapture={validarCantidadesAlEnviar} className={gestion.busquedaGeneral} role="search" onSubmit={(e) => { e.preventDefault(); setBusqueda(entrada.trim()); setPagina(1) }}><div className={gestion.controlBusquedaGeneral}><IconoAccion nombre="buscar" className={gestion.iconoBusquedaGeneral} /><input type="search" value={entrada} maxLength={150} aria-label={`Buscar ${catalogo.titulo.toLocaleLowerCase('es')}`} placeholder="Buscar por código o nombre…" onChange={(e) => { setEntrada(e.target.value); setFiltros((actual) => actual.filter((f) => f.id !== 'nombre')); setPagina(1) }} />{entrada && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { setEntrada(''); setBusqueda(''); setPagina(1) }}>×</button>}</div><small>{entrada.trim() !== busqueda ? 'Esperando una pausa para buscar…' : catalogo.descripcion}</small></form>
    </HerramientasListado>
    {errorExportacion && <div className={`${gestion.alertaError} ${styles.error}`} role="alert">{errorExportacion}</div>}
    <div className={gestion.panelTabla} aria-busy={cargando}>
      <div className={gestion.resumenTabla}><div><strong>Listado de {catalogo.titulo.toLocaleLowerCase('es')}</strong><small>{cargando ? 'Actualizando resultados…' : resultado ? `${resultado.total} ${resultado.total === 1 ? 'registro encontrado' : 'registros encontrados'}` : 'Consulta del catálogo'}</small></div><div className={gestion.accionesResumen}>{hayCriterios && <button type="button" onClick={limpiar}>Limpiar filtros</button>}<button type="button" onClick={() => setRevision((r) => r + 1)}>Actualizar</button></div></div>
      {cargando ? <div className={gestion.estadoVacio} role="status"><h2>Cargando catálogo…</h2></div> : error ? <div className={`${gestion.estadoVacio} ${styles.error}`} role="alert"><h2>No fue posible cargar los registros</h2><p>{error}</p><button type="button" onClick={() => setRevision((r) => r + 1)}>Reintentar</button></div> : resultado && <>
        <TablaDatos apariencia="tarjetas" descripcion={catalogo.titulo} datos={resultado.items} columnas={columnas} filtros={filtros} ordenamiento={ordenamiento} obtenerIdFila={(item) => item.id} onFiltrosChange={cambiarFiltros} onOrdenamientoChange={(siguiente) => { setOrdenamiento(siguiente.length ? siguiente : [{ id: 'nombre', desc: false }]); setPagina(1) }} />
        {!resultado.items.length && <div className={gestion.estadoVacio}><h2>{hayCriterios ? 'Sin coincidencias' : 'No hay registros'}</h2><p>{hayCriterios ? 'Prueba otra búsqueda o limpia los filtros.' : `Comienza creando ${catalogo.singular}.`}</p>{hayCriterios ? <button type="button" onClick={limpiar}>Limpiar filtros</button> : puedeCrear && <button type="button" onClick={() => onNavegar(`${rutaCatalogo(catalogo.clave)}/nuevo`)}>Crear {catalogo.singular}</button>}</div>}
        <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular={catalogo.singular} unidadPlural={catalogo.titulo.toLocaleLowerCase('es')} onPaginaChange={setPagina} onTamanoPaginaChange={(tamano) => { setTamanoPagina(tamano); setPagina(1) }} />
      </>}
    </div>
    {aInactivar && <CatalogoOperacionModal key={aInactivar.id} catalogo={catalogo} registro={aInactivar} operacion="inactivar" onCerrar={() => setAInactivar(null)} onCompletado={() => { setExito(`${aInactivar.nombre} fue desactivado correctamente.`); setAInactivar(null); setRevision((r) => r + 1) }} />}
  </section>
}
