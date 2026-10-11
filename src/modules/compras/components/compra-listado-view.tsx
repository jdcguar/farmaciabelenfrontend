import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useMemo, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { listarCompras, listarObligaciones, exportarCompra, generarCompraPdf } from '../compra-api'
import iconoPdf from '../../../assets/acciones/pdf.png'
import { compras, rutaCompra, puedeCrearCompra, origenRecurso } from '../compra.config'
import type { RecursoCompra, DocumentoCompra, ObligacionListado, ConsultaCompra, Paginado } from '../compra.types'
import { dinero, etiquetasEstado, esUuid } from '../compra-reglas'
import { TablaDatos, PaginacionTabla, type ColumnaTabla, type ColumnFiltersState } from '../../../shared/components/tabla-datos'
import { BotonExportar } from '../../../shared/components/boton-exportar/boton-exportar'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { SelectorReferencia, NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { SelectorDocumento } from './selector-documento'
import { CampoCompra, EstadoCompra, EstadoCargaCompra, ErrorCompra } from './compra-campo'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import herramientas from '../../catalogos-farmacia/catalogos.module.css'
import styles from '../compra.module.css'
type Fila = DocumentoCompra | ObligacionListado
export function CompraListadoView({ recurso, sesion, consultaInicial, onNavegar }: { recurso: RecursoCompra; sesion: SesionUsuario; consultaInicial: string; onNavegar: (r: string) => void }) {
  const inicial = new URLSearchParams(consultaInicial), cfg = compras[recurso]
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50), [revision, setRevision] = useState(0)
  const [criterios, setCriterios] = useState<ConsultaCompra>(() => ({ origenId: esUuid(inicial.get('origenId') ?? '') ? inicial.get('origenId')! : undefined, estado: cfg.estados.some(e => e === inicial.get('estado')) ? inicial.get('estado')! : undefined }))
  const [borrador, setBorrador] = useState<ConsultaCompra>(criterios), [errorFiltros, setErrorFiltros] = useState<string | null>(null)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [documentoGenerando, setDocumentoGenerando] = useState<string | null>(null), [errorDocumentoPdf, setErrorDocumentoPdf] = useState<unknown>(null)
  const [resultado, setResultado] = useState<Paginado<Fila> | null>(null), [error, setError] = useState<unknown>(null), [errorExportar, setErrorExportar] = useState<unknown>(null), [finalizada, setFinalizada] = useState('')
  const parametros = useMemo(() => ({ ...criterios, pagina, tamanoPagina }), [criterios, pagina, tamanoPagina]), clave = JSON.stringify({ recurso, parametros, revision }), cargando = finalizada !== clave
  const corporativo = sesion.permisos.includes('COMPRAS.ACCESO.CORPORATIVO'), origen = recurso === 'obligaciones' ? 'ordenes' : origenRecurso[recurso]
  useEffect(() => {
    const c = new AbortController()
    const solicitud = recurso === 'obligaciones' ? listarObligaciones(parametros, c.signal) : listarCompras(recurso, parametros, c.signal)
    void solicitud.then(r => { if (!c.signal.aborted) { if (pagina > Math.max(1, r.totalPaginas)) setPagina(Math.max(1, r.totalPaginas)); setResultado(r); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, pagina, parametros, recurso])
  const columnas: ColumnaTabla<Fila>[] = [
    { id: 'numero', titulo: recurso === 'obligaciones' ? 'Factura' : 'Documento', obtenerValor: f => 'numero' in f ? f.numero : f.facturaNumero, celda: f => <button type="button" className={`${styles.enlace} ${styles.numero}`} onClick={() => onNavegar(rutaCompra(recurso, f.id))}>{'numero' in f ? f.numero : f.facturaNumero}</button> },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: f => f.sucursalId, celda: f => <NombreReferencia referencia="sucursales" id={f.sucursalId} /> },
    { id: 'proveedor', titulo: 'Proveedor / prioridad', obtenerValor: f => f.proveedorId, celda: f => 'proveedorNombre' in f ? f.proveedorNombre ?? f.prioridad : f.proveedorId ? <NombreReferencia referencia="proveedores" id={f.proveedorId} /> : '—' },
    { id: 'fecha', titulo: recurso === 'obligaciones' ? 'Vencimiento' : 'Fecha', obtenerValor: f => 'fecha' in f ? f.fecha : f.vencimiento, celda: f => 'fecha' in f ? f.fecha : f.vencimiento },
    { id: 'estado', titulo: 'Estado', obtenerValor: f => f.estado, celda: f => <EstadoCompra estado={f.estado} /> },
    { id: 'importe', titulo: recurso === 'solicitudes' ? 'Presupuesto' : 'Importe', obtenerValor: f => f.importe, celda: f => dinero(f.importe) },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: f => f.id, celda: f => <div className={gestion.accionesFila}>
      <button type="button" aria-label={`Ver ${cfg.singular}`} title="Ver detalle" onClick={() => onNavegar(rutaCompra(recurso, f.id))}><IconoAccion nombre="ver" /></button>
      {recurso !== 'evaluaciones' && <button type="button" className={styles.generarDocumentoPdf} title={`Generar ${cfg.singular} en PDF`} aria-label={`Generar ${cfg.singular} ${'numero' in f ? f.numero : f.facturaNumero} en PDF`} aria-busy={documentoGenerando === f.id} disabled={documentoGenerando !== null} onClick={async () => {
        setDocumentoGenerando(f.id); setErrorDocumentoPdf(null)
        try { await generarCompraPdf(recurso, f.id) } catch (e) { setErrorDocumentoPdf(e) } finally { setDocumentoGenerando(null) }
      }}><img src={iconoPdf} alt="" aria-hidden="true" /><span>{documentoGenerando === f.id ? 'Generando…' : `Generar ${cfg.singular}`}</span></button>}
    </div> },
  ]
  const filtros: ColumnFiltersState = criterios.estado ? [{ id: 'estado', value: [criterios.estado] }] : []
  const filtrosActivos = [criterios.sucursalId, criterios.proveedorId, criterios.origenId, criterios.desde, criterios.hasta].filter(Boolean).length
  const aplicarFiltros = () => {
    if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
      setErrorFiltros('La fecha inicial no puede superar la final.')
      return
    }
    setErrorFiltros(null)
    setCriterios({ ...borrador, estado: criterios.estado })
    setPagina(1)
    setFiltrosAbiertos(false)
  }
  return <section className={gestion.pagina}><header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>{cfg.titulo}</h1><div className={gestion.accionesListado}>{recurso !== 'obligaciones' && <BotonExportar deshabilitado={cargando || !!error || !!errorFiltros} onExportar={async f => { setErrorExportar(null); try { await exportarCompra(recurso, parametros, f) } catch (e) { setErrorExportar(e) } }} />}{puedeCrearCompra(recurso, sesion.permisos) && <button className={gestion.botonPrimario} type="button" onClick={() => onNavegar(`${rutaCompra(recurso)}/nuevo`)}><IconoAccion nombre="agregar" />Nueva {cfg.singular}</button>}</div></div><p className={styles.intro}>{cfg.descripcion} {corporativo ? 'Alcance corporativo.' : `Sucursal: ${sesion.sucursal.nombre}.`}</p></header>
    <ErrorCompra error={errorExportar} />
    <ErrorCompra error={errorDocumentoPdf} />
    <HerramientasListado disposicion="estados" filtros={filtros} opcionesEstado={cfg.estados.map(e => ({ valor: e, etiqueta: etiquetasEstado[e] ?? e }))} onFiltrosChange={f => { const v = f.find(x => x.id === 'estado')?.value; const estado = Array.isArray(v) ? String(v[0] ?? '') || undefined : undefined; setCriterios(prev => ({ ...prev, estado })); setBorrador(prev => ({ ...prev, estado })); setPagina(1) }} total={!cargando && !error ? resultado?.total : undefined} unidadSingular={cfg.singular} unidadPlural={cfg.titulo.toLowerCase()} accionesEstado={
      <button type="button" className={herramientas.botonHerramienta} aria-haspopup="dialog" aria-label={`Filtros de ${cfg.titulo.toLowerCase()}${filtrosActivos ? `, ${filtrosActivos} aplicados` : ''}`} data-activo={filtrosActivos > 0} onClick={() => { setBorrador({ ...criterios }); setErrorFiltros(null); setFiltrosAbiertos(true) }}>
        <IconoAccion nombre="filtrar" /><span>Filtros</span>{filtrosActivos > 0 && <span className={herramientas.contadorFiltros} aria-hidden="true">{filtrosActivos}</span>}
      </button>
    } />
    <ModalEstado abierto={filtrosAbiertos} tipo="informacion" apariencia="formulario" titulo={`Filtrar ${cfg.titulo.toLowerCase()}`} onCerrar={() => { setFiltrosAbiertos(false); setErrorFiltros(null) }} textoAccionPrincipal="Aplicar filtros" onAccionPrincipal={aplicarFiltros} textoAccionSecundaria="Limpiar" onAccionSecundaria={() => { setBorrador({ estado: criterios.estado }); setErrorFiltros(null) }} mensaje={<div className={herramientas.panelHerramienta}>
      <p className={herramientas.ayudaHerramienta}>Ajusta los criterios y aplícalos para actualizar la lista.</p>
      <ErrorCompra error={errorFiltros} />
      <form onSubmitCapture={validarCantidadesAlEnviar} className={herramientas.camposHerramienta} onSubmit={e => { e.preventDefault(); aplicarFiltros() }}>
        {corporativo && <CampoCompra nombre="f-sucursal" etiqueta="Sucursal" requerido={false}><SelectorReferencia id="f-sucursal" referencia="sucursales" value={borrador.sucursalId ?? ''} onChange={v => setBorrador(d => ({ ...d, sucursalId: v || undefined }))} /></CampoCompra>}
        <CampoCompra nombre="f-proveedor" etiqueta="Proveedor" requerido={false}><SelectorReferencia id="f-proveedor" referencia="proveedores" value={borrador.proveedorId ?? ''} onChange={v => setBorrador(d => ({ ...d, proveedorId: v || undefined }))} /></CampoCompra>
        {origen && <CampoCompra nombre="f-origen" etiqueta={recurso === 'obligaciones' ? 'Orden de origen de factura' : 'Documento de origen'} requerido={false}><SelectorDocumento id="f-origen" recurso={origen} requerido={false} value={borrador.origenId ?? ''} onChange={v => setBorrador(d => ({ ...d, origenId: v || undefined }))} /></CampoCompra>}
        <CampoCompra nombre="f-desde" etiqueta={recurso === 'obligaciones' ? 'Vencimiento desde' : 'Fecha desde'} tipo="date" requerido={false} value={borrador.desde ?? ''} onChange={v => setBorrador(d => ({ ...d, desde: v || undefined }))} />
        <CampoCompra nombre="f-hasta" etiqueta={recurso === 'obligaciones' ? 'Vencimiento hasta' : 'Fecha hasta'} tipo="date" requerido={false} value={borrador.hasta ?? ''} onChange={v => setBorrador(d => ({ ...d, hasta: v || undefined }))} />
      </form>
    </div>} />
    <div className={gestion.panelTabla}><EstadoCargaCompra cargando={cargando} error={error} onReintentar={() => setRevision(r => r + 1)} />{!cargando && !error && resultado && <>{resultado.items.length ? <TablaDatos apariencia="tarjetas" descripcion={cfg.titulo} columnas={columnas} datos={resultado.items} obtenerIdFila={f => f.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} /> : <div className={gestion.estadoVacio}><h2>{Object.values(criterios).some(Boolean) ? 'Sin coincidencias' : 'Sin registros'}</h2><p>{Object.values(criterios).some(Boolean) ? 'Prueba otro estado o rango de fechas.' : `Todavía no hay ${cfg.titulo.toLowerCase()} disponibles.`}</p></div>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular={cfg.singular} unidadPlural={cfg.titulo.toLowerCase()} onPaginaChange={setPagina} onTamanoPaginaChange={v => { setTamanoPagina(v); setPagina(1) }} /></>}</div>
  </section>
}
