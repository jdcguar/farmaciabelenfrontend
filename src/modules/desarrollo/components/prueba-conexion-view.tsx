import { useEffect, useRef, useState } from 'react'
import { construirUrlApi } from '../../../shared/api/cliente-api'
import styles from './prueba-conexion-view.module.css'

type Resultado = {
  correcto: boolean
  mensaje: string
  http?: number
  duracion: number
  respuesta?: string
}

export function PruebaConexionView() {
  const [probando, setProbando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const solicitud = useRef<AbortController | null>(null)
  const endpoint = construirUrlApi('/api/health')

  useEffect(() => () => { solicitud.current?.abort() }, [])

  const probar = async () => {
    if (solicitud.current) return
    const controlador = new AbortController()
    solicitud.current = controlador
    setProbando(true)
    setResultado(null)
    const inicio = performance.now()
    let agotado = false
    const limite = window.setTimeout(() => {
      agotado = true
      controlador.abort()
    }, 10000)

    try {
      const respuesta = await fetch(endpoint, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controlador.signal,
      })
      const contenido: unknown = await respuesta.json()
      const valido = typeof contenido === 'object'
        && contenido !== null
        && 'success' in contenido
        && contenido.success === true
        && 'message' in contenido
        && typeof contenido.message === 'string'
      if (!controlador.signal.aborted) {
        setResultado({
          correcto: respuesta.ok && valido,
          mensaje: respuesta.ok && valido
            ? 'El frontend se conectó correctamente con el backend.'
            : 'El backend respondió, pero la comprobación no fue exitosa.',
          http: respuesta.status,
          duracion: Math.round(performance.now() - inicio),
          respuesta: JSON.stringify(contenido, null, 2),
        })
      }
    } catch {
      if (!controlador.signal.aborted || agotado) {
        setResultado({
          correcto: false,
          mensaje: agotado
            ? 'El backend no respondió en 10 segundos.'
            : 'No se pudo completar la prueba. Revisa que el backend esté iniciado, la URL configurada y los orígenes permitidos en CORS. El endpoint debe devolver JSON.',
          duracion: Math.round(performance.now() - inicio),
        })
      }
    } finally {
      window.clearTimeout(limite)
      solicitud.current = null
      if (!controlador.signal.aborted || agotado) setProbando(false)
    }
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.tarjeta}>
        <span className={styles.etiqueta}>Farmacia Belén · Diagnóstico</span>
        <h1>Prueba de conexión</h1>
        <p>Comprueba la comunicación entre el frontend y el backend sin iniciar sesión ni enviar credenciales.</p>
        <dl className={styles.detalles}>
          <div><dt>Método</dt><dd>GET</dd></div>
          <div><dt>Endpoint</dt><dd>{endpoint}</dd></div>
          <div><dt>Autenticación</dt><dd>Sin cookies, usuario ni contraseña</dd></div>
        </dl>
        <button type="button" className={styles.boton} disabled={probando} onClick={() => { void probar() }}>
          {probando ? 'Comprobando…' : 'Probar conexión'}
        </button>
        <div aria-live="polite" aria-busy={probando}>
          {probando && <p>Esperando respuesta del backend…</p>}
          {resultado && (
            <section className={resultado.correcto ? styles.exito : styles.error}>
              <h2>{resultado.correcto ? 'Conexión exitosa' : 'Prueba fallida'}</h2>
              <p>{resultado.mensaje}</p>
              <p>{resultado.http !== undefined && <>HTTP {resultado.http} · </>}Tiempo: {resultado.duracion} ms</p>
              {resultado.respuesta && <pre>{resultado.respuesta}</pre>}
            </section>
          )}
        </div>
        <p className={styles.nota}>Esta prueba verifica la respuesta de la API. La conexión a Oracle se comprueba por separado.</p>
        <a href="/">Volver al inicio</a>
      </section>
    </main>
  )
}