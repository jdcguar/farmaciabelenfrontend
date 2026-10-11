import { useEffect, useState } from 'react'
import { Selector } from '../../../shared/components/selector/selector'
import { opcionesActivo } from '../activo-api'
import { mensajeError } from '../activo-hooks'
import type { Activo, Referencia } from '../activo.types'
import { formulario, catalogos } from '../activo-estilos'
type Opcion = Referencia | Activo
export function SelectorActivo<T extends Opcion>({ recurso, id, etiqueta, valor, onChange, sucursalId, seleccionado, error, disabled, requerido, excluidos = [] }: { recurso: 'sucursales' | 'tipos' | 'empleados' | 'disponibles'; id: string; etiqueta: string; valor: string; onChange: (id: string, opcion?: T) => void; sucursalId?: string; seleccionado?: T; error?: string; disabled?: boolean; requerido?: boolean; excluidos?: string[] }) {
  const [busqueda, setBusqueda] = useState(''), [entrada, setEntrada] = useState(''), [pagina, setPagina] = useState(1), [revision, setRevision] = useState(0)
  const [elegido, setElegido] = useState<T>()
  const [resultado, setResultado] = useState<{ clave: string; items: T[]; totalPaginas: number; pagina: number; error?: unknown }>({ clave: '', items: [], totalPaginas: 0, pagina: 0 })
  const bloqueado = disabled || (['empleados', 'disponibles'].includes(recurso) && !sucursalId)
  const clave = JSON.stringify({ recurso, sucursalId, busqueda, revision }), buscando = entrada.trim() !== busqueda, cargando = !bloqueado && (buscando || resultado.clave !== clave || resultado.pagina !== pagina)
  useEffect(() => { const t = window.setTimeout(() => { setBusqueda(entrada.trim()); setPagina(1) }, 350); return () => window.clearTimeout(t) }, [entrada])
  useEffect(() => {
    if (bloqueado) return
    const c = new AbortController()
    void opcionesActivo<T>(recurso, { pagina, tamanoPagina: 50, busqueda: busqueda || undefined, sucursalId: ['empleados', 'disponibles'].includes(recurso) ? sucursalId : undefined }, c.signal).then(r => { if (!c.signal.aborted) setResultado(anterior => ({ clave, pagina, totalPaginas: r.totalPaginas, items: pagina > 1 && anterior.clave === clave ? [...new Map([...anterior.items, ...r.items].map(i => [i.id, i])).values()] : r.items })) }).catch((e: unknown) => { if (!c.signal.aborted) setResultado(anterior => ({ clave, pagina, totalPaginas: anterior.clave === clave ? anterior.totalPaginas : 0, items: anterior.clave === clave ? anterior.items : [], error: e })) })
    return () => c.abort()
  }, [bloqueado, busqueda, clave, pagina, recurso, sucursalId])
  const items = bloqueado || buscando || resultado.clave !== clave ? [] : resultado.items
  const actual = seleccionado?.id === valor ? seleccionado : elegido?.id === valor ? elegido : undefined
  const opciones = actual && !items.some(i => i.id === valor) ? [actual, ...items] : items
  return <div className={formulario.campo}><label htmlFor={id}>{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label><Selector id={id} value={valor} disabled={bloqueado} required={requerido} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onValueChange={v => { const opcion = opciones.find(i => i.id === v); setElegido(opcion); onChange(v, opcion) }} busquedaRemota={{ onBuscar: v => { setEntrada(v); setPagina(1) }, cargando, hayMas: resultado.clave === clave && pagina < resultado.totalPaginas, onCargarMas: () => { if (!cargando) setPagina(p => p + 1) }, error: resultado.clave === clave && resultado.error ? mensajeError(resultado.error) : undefined, onReintentar: () => setRevision(r => r + 1) }}><option value="">{bloqueado && !sucursalId ? 'Selecciona primero la sucursal' : 'Selecciona una opción'}</option>{opciones.filter(i => !excluidos.includes(i.id) || i.id === valor).map(i => <option key={i.id} value={i.id}>{'codigo' in i && i.codigo || 'prefijo' in i && i.prefijo} · {'nombre' in i ? i.nombre : i.descripcion}</option>)}</Selector>{error && <small id={`${id}-error`} className={catalogos.errorTexto}>{error}</small>}</div>
}
