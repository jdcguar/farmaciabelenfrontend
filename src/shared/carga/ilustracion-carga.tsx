import styles from './ilustracion-carga.module.css'

export function IlustracionCarga() {
  return (
    <svg
      className={styles.ilustracion}
      viewBox="0 0 180 190"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.bolsaAnimada}>
        <path
          className={styles.bolsa}
          d="M30 16h48a6 6 0 0 1 6 6v2h8a6 6 0 0 1 6 6v90a6 6 0 0 1-6 6H78l-8 12H42l-8-12H20a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6h4v-2a6 6 0 0 1 6-6Z"
        />
        <path
          className={styles.liquido}
          d="M28 76C42 76 70 76 84 76Q90 76 90 82L90 112Q90 118 84 118H28Q22 118 22 112V82Q22 76 28 76Z"
        />
        <path className={styles.contorno} d="M62 42h18m-18 22h18m-18 22h18m-18 22h18" />
      </g>
      <path
        className={styles.contorno}
        d="M56 138c0 16 10 24 26 24h18c16 0 28-12 28-28V32a14 14 0 0 1 28 0v48"
      />
      <path
        className={styles.gota}
        d="M156 90c-4 6-12 13-12 20a12 12 0 0 0 24 0c0-7-8-14-12-20Z"
      />
    </svg>
  )
}
