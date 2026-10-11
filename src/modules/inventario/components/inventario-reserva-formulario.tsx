import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import type { FormEvent } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { camposFormulario } from '../inventario-formulario'
import type { DatosFormulario } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { IconoPosicion } from './inventario-posicion-identidad'
import styles from '../../empleados/components/empleado-crear-view.module.css'
import local from './inventario-posiciones.module.css'

const secciones = [
  { id: 'reserva-identificacion', titulo: 'Identificación de la reserva', descripcion: 'Sucursal y documento que identifican el compromiso de stock.', campos: ['sucursalId', 'referencia'] },
  { id: 'reserva-cantidad', titulo: 'Presentación y cantidad', descripcion: 'Presentación, unidad y cantidad que deseas reservar.', campos: ['presentacionId', 'unidadId', 'cantidad'] },
  { id: 'reserva-vigencia', titulo: 'Vigencia de la reserva', descripcion: 'Define hasta cuándo se mantiene el compromiso de stock.', campos: ['expiraEn'] },
]
type Props = {
  datos: DatosFormulario; errores: Record<string, string>; error: string | null; guardando: boolean
  creado: { id: string } | null; regreso: string; onCambiar: (campo: string, valor: string) => void; onGuardar: (e: FormEvent) => Promise<void>
}
export function InventarioReservaFormulario({ datos, errores, error, guardando, creado, regreso, onCambiar, onGuardar }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const campos = camposFormulario('reservas', datos, corporativo)
  return <section aria-labelledby="titulo-formulario-reserva">
    <div className={styles.encabezadoPagina}><h1 id="titulo-formulario-reserva">Registrar reserva</h1><span className={styles.indicadorFormulario}>Nueva reserva</span></div>
    {error && <div className={styles.alertaError} role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.formulario} noValidate onSubmit={e => void onGuardar(e)} aria-busy={guardando}>
      <fieldset className={styles.panelPerfil} disabled={guardando || Boolean(creado)}>
        <legend>Resumen de la reserva</legend>
        <div className={styles.selectorFoto}><div className={`${styles.vistaPreviaFoto} ${local.perfilIcono}`}><IconoPosicion /></div><div className={styles.controlesFoto}><strong>{datos.referencia || 'Nueva reserva'}</strong><p>Compromiso de stock disponible y preparación por FEFO.</p></div></div>
        <nav className={styles.navegacionFormulario} aria-label="Secciones del formulario de reserva"><p>Completa el registro</p>{secciones.map((s, i) => <a href={`#${s.id}`} key={s.id} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}><span>{String(i + 1).padStart(2, '0')}</span><div>{s.titulo}<small>{s.descripcion}</small></div></a>)}</nav>
      </fieldset>
      {secciones.map((s, i) => <fieldset id={s.id} key={s.id} disabled={guardando || Boolean(creado)}>
        <legend><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</legend>
        <p className={styles.descripcionSeccion}>{s.descripcion}</p>
        <div className={s.campos.length === 3 ? styles.grillaTres : styles.grillaDos}>{s.campos.map(clave => <CampoInventario key={clave} apariencia="empleados" unidadCantidad={clave === 'cantidad' ? { unidadId: datos.unidadId } : undefined} campo={campos.find(c => c.clave === clave)!} value={datos[clave] ?? ''} onChange={v => onCambiar(clave, v)} error={errores[clave]} soloSucursalActual={!corporativo} disabled={guardando || Boolean(creado)} />)}</div>
        {s.id === 'reserva-vigencia' && <p className={styles.descripcionSeccion}>Al registrar se compromete stock disponible. Después podrás preparar la reserva por FEFO desde su detalle.</p>}
      </fieldset>)}
      <div className={styles.accionesFormulario}><p><span aria-hidden="true">*</span> Campos obligatorios</p><div>
        <button className={styles.botonSecundario} type="button" disabled={guardando} onClick={() => onNavegar(regreso)}><IconoAccion nombre="cancelar" className={styles.iconoBoton} /><span>Cancelar</span></button>
        <button className={styles.botonPrincipal} type="submit" disabled={guardando || Boolean(creado)}><IconoAccion nombre="guardar" className={styles.iconoBoton} /><span>{guardando ? 'Registrando reserva…' : 'Registrar reserva'}</span></button>
      </div></div>
    </form>
    <ModalEstado abierto={Boolean(creado)} tipo="exito" titulo="Reserva registrada" mensaje={<><strong>{datos.referencia}</strong> fue registrada correctamente.</>} textoAccionPrincipal={regreso !== '/' ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={() => onNavegar(regreso !== '/' ? `${regreso}/${creado!.id}` : '/')} onCerrar={() => onNavegar(regreso)} />
  </section>
}
