import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import type { DetalleVenta, LineaVenta } from '../venta.types'
import { dineroVenta, fechaHoraVenta } from '../venta-reglas'
import styles from '../venta.module.css'
export function ResumenOperacionVenta({venta}:{venta:DetalleVenta}){
  const columnas:ColumnaTabla<LineaVenta>[]=[
    {id:'producto',titulo:'Producto y presentación',obtenerValor:l=>l.historico.productoNombre,celda:l=><><strong>{l.historico.productoNombre}</strong><p>{l.historico.concentracion} · {l.historico.presentacionNombre}</p></>},
    {id:'cantidad',titulo:'Cantidad y total',obtenerValor:l=>l.cantidad,celda:l=><>{mostrarCantidad(l.cantidad)} · {mostrarCantidad(l.cantidadBase)} base<p>{dineroVenta(l.total)}</p></>},
    {id:'lotes',titulo:'Lotes y vigencia',obtenerValor:l=>l.id,celda:l=>{const xs=venta.asignaciones.filter(x=>x.lineaId===l.id&&['PREPARADA','CONSUMIDA'].includes(x.estado));return xs.length?xs.map(x=><p key={x.id}>{x.numeroLote??'Sin lote'} · {mostrarCantidad(x.cantidadBase)} base · Vence {x.fechaVencimiento??'Sin fecha'}{l.fraccionada&&<> · Apertura {fechaHoraVenta(x.aperturaEn)} · Uso hasta {fechaHoraVenta(x.venceFraccionEn)}</>}</p>):venta.contingenciaId?'Se incorporan los lotes físicos del folio al conciliar':'Se asignan al preparar'}},
    {id:'controles',titulo:'Controles',obtenerValor:l=>l.requiereReceta,celda:l=><>{l.esControlado?'Controlado · ':''}{l.fraccionada?'Fraccionada · ':''}{l.requiereReceta?`Receta ${venta.recetas.find(r=>r.id===l.recetaId)?.estado==='VALIDADA'?'validada':'pendiente de revisión'}`:'Venta libre'}</>},
  ]
  return<div className={styles.contenido}><p className={styles.aviso}>Coteja estos datos con el producto y la evidencia físicos. El servidor revalida las condiciones al registrar la operación.</p><TablaDatos apariencia="tarjetas" descripcion="Productos y lotes de la operación" columnas={columnas} datos={venta.lineas} obtenerIdFila={l=>l.id} filtros={[]} ordenamiento={[]} onFiltrosChange={()=>{}} onOrdenamientoChange={()=>{}}/></div>
}
