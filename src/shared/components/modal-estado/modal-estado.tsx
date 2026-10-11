import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './modal-estado.module.css'

export type TipoModalEstado = 'exito' | 'error' | 'advertencia' | 'informacion'

export type AnimacionLottie = {
  src: string
  loop?: boolean
  velocidad?: number
}

export type ModalEstadoProps = {
  abierto: boolean
  tipo: TipoModalEstado
  titulo: string
  mensaje: ReactNode
  textoAccionPrincipal?: string
  onAccionPrincipal?: () => void
  textoAccionSecundaria?: string
  onAccionSecundaria?: () => void
  iconoAccionPrincipal?: ReactNode
  iconoAccionSecundaria?: ReactNode
  varianteAccionPrincipal?: 'predeterminada' | 'peligro'
  onCerrar?: () => void
  cargando?: boolean
  animacion?: AnimacionLottie
  apariencia?: 'estado' | 'formulario'
  focoInicial?: 'principal' | 'contenido'
}

const etiquetasEstado: Record<TipoModalEstado, string> = {
  exito: 'Operación exitosa',
  error: 'Se produjo un error',
  advertencia: 'Advertencia',
  informacion: 'Información',
}

function usePrefiereMovimientoReducido() {
  const [prefiereMovimientoReducido, setPrefiereMovimientoReducido] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const actualizarPreferencia = () => setPrefiereMovimientoReducido(consulta.matches)

    consulta.addEventListener('change', actualizarPreferencia)
    return () => consulta.removeEventListener('change', actualizarPreferencia)
  }, [])

  return prefiereMovimientoReducido
}

function IlustracionInformacion() {
  const tapaId = useId()

  return (
    <div className={`${styles.ilustracion} ${styles.ilustracionInformacion}`} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <clipPath id={tapaId}>
            <rect x="38" y="32" width="44" height="10" rx="5" />
          </clipPath>
        </defs>
        <g className={styles.frascoInformacion}>
          <path
            className={styles.envaseInformacion}
            d="M44 48h32a14 14 0 0 1 14 14v40a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V62a14 14 0 0 1 14-14Z"
          />
          <rect className={styles.envaseInformacion} x="43" y="42" width="34" height="6" rx="2" />
          <rect className={styles.envaseInformacion} x="42" y="18" width="36" height="16" rx="5" />
          <rect className={styles.baseTapaInformacion} x="38" y="32" width="44" height="10" rx="5" />
          <g clipPath={`url(#${tapaId})`}>
            <rect className={styles.colorTapaInformacion} x="46" y="32" width="44" height="10" />
          </g>
          <rect className={styles.contornoTapaInformacion} x="38" y="32" width="44" height="10" rx="5" />
          <circle className={styles.etiquetaFrascoInformacion} cx="60" cy="76" r="20" />
          <g className={styles.signoAperturaInformacion}>
            <circle cx="60" cy="62" r="2.3" />
            <path className={styles.barraAperturaInformacion} d="M60 70v14" />
          </g>
        </g>
        <g transform="translate(95 98)">
          <g className={styles.capsulaInformacion}>
            <rect className={styles.baseCapsulaInformacion} x="-10" y="-18" width="20" height="36" rx="10" />
            <path className={styles.colorCapsulaInformacion} d="M-10 0v-8a10 10 0 0 1 20 0v8Z" />
            <rect className={styles.contornoCapsulaInformacion} x="-10" y="-18" width="20" height="36" rx="10" />
            <path className={styles.contornoCapsulaInformacion} d="M-10 0h20" />
          </g>
        </g>
        <g transform="translate(110 28)">
          <g className={styles.particulaInformacion}><path d="M-4 0h8M0-4v8" /></g>
        </g>
        <g transform="translate(16 100)">
          <g className={`${styles.particulaInformacion} ${styles.particulaInformacionDos}`}>
            <path d="M-3 0h6M0-3v6" />
          </g>
        </g>
      </svg>
    </div>
  )
}

function IlustracionExito({
  cargando,
  prefiereMovimientoReducido,
}: {
  cargando: boolean
  prefiereMovimientoReducido: boolean
}) {
  const liquidoId = useId()
  const [introduccionTerminada, setIntroduccionTerminada] = useState(false)

  useEffect(() => {
    // Breve entrada visual para los modales que se abren después de guardar.
    // La espera real depende exclusivamente de la propiedad cargando.
    const temporizador = window.setTimeout(() => setIntroduccionTerminada(true), 1100)
    return () => window.clearTimeout(temporizador)
  }, [])

  const mostrarCarga = cargando || (!introduccionTerminada && !prefiereMovimientoReducido)

  return (
    <div
      className={`${styles.ilustracion} ${styles.ilustracionExito} ${mostrarCarga ? styles.estadoCargando : styles.estadoExito}`}
      aria-hidden="true"
    >
      <svg className={styles.jeringa} viewBox="0 0 120 120">
        <defs>
          <clipPath id={liquidoId}>
            <path d="M46 36h28v42a8 8 0 0 1-8 8H54a8 8 0 0 1-8-8Z" />
          </clipPath>
        </defs>
        <g transform="rotate(45 60 60)">
          <g clipPath={`url(#${liquidoId})`}>
            <rect className={styles.liquidoJeringa} x="46" y="36" width="28" height="50" />
          </g>
          <path className={styles.cuerpoJeringa} d="M46 36h28v42a8 8 0 0 1-8 8H54a8 8 0 0 1-8-8Z" />
          <g className={styles.contornoJeringa}>
            <path d="M42 10h36M54 10v20m12-20v20M43 30h34" />
            <path d="M53 92h14m-7 0v22" />
          </g>
        </g>
      </svg>
      <svg className={styles.chequecito} viewBox="0 0 120 120">
        <circle
          className={styles.circuloExito}
          pathLength={1}
          cx="60"
          cy="60"
          r="44"
          transform="rotate(-90 60 60)"
        />
        <path className={styles.marcaExito} pathLength={1} d="m39 60 14 14 29-29" />
      </svg>
    </div>
  )
}

