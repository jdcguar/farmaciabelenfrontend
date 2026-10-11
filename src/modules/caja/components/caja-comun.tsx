import type { ChangeEvent, ReactNode } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { cajaConfig } from '../caja.config'
import type { RecursoCaja } from '../caja.types'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import catalogo from '../../catalogos-farmacia/catalogos.module.css'
import styles from '../caja.module.css'
export function CampoCaja({ nombre, etiqueta, error, ayuda, requerido = true, children, value, onChange, tipo = 'text', area, maxLength, disabled, inputMode }: { nombre: string; etiqueta: string; error?: string; ayuda?: string; requerido?: boolean; children?: ReactNode; value?: string; onChange?: (v: string) => void; tipo?: string; area?: boolean; maxLength?: number; disabled?: boolean; inputMode?: 'decimal' | 'numeric' }) {
  const descripcion = error ?? ayuda, props = { id: nombre, name: nombre, value, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value), required: requerido, disabled, maxLength, 'aria-invalid': !!error, 'aria-describedby': descripcion ? `${nombre}-ayuda` : undefined }
  return <div className={form.campo}><label htmlFor={nombre}>{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label>{children ?? (area ? <textarea {...props} rows={3} /> : <input {...props} type={tipo} inputMode={inputMode} />)}{descripcion && <small id={`${nombre}-ayuda`} className={error ? form.errorCampo : form.ayudaCampo}>{descripcion}</small>}</div>
}
export function ErrorCaja({ error }: { error: unknown }) { return error ? <div className={form.alertaError} role="alert"><span aria-hidden="true">!</span><p>{error instanceof Error ? error.message : typeof error === 'string' ? error : 'No fue posible completar la operación.'}</p></div> : null }
export function CargaCaja({ cargando, error, onReintentar }: { cargando: boolean; error: unknown; onReintentar: () => void }) {
  if (cargando) return <div className={gestion.estadoVacio} role="status" aria-busy="true"><h2>Cargando información de Caja…</h2></div>
  return error ? <div className={gestion.estadoVacio}><h2>{error instanceof ErrorApi && error.estadoHttp === 403 ? 'Acceso no autorizado' : 'No fue posible cargar la información'}</h2><ErrorCaja error={error} /><button className={form.botonSecundario} type="button" onClick={onReintentar}>Reintentar</button></div> : null
}
export function EstadoCaja({ recurso, estado }: { recurso: RecursoCaja; estado: string }) { const etiquetas: Record<string, string> = cajaConfig[recurso].estados; return <span className={styles.estado} data-estado={estado}>{etiquetas[estado] ?? estado}</span> }
export function MarcoFormularioCaja({ titulo, sucursal, secciones, resumen, children, pie, error, formRef, guardando, onGuardar }: { titulo: string; sucursal: string; secciones: { id: string; titulo: string }[]; resumen: ReactNode; children: ReactNode; pie: ReactNode; error: unknown; formRef: React.RefObject<HTMLFormElement | null>; guardando: boolean; onGuardar: () => void }) {
  return <section className={`${form.paginaFormulario} ${catalogo.pagina}`}><header className={empleado.encabezadoPagina}><h1>{titulo}</h1><span className={empleado.indicadorFormulario}>Caja · {sucursal}</span></header><form ref={formRef} className={form.formulario} noValidate aria-busy={guardando} onSubmit={e => { e.preventDefault(); onGuardar() }}><ErrorCaja error={error} /><div className={`${empleado.formulario} ${catalogo.formularioProducto}`}><fieldset disabled={guardando} className={empleado.panelPerfil}><legend>{titulo}</legend><div className={styles.identidad}><span aria-hidden="true"><IconoAccion nombre="agregar" /></span>{resumen}</div><NavegacionSecciones lateral className={empleado.navegacionFormulario} secciones={secciones} /></fieldset><div className={catalogo.contenidoFormularioProducto}>{children}</div><div className={empleado.accionesFormulario}>{pie}</div></div></form></section>
}
