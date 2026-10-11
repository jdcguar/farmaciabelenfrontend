import { useMemo } from 'react'
import { columnFilteringFeature, filterFn_includesString, functionalUpdate, rowSortingFeature, tableFeatures, useTable, type ColumnDef } from '@tanstack/react-table'
import type { TablaDatosProps } from '../tabla-datos/tabla-datos'
import { MenuFiltroColumna } from '../tabla-datos/menu-filtro-columna'
import { IconoAccion } from '../icono-accion'
import styles from './auditoria.module.css'

const funcionalidades = tableFeatures({ columnFilteringFeature, rowSortingFeature })

/** Usa los mismos filtros, columnas y callbacks de las tablas de auditoría; presenta cada evento como un registro independiente. */
export function ListaAuditoria<T extends object>({ descripcion, datos, columnas, filtros, ordenamiento, obtenerIdFila,
  onFiltrosChange, onOrdenamientoChange, renderizarFilaExpandida }: TablaDatosProps<T>) {
  const definiciones = useMemo<ColumnDef<typeof funcionalidades, T, unknown>[]>(() => columnas.map((columna) => ({
    id: columna.id, accessorFn: columna.obtenerValor, header: columna.titulo,
    enableColumnFilter: Boolean(columna.filtro), enableSorting: Boolean(columna.ordenable),
    filterFn: filterFn_includesString,
  })), [columnas])
  const tabla = useTable({
    features: funcionalidades, data: datos, columns: definiciones, getRowId: obtenerIdFila,
    manualFiltering: true, manualSorting: true, enableMultiSort: false, enableSortingRemoval: true,
    state: { columnFilters: filtros, sorting: ordenamiento },
    onColumnFiltersChange: (actualizador) => onFiltrosChange(functionalUpdate(actualizador, filtros)),
    onSortingChange: (actualizador) => onOrdenamientoChange(functionalUpdate(actualizador, ordenamiento).slice(0, 1)),
  })
  const columna = (id: string) => columnas.find((actual) => actual.id === id)

  return (
    <div className={styles.listaAuditoria} role="region" aria-label={descripcion}>
      {columnas.some(c => c.filtro || c.ordenable) && <div className={styles.barraFiltros}>
        <span>Filtrar y ordenar</span>
        <div className={styles.filtros}>
          {tabla.getHeaderGroups().flatMap((grupo) => grupo.headers.map((encabezado) => {
            const configuracion = columna(encabezado.column.id)
            if (!configuracion || (!configuracion.filtro && !configuracion.ordenable)) return null
            const direccion = encabezado.column.getIsSorted()
            return <div key={encabezado.id} data-ordenado={direccion !== false}>
              <MenuFiltroColumna apariencia="tarjetas" titulo={configuracion.titulo} filtro={configuracion.filtro}
                valorFiltro={encabezado.column.getFilterValue()} ordenable={Boolean(configuracion.ordenable)} direccionOrden={direccion}
                onCambiarFiltro={(valor) => encabezado.column.setFilterValue(valor)}
                onOrdenar={(orden) => { if (orden === false) encabezado.column.clearSorting(); else encabezado.column.toggleSorting(orden === 'desc', false) }} />
            </div>
          }))}
        </div>
      </div>}
      <ol className={styles.eventos}>
        {tabla.getRowModel().rows.map((fila) => {
          const evento = fila.original
          const operacion = String(columna('operacion')?.obtenerValor(evento) ?? '')
          const detalle = renderizarFilaExpandida?.(evento)
          return <li className={styles.evento} key={fila.id}>
            <div className={styles.momento}>
              <span className={styles.marcaTiempo} aria-hidden="true"><IconoAccion nombre="reloj" /></span>
              <div><span>Fecha y hora</span><time dateTime={String(columna('fecha')?.obtenerValor(evento) ?? '')}>{columna('fecha')?.celda(evento)}</time></div>
            </div>
            <article className={styles.registro} data-expandido={Boolean(detalle)}>
              <header className={styles.cabeceraEvento}>
                <div className={styles.identidadEvento}>
                  <div className={styles.accion} data-operacion={operacion}><IconoAccion nombre={operacion === 'CREAR' ? 'agregar' : operacion.includes('INACTIVAR') || operacion.includes('ELIMINAR') || operacion.includes('ESTADO') ? 'estado' : 'editar'} />{columna('operacion')?.celda(evento)}</div>
                  <h3>{columna('resumen')?.celda(evento)}</h3>
                </div>
                <div className={styles.cambios}>{columna('cambios')?.celda(evento)}</div>
              </header>
              <dl className={styles.datosEvento}>
                <div><dt>{columna('usuario')?.titulo}</dt><dd>{columna('usuario')?.celda(evento)}</dd></div>
                <div><dt>{columna('sucursal')?.titulo}</dt><dd>{columna('sucursal')?.celda(evento)}</dd></div>
              </dl>
              {detalle && <div className={styles.expandido}>{detalle}</div>}
            </article>
          </li>
        })}
      </ol>
    </div>
  )
}
