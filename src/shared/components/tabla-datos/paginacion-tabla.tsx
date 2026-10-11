import { Selector } from '../selector/selector'
import { useId } from 'react'
import styles from './tabla-datos.module.css'
import tarjetas from './tabla-tarjetas.module.css'

type PaginacionTablaProps = {
  apariencia?: 'clasica' | 'tarjetas'
  pagina: number
  tamanoPagina: number
  total: number
  totalPaginas: number
  unidadSingular: string
  unidadPlural: string
  onPaginaChange: (pagina: number) => void
  onTamanoPaginaChange: (tamano: number) => void
}

const tamanosPagina = [50, 100, 150, 200] as const

function paginasVisibles(actual: number, total: number): number[] {
  const paginas = new Set([1, total, actual - 1, actual, actual + 1])
  return [...paginas].filter((pagina) => pagina > 0 && pagina <= total).sort((a, b) => a - b)
}

export function PaginacionTabla({
  apariencia = 'clasica',
  pagina,
  tamanoPagina,
  total,
  totalPaginas,
  unidadSingular,
  unidadPlural,
  onPaginaChange,
  onTamanoPaginaChange,
}: PaginacionTablaProps) {
  const selectorId = useId()
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanoPagina + 1
  const fin = Math.min(pagina * tamanoPagina, total)
  const unidad = total === 1 ? unidadSingular : unidadPlural
  const paginas = paginasVisibles(pagina, totalPaginas)

  return (
    <nav className={`${styles.paginacion} ${apariencia === 'tarjetas' ? tarjetas.paginacion : ''}`} aria-label={`Paginación de ${unidadPlural}`}>
      <div className={styles.resumenPaginacion}>
        <span>{inicio}–{fin} de {total} {unidad}</span>
        <label htmlFor={selectorId}>
          Filas por página
          <Selector compacto
            id={selectorId}
            value={tamanoPagina}
            onValueChange={(valor) => onTamanoPaginaChange(Number(valor))}
          >
            {tamanosPagina.map((tamano) => <option key={tamano} value={tamano}>{tamano}</option>)}
          </Selector>
        </label>
      </div>
      <div className={styles.controlesPagina}>
        <button type="button" disabled={pagina <= 1} onClick={() => onPaginaChange(pagina - 1)}>Anterior</button>
        {paginas.map((numero, indice) => (
          <span key={numero} className={styles.numeroPaginaGrupo}>
            {indice > 0 && numero - paginas[indice - 1]! > 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              className={numero === pagina ? styles.paginaActiva : undefined}
              aria-current={numero === pagina ? 'page' : undefined}
              aria-label={`Página ${numero}`}
              onClick={() => onPaginaChange(numero)}
            >
              {numero}
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={totalPaginas === 0 || pagina >= totalPaginas}
          onClick={() => onPaginaChange(pagina + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  )
}
