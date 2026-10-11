import { useEffect, useState } from 'react'
import { ErrorApi } from '../../shared/api/cliente-api'
export const mensajeError = (e: unknown) => e instanceof Error ? e.message : 'No fue posible completar la operación.'
export function erroresApi(e: unknown) { return e instanceof ErrorApi ? Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje])) : {} }
export function useConsultaActivo<T>(clave: string, solicitar: (signal: AbortSignal) => Promise<T>) {
  const [estado, setEstado] = useState<{ clave: string; dato?: T; error?: unknown }>({ clave: '' })
  useEffect(() => { const c = new AbortController(); void solicitar(c.signal).then(dato => { if (!c.signal.aborted) setEstado({ clave, dato }) }).catch((error: unknown) => { if (!c.signal.aborted) setEstado({ clave, error }) }); return () => c.abort() }, [clave, solicitar])
  return { cargando: estado.clave !== clave, dato: estado.clave === clave ? estado.dato : undefined, error: estado.clave === clave ? estado.error : undefined }
}
export function useCambiosActivo(pendientes: boolean, onCambios: (p: boolean) => void) { useEffect(() => { onCambios(pendientes) }, [pendientes, onCambios]); useEffect(() => () => onCambios(false), [onCambios]) }
