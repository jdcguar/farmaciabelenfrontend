import { etiqueta } from '../inventario.config'
import styles from '../../empleados/components/empleado-gestion.module.css'

export function IconoPosicion() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" /><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" /></svg>
}

export function CondicionExistencia({ valor }: { valor?: string }) {
  const tono = valor === 'APTA' ? styles.activo : valor === 'BLOQUEADA' ? styles.retirado : styles.suspendido
  return <span className={`${styles.estado} ${tono}`}>{valor ? etiqueta(valor) : 'Sin condición'}</span>
}
