import { InventarioControlDetalle } from './inventario-control-detalle'
import { useEffect, useState } from 'react'
import { obtenerInventario } from '../inventario-api'
import type { AccionInventario, RecursoInventario, RegistroInventario } from '../inventario.types'
import { InventarioAccionModal } from './inventario-accion-modal'
import { InventarioPosicionDetalle } from './inventario-posicion-detalle'
import { InventarioSeguimientoDetalle } from './inventario-seguimiento-detalle'
import { InventarioOperacionDetalle } from './inventario-operacion-detalle'

export function InventarioDetalleView({ recurso, id }: { recurso: RecursoInventario; id: string }) {
  const [registro, setRegistro] = useState<RegistroInventario | null>(null), [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0), [revisionAuditoria, setRevisionAuditoria] = useState(0), [finalizada, setFinalizada] = useState('')
  const [accion, setAccion] = useState<AccionInventario | null>(null)
  const clave = `${recurso}/${id}/${revision}`, cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void obtenerInventario(recurso, id, c.signal).then(r => { if (!c.signal.aborted) { setRegistro(r); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar el registro.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, id, recurso])
  const r = !cargando && !error ? registro : null
  if (recurso === 'lotes' || recurso === 'existencias') return <InventarioPosicionDetalle recurso={recurso} registro={r} cargando={cargando} error={error} revisionAuditoria={revisionAuditoria} onRecargar={() => { setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} />
  if (recurso === 'kardex' || recurso === 'reservas') return <>
    <InventarioSeguimientoDetalle recurso={recurso} registro={r} cargando={cargando} error={error} revisionAuditoria={revisionAuditoria} onRecargar={() => { setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onAccion={setAccion} />
    {recurso === 'reservas' && r && accion && <InventarioAccionModal apariencia="empleados" key={`${accion}-${r.version}`} recurso={recurso} registro={r} accion={accion} onCerrar={() => setAccion(null)} onRecargar={() => { setAccion(null); setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onActualizado={nuevo => { setRegistro(nuevo); setRevisionAuditoria(v => v + 1) }} />}
  </>
  if (recurso === 'movimientos' || recurso === 'bloqueos') return <>
    <InventarioOperacionDetalle recurso={recurso} registro={r} cargando={cargando} error={error} revisionAuditoria={revisionAuditoria} onRecargar={() => { setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onAccion={setAccion} />
    {r && accion && <InventarioAccionModal apariencia="empleados" key={`${accion}-${r.version}`} recurso={recurso} registro={r} accion={accion} onCerrar={() => setAccion(null)} onRecargar={() => { setAccion(null); setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onActualizado={nuevo => { setRegistro(nuevo); setRevisionAuditoria(v => v + 1) }} />}
  </>
  return <>
    <InventarioControlDetalle recurso={recurso} registro={r} cargando={cargando} error={error} revisionAuditoria={revisionAuditoria} onRecargar={() => { setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onAccion={setAccion} />
    {r && accion && <InventarioAccionModal apariencia="empleados" key={`${accion}-${r.version}`} recurso={recurso} registro={r} accion={accion} onCerrar={() => setAccion(null)} onRecargar={() => { setAccion(null); setRevision(v => v + 1); setRevisionAuditoria(v => v + 1) }} onActualizado={nuevo => { setRegistro(nuevo); setRevisionAuditoria(v => v + 1) }} />}
  </>
}
