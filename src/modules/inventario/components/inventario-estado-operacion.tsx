import { etiqueta } from '../inventario.config'
import styles from '../../empleados/components/empleado-gestion.module.css'

export function EstadoOperacion({ valor }: { valor?: string }) {
  const tono = ['CONFIRMADO', 'LEVANTADO', 'RESUELTA', 'CONCILIADO'].includes(valor ?? '') ? styles.activo : ['ANULADO', 'ACTIVO', 'CANCELADO'].includes(valor ?? '') ? styles.retirado : valor === 'CERRADO' ? styles.inactivo : styles.suspendido
  return <span className={`${styles.estado} ${tono}`}>{valor ? etiqueta(valor) : 'Sin estado'}</span>
}
