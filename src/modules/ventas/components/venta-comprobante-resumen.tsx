import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { dineroVenta } from '../venta-reglas'
import type { DetalleVenta } from '../venta.types'
import styles from '../venta.module.css'

export function VentaComprobanteResumen({venta,sucursal}:{venta:DetalleVenta;sucursal?:string}) {
  const fecha=venta.confirmadoEn?new Intl.DateTimeFormat('es-GT',{timeZone:'America/Guatemala',dateStyle:'medium',timeStyle:'short'}).format(new Date(venta.confirmadoEn)):'Sin registrar'
  return <article className={styles.comprobanteResumen} aria-label={`Comprobante ${venta.numero}`}>
    <header><strong>Farmacia Belén</strong><span>{venta.numero}</span></header>
    <dl className={styles.comprobanteDatos}>
      <div><dt>Cliente</dt><dd>{venta.clienteHistorico.nombre??'Cliente sin nombre registrado'}</dd></div>
      <div><dt>Fecha de cobro</dt><dd>{fecha}</dd></div>
      {sucursal&&<div><dt>Sucursal</dt><dd>{sucursal}</dd></div>}
    </dl>
    <div className={styles.comprobanteTabla}><table aria-label="Productos del comprobante"><thead><tr><th>Producto y presentación</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>{venta.lineas.map(l=><tr key={l.id}><td><strong>{l.historico.productoNombre??'Producto'}</strong><span>{l.historico.presentacionNombre??'Presentación'}</span><small>Precio unitario: {dineroVenta(l.precio)}</small></td><td>{mostrarCantidad(l.cantidad)}</td><td>{dineroVenta(l.total)}</td></tr>)}</tbody></table></div>
    <dl className={styles.comprobanteTotales}>{[
      ['Subtotal',venta.subtotal],['Impuestos',venta.impuesto],['Total GTQ',venta.total],['Efectivo recibido',venta.efectivoRecibido],['Cambio',venta.cambio],
    ].map(([nombre,valor])=><div key={nombre} data-total={nombre==='Total GTQ'}><dt>{nombre}</dt><dd>{valor===null?'Sin registrar':dineroVenta(valor!)}</dd></div>)}</dl>
    <p>Comprobante interno; no sustituye factura FEL.</p>
  </article>
}
