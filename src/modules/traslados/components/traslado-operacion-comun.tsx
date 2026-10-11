import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import type { ReactNode } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { CargaTraslado, ErrorTraslado } from './traslado-campo'
import type { useOperacionTraslado } from '../traslado-hooks'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import gestion from '../../empleados/components/empleado-gestion.module.css'
import base from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import catalogo from '../../catalogos-farmacia/catalogos.module.css'
import styles from '../traslado.module.css'

export function CargaOperacion({ cargando, error, recargar, volver }: { cargando: boolean; error: unknown; recargar: () => void; volver: () => void }) {
  return <section className={base.pagina}><button type="button" className={styles.enlace} onClick={volver}>← Volver</button><CargaTraslado cargando={cargando} error={error} onReintentar={recargar} /></section>
}
export function NoDisponible({ mensaje, volver }: { mensaje: string; volver: () => void }) { return <section className={base.pagina}><div className={base.estadoVacio}><h1>Operación no disponible</h1><p>{mensaje}</p><button type="button" className={form.botonSecundario} onClick={volver}>Volver al detalle</button></div></section> }
type Seccion = { id: string; titulo: string }
export function FormularioOperacion({ titulo, resumen, secciones, children, operacion, onGuardar, volver, textoGuardar, recargar }: {
  titulo: string; resumen: ReactNode; secciones: Seccion[]; children: ReactNode; operacion: ReturnType<typeof useOperacionTraslado>; onGuardar: () => void; volver: () => void; textoGuardar: string; recargar: () => void
}) {
  const { formulario, error, guardando, conflicto } = operacion
  return <section className={`${form.paginaFormulario} ${catalogo.pagina}`}><header className={empleado.encabezadoPagina}><h1>{titulo}</h1><span className={empleado.indicadorFormulario}>Traslados</span></header>
    <form onSubmitCapture={validarCantidadesAlEnviar} ref={formulario} className={form.formulario} noValidate aria-busy={guardando} onSubmit={e => { e.preventDefault(); onGuardar() }}><ErrorTraslado error={error} /><div className={`${empleado.formulario} ${catalogo.formularioProducto}`}>
      <fieldset className={empleado.panelPerfil}><legend>{titulo}</legend><div className={styles.identidad}><span aria-hidden="true"><IconoAccion nombre="enviar" /></span>{resumen}</div><NavegacionSecciones lateral className={empleado.navegacionFormulario} secciones={secciones} /></fieldset>
      <div className={catalogo.contenidoFormularioProducto}>{children}{conflicto && <p role="alert" className={styles.aviso}>Los datos requieren revisión. Actualiza el documento antes de reintentar; se descartará el borrador actual.</p>}</div>
      <div className={empleado.accionesFormulario}><p><span aria-hidden="true">*</span> Campos obligatorios</p><div><button type="button" className={form.botonSecundario} disabled={guardando} onClick={volver}>Cancelar</button>{conflicto ? <button type="button" className={form.botonPrincipal} onClick={recargar}>Actualizar documento</button> : <button type="submit" className={form.botonPrincipal} disabled={guardando}><IconoAccion nombre="guardar" />{guardando ? 'Guardando…' : textoGuardar}</button>}</div></div>
    </div></form>
  </section>
}
export function SeccionOperacion({ id, numero, titulo, descripcion, disabled, children }: { id: string; numero: string; titulo: string; descripcion?: string; disabled?: boolean; children: ReactNode }) { return <fieldset id={id} disabled={disabled}><legend><span className={empleado.numeroSeccion}>{numero}</span>{titulo}</legend>{descripcion && <p className={empleado.descripcionSeccion}>{descripcion}</p>}{children}</fieldset> }
export function DetalleOperacion({ titulo, identidad, estado, resumen, acciones, secciones, children, volver, recargar, exito }: { titulo: string; identidad: string; estado: ReactNode; resumen: ReactNode; acciones: ReactNode; secciones: Seccion[]; children: ReactNode; volver: () => void; recargar: () => void; exito: string }) {
  return <section className={`${gestion.pagina} ${catalogo.pagina}`}><header className={base.filaCabecera}><button type="button" className={styles.enlace} onClick={volver}>← Volver</button><button type="button" className={form.botonSecundario} onClick={recargar}>Actualizar datos</button></header>{exito && <p role="status" className={styles.aviso}>{exito}</p>}<div className={gestion.detalleLayout}>
    <header className={`${gestion.cabeceraDetalle} ${styles.resumenDetalle}`}><div className={gestion.perfilEmpleado}><div><p>{titulo}</p><h1>{identidad}</h1>{estado}</div></div><div className={gestion.resumenPerfil}>{resumen}</div><div className={gestion.accionesCabecera}>{acciones}</div></header>
    <div className={gestion.detalleContenido}><NavegacionSecciones className={gestion.navegacionDetalle} secciones={secciones} /><div className={gestion.encabezadoExpediente}><p>{titulo}</p><h2>Información y seguimiento</h2></div><div className={gestion.grillaDetalle}>{children}</div></div>
  </div></section>
}
export function TarjetaOperacion({ id, numero, titulo, children }: { id: string; numero: string; titulo: string; children: ReactNode }) { return <article id={id} className={`${gestion.tarjetaDetalle} ${styles.tarjetaCompleta}`}><h2><span className={gestion.numeroSeccion}>{numero}</span>{titulo}</h2>{children}</article> }
export function TablaControl({ datos }: { datos: [string, ReactNode][] }) { return <dl className={styles.controlOperacion}>{datos.map(([titulo, valor]) => <div key={titulo} className={gestion.datoCompleto}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl> }
