import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { etiqueta, fechaActivo } from '../activo-reglas'
import type { DetalleAsignacion, DetalleDevolucion } from '../activo.types'
export function TablaActivosAsignados({ detalles }: { detalles: DetalleAsignacion[] }) {
  const columnas: ColumnaTabla<DetalleAsignacion>[] = [
    { id: 'codigo', titulo: 'Activo', obtenerValor: d => d.codigo, celda: d => <><strong>{d.codigo}</strong><p>{d.descripcion}</p><small>{d.tipoNombre} · {d.marca} · {d.modelo} · Serie: {d.numeroSerie ?? 'Sin serie'}</small></> },
    { id: 'entrega', titulo: 'Entrega', obtenerValor: d => d.condicionEntrega, celda: d => <>{etiqueta(d.condicionEntrega)}<p>{d.notasEntrega || 'Sin notas'}</p></> },
    { id: 'estado', titulo: 'Custodia', obtenerValor: d => d.estado, celda: d => etiqueta(d.estado) },
    { id: 'devolucion', titulo: 'Devolución', obtenerValor: d => d.devueltoEn, celda: d => d.estado === 'DEVUELTO' ? <>{fechaActivo(d.devueltoEn)}<p>{etiqueta(d.condicionDevolucion)}</p></> : 'Continúa asignado' },
  ]
  return <TablaDatos apariencia="tarjetas" descripcion="Activos incluidos en el acta y custodia actual" datos={detalles} columnas={columnas} obtenerIdFila={d => d.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} />
}
export function TablaActivosDevueltos({ detalles }: { detalles: DetalleDevolucion[] }) {
  const columnas: ColumnaTabla<DetalleDevolucion>[] = [
    { id: 'codigo', titulo: 'Activo solicitado', obtenerValor: d => d.activo.codigo, celda: d => <><strong>{d.activo.codigo}</strong><p>{d.activo.descripcion}</p><small>{d.activo.marca} · {d.activo.modelo} · Serie: {d.activo.numeroSerie ?? 'Sin serie'}</small></> },
    { id: 'motivo', titulo: 'Motivo del empleado', obtenerValor: d => d.motivo, celda: d => d.motivo },
    { id: 'entrega', titulo: 'Condición de entrega', obtenerValor: d => d.activo.condicionEntrega, celda: d => etiqueta(d.activo.condicionEntrega) },
    { id: 'recepcion', titulo: 'Recepción física', obtenerValor: d => d.condicionRecibida, celda: d => <>{d.condicionRecibida ? etiqueta(d.condicionRecibida) : 'Pendiente'}<p>{d.notasRecepcion || 'Sin notas'}</p></> },
  ]
  return <TablaDatos apariencia="tarjetas" descripcion="Activos incluidos en la solicitud de devolución" datos={detalles} columnas={columnas} obtenerIdFila={d => d.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} />
}
