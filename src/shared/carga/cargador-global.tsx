import { useSyncExternalStore } from 'react'
import { IlustracionCarga } from './ilustracion-carga'
import {
  obtenerEstadoCargaGlobal,
  suscribirCargaGlobal,
} from './estado-carga-global'
import styles from './cargador-global.module.css'

export function CargadorGlobal() {
  const estaCargando = useSyncExternalStore(
    suscribirCargaGlobal,
    obtenerEstadoCargaGlobal,
    obtenerEstadoCargaGlobal,
  )

  if (!estaCargando) return null

  return (
    <div
      className={styles.fondo}
      role="status"
      aria-live="polite"
      aria-label="Procesando solicitud"
    >
      <div className={styles.contenido}>
        <span className={styles.animacion} aria-hidden="true">
          <IlustracionCarga />
        </span>
      </div>
    </div>
  )
}
