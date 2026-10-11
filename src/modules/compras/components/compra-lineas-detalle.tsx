import { useState } from 'react'
import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { DetalleCompra, LineaCompra } from '../compra.types'
import { cantidadTexto, dinero } from '../compra-reglas'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import styles from '../compra.module.css'
export function CompraLineasDetalle({ doc }: { doc: DetalleCompra }) {
  const [expandida, setExpandida] = useState<string | null>(null)
  const recepcion = doc.tipo === 'RECEPCION'
  const columnas: ColumnaTabla<LineaCompra>[] = [
    { id: 'presentacion', titulo: 'Presentación', obtenerValor: l => l.descripcion, celda: l => <div><strong>{l.descripcion}</strong><small><NombreReferencia referencia="unidades" id={l.unidadId} /></small></div> },
    { id: 'cantidad', titulo: recepcion ? 'Física / declarada' : 'Cantidad', obtenerValor: l => l.cantidad, celda: l => <div>{cantidadTexto(l.cantidad)}{recepcion && <small>Declarada: {cantidadTexto(l.cantidadDeclarada)}</small>}</div> },
    ...(recepcion ? [
      { id: 'lote', titulo: 'Lote / vencimiento', obtenerValor: (l: LineaCompra) => l.numeroLote, celda: (l: LineaCompra) => <div>{l.numeroLote ?? 'Sin lote'}<small>{l.fechaVencimiento ?? 'Sin vencimiento'}</small></div> },
      { id: 'decision', titulo: 'Decisión (unidad original)', obtenerValor: (l: LineaCompra) => l.aceptada, celda: (l: LineaCompra) => <div>Aceptada: {cantidadTexto(l.aceptada)}<small>Cuarentena: {cantidadTexto(l.cuarentena)}</small><small>Rechazada: {cantidadTexto(l.rechazada)}</small></div> },
    ] : doc.tipo !== 'SOLICITUD' ? [
      { id: 'precio', titulo: 'Neto / impuesto', obtenerValor: (l: LineaCompra) => l.precio, celda: (l: LineaCompra) => <div>{dinero(l.precio)}<small>{cantidadTexto(l.tasaImpuesto)}%</small></div> },
      { id: 'total', titulo: 'Total', obtenerValor: (l: LineaCompra) => l.total, celda: (l: LineaCompra) => dinero(l.total) },
    ] : []),
    ...(doc.tipo === 'ORDEN' ? [{ id: 'pendiente', titulo: 'Pendiente (base)', obtenerValor: (l: LineaCompra) => doc.pendientes?.find(p => p.lineaId === l.id)?.pendienteBase, celda: (l: LineaCompra) => cantidadTexto(doc.pendientes?.find(p => p.lineaId === l.id)?.pendienteBase ?? '0') }] : []),
    { id: 'detalle', titulo: 'Detalle', obtenerValor: l => l.id, celda: l => <button type="button" className={styles.enlace} aria-expanded={expandida === l.id} onClick={() => setExpandida(p => p === l.id ? null : l.id)}>{expandida === l.id ? 'Ocultar' : 'Ver trazabilidad'}</button> },
  ]
  return <article id="compra-lineas" className={gestion.tarjetaDetalle}><div className={styles.panel}><h2>Líneas del documento</h2>{doc.tipo === 'ORDEN' && <p className={styles.intro}>Los saldos base incluyen recepción confirmada aceptada y en cuarentena; inspecciones aún pendientes se validan al confirmar.</p>}</div>{doc.lineas.length ? <TablaDatos apariencia="tarjetas" descripcion="Líneas de compra" datos={doc.lineas} columnas={columnas} filtros={[]} ordenamiento={[]} obtenerIdFila={l => l.id} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} renderizarFilaExpandida={l => expandida === l.id ? <div className={styles.panel}><dl className={styles.datos}>
    <div><dt>Presentación pedida</dt><dd><NombreReferencia referencia="presentaciones" id={l.presentacionId} /></dd></div><div><dt>Identificador de línea origen</dt><dd>{l.origenLineaId ?? 'Sin origen'}</dd></div>
    <div><dt>Cantidad base y conversión histórica</dt><dd>{l.cantidadBase} · {l.factorNumerador}/{l.factorDenominador}</dd></div><div><dt>Vida útil mínima</dt><dd>{l.vidaUtilMinimaDias} días</dd></div>
    <div><dt>Lote / fabricación / vencimiento</dt><dd>{l.numeroLote ?? '—'} / {l.fechaFabricacion ?? '—'} / {l.fechaVencimiento ?? '—'}</dd></div><div><dt>Presentación observada</dt><dd>{l.presentacionObservadaId ? <NombreReferencia referencia="presentaciones" id={l.presentacionObservadaId} /> : 'Sin diferencia declarada'}</dd></div>
    <div><dt>Destino aceptado</dt><dd>{l.destinoUbicacionId ? <NombreReferencia referencia="ubicaciones" id={l.destinoUbicacionId} /> : '—'}</dd></div><div><dt>Destino cuarentena</dt><dd>{l.cuarentenaUbicacionId ? <NombreReferencia referencia="ubicaciones" id={l.cuarentenaUbicacionId} /> : '—'}</dd></div>
    <div><dt>Incidencia</dt><dd>{l.incidencia ?? 'Sin incidencia'}</dd></div><div><dt>Cancelada / autorizada / recibida (base)</dt><dd>{l.cancelada} / {doc.pendientes?.find(p => p.lineaId === l.id)?.autorizadaBase ?? '—'} / {doc.pendientes?.find(p => p.lineaId === l.id)?.recibidaBase ?? '—'}</dd></div>
  </dl></div> : null} /> : <p className={styles.vacío}>Este documento no contiene líneas.</p>}</article>
}
