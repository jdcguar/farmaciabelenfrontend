import { createContext, useContext } from 'react'
import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import type { OpcionReferencia, Referencia } from './catalogo.types'
export type ContextoCatalogo = { sesion: SesionUsuario; resolver: (referencia: Referencia, id: string) => Promise<OpcionReferencia>; onNavegar: (ruta: string) => void }
export const ContextoReferencias = createContext<ContextoCatalogo | null>(null)
export function useContextoCatalogo() {
  const contexto = useContext(ContextoReferencias)
  if (!contexto) throw new Error('Falta el contexto del catálogo.')
  return contexto
}
