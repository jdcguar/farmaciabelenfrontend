import type { ReactNode } from 'react'
import type { ColumnFiltersState } from '../tabla-datos'
import styles from './gestion-modulo.module.css'

type Props = {
  children?: ReactNode
  filtros: ColumnFiltersState
  opcionesEstado?: readonly { valor: string; etiqueta: string }[]
  onFiltrosChange: (filtros: ColumnFiltersState) => void
  total?: number
  unidadSingular: string
  unidadPlural: string
  acciones?: ReactNode
  accionesEstado?: ReactNode
  filtrosAdicionales?: ReactNode
  disposicion?: 'fila' | 'apilada' | 'estados' | 'estados-con-filtros'
  mostrarEstados?: boolean
}

const estadosBasicos = [
  { valor: 'ACTIVO', etiqueta: 'Activo' },
  { valor: 'INACTIVO', etiqueta: 'Inactivo' },
]

export function HerramientasListado({ children, filtros, opcionesEstado = estadosBasicos, onFiltrosChange, total, unidadSingular, unidadPlural, acciones, accionesEstado, filtrosAdicionales, disposicion = 'fila', mostrarEstados = true }: Props) {
  const valor = filtros.find((filtro) => filtro.id === 'estado')?.value
  const seleccionados = Array.isArray(valor) ? valor : []
  const seleccionar = (estado?: string) => {
    const restantes = filtros.filter((filtro) => filtro.id !== 'estado')
    onFiltrosChange(estado ? [...restantes, { id: 'estado', value: [estado] }] : restantes)
  }

  return (
    <div className={styles.herramientasListado}>
      <div className={`${styles.barraBusqueda} ${acciones ? styles.conAcciones : ''}`} data-disposicion={disposicion}>
        {acciones ? <div className={styles.busquedaConAcciones}>{children}{acciones}</div> : children}
        {mostrarEstados && <div className={styles.filtrosRapidos} role="group" aria-label="Filtrar por estado">
          <button type="button" aria-pressed={!seleccionados.length} onClick={() => seleccionar()}>Todos</button>
          {opcionesEstado.map((estado) => (
            <button key={estado.valor} type="button" aria-pressed={seleccionados.length === 1 && seleccionados[0] === estado.valor} onClick={() => seleccionar(estado.valor)}>
              <span className={styles.puntoEstado} data-estado={estado.valor} aria-hidden="true" />
              {estado.etiqueta}
            </button>
          ))}
        </div>}
        {filtrosAdicionales && <div className={styles.filtrosAdicionales}>{filtrosAdicionales}</div>}
        {accionesEstado && <div className={styles.accionesEstado}>{accionesEstado}</div>}
        <div className={styles.resumenResultados} aria-live="polite">
          <strong>{total === undefined ? '—' : total.toLocaleString('es-GT')}</strong>
          <span>{total === 1 ? unidadSingular : unidadPlural}</span>
        </div>
      </div>
    </div>
  )
}
