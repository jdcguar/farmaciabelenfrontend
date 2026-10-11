import { InputCantidad } from '../../../shared/cantidades/input-cantidad'
import type { ContextoCantidad } from '../../../shared/cantidades/cantidad'
import type { ReactNode } from 'react'
import { etiquetasEstado } from '../compra-reglas'
import { ErrorApi } from '../../../shared/api/cliente-api'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../compra.module.css'
export function CampoCompra({ nombre, etiqueta, value = '', onChange, error, ayuda, children, tipo = 'text', requerido = true, maxLength, min, max, disabled, area = false, unidadCantidad }: { nombre: string; etiqueta: string; value?: string; onChange?: (v: string) => void; error?: string; ayuda?: string; children?: ReactNode; tipo?: string; requerido?: boolean; maxLength?: number; min?: string; max?: string; disabled?: boolean; area?: boolean; unidadCantidad?: ContextoCantidad }) {
  const props = { id: nombre, value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value), required: requerido, maxLength, disabled, 'aria-invalid': Boolean(error), 'aria-describedby': `${nombre}-ayuda` }
  return <div className={`${form.campo} ${styles.campo}`}><label htmlFor={nombre}>{etiqueta}{requerido && <span aria-hidden="true"> *</span>}</label>
    {children ?? (area ? <textarea {...props} /> : unidadCantidad ? <InputCantidad {...props} contexto={unidadCantidad} onChange={onChange} /> : <input {...props} type={tipo} min={min} max={max} inputMode={tipo === 'text' && /cantidad|precio|Impuesto|presupuesto|costes|aceptada|cuarentena|rechazada|tipoCambio/.test(nombre) ? 'decimal' : undefined} />)}
    <small id={`${nombre}-ayuda`} className={error ? styles.errorCampo : form.ayudaCampo}>{error ?? ayuda}</small>
  </div>
}
export function ErrorCompra({ error, onReintentar }: { error: unknown; onReintentar?: () => void }) {
  if (!error) return null
  return <div className={styles.error} role="alert"><p>{error instanceof Error ? error.message : String(error)}</p>{error instanceof ErrorApi && <><small>Código: {error.codigo}</small>{error.detalles.length > 0 && <ul>{error.detalles.map((d, i) => <li key={i}>{d.campo}: {d.mensaje}</li>)}</ul>}</>}{onReintentar && <button type="button" className={styles.enlace} onClick={onReintentar}>Reintentar</button>}</div>
}
export function EstadoCargaCompra({ cargando, error, onReintentar }: { cargando: boolean; error?: unknown; onReintentar?: () => void }) { return cargando ? <p className={styles.aviso} role="status" aria-busy="true">Cargando información…</p> : <ErrorCompra error={error} onReintentar={onReintentar} /> }
export function EstadoCompra({ estado }: { estado: string }) { return <span className={styles.estado} data-estado={estado}>{etiquetasEstado[estado] ?? estado}</span> }
