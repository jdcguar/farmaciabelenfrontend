import { useEffect, useMemo, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { listarDocumentosTraslado, exportarDocumentosTraslado } from '../traslado-api'
import { estadosDespacho, estadosRecepcion, prioridadesTraslado } from '../traslado.config'
import { criteriosDocumentoTraslado } from '../traslado-documentos-reglas'
import { fechaHora } from '../traslado-reglas'
import type { ConsultaDocumentoTraslado, DocumentoListado, Paginado, RecursoDocumentoTraslado } from '../traslado.types'
import { TablaDatos, PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { BotonExportar } from '../../../shared/components/boton-exportar/boton-exportar'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { CargaTraslado, ErrorTraslado } from './traslado-campo'
import { TrasladoFiltros } from './traslado-filtros'
import { BotonComprobanteTraslado } from './boton-comprobante-traslado'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

export function TrasladoDocumentosListadoView({ recurso, sesion, consulta, onNavegar }: { recurso: RecursoDocumentoTraslado; sesion: SesionUsuario; consulta: string; onNavegar: (r: string) => void }) {
  const titulo = recurso === 'despachos' ? 'Despachos' : 'Recepciones', singular = recurso === 'despachos' ? 'despacho' : 'recepción', plural = recurso === 'despachos' ? 'despachos' : 'recepciones'
  const estados: Record<string, string> = recurso === 'despachos' ? estadosDespacho : estadosRecepcion
  const [criterios, setCriterios] = useState(() => criteriosDocumentoTraslado(recurso, consulta))
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50), [revision, setRevision] = useState(0)
  const [resultado, setResultado] = useState<Paginado<DocumentoListado> | null>(null), [error, setError] = useState<unknown>(null), [errorExportar, setErrorExportar] = useState<unknown>(null), [finalizada, setFinalizada] = useState('')
  const parametros = useMemo(() => ({ ...criterios, pagina, tamanoPagina }), [criterios, pagina, tamanoPagina]), clave = JSON.stringify({ recurso, parametros, revision }), cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void listarDocumentosTraslado(recurso, parametros, c.signal).then(r => { if (!c.signal.aborted) { setResultado(r); setError(null); if (pagina > Math.max(1, r.totalPaginas)) setPagina(Math.max(1, r.totalPaginas)) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [recurso, clave, pagina, parametros])
  const detalle = (id: string) => onNavegar(`/traslados/${recurso}/${id}`)
  const columnas: ColumnaTabla<DocumentoListado>[] = [
    { id: 'documento', titulo: recurso === 'despachos' ? 'Despacho' : 'Recepción', obtenerValor: d => d.id, celda: d => <button type="button" className={styles.enlace} onClick={() => detalle(d.id)}>{d.id}</button> },
    { id: 'traslado', titulo: 'Traslado', obtenerValor: d => d.numeroTraslado, celda: d => <button type="button" className={styles.enlace} onClick={() => onNavegar(`/traslados/${d.trasladoId}`)}>{d.numeroTraslado}</button> },
    ...(recurso === 'recepciones' ? [{ id: 'despacho', titulo: 'Despacho', obtenerValor: (d: DocumentoListado) => 'despachoId' in d ? d.despachoId : '', celda: (d: DocumentoListado) => 'despachoId' in d ? <button type="button" className={styles.enlace} onClick={() => onNavegar(`/traslados/despachos/${d.despachoId}`)}>{d.despachoId}</button> : null }] : []),
    { id: 'origen', titulo: 'Origen', obtenerValor: d => d.origenSucursalId, celda: d => <NombreReferencia referencia="sucursales" id={d.origenSucursalId} /> },
    { id: 'destino', titulo: 'Destino', obtenerValor: d => d.destinoSucursalId, celda: d => <NombreReferencia referencia="sucursales" id={d.destinoSucursalId} /> },
    { id: 'prioridad', titulo: 'Prioridad', obtenerValor: d => d.prioridad, celda: d => prioridadesTraslado[d.prioridad] },
    { id: 'creado', titulo: 'Creado', obtenerValor: d => d.creadoEn ?? '', celda: d => fechaHora(d.creadoEn) },
    { id: 'evento', titulo: recurso === 'despachos' ? 'Salida' : 'Confirmación', obtenerValor: d => ('despachadoEn' in d ? d.despachadoEn : d.confirmadaEn) ?? '', celda: d => fechaHora('despachadoEn' in d ? d.despachadoEn : d.confirmadaEn) },
    { id: 'estado', titulo: 'Estado', obtenerValor: d => d.estado, celda: d => <span className={styles.estado} data-estado={d.estado}>{estados[d.estado]}</span> },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: d => d.id, celda: d => <div className={gestion.accionesFila}><button type="button" aria-label={`Ver ${singular} ${d.id}`} title="Ver detalle" onClick={() => detalle(d.id)}><IconoAccion nombre="ver" /></button><BotonComprobanteTraslado recurso={recurso} id={d.id} referencia={`${singular} ${d.id}`} /></div> },
  ]
  const filtrado = Object.values(criterios).some(Boolean), limpiar = () => { setCriterios({}); setPagina(1) }
  return <section className={gestion.pagina}><header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>{titulo}</h1><div className={gestion.accionesListado}><BotonExportar deshabilitado={cargando || !!error} onExportar={async formato => { setErrorExportar(null); try { await exportarDocumentosTraslado(recurso, criterios, formato) } catch (e) { setErrorExportar(e) } }} /><button type="button" className={form.botonSecundario} onClick={() => onNavegar('/traslados')}>Ver traslados</button></div></div><p className={styles.intro}>{recurso === 'despachos' ? 'Guías de preparación y envío entre puntos de atención.' : 'Inspecciones y confirmaciones de recepción de traslados.'} {sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO') ? 'Alcance corporativo.' : `Origen o destino: ${sesion.sucursal.nombre}.`}</p></header>
    <ErrorTraslado error={errorExportar} />
    <HerramientasListado disposicion="estados" filtros={criterios.estado ? [{ id: 'estado', value: [criterios.estado] }] : []} opcionesEstado={Object.entries(estados).map(([valor, etiqueta]) => ({ valor, etiqueta }))} onFiltrosChange={f => { const v = f.find(x => x.id === 'estado')?.value; const estado = Array.isArray(v) ? v[0] as ConsultaDocumentoTraslado['estado'] : undefined; setCriterios(c => ({ ...c, estado })); setPagina(1) }} total={!cargando && !error ? resultado?.total : undefined} unidadSingular={singular} unidadPlural={plural} accionesEstado={<TrasladoFiltros recurso={recurso} valores={criterios} onAplicar={valores => { setCriterios(actual => ({ ...valores, estado: actual.estado })); setPagina(1) }} />} />
    <div className={gestion.panelTabla}><div className={gestion.resumenTabla}><h2>Listado de {plural}</h2><button type="button" className={form.botonSecundario} disabled={cargando} onClick={() => setRevision(r => r + 1)}>Actualizar</button></div>{cargando ? <div className={gestion.estadoVacio} role="status" aria-busy="true"><h2>Cargando {plural}…</h2></div> : <CargaTraslado cargando={false} error={error} onReintentar={() => setRevision(r => r + 1)} />}{!cargando && !error && resultado && <>{resultado.items.length ? <div className={styles.tablaDocumentos} data-recurso={recurso}><TablaDatos apariencia="tarjetas" descripcion={`Listado de ${plural}`} columnas={columnas} datos={resultado.items} obtenerIdFila={d => d.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} /></div> : <div className={gestion.estadoVacio}><h2>{filtrado ? 'Sin coincidencias' : 'Sin registros'}</h2><p>{filtrado ? 'Prueba con otros filtros.' : `Todavía no hay ${plural} disponibles para tu usuario.`}</p>{filtrado && <button type="button" className={form.botonSecundario} onClick={limpiar}>Limpiar filtros</button>}</div>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular={singular} unidadPlural={plural} onPaginaChange={setPagina} onTamanoPaginaChange={v => { setTamanoPagina(v); setPagina(1) }} /></>}</div>
  </section>
}
