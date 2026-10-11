import { etiqueta } from '../inventario.config'
import styles from '../../empleados/components/empleado-gestion.module.css'

export function EstadoVencimiento({ valor }: { valor?: string }) {
  const tono = valor === 'VIGENTE' ? styles.activo : ['VENCIDO', 'CRITICO'].includes(valor ?? '') ? styles.retirado : valor === 'DESCONOCIDO' ? styles.inactivo : styles.suspendido
  return <span className={`${styles.estado} ${tono}`}>{valor ? etiqueta(valor) : 'Sin alerta'}</span>
}
