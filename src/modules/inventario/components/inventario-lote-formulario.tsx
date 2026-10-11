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
  { id: 'lote-identificacion', titulo: 'Identificación del lote', descripcion: 'Presentación y número que identifican el lote.', campos: ['presentacionId', 'numero'] },
  { id: 'lote-fechas', titulo: 'Fechas del lote', descripcion: 'Ingreso, fabricación y vencimiento para el seguimiento del lote.', campos: ['fechaIngreso', 'fechaFabricacion', 'fechaVencimiento'] },
  { id: 'lote-origen', titulo: 'Origen y trazabilidad', descripcion: 'Proveedor y documento de origen del lote.', campos: ['proveedorId', 'referenciaOrigen'] },
]
type Props = {
  datos: DatosFormulario; errores: Record<string, string>; error: string | null; guardando: boolean
  creado: { id: string } | null; regreso: string; onCambiar: (campo: string, valor: string) => void; onGuardar: (e: FormEvent) => Promise<void>
}

export function InventarioLoteFormulario({ datos, errores, error, guardando, creado, regreso, onCambiar, onGuardar }: Props) {
  const { onNavegar } = useContextoCatalogo()
  const campos = camposFormulario('lotes', datos, false)
  return <section aria-labelledby="titulo-formulario-lote">
    <div className={styles.encabezadoPagina}><h1 id="titulo-formulario-lote">Registrar lote</h1><span className={styles.indicadorFormulario}>Nuevo lote</span></div>
    {error && <div className={styles.alertaError} role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.formulario} noValidate onSubmit={e => void onGuardar(e)} aria-busy={guardando}>
      <fieldset className={styles.panelPerfil} disabled={guardando || Boolean(creado)}>
        <legend>Resumen del lote</legend>
        <div className={styles.selectorFoto}><div className={`${styles.vistaPreviaFoto} ${local.perfilIcono}`}><IconoPosicion /></div><div className={styles.controlesFoto}><strong>{datos.numero || 'Nuevo lote'}</strong><p>Identificación, fechas y origen para el control del inventario.</p></div></div>
        <nav className={styles.navegacionFormulario} aria-label="Secciones del formulario de lote"><p>Completa el registro</p>{secciones.map((s, i) => <a href={`#${s.id}`} key={s.id} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}><span>{String(i + 1).padStart(2, '0')}</span><div>{s.titulo}<small>{s.descripcion}</small></div></a>)}</nav>
      </fieldset>
      {secciones.map((s, i) => <fieldset id={s.id} key={s.id} disabled={guardando || Boolean(creado)}>
        <legend><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</legend>
        <p className={styles.descripcionSeccion}>{s.descripcion}</p>
        <div className={s.campos.length === 3 ? styles.grillaTres : styles.grillaDos}>{s.campos.map(clave => {
          const campo = campos.find(c => c.clave === clave)!
          return <CampoInventario key={clave} apariencia="empleados" campo={campo} value={datos[clave] ?? ''} onChange={v => onCambiar(clave, v)} error={errores[clave]} disabled={guardando || Boolean(creado)} />
        })}</div>
      </fieldset>)}
      <div className={styles.accionesFormulario}><p><span aria-hidden="true">*</span> Campos obligatorios</p><div>
        <button className={styles.botonSecundario} type="button" disabled={guardando} onClick={() => onNavegar(regreso)}><IconoAccion nombre="cancelar" className={styles.iconoBoton} /><span>Cancelar</span></button>
        <button className={styles.botonPrincipal} type="submit" disabled={guardando || Boolean(creado)}><IconoAccion nombre="guardar" className={styles.iconoBoton} /><span>{guardando ? 'Registrando lote…' : 'Registrar lote'}</span></button>
      </div></div>
    </form>
    <ModalEstado abierto={Boolean(creado)} tipo="exito" titulo="Lote registrado" mensaje={<><strong>{datos.numero}</strong> fue registrado correctamente.</>} textoAccionPrincipal={regreso !== '/' ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={() => onNavegar(regreso !== '/' ? `${regreso}/${creado!.id}` : '/')} onCerrar={() => onNavegar(regreso)} />
  </section>
}
