import { etiqueta } from '../inventario.config'
import styles from '../../empleados/components/empleado-gestion.module.css'

export function EstadoReserva({ valor }: { valor?: string }) {
  const tono = ['ACTIVA', 'PREPARADA', 'CONSUMIDA'].includes(valor ?? '') ? styles.activo : valor === 'CANCELADA' ? styles.retirado : valor === 'EXPIRADA' ? styles.inactivo : styles.suspendido
  return <span className={`${styles.estado} ${tono}`}>{valor ? etiqueta(valor) : 'Sin estado'}</span>
}
