import { InputCantidad } from '../../../shared/cantidades/input-cantidad'
import type { ContextoCantidad } from '../../../shared/cantidades/cantidad'
import type { ChangeEvent, ReactNode } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { estadosTraslado } from '../traslado.config'
import type { EstadoTraslado } from '../traslado.types'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import styles from '../traslado.module.css'
export function CampoTraslado({ nombre, etiqueta, error, ayuda, requerido = true, children, value, onChange, tipo = 'text', area, maxLength, disabled, inputMode, unidadCantidad }: {
  nombre: string; etiqueta: string; error?: string; ayuda?: string; requerido?: boolean; children?: ReactNode; value?: string; onChange?: (v: string) => void; tipo?: string; area?: boolean; maxLength?: number; disabled?: boolean; inputMode?: 'decimal' | 'numeric'; unidadCantidad?: ContextoCantidad
}) {
  const descripcion = error ?? ayuda
  const props = { id: nombre, name: nombre, value, onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value), required: requerido, disabled, maxLength, 'aria-invalid': !!error, 'aria-describedby': descripcion ? `${nombre}-ayuda` : undefined }
  return <div className={form.campo}><label htmlFor={nombre}>{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label>{children ?? (area ? <textarea {...props} rows={3} /> : unidadCantidad ? <InputCantidad {...props} contexto={unidadCantidad} onChange={onChange} /> : <input {...props} type={tipo} inputMode={inputMode ?? (tipo === 'text' && (nombre.includes('cantidad') || nombre.includes('aprobacion')) ? 'decimal' : undefined)} />)}{descripcion && <small id={`${nombre}-ayuda`} className={error ? form.errorCampo : form.ayudaCampo}>{descripcion}</small>}</div>
}
export function ErrorTraslado({ error }: { error: unknown }) {
  if (!error) return null
  return <div className={`${form.alertaError} ${styles.error}`} role="alert"><span aria-hidden="true">!</span><p>{error instanceof Error ? error.message : typeof error === 'string' ? error : 'No fue posible completar la operación.'}</p></div>
}
export function CargaTraslado({ cargando, error, onReintentar }: { cargando: boolean; error: unknown; onReintentar: () => void }) {
  if (cargando) return <div className={gestion.estadoVacio} role="status" aria-busy="true"><h2>Cargando traslados…</h2></div>
  if (!error) return null
  const titulo = error instanceof ErrorApi && error.estadoHttp === 403 ? 'Acceso no autorizado' : error instanceof ErrorApi && error.estadoHttp === 404 ? 'Traslado no encontrado' : 'No fue posible cargar la información'
  return <div className={gestion.estadoVacio}><h2>{titulo}</h2><ErrorTraslado error={error} /><button type="button" className={form.botonSecundario} onClick={onReintentar}>Reintentar</button></div>
}
export function EstadoTrasladoBadge({ estado }: { estado: EstadoTraslado }) { return <span className={styles.estado} data-estado={estado}>{estadosTraslado[estado]}</span> }
