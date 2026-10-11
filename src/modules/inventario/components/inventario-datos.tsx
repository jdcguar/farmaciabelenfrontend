import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { obtenerInventario } from '../inventario-api'
import { etiqueta, vistas } from '../inventario.config'
import { fechaHora, textoCantidad } from '../inventario-reglas'
import type { RecursoInventario, RegistroInventario } from '../inventario.types'
import styles from '../inventario.module.css'

type Resolver = (recurso: RecursoInventario, id: string) => Promise<RegistroInventario>
const ContextoRegistro = createContext<Resolver | null>(null)
export function ReferenciasInventario({ children }: { children: ReactNode }) {
  const cache = useRef(new Map<string, Promise<RegistroInventario>>())
  const resolver = useMemo<Resolver>(() => (recurso, id) => {
    const clave = `${recurso}/${id}`
    if (!cache.current.has(clave)) {
      const p = obtenerInventario(recurso, id); cache.current.set(clave, p)
      void p.catch(() => cache.current.delete(clave))
    }
    return cache.current.get(clave)!
  }, [])
  return <ContextoRegistro.Provider value={resolver}>{children}</ContextoRegistro.Provider>
}
export function EstadoInventario({ valor }: { valor?: string | null }) {
  const tono = ['APTA', 'ACTIVO', 'CONFIRMADO', 'CONCILIADO', 'VIGENTE', 'RESUELTA'].includes(valor ?? '') ? 'exito' : ['BLOQUEADA', 'ANULADO', 'VENCIDO', 'CRITICO', 'CANCELADO', 'CANCELADA'].includes(valor ?? '') ? 'peligro' : 'advertencia'
  return <span className={styles.estado} data-tono={tono}>{valor ? etiqueta(valor) : 'Sin estado'}</span>
}
export function NombreInventario({ recurso, id }: { recurso: RecursoInventario; id: string | null | undefined }) {
  const resolver = useContext(ContextoRegistro)!
  const { sesion, onNavegar } = useContextoCatalogo()
  const [resultado, setResultado] = useState<RegistroInventario | null>(null)
  const [fallo, setFallo] = useState(false)
  const permitido = sesion.permisos.includes(`INVENTARIO.${vistas[recurso].grupo}.VER`)
  useEffect(() => {
    let vigente = true
    if (id && permitido) void resolver(recurso, id).then(r => { if (vigente) { setResultado(r); setFallo(false) } }).catch(() => { if (vigente) setFallo(true) })
    return () => { vigente = false }
  }, [id, permitido, recurso, resolver])
  if (!id) return <span>Sin asignación</span>
  if (!permitido || fallo) return <span className={styles.id}>{id}</span>
  const r = resultado?.id === id ? resultado : null
  if (!r) return <span>Cargando referencia…</span>
  return <span><button type="button" className={styles.enlace} onClick={() => onNavegar(`/inventario/${recurso}/${id}`)}>{r.numero ?? r.referencia ?? 'Ver existencia'}</button>
    {recurso === 'existencias' && <small> · {r.presentacionId && <NombreReferencia referencia="presentaciones" id={r.presentacionId} />} · {r.ubicacionId && <NombreReferencia referencia="ubicaciones" id={r.ubicacionId} />} · <NombreInventario recurso="lotes" id={r.loteId} /> · {r.condicion && etiqueta(r.condicion)}</small>}
  </span>
}


export function ValorInventario({ campo, registro }: { campo: string; registro: RegistroInventario }) {
  const valor = registro[campo as keyof RegistroInventario]
  if (campo === 'loteId' && !valor) return <span>Sin lote</span>
  if (campo === 'sucursalId' && valor === null && registro.alcance) return <span>Todas las sucursales</span>
  if (valor === null || valor === undefined || valor === '') return <span>Sin dato</span>
  if (campo === 'presentacionId') return <NombreReferencia referencia="presentaciones" id={String(valor)} />
  if (campo === 'sucursalId') return <NombreReferencia referencia="sucursales" id={String(valor)} />
  if (campo === 'ubicacionId') return <NombreReferencia referencia="ubicaciones" id={String(valor)} />
  if (campo === 'proveedorId') return <NombreReferencia referencia="proveedores" id={String(valor)} />
  if (campo === 'loteId') return <NombreInventario recurso="lotes" id={String(valor)} />
  if (campo === 'existenciaId') return <NombreInventario recurso="existencias" id={String(valor)} />
  if (campo === 'movimientoId' || campo === 'movimientoCorregidoId') return <NombreInventario recurso="movimientos" id={String(valor)} />
  if (campo === 'conteoId') return <NombreInventario recurso="conteos" id={String(valor)} />
  if (campo === 'objetivoId') return registro.alcance === 'LOTE' ? <NombreInventario recurso="lotes" id={String(valor)} /> : <NombreReferencia referencia={registro.alcance === 'UBICACION' ? 'ubicaciones' : 'productos'} id={String(valor)} />
  if (['estado', 'condicion', 'estadoEfectivo', 'estadoVencimiento'].includes(campo)) return <EstadoInventario valor={String(valor)} />
  if (campo.endsWith('Base')) return <span>{textoCantidad(String(valor))}</span>
  if (campo.endsWith('En') || campo === 'expiraEn') return <span>{fechaHora(String(valor))}</span>
  if (['tipo', 'clase', 'alcance', 'direccion'].includes(campo)) return <span>{etiqueta(String(valor))}</span>
  return <span>{String(valor)}</span>
}
export function MensajeCarga({ error, cargando, onReintentar }: { error: string | null; cargando: boolean; onReintentar: () => void }) {
  return cargando ? <p role="status" className={styles.seccion}>Cargando información…</p> : error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" className={styles.secundario} onClick={onReintentar}>Reintentar</button></div> : null
}