function IlustracionError() {
  const cruzId = useId()
  const recorteId = useId()

  return (
    <div className={`${styles.ilustracion} ${styles.ilustracionError}`} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <path
            id={cruzId}
            d="M48 16h24a4 4 0 0 1 4 4v24h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H76v24a4 4 0 0 1-4 4H48a4 4 0 0 1-4-4V76H20a4 4 0 0 1-4-4V48a4 4 0 0 1 4-4h24V20a4 4 0 0 1 4-4Z"
          />
          <clipPath id={recorteId}>
            <use href={`#${cruzId}`} />
          </clipPath>
        </defs>
        <g className={styles.cruzMedicaError}>
          <use className={styles.baseCruzError} href={`#${cruzId}`} />
          <g clipPath={`url(#${recorteId})`}>
            <use
              className={styles.rellenoCruzError}
              href={`#${cruzId}`}
              transform="translate(7 7)"
            />
          </g>
          <use className={styles.contornoCruzError} href={`#${cruzId}`} />
          <circle className={styles.insigniaError} cx="88" cy="84" r="18" />
          <g className={styles.marcaError}>
            <path className={styles.diagonalErrorUno} d="M82 78L94 90" />
            <path className={styles.diagonalErrorDos} d="M94 78L82 90" />
          </g>
        </g>
        <g transform="translate(10 16)">
          <g className={styles.particulaError}><path d="M-4 0h8M0-4v8" /></g>
        </g>
        <g transform="translate(110 18)">
          <g className={`${styles.particulaError} ${styles.particulaErrorDos}`}>
            <path d="M-3 0h6M0-3v6" />
          </g>
        </g>
        <g transform="translate(18 105)">
          <g className={`${styles.particulaError} ${styles.particulaErrorTres}`}>
            <path d="M-3 0h6M0-3v6" />
          </g>
        </g>
      </svg>
    </div>
  )
}

function IlustracionAdvertencia() {
  return (
    <div className={`${styles.ilustracion} ${styles.ilustracionAdvertencia}`} aria-hidden="true">
      <svg viewBox="0 0 150 120">
        <g className={styles.ambulancia}>
          <path
            className={styles.carroceriaAdvertencia}
            d="M30 37h74a4 4 0 0 1 4 4l9 25h19a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6Z"
          />
          <path className={styles.ventanaAdvertencia} d="M97 43h12l8 23H97a4 4 0 0 1-4-4V47a4 4 0 0 1 4-4Z" />
          <path className={styles.rellenoVentanaAdvertencia} d="M99 48h12l6 16H99Z" />
          <path className={styles.sirenaAdvertencia} d="M93 37v-7a7 7 0 0 1 14 0v7Z" />
          <g className={styles.destellosSirena}>
            <path d="M100 15v-4m-12 8-3-3m27 3 3-3M83 28h-4m38 0h4" />
          </g>
          <g className={styles.lineasVelocidad}>
            <path d="M20 74h13M16 82h17M12 90h21" />
          </g>
          {[54, 115].map((x) => (
            <g transform={`translate(${x} 98)`} key={x}>
              <g className={styles.ruedaAdvertencia}>
                <circle className={styles.neumaticoAdvertencia} r="10" />
                <circle className={styles.reflejoRuedaAdvertencia} r="7.5" pathLength={1} />
                <circle className={styles.ejeRuedaAdvertencia} r="2.6" />
              </g>
            </g>
          ))}
          <circle className={styles.avisoAdvertencia} cx="30" cy="49" r="20" />
          <g className={styles.exclamacionAdvertencia}>
            <path d="M30 39v13" />
            <circle cx="30" cy="59" r="1.5" />
          </g>
        </g>
        <g transform="translate(138 18)">
          <g className={styles.particulaAdvertencia}><path d="M-4 0h8M0-4v8" /></g>
        </g>
        <g transform="translate(19 110)">
          <g className={`${styles.particulaAdvertencia} ${styles.particulaAdvertenciaDos}`}>
            <path d="M-3 0h6M0-3v6" />
          </g>
        </g>
      </svg>
    </div>
  )
}

