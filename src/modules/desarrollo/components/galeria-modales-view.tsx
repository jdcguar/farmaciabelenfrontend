import { useEffect, useState } from 'react'
import {
  ModalEstado,
  type TipoModalEstado,
} from '../../../shared/components/modal-estado'
import { IlustracionCarga } from '../../../shared/carga/ilustracion-carga'
import { iniciarCargaGlobal } from '../../../shared/carga/estado-carga-global'
import { IconoAccion } from '../../../shared/components/icono-accion'
import styles from './galeria-modales-view.module.css'

type GaleriaModalesViewProps = {
  onVolver: () => void
}

type ConfiguracionModal = {
  etiqueta: string
  titulo: string
  descripcion: string
  mensaje: string
}

const configuraciones: Record<TipoModalEstado, ConfiguracionModal> = {
  exito: {
    etiqueta: 'Éxito',
    titulo: 'Operación completada',
    descripcion: 'La jeringa se llena y da paso al círculo y la marca de éxito.',
    mensaje: 'La información se guardó correctamente en el sistema.',
  },
  error: {
    etiqueta: 'Error',
    titulo: 'No fue posible continuar',
    descripcion: 'Comunica que una operación no pudo completarse.',
    mensaje: 'Revisa la información e inténtalo nuevamente.',
  },
  advertencia: {
    etiqueta: 'Advertencia',
    titulo: 'Confirma esta acción',
    descripcion: 'Solicita confirmación antes de una acción importante.',
    mensaje: 'Esta acción requiere tu confirmación antes de continuar.',
  },
  informacion: {
    etiqueta: 'Información',
    titulo: 'Información importante',
    descripcion: 'Presenta un aviso sin indicar un error.',
    mensaje: 'Aquí puedes comunicar información importante al usuario.',
  },
}

const tiposModal = Object.keys(configuraciones) as TipoModalEstado[]

export function GaleriaModalesView({ onVolver }: GaleriaModalesViewProps) {
  const [tipoActivo, setTipoActivo] = useState<TipoModalEstado | null>(null)
  const [cargando, setCargando] = useState(false)
  const [probandoLoader, setProbandoLoader] = useState(false)
  const configuracionActiva = configuraciones[tipoActivo ?? 'informacion']
  const esAdvertencia = tipoActivo === 'advertencia'

  useEffect(() => {
    if (!cargando) return
    const temporizador = window.setTimeout(() => setCargando(false), 3200)
    return () => window.clearTimeout(temporizador)
  }, [cargando])

  useEffect(() => {
    if (!probandoLoader) return

    const finalizarCarga = iniciarCargaGlobal()
    const temporizador = window.setTimeout(() => setProbandoLoader(false), 5000)

    return () => {
      window.clearTimeout(temporizador)
      finalizarCarga()
    }
  }, [probandoLoader])
  const cerrarModal = () => {
    setTipoActivo(null)
    setCargando(false)
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.contenedor} aria-labelledby="titulo-galeria-modales">
        <header className={styles.encabezado}>
          <div>
            <span className={styles.etiquetaEntorno}>Solo desarrollo</span>
            <h1 id="titulo-galeria-modales">Prueba de modales</h1>
            <p>
              Abre cada estado para revisar su icono, animación, texto y acciones.
              Cada apertura reproduce la animación desde el inicio.
            </p>
          </div>

          <button className={styles.botonVolver} type="button" onClick={onVolver}>
            Volver al sistema
          </button>
        </header>

        <div className={styles.avisoRuta} role="note">
          Esta pantalla solo está disponible con <code>npm run dev</code> en la ruta{' '}
          <code>/componentes/modales</code>.
        </div>

        <div className={styles.cuadricula}>
          <article className={`${styles.tarjeta} ${styles.informacion}`}>
            <span className={styles.muestraCarga}>
              <IlustracionCarga />
            </span>
            <h2>Loader del sistema</h2>
            <p>Bolsa de suero con una gota que cae mientras se procesa la solicitud.</p>
            <button type="button" onClick={() => setProbandoLoader(true)}>
              Probar loader
            </button>
          </article>
          {tiposModal.map((tipo) => {
            const configuracion = configuraciones[tipo]

            return (
              <article className={`${styles.tarjeta} ${styles[tipo]}`} key={tipo}>
                <span className={styles.indicador} aria-hidden="true" />
                <h2>{configuracion.etiqueta}</h2>
                <p>{configuracion.descripcion}</p>
                <button type="button" onClick={() => setTipoActivo(tipo)}>
                  Probar modal de {configuracion.etiqueta.toLowerCase()}
                </button>
                {tipo === 'exito' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCargando(true)
                      setTipoActivo('exito')
                    }}
                  >
                    Probar carga y éxito
                  </button>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <ModalEstado
        key={tipoActivo ?? 'modal-cerrado'}
        abierto={tipoActivo !== null}
        tipo={tipoActivo ?? 'informacion'}
        cargando={cargando}
        titulo={cargando ? 'Guardando información' : configuracionActiva.titulo}
        mensaje={cargando ? 'Espera mientras se completa la operación de prueba.' : configuracionActiva.mensaje}
        textoAccionPrincipal={cargando ? 'Procesando…' : esAdvertencia ? 'Confirmar' : 'Entendido'}
        onAccionPrincipal={cerrarModal}
        textoAccionSecundaria={esAdvertencia ? 'Cancelar' : undefined}
        iconoAccionSecundaria={esAdvertencia ? <IconoAccion nombre="cancelar" /> : undefined}
        onAccionSecundaria={esAdvertencia ? cerrarModal : undefined}
        onCerrar={cerrarModal}
      />
    </main>
  )
}
