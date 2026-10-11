import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { LineaConteo, LineaMovimiento, RecursoInventario, RegistroInventario } from '../inventario.types'
import { textoCantidad } from '../inventario-reglas'
import { EstadoInventario, NombreInventario } from './inventario-datos'
import { CondicionExistencia } from './inventario-posicion-identidad'
import styles from '../inventario.module.css'
import local from './inventario-posiciones.module.css'

export function TablaSimple<T extends { id?: string; existenciaId?: string }>({ datos, columnas, apariencia }: { datos: T[]; columnas: ColumnaTabla<T>[]; apariencia?: 'empleados' }) {
  return <div className={apariencia ? local.tablaOperacion : styles.tabla}><TablaDatos apariencia="tarjetas" descripcion="Detalle de cantidades de inventario" datos={datos} columnas={columnas} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} obtenerIdFila={r => r.id ?? r.existenciaId ?? ''} />{!datos.length && <p>No hay líneas registradas.</p>}</div>
}
export function DetalleLineas({ recurso, registro, apariencia }: { recurso: RecursoInventario; registro: RegistroInventario; apariencia?: 'empleados' }) {
  if (recurso === 'conteos') {
    const datos = registro.lineas as LineaConteo[]
    return <TablaSimple apariencia={apariencia} datos={datos} columnas={[
      { id: 'posicion', titulo: 'Posición', obtenerValor: l => l.existenciaId, celda: l => <NombreInventario recurso="existencias" id={l.existenciaId} /> },
      ...(['esperadaBase', 'contadaBase', 'diferenciaBase'] as const).map(c => ({ id: c, titulo: c === 'esperadaBase' ? 'Esperada' : c === 'contadaBase' ? 'Contada' : 'Diferencia', obtenerValor: (l: LineaConteo) => l[c], celda: (l: LineaConteo) => textoCantidad(l[c]) })),
      { id: 'evidencia', titulo: 'Evidencia', obtenerValor: l => l.evidencia, celda: l => l.evidencia ?? 'Pendiente' },
    ]} />
  }
  return <TablaSimple apariencia={apariencia} datos={registro.lineas as LineaMovimiento[]} columnas={[
    { id: 'presentacion', titulo: 'Presentación', obtenerValor: l => l.presentacionId, celda: l => <NombreReferencia referencia="presentaciones" id={l.presentacionId} /> },
    { id: 'lote', titulo: 'Lote', obtenerValor: l => l.loteId, celda: l => <NombreInventario recurso="lotes" id={l.loteId} /> },
    { id: 'origen', titulo: 'Origen', obtenerValor: l => l.origenExistenciaId, celda: l => <NombreInventario recurso="existencias" id={l.origenExistenciaId} /> },
    { id: 'destino', titulo: 'Destino', obtenerValor: l => l.destinoUbicacionId, celda: l => l.destinoUbicacionId ? <NombreReferencia referencia="ubicaciones" id={l.destinoUbicacionId} /> : 'Sin destino' },
    { id: 'cantidad', titulo: 'Cantidad original', obtenerValor: l => l.cantidadOriginal, celda: l => <span>{textoCantidad(l.cantidadOriginal)} · <NombreReferencia referencia="unidades" id={l.unidadId} /></span> },
    { id: 'base', titulo: 'Cantidad base', obtenerValor: l => l.cantidadBase, celda: l => textoCantidad(l.cantidadBase) },
    { id: 'coste', titulo: 'Coste unitario base (GTQ)', obtenerValor: l => l.costeUnitarioBase, celda: l => l.costeUnitarioBase === null ? 'Pendiente' : textoCantidad(l.costeUnitarioBase) },
    { id: 'condicion', titulo: 'Condición destino', obtenerValor: l => l.condicionDestino, celda: l => apariencia ? <CondicionExistencia valor={l.condicionDestino} /> : <EstadoInventario valor={l.condicionDestino} /> },
  ]} />
}
