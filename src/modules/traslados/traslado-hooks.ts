import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../shared/api/cliente-api'
import { enfocarError } from './traslado-dom'
import type { ErroresTraslado } from './traslado.types'
export function useCargaTraslado<T>(id: string, obtener: (id: string, signal?: AbortSignal) => Promise<T>) {
  const [documento, setDocumento] = useState<T | null>(null), [error, setError] = useState<unknown>(null), [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState('')
  const clave = `${id}:${revision}`, cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void obtener(id, c.signal).then(r => { if (!c.signal.aborted) { setDocumento(r); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [id, clave, obtener])
  return { documento, cargando, error, recargar: () => setRevision(v => v + 1) }
}
export function useOperacionTraslado() {
  const [errores, setErrores] = useState<ErroresTraslado>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [conflicto, setConflicto] = useState(false)
  const formulario = useRef<HTMLFormElement>(null), envio = useRef(false)
  async function ejecutar<T>(fallos: ErroresTraslado, guardar: () => Promise<T>, completado: (r: T) => void, indices?: number[]) {
    if (envio.current || conflicto) return
    setErrores(fallos); setError(null)
    if (Object.keys(fallos).length) { setError('Revisa los campos señalados antes de continuar.'); enfocarError(formulario.current); return }
    envio.current = true; setGuardando(true)
    try { completado(await guardar()) }
    catch (e: unknown) {
      setError(e)
      if (e instanceof ErrorApi) {
        if (e.estadoHttp === 409 && e.codigo !== 'TRASLADO_CONTROL_REQUERIDO') setConflicto(true)
        const campos = Object.fromEntries(e.detalles.map(d => [indices ? d.campo.replace(/^lineas\.(\d+)\./, (_, i: string) => `lineas.${indices[Number(i)] ?? i}.`) : d.campo, d.mensaje]))
        if (e.codigo === 'TRASLADO_CONTROL_REQUERIDO') campos.controlCompensatorio = e.message
        setErrores(campos)
        enfocarError(formulario.current)
      }
    } finally { envio.current = false; setGuardando(false) }
  }
  return { errores, error, guardando, conflicto, formulario, ejecutar, limpiarErrores: () => { setErrores({}); setError(null) } }
}
export function useCambiosTraslado(sucio: boolean, onCambiosPendientes: (v: boolean) => void) { useEffect(() => { onCambiosPendientes(sucio); return () => onCambiosPendientes(false) }, [sucio, onCambiosPendientes]) }
