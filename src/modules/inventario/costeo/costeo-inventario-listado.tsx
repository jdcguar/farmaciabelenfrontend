import type { ReactNode } from 'react'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { BotonExportar } from '../../../shared/components/boton-exportar'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { TablaDatos, PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { recursosCosteo, mostrarCosto, type FilaCosteo, type ResultadoCosteo } from './costeo.config'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from '../components/inventario-posiciones.module.css'
import costeo from './costeo-inventario.module.css'

type Props = {
  recurso: 'valoracion' | 'registros'
  filtros: Record<string, string>
  resultado: ResultadoCosteo | null
  cargando: boolean
  error: string
  errorExportacion: string
  exito: string
  columnas: ColumnaTabla<FilaCosteo>[]
  onPresentacion: (valor: string) => void
  onFiltros: () => void
  onLimpiar: () => void
  onActualizar: () => void
  onPagina: (pagina: number) => void
  onTamano: (tamano: number) => void
  onExportar: (formato: 'pdf' | 'xlsx') => Promise<void>
  children: ReactNode
}

export function CosteoInventarioListado({ recurso, filtros, resultado, cargando, error, errorExportacion, exito, columnas, onPresentacion, onFiltros, onLimpiar, onActualizar, onPagina, onTamano, onExportar, children }: Props) {
  const valoracion = recurso === 'valoracion'
  const config = recursosCosteo[recurso]
  const cantidadFiltros = Object.values(filtros).filter(Boolean).length
  const disponible = !cargando && !error
  const resumen = disponible ? resultado?.resumen : undefined
  const total = disponible ? resultado?.total : undefined
  const indicadores = [
    { nombre: 'Inventario físico', valor: resumen ? mostrarCosto(resumen.valorFisico, true) : '—', nota: 'Valor del stock físico del filtro.' },
    { nombre: 'Inventario en tránsito', valor: resumen ? mostrarCosto(resumen.valorTransito, true) : '—', nota: 'Se muestra separado del inventario físico.' },
    { nombre: 'Costos pendientes', valor: resumen ? String(resumen.registrosPendientes) : '—', nota: 'Registros que requieren costo documentado.' },
  ]
  return <section className={`${styles.pagina} ${costeo.pagina}`} aria-labelledby="costeo-titulo">
    <header className={styles.cabeceraPagina}>
      <div className={styles.filaCabeceraEmpleados}>
        <div className={styles.tituloPagina}><h1 id="costeo-titulo">{config.titulo}</h1></div>
        <div className={styles.accionesListado}><BotonExportar deshabilitado={cargando || Boolean(error) || !total} onExportar={onExportar} /></div>
      </div>
    </header>
    {valoracion && <div className={costeo.resumenValoracion} aria-busy={cargando}>
      <dl className={costeo.indicadores}>{indicadores.map(i => <div key={i.nombre} className={styles.tarjetaDetalle}><dt>{i.nombre}</dt><dd>{i.valor}</dd><dd className={costeo.notaIndicador}>{i.nota}</dd></div>)}</dl>
      <p className={costeo.nota}>Los totales corresponden a todos los registros del filtro. Un costo pendiente indica que falta documentación; no equivale a cero.</p>
    </div>}
    <div className={styles.herramientasListado}><div className={styles.barraBusqueda}>
      <div className={styles.busquedaGeneral}>
        <div className={local.consultaPresentacion}>
          <IconoAccion nombre="buscar" className={local.iconoConsulta} />
          <label htmlFor="costeo-consulta-presentacion">Buscar por presentación</label>
          <SelectorReferencia id="costeo-consulta-presentacion" referencia="presentaciones" value={filtros.presentacionId ?? ''} textoVacio="Buscar por presentación" descripcionId="costeo-ayuda-consulta" onChange={onPresentacion} />
        </div>
        <small id="costeo-ayuda-consulta">Busca y selecciona una presentación para consultar {valoracion ? 'su valoración' : 'sus registros monetarios'}.</small>
      </div>
      <div className={styles.filtrosRapidos} role="group" aria-label="Filtros del listado">
        <button type="button" aria-pressed={!cantidadFiltros} onClick={onLimpiar}>Todos</button>
        <button type="button" onClick={onFiltros}>Filtros{cantidadFiltros ? ` (${cantidadFiltros})` : ''}</button>
      </div>
      <div className={styles.resumenResultados} aria-live="polite"><strong>{total === undefined ? '—' : total.toLocaleString('es-GT')}</strong><span>{total === 1 ? 'registro' : 'registros'}</span></div>
    </div></div>
    {exito && <p className={costeo.nota} role="status">{exito}</p>}
    {errorExportacion && <div className={styles.alertaError} role="alert"><p>{errorExportacion}</p></div>}
    <div className={styles.panelTabla} aria-busy={cargando}>
      <div className={styles.resumenTabla}>
        <div className={styles.resumenContenido}><strong>{valoracion ? 'Valoración del inventario' : 'Registros del kardex monetario'}</strong><small>{config.descripcion} Cantidades en unidades base; importes en GTQ.</small></div>
        <div className={styles.accionesResumen}>
          <span>{disponible && resultado?.total ? `${(resultado.pagina - 1) * resultado.tamanoPagina + 1}–${Math.min(resultado.pagina * resultado.tamanoPagina, resultado.total)} de ${resultado.total}` : '—'}</span>
          {cantidadFiltros > 0 && <button type="button" onClick={onLimpiar}>Limpiar filtros ({cantidadFiltros})</button>}
          <button type="button" disabled={cargando} onClick={onActualizar}>Actualizar</button>
        </div>
      </div>
      {cargando ? <p className={local.estadoCarga} role="status">Cargando {valoracion ? 'valoración del inventario' : 'kardex monetario'}…</p>
        : error ? <div className={styles.estadoVacio} role="alert"><h2>No fue posible cargar los registros</h2><p>{error}</p><button type="button" onClick={onActualizar}>Reintentar</button></div>
          : resultado && (resultado.items.length ? <>
            <div className={local.tablaOperacion}><TablaDatos apariencia="tarjetas" descripcion={config.titulo} datos={resultado.items} columnas={columnas} filtros={[]} ordenamiento={[]} obtenerIdFila={r => r.id} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} /></div>
            <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="registro" unidadPlural="registros" onPaginaChange={onPagina} onTamanoPaginaChange={onTamano} />
          </> : <div className={styles.estadoVacio}>
            <span aria-hidden="true"><IconoAccion nombre="sin-registros" /></span>
            <h2>{cantidadFiltros ? 'Sin coincidencias' : valoracion ? 'No hay inventario para valorar' : 'No hay registros en el kardex monetario'}</h2>
            <p>{cantidadFiltros ? 'Prueba con otros filtros o limpia la consulta.' : valoracion ? 'El stock aparecerá al registrar existencias en la sucursal.' : 'Los registros aparecerán al documentar operaciones de costeo. El historial anterior conserva sus datos originales.'}</p>
            {cantidadFiltros > 0 && <button type="button" onClick={onLimpiar}>Limpiar filtros</button>}
          </div>)}
    </div>
    {children}
  </section>
}
