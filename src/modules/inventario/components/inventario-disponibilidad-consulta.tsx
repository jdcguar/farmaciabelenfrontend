import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import type { FormEvent } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { Disponibilidad } from '../inventario.types'
import { fechaHora, textoCantidad } from '../inventario-reglas'
import { CampoInventario } from './inventario-campo'
import { NombreInventario } from './inventario-datos'
import { CondicionExistencia } from './inventario-posicion-identidad'
import { TablaSimple } from './inventario-lineas-detalle'
import styles from '../../empleados/components/empleado-gestion.module.css'
import formulario from '../../empleados/components/empleado-crear-view.module.css'
import local from './inventario-posiciones.module.css'
import consulta from './inventario-disponibilidad-consulta.module.css'

type Props = {
  datos: { sucursalId: string; presentacionId: string }; corporativo: boolean; cargando: boolean; error: string | null
  errores: Record<string, string>; resultado: Disponibilidad | null; consultado: boolean
  onCambiar: (campo: 'sucursalId' | 'presentacionId', valor: string) => void
  onConsultar: (e: FormEvent) => void; onReintentar: () => void
}
const cantidades = [
  ['existenciaFisica', 'Existencia física'], ['existenciaApta', 'Existencia apta'],
  ['reservada', 'Stock reservado'], ['reservaSobreStockApto', 'Reserva sobre stock apto'],
] as const
const restricciones = [
  ['cuarentena', 'En cuarentena'], ['restringida', 'Restringida'], ['vencida', 'Vencida'],
] as const
export function InventarioDisponibilidadConsulta({ datos, corporativo, cargando, error, errores, resultado: r, consultado, onCambiar, onConsultar, onReintentar }: Props) {
  return <section className={styles.pagina} aria-labelledby="titulo-disponibilidad">
    <header className={styles.cabeceraPagina}><div className={styles.filaCabeceraEmpleados}><div className={styles.tituloPagina}><h1 id="titulo-disponibilidad">Disponibilidad</h1></div></div></header>
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.tarjetaDetalle} noValidate onSubmit={onConsultar} aria-busy={cargando}>
      <h2><span className={styles.numeroSeccion}>01</span>Consultar stock</h2><p className={formulario.descripcionSeccion}>Selecciona una presentación y una sucursal para consultar sus cantidades en unidades base.</p>
      <div className={formulario.grillaDos}><CampoInventario apariencia="empleados" campo={{ clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales', requerido: true }} value={datos.sucursalId} onChange={v => onCambiar('sucursalId', v)} soloSucursalActual={!corporativo} error={errores.sucursalId} disabled={cargando} /><CampoInventario apariencia="empleados" campo={{ clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones', requerido: true }} value={datos.presentacionId} onChange={v => onCambiar('presentacionId', v)} error={errores.presentacionId} disabled={cargando} /></div>
      <div className={local.accionesConsulta}><p><span aria-hidden="true">*</span> Campos obligatorios</p><button type="submit" className={formulario.botonPrincipal} disabled={cargando}><IconoAccion nombre="buscar" className={formulario.iconoBoton} /><span>{cargando ? 'Consultando…' : 'Consultar disponibilidad'}</span></button></div>
    </form>
    {cargando && <p className={local.estadoCarga} role="status">Consultando disponibilidad…</p>}
    {!cargando && error && <div className={styles.alertaError} role="alert"><p>{error}</p>{consultado && !Object.keys(errores).length && <button type="button" onClick={onReintentar}>Reintentar consulta</button>}</div>}
    {!cargando && !error && r && <div className={consulta.resultado}>
      <article className={styles.tarjetaDetalle} aria-labelledby="titulo-resultado-stock">
        <h2 id="titulo-resultado-stock"><span className={styles.numeroSeccion}>02</span>Resultado de la consulta</h2>
        <div className={consulta.cabeceraResultado}>
          <div className={consulta.identidad}>
            <h3><NombreReferencia referencia="presentaciones" id={r.presentacionId} /></h3>
            <dl className={consulta.datosConsulta}>
              <div><dt>Sucursal consultada</dt><dd><NombreReferencia referencia="sucursales" id={r.sucursalId} /></dd></div>
              <div><dt>Consultado el</dt><dd><time dateTime={r.actualizadoEn}>{fechaHora(r.actualizadoEn)}</time></dd></div>
            </dl>
          </div>
          <div className={consulta.disponible}>
            <p>Stock disponible</p>
            <strong>{textoCantidad(r.disponible)}</strong>
            <span>Unidad base: <NombreReferencia referencia="unidades" id={r.unidadBaseId} /></span>
          </div>
        </div>
        <p className={consulta.ayudaResultado}>Cantidades expresadas en unidades base. Consultar no reserva ni descuenta stock.</p>
      </article>
      <div className={styles.grillaDetalle}>
        <article className={`${styles.tarjetaDetalle} ${consulta.metricas}`} aria-labelledby="titulo-existencias-stock">
          <h2 id="titulo-existencias-stock"><span className={styles.numeroSeccion}>03</span>Existencias y reservas</h2>
          <dl>{cantidades.map(([campo, nombre]) => <div key={campo}><dt>{nombre}</dt><dd>{textoCantidad(r[campo])}</dd></div>)}</dl>
        </article>
        <article className={`${styles.tarjetaDetalle} ${consulta.metricas}`} aria-labelledby="titulo-restricciones-stock">
          <h2 id="titulo-restricciones-stock"><span className={styles.numeroSeccion}>04</span>Restricciones de stock</h2>
          <dl>{restricciones.map(([campo, nombre]) => <div key={campo}><dt>{nombre}</dt><dd>{textoCantidad(r[campo])}</dd></div>)}</dl>
          <p className={consulta.ayudaRestricciones}>Estas categorías pueden coincidir. Sus cantidades no se suman para calcular la disponibilidad.</p>
        </article>
      </div>
      <article className={styles.tarjetaDetalle} id="stock-posiciones">
        <h2><span className={styles.numeroSeccion}>05</span>Posiciones y restricciones</h2>
        <p className={formulario.descripcionSeccion}>{r.posiciones.length} {r.posiciones.length === 1 ? 'posición' : 'posiciones'} · Cantidades en unidades base.</p>
        {r.posiciones.length ? <TablaSimple apariencia="empleados" datos={r.posiciones} columnas={[
          { id: 'ubicacion', titulo: 'Ubicación', obtenerValor: p => p.ubicacionId, celda: p => <NombreReferencia referencia="ubicaciones" id={p.ubicacionId!} /> },
          { id: 'lote', titulo: 'Lote', obtenerValor: p => p.loteId, celda: p => <NombreInventario recurso="lotes" id={p.loteId} /> },
          { id: 'condicion', titulo: 'Condición', obtenerValor: p => p.condicion, celda: p => <CondicionExistencia valor={p.condicion} /> },
          { id: 'cantidad', titulo: 'Existencia física', obtenerValor: p => p.cantidadBase, celda: p => textoCantidad(p.cantidadBase) },
          { id: 'libre', titulo: 'Libre para asignar', obtenerValor: p => p.libreAsignableBase, celda: p => textoCantidad(p.libreAsignableBase) },
          { id: 'restricciones', titulo: 'Restricciones', obtenerValor: p => p.restricciones, celda: p => p.restricciones.length ? p.restricciones.join(', ').replaceAll('_', ' ') : 'Sin restricciones' },
        ]} /> : <div className={styles.estadoVacio}><span aria-hidden="true"><IconoAccion nombre="sin-registros" /></span><h3>Sin posiciones registradas</h3><p>Esta presentación no tiene existencias en la sucursal consultada.</p></div>}
      </article>
    </div>}
    {!consultado && !error && <div className={styles.estadoVacio}><span aria-hidden="true"><IconoAccion nombre="sin-registros" /></span><h2>Selecciona una presentación</h2><p>Completa la consulta para ver cantidades y posiciones de la sucursal.</p></div>}
  </section>
}
