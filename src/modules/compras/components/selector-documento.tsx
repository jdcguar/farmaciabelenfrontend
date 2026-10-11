import { useEffect, useState } from 'react'
import { Selector } from '../../../shared/components/selector/selector'
import { listarCompras, obtenerCompra } from '../compra-api'
import { permisoCompra } from '../compra.config'
import type { DocumentoCompra, RecursoDocumento } from '../compra.types'
import { etiquetasEstado } from '../compra-reglas'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { ErrorCompra } from './compra-campo'
// Compras no ofrece búsqueda textual. Se cargan páginas reales sin enviar filtros inventados.
export function SelectorDocumento({ id, recurso, value, onChange, estados, error, requerido = true, origenId }: { id: string; recurso: RecursoDocumento; value: string; onChange: (v: string) => void; estados?: readonly string[]; error?: string; requerido?: boolean; origenId?: string }) {
  const { sesion } = useContextoCatalogo(), autorizado = sesion.permisos.includes(permisoCompra(recurso))
  const [items, setItems] = useState<DocumentoCompra[]>([]), [pagina, setPagina] = useState(1), [mas, setMas] = useState(false), [revision, setRevision] = useState(0)
  const [fallo, setFallo] = useState<unknown>(null), [finalizada, setFinalizada] = useState(''), [seleccion, setSeleccion] = useState<DocumentoCompra | null>(null)
  const clave = JSON.stringify({ recurso, pagina, revision, origenId }), cargando = autorizado && clave !== finalizada
  useEffect(() => {
    if (!autorizado) return
    const c = new AbortController()
    void listarCompras(recurso, { pagina, tamanoPagina: 50, origenId }, c.signal).then(r => { if (!c.signal.aborted) { setItems(prev => pagina === 1 ? r.items : [...prev, ...r.items.filter(x => !prev.some(p => p.id === x.id))]); setMas(pagina < r.totalPaginas); setFallo(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setFallo(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [autorizado, clave, origenId, pagina, recurso])
  useEffect(() => {
    if (!autorizado || !value) return
    const c = new AbortController(); void obtenerCompra(recurso, value, c.signal).then(r => { if (!c.signal.aborted) setSeleccion(r) }).catch(() => { if (!c.signal.aborted) setSeleccion(null) }); return () => c.abort()
  }, [autorizado, recurso, value])
  const opciones = value && seleccion?.id === value && !items.some(x => x.id === value) ? [seleccion, ...items] : items
  return <><Selector id={id} value={value} onValueChange={onChange} required={requerido} disabled={!autorizado} aria-invalid={Boolean(error)} aria-describedby={`${id}-ayuda`} busquedaRemota={{ cargando, hayMas: mas, onCargarMas: () => setPagina(p => p + 1), error: fallo instanceof Error ? fallo.message : fallo ? String(fallo) : null, onReintentar: () => setRevision(r => r + 1), sinCoincidencias: !opciones.length }}>
    <option value="">{requerido ? 'Selecciona un documento' : 'Todos los documentos'}</option>{opciones.map(d => <option value={d.id} key={d.id} disabled={Boolean(estados && !estados.includes(d.estado))}>{d.numero} · {d.proveedorNombre ?? d.motivo} · {etiquetasEstado[d.estado] ?? d.estado}</option>)}
  </Selector>{!autorizado && <ErrorCompra error={`Se requiere ${permisoCompra(recurso)} para consultar documentos de origen.`} />}{fallo != null && <ErrorCompra error={fallo} onReintentar={() => setRevision(r => r + 1)} />}</>
}
