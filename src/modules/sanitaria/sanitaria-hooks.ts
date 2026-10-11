import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../shared/api/cliente-api'
import { claveSanitaria } from './sanitaria-reglas'
import { enfocarErrorCaja } from '../caja/caja-foco'
export { useCargaCaja as useCargaSanitaria } from '../caja/caja-hooks'
export function useEnvioSanitaria(onCambiosPendientes: (v: boolean) => void, sucio: boolean) {
  const [errores, setErrores] = useState<Record<string, string>>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [conflicto, setConflicto] = useState(false), [completado, setCompletado] = useState(false)
  const formulario = useRef<HTMLFormElement>(null), envio = useRef(false), clave = useRef<{ contenido: string; clave: string } | null>(null)
  useEffect(() => { onCambiosPendientes((sucio || guardando) && !completado); return () => onCambiosPendientes(false) }, [onCambiosPendientes, sucio, guardando, completado])
  async function ejecutar(fallos: Record<string, string>, datos: object, guardar: (clave: string) => Promise<unknown>, exito: (r: unknown) => void) {
    if (envio.current || conflicto || completado) return
    setErrores(fallos); setError(null)
    if (Object.keys(fallos).length) { setError('Revisa los campos señalados.'); enfocarErrorCaja(formulario.current); return }
    clave.current = claveSanitaria(clave.current, datos); envio.current = true; setGuardando(true)
    try { const r = await guardar(clave.current.clave); setCompletado(true); onCambiosPendientes(false); exito(r) }
    catch (e) { setError(e); if (e instanceof ErrorApi) { setErrores(Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje]))); if (['SANITARIA_MODIFICADA', 'SANITARIA_IDEMPOTENCIA_INCOMPATIBLE', 'SANITARIA_LOTE_CAMBIO', 'SANITARIA_EVALUACION_DESACTUALIZADA', 'SANITARIA_BLOQUEO_CAMBIO', 'SANITARIA_SALDO_CAMBIO', 'SANITARIA_SALDO_INSUFICIENTE', 'SANITARIA_VERSION_REQUERIDA'].includes(e.codigo)) setConflicto(true); enfocarErrorCaja(formulario.current) } }
    finally { envio.current = false; setGuardando(false) }
  }
  return { formulario, errores, error, guardando, conflicto, completado, ejecutar, limpiar: () => { setError(null); setErrores({}) } }
}
