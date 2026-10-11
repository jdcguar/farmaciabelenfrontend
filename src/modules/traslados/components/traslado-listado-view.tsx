import { useEffect, useMemo, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { listarTraslados, exportarTraslados } from '../traslado-api'
import { estadosTraslado, permisoTraslado, prioridadesTraslado, tiposTraslado } from '../traslado.config'
import type { ConsultaTraslado, EstadoTraslado, Paginado, PrioridadTraslado, Traslado } from '../traslado.types'
import { esUuid, fechaValida } from '../traslado-reglas'
import { TablaDatos, PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { BotonExportar } from '../../../shared/components/boton-exportar/boton-exportar'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { CargaTraslado, ErrorTraslado, EstadoTrasladoBadge } from './traslado-campo'
import { TrasladoFiltros } from './traslado-filtros'
import { BotonComprobanteTraslado } from './boton-comprobante-traslado'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'
export function TrasladoListadoView({ sesion, consulta, onNavegar }: { sesion: SesionUsuario; consulta: string; onNavegar: (r: string) => void }) {
  const [criterios, setCriterios] = useState<ConsultaTraslado>(() => {
    const q = new URLSearchParams(consulta), c: ConsultaTraslado = {}
    for (const k of ['origenSucursalId', 'destinoSucursalId'] as const) if (esUuid(q.get(k) ?? '')) c[k] = q.get(k)!
    if (Object.hasOwn(estadosTraslado, q.get('estado') ?? '')) c.estado = q.get('estado') as EstadoTraslado
    if (Object.hasOwn(prioridadesTraslado, q.get('prioridad') ?? '')) c.prioridad = q.get('prioridad') as PrioridadTraslado
    for (const k of ['desde', 'hasta'] as const) if (fechaValida(q.get(k) ?? '')) c[k] = q.get(k)!
    if (c.desde && c.hasta && c.desde > c.hasta) { delete c.desde; delete c.hasta }
    return c
  })
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50), [revision, setRevision] = useState(0)
  const [resultado, setResultado] = useState<Paginado<Traslado> | null>(null), [error, setError] = useState<unknown>(null), [errorExportar, setErrorExportar] = useState<unknown>(null), [finalizada, setFinalizada] = useState('')
  const parametros = useMemo(() => ({ ...criterios, pagina, tamanoPagina }), [criterios, pagina, tamanoPagina]), clave = JSON.stringify({ parametros, revision }), cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void listarTraslados(parametros, c.signal).then(r => { if (!c.signal.aborted) { setResultado(r); setError(null); if (pagina > Math.max(1, r.totalPaginas)) setPagina(Math.max(1, r.totalPaginas)) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, pagina, parametros])
  const columnas: ColumnaTabla<Traslado>[] = [
    { id: 'numero', titulo: 'Traslado', obtenerValor: t => t.numero, celda: t => <button type="button" className={styles.enlace} onClick={() => onNavegar(`/traslados/${t.id}`)}>{t.numero}</button> },
    { id: 'origen', titulo: 'Origen', obtenerValor: t => t.origenSucursalId, celda: t => <NombreReferencia referencia="sucursales" id={t.origenSucursalId} /> },
    { id: 'destino', titulo: 'Destino', obtenerValor: t => t.destinoSucursalId, celda: t => <NombreReferencia referencia="sucursales" id={t.destinoSucursalId} /> },
    { id: 'tipo', titulo: 'Tipo', obtenerValor: t => t.tipo, celda: t => tiposTraslado[t.tipo] },
    { id: 'prioridad', titulo: 'Prioridad', obtenerValor: t => t.prioridad, celda: t => prioridadesTraslado[t.prioridad] },
    { id: 'fecha', titulo: 'Fecha requerida', obtenerValor: t => t.fechaRequerida, celda: t => t.fechaRequerida },
    { id: 'estado', titulo: 'Estado', obtenerValor: t => t.estado, celda: t => <EstadoTrasladoBadge estado={t.estado} /> },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: t => t.id, celda: t => <div className={gestion.accionesFila}><button type="button" aria-label={`Ver traslado ${t.numero}`} title="Ver detalle" onClick={() => onNavegar(`/traslados/${t.id}`)}><IconoAccion nombre="ver" /></button><BotonComprobanteTraslado recurso="traslados" id={t.id} referencia={`traslado ${t.numero}`} /></div> },
  ]
  const limpiar = () => { setCriterios({}); setPagina(1) }
  return <section className={gestion.pagina}><header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>Traslados</h1><div className={gestion.accionesListado}><BotonExportar deshabilitado={cargando || !!error} onExportar={async formato => { setErrorExportar(null); try { await exportarTraslados(criterios, formato) } catch (e) { setErrorExportar(e) } }} />{sesion.permisos.includes(permisoTraslado('CREAR')) && <button className={gestion.botonPrimario} type="button" onClick={() => onNavegar('/traslados/nuevo')}><IconoAccion nombre="agregar" />Nueva solicitud</button>}</div></div><p className={styles.intro}>Solicitudes de abastecimiento y traslado entre puntos de atención. {sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO') ? 'Alcance corporativo.' : `Origen o destino: ${sesion.sucursal.nombre}.`}</p></header>
    <ErrorTraslado error={errorExportar} />
    <HerramientasListado disposicion="estados" filtros={criterios.estado ? [{ id: 'estado', value: [criterios.estado] }] : []} opcionesEstado={Object.entries(estadosTraslado).map(([valor, etiqueta]) => ({ valor, etiqueta }))} onFiltrosChange={f => { const v = f.find(x => x.id === 'estado')?.value; const estado = Array.isArray(v) ? v[0] as EstadoTraslado : undefined; setCriterios(c => ({ ...c, estado })); setPagina(1) }} total={!cargando && !error ? resultado?.total : undefined} unidadSingular="traslado" unidadPlural="traslados" accionesEstado={<TrasladoFiltros valores={criterios} onAplicar={valores => { setCriterios(actual => ({ ...valores, estado: actual.estado })); setPagina(1) }} />} />
    <div className={gestion.panelTabla}><div className={gestion.resumenTabla}><h2>Listado de traslados</h2><button type="button" className={form.botonSecundario} disabled={cargando} onClick={() => setRevision(r => r + 1)}>Actualizar</button></div><CargaTraslado cargando={cargando} error={error} onReintentar={() => setRevision(r => r + 1)} />{!cargando && !error && resultado && <>{resultado.items.length ? <TablaDatos apariencia="tarjetas" descripcion="Listado de traslados" columnas={columnas} datos={resultado.items} obtenerIdFila={t => t.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} /> : <div className={gestion.estadoVacio}><h2>{Object.values(criterios).some(Boolean) ? 'Sin coincidencias' : 'Sin registros'}</h2><p>{Object.values(criterios).some(Boolean) ? 'Prueba con otros filtros.' : 'Todavía no hay traslados disponibles para tu usuario.'}</p>{Object.values(criterios).some(Boolean) && <button type="button" className={form.botonSecundario} onClick={limpiar}>Limpiar filtros</button>}</div>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="traslado" unidadPlural="traslados" onPaginaChange={setPagina} onTamanoPaginaChange={v => { setTamanoPagina(v); setPagina(1) }} /></>}</div>
  </section>
}
