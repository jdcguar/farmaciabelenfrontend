import type { ReactNode } from 'react'
import logotipoFarmaciaBelenBlanco from '../../../assets/marca/logotipo-blanco.png'
import styles from './inicio-sesion-view.module.css'

type EstructuraAutenticacionProps = {
  tituloId: string
  titulo: string
  descripcion: string
  children: ReactNode
  compacta?: boolean
}

export function EstructuraAutenticacion({
  tituloId,
  titulo,
  descripcion,
  children,
  compacta = false,
}: EstructuraAutenticacionProps) {
  return (
    <main className={styles.pagina}>
      <section
        className={`${styles.tarjeta} ${compacta ? styles.tarjetaCompacta : ''}`}
        aria-labelledby={tituloId}
      >
        <div className={styles.cabeceraTarjeta}>
          <div className={styles.marcaPrincipal}>
            <img src={logotipoFarmaciaBelenBlanco} alt="Farmacia Belén" />
          </div>
        </div>

        <div className={styles.contenidoTarjeta}>
          <div className={styles.marcaFormulario} aria-label="Farmacia Belén">
            <span className={styles.nombreMarca}>
              <strong>Bienvenido</strong>
            </span>
          </div>
          <header className={styles.encabezado}>
            <h1 id={tituloId}>{titulo}</h1>
            <p>{descripcion}</p>
          </header>

          {children}
        </div>
      </section>
    </main>
  )
}
