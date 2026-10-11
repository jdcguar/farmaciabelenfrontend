import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../shared/api/cliente-api'
import { claveCaja } from './caja-reglas'
import { enfocarErrorCaja } from './caja-foco'
import type { ErroresCaja } from './caja.types'
export function useCargaCaja<T>(claveBase: string, obtener: (signal: AbortSignal) => Promise<T>) {
  const [documento, setDocumento] = useState<T | null>(null), [error, setError] = useState<unknown>(null), [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState('')
  const clave = `${claveBase}:${revision}`
  useEffect(() => { const c = new AbortController(); void obtener(c.signal).then(r => { if (!c.signal.aborted) { setDocumento(r); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort() }, [clave, obtener])
  return { documento: finalizada === clave ? documento : null, error: finalizada === clave ? error : null, cargando: finalizada !== clave, recargar: () => setRevision(v => v + 1) }
}
export function useEnvioCaja(onCambiosPendientes: (v: boolean) => void, sucio: boolean) {
  const [errores, setErrores] = useState<ErroresCaja>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [conflicto, setConflicto] = useState(false), [completado, setCompletado] = useState(false)
  const formulario = useRef<HTMLFormElement>(null), envio = useRef(false), idempotencia = useRef<{ contenido: string; clave: string } | null>(null)
  useEffect(() => { onCambiosPendientes((sucio || guardando) && !completado); return () => onCambiosPendientes(false) }, [onCambiosPendientes, sucio, guardando, completado])
  async function ejecutar<T>(fallos: ErroresCaja, datos: object, guardar: (clave: string) => Promise<T>, exito: (r: T) => void) {
    if (envio.current || conflicto || completado) return
    setErrores(fallos); setError(null)
    if (Object.keys(fallos).length) { setError('Revisa los campos señalados.'); enfocarErrorCaja(formulario.current); return }
    idempotencia.current = claveCaja(idempotencia.current, datos); envio.current = true; setGuardando(true)
    try { const r = await guardar(idempotencia.current.clave); setCompletado(true); onCambiosPendientes(false); exito(r) }
    catch (e: unknown) { setError(e); if (e instanceof ErrorApi) { if (e.codigo === 'CAJA_MODIFICADA' || e.codigo === 'CAJA_IDEMPOTENCIA_INCOMPATIBLE') setConflicto(true); setErrores(Object.fromEntries(e.detalles.map(d => [d.campo.replace(/^configuracion\./, ''), d.mensaje]))); enfocarErrorCaja(formulario.current) } }
    finally { envio.current = false; setGuardando(false) }
  }
  function limpiar() { setErrores({}); setError(null) }
  return { errores, error, guardando, conflicto, completado, formulario, ejecutar, limpiar }
}
