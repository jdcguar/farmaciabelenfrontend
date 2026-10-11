import { useId } from 'react'
import type { ReactNode } from 'react'
import { IconoAccion } from '../icono-accion'
import styles from './auditoria.module.css'

type Detalle = { id: string; nombrePropiedad: string; etiquetaPropiedad: string | null; valorAnterior: string | null; valorNuevo: string | null }
type Props = { id: string; detalles: readonly Detalle[]; formatearValor: (valor: string | null) => ReactNode }

export function CambiosAuditoria({ id, detalles, formatearValor }: Props) {
  const tituloId = useId()
  return <section id={id} className={styles.detalle} aria-labelledby={tituloId}>
    <div className={styles.tituloCambios}><h4 id={tituloId}>Cambios registrados</h4><span>{detalles.length} {detalles.length === 1 ? 'campo' : 'campos'}</span></div>
    <div className={styles.listaCambios}>
      {detalles.map((detalle, indice) => <section className={styles.cambio} key={detalle.id}>
        <h5><span aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>{detalle.etiquetaPropiedad ?? detalle.nombrePropiedad}</h5>
        <div className={styles.comparacion}>
          <dl className={styles.anterior}><dt>Valor anterior</dt><dd>{formatearValor(detalle.valorAnterior)}</dd></dl>
          <span className={styles.flecha} aria-hidden="true"><IconoAccion nombre="flecha" /></span>
          <dl className={styles.nuevo}><dt>Valor nuevo</dt><dd>{formatearValor(detalle.valorNuevo)}</dd></dl>
        </div>
      </section>)}
    </div>
  </section>
}