function IlustracionEstado({
  tipo,
  animacion,
  cargando,
}: {
  tipo: TipoModalEstado
  animacion?: AnimacionLottie
  cargando: boolean
}) {
  const prefiereMovimientoReducido = usePrefiereMovimientoReducido()

  if (animacion) {
    return (
      <div className={styles.animacionLottie} aria-hidden="true">
        <DotLottieReact
          src={animacion.src}
          autoplay={!prefiereMovimientoReducido}
          loop={!prefiereMovimientoReducido && Boolean(animacion.loop)}
          speed={animacion.velocidad ?? 1}
        />
      </div>
    )
  }

  if (tipo === 'exito') {
    return (
      <IlustracionExito
        cargando={cargando}
        prefiereMovimientoReducido={prefiereMovimientoReducido}
      />
    )
  }

  if (tipo === 'error') {
    return <IlustracionError />
  }

  if (tipo === 'advertencia') {
    return <IlustracionAdvertencia />
  }

  return <IlustracionInformacion />
}

function obtenerElementosEnfocables(contenedor: HTMLElement) {
  return Array.from(
    contenedor.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export function ModalEstado({
  abierto,
  tipo,
  titulo,
  mensaje,
  textoAccionPrincipal = 'Aceptar',
  onAccionPrincipal,
  textoAccionSecundaria,
  onAccionSecundaria,
  iconoAccionPrincipal,
  iconoAccionSecundaria,
  varianteAccionPrincipal = 'predeterminada',
  focoInicial = 'principal',
  onCerrar,
  cargando = false,
  animacion,
  apariencia = 'estado',
}: ModalEstadoProps) {
  const tituloId = useId()
  const mensajeId = useId()
  const dialogoRef = useRef<HTMLDivElement>(null)
  const botonPrincipalRef = useRef<HTMLButtonElement>(null)
  const onCerrarRef = useRef(onCerrar)
  const cargandoRef = useRef(cargando)

  useEffect(() => {
    onCerrarRef.current = onCerrar
    cargandoRef.current = cargando
  }, [cargando, onCerrar])

  useEffect(() => {
    if (!abierto) return

    const elementoAnterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (apariencia === 'formulario' || focoInicial === 'contenido') {
      dialogoRef.current?.focus()
    } else if (botonPrincipalRef.current && !botonPrincipalRef.current.disabled) {
      botonPrincipalRef.current.focus()
    } else {
      dialogoRef.current?.focus()
    }

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onCerrarRef.current && !cargandoRef.current) {
        event.preventDefault()
        onCerrarRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogoRef.current) return

      const enfocables = obtenerElementosEnfocables(dialogoRef.current)
      if (enfocables.length === 0) {
        event.preventDefault()
        dialogoRef.current.focus()
        return
      }

      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]

      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      elementoAnterior?.focus()
    }
  }, [abierto, apariencia, focoInicial])

  useEffect(() => {
    // Deshabilitar la acción durante una consulta puede llevar el foco al body.
    if (abierto && apariencia === 'formulario' && document.activeElement === document.body) {
      dialogoRef.current?.focus()
    }
  }, [abierto, apariencia, cargando])

  if (!abierto) return null

  const ejecutarAccionPrincipal = onAccionPrincipal ?? onCerrar
  const rol = tipo === 'error' || tipo === 'advertencia' ? 'alertdialog' : 'dialog'

  return createPortal(
    <div className={styles.fondo}>
      <div
        ref={dialogoRef}
        className={`${styles.modal} ${styles[tipo]} ${apariencia === 'formulario' ? styles.formulario : ''}`}
        role={rol}
        aria-modal="true"
        aria-busy={cargando}
        aria-labelledby={tituloId}
        aria-describedby={mensajeId}
        tabIndex={-1}
      >
        {onCerrar && (
          <button
            className={styles.cerrar}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar mensaje"
            disabled={cargando}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        )}

        {apariencia === 'estado' && <IlustracionEstado tipo={tipo} animacion={animacion} cargando={cargando} />}

        {apariencia === 'estado' && <span className={styles.etiqueta} aria-live="polite">
          {tipo === 'exito' && cargando ? 'Procesando operación' : etiquetasEstado[tipo]}
        </span>}
        <h2 id={tituloId}>{titulo}</h2>
        <div id={mensajeId} className={styles.mensaje}>{mensaje}</div>

        <div className={styles.acciones}>
          {textoAccionSecundaria && onAccionSecundaria && (
            <button
              className={styles.secundario}
              type="button"
              onClick={onAccionSecundaria}
              disabled={cargando}
            >
              {iconoAccionSecundaria}
              {textoAccionSecundaria}
            </button>
          )}

          {ejecutarAccionPrincipal && (
            <button
              ref={botonPrincipalRef}
              className={`${styles.principal} ${varianteAccionPrincipal === 'peligro' ? styles.principalPeligro : ''}`}
              type="button"
            onClick={ejecutarAccionPrincipal}
            disabled={cargando}
          >
              {iconoAccionPrincipal}
              <span>{textoAccionPrincipal}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
