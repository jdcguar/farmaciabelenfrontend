import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import type { FormEvent } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { fechaHora, textoCantidad } from '../inventario-reglas'
import type { Fefo } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { NombreInventario } from './inventario-datos'
import { TablaSimple } from './inventario-lineas-detalle'
import styles from '../../empleados/components/empleado-gestion.module.css'
import formulario from '../../empleados/components/empleado-crear-view.module.css'
import local from './inventario-posiciones.module.css'

type Datos = { sucursalId: string; presentacionId: string; unidadId: string; cantidad: string; dias: string }
type Props = {
  datos: Datos; corporativo: boolean; cargando: boolean; error: string | null; errores: Record<string, string>
  resultado: Fefo | null; consultado: boolean; consulta: { sucursalId: string; presentacionId: string; vidaUtilMinimaDias: number } | null
  onCambiar: (campo: keyof Datos, valor: string) => void; onConsultar: (e: FormEvent) => void; onReintentar: () => void
}
export function InventarioFefoConsulta({ datos, corporativo, cargando, error, errores, resultado: r, consulta, consultado, onCambiar, onConsultar, onReintentar }: Props) {
  return <section className={styles.pagina} aria-labelledby="titulo-fefo">
    <header className={styles.cabeceraPagina}><div className={styles.filaCabeceraEmpleados}><div className={styles.tituloPagina}><h1 id="titulo-fefo">Selección FEFO</h1></div></div></header>
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.tarjetaDetalle} noValidate onSubmit={onConsultar} aria-busy={cargando}>
      <h2><span className={styles.numeroSeccion}>01</span>Consultar selección</h2><p className={formulario.descripcionSeccion}>Consulta las posiciones aptas que vencen primero para la cantidad requerida.</p>
      <div className={formulario.grillaDos}>
        <CampoInventario apariencia="empleados" campo={{ clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales', requerido: true }} value={datos.sucursalId} onChange={v => onCambiar('sucursalId', v)} soloSucursalActual={!corporativo} error={errores.sucursalId} disabled={cargando} />
        <CampoInventario apariencia="empleados" campo={{ clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones', requerido: true }} value={datos.presentacionId} onChange={v => onCambiar('presentacionId', v)} error={errores.presentacionId} disabled={cargando} />
        <CampoInventario apariencia="empleados" campo={{ clave: 'unidadId', etiqueta: 'Unidad de la cantidad', referencia: 'unidades', requerido: true }} value={datos.unidadId} onChange={v => onCambiar('unidadId', v)} error={errores.unidadId} disabled={cargando} />
        <CampoInventario apariencia="empleados" campo={{ clave: 'cantidad', etiqueta: 'Cantidad requerida', tipo: 'decimal', requerido: true, ayuda: 'El servidor convierte la cantidad a unidades base sin redondear.' }} unidadCantidad={{ unidadId: datos.unidadId }} value={datos.cantidad} onChange={v => onCambiar('cantidad', v)} error={errores.cantidad} disabled={cargando} />
        <CampoInventario apariencia="empleados" campo={{ clave: 'dias', etiqueta: 'Vida útil mínima (días)', tipo: 'entero', requerido: true, ayuda: 'Entre 0 y 36500 días.' }} value={datos.dias} onChange={v => onCambiar('dias', v)} error={errores.dias} disabled={cargando} />
      </div><div className={local.accionesConsulta}><p><span aria-hidden="true">*</span> Campos obligatorios</p><button type="submit" className={formulario.botonPrincipal} disabled={cargando}><IconoAccion nombre="buscar" className={formulario.iconoBoton} /><span>{cargando ? 'Consultando…' : 'Consultar selección FEFO'}</span></button></div>
    </form>
    {cargando && <p className={local.estadoCarga} role="status">Consultando selección FEFO…</p>}
    {!cargando && error && <div className={styles.alertaError} role="alert"><p>{error}</p>{consultado && !Object.keys(errores).length && <button type="button" onClick={onReintentar}>Reintentar consulta</button>}</div>}
    {!cargando && !error && r && consulta && <>
      <article className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>02</span>Resultado de la consulta</h2><dl><div><dt>Presentación</dt><dd><NombreReferencia referencia="presentaciones" id={consulta.presentacionId} /></dd></div><div><dt>Sucursal</dt><dd><NombreReferencia referencia="sucursales" id={consulta.sucursalId} /></dd></div><div><dt>Cantidad requerida en unidades base</dt><dd>{textoCantidad(r.cantidadBase)}</dd></div><div><dt>Vida útil mínima</dt><dd>{consulta.vidaUtilMinimaDias} días</dd></div><div className={styles.datoCompleto}><dt>Consultado el</dt><dd>{fechaHora(r.actualizadoEn)}</dd></div></dl></article>
      <div className={styles.alertaAdvertencia} role="status"><p>Esta consulta propone una selección por vencimiento. No reserva ni descuenta stock; la preparación de reservas vuelve a verificar la disponibilidad.</p></div>
      <article className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>03</span>Posiciones seleccionadas</h2><p className={formulario.descripcionSeccion}>Orden FEFO devuelto por el servidor. Cantidades en unidades base.</p>{r.seleccion.length ? <TablaSimple apariencia="empleados" datos={r.seleccion} columnas={[
        { id: 'orden', titulo: 'Orden FEFO', obtenerValor: p => r.seleccion.indexOf(p) + 1, celda: p => r.seleccion.indexOf(p) + 1 },
        { id: 'existencia', titulo: 'Existencia seleccionada', obtenerValor: p => p.existenciaId, celda: p => <NombreInventario recurso="existencias" id={p.existenciaId} /> },
        { id: 'cantidad', titulo: 'Cantidad base a tomar', obtenerValor: p => p.cantidadBase, celda: p => textoCantidad(p.cantidadBase) },
      ]} /> : <div className={styles.estadoVacio}><h3>Sin posiciones seleccionadas</h3><p>La consulta no devolvió posiciones para esta cantidad.</p></div>}</article>
    </>}
    {!consultado && !error && <div className={styles.estadoVacio}><span aria-hidden="true"><IconoAccion nombre="sin-registros" /></span><h2>Completa la consulta</h2><p>Selecciona sucursal, presentación, unidad y cantidad para ver la propuesta FEFO.</p></div>}
  </section>
}
