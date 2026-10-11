import { InputCantidad } from '../../../shared/cantidades/input-cantidad'
import type { ContextoCantidad } from '../../../shared/cantidades/cantidad'
import { Selector } from '../../../shared/components/selector/selector'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import { SelectorReferencia } from './referencia-catalogo'
import { textoValor } from '../catalogo-reglas'
import type { CampoCatalogo, ValorFormulario } from '../catalogo.types'
import styles from '../catalogos.module.css'
type Props = { campo: CampoCatalogo; valor: ValorFormulario; error?: string; disabled?: boolean; onChange: (valor: ValorFormulario) => void; prefijo?: string; soloSucursalActual?: boolean; filtro?: boolean; unidadCantidad?: ContextoCantidad }
export function CatalogoCampo({ campo, valor, error, disabled, onChange, prefijo = '', soloSucursalActual, filtro, unidadCantidad }: Props) {
  const id = `${prefijo}${campo.clave}`
  const ayuda = error ?? campo.ayuda
  const aria = { 'aria-invalid': Boolean(error), 'aria-describedby': ayuda ? `${id}-ayuda` : undefined }
  return <div className={`${formulario.campo} ${campo.tipo === 'area' ? styles.campoCompleto : ''}`}>
    {campo.tipo === 'booleano' ? <label className={styles.booleano} htmlFor={id}><input id={id} type="checkbox" checked={valor === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} {...aria} /><span>{campo.etiqueta}</span></label> : <>
      <label htmlFor={id}>{campo.etiqueta}{campo.requerido && !filtro && <span aria-hidden="true"> *</span>}</label>
      {campo.tipo === 'referencia' && campo.referencia ? <SelectorReferencia id={id} referencia={campo.referencia} value={textoValor(valor)} onChange={onChange} disabled={disabled} requerido={campo.requerido && !filtro} error={error} descripcionId={aria['aria-describedby']} excluirEmpaque={campo.clave === 'unidadBaseId'} soloSucursalActual={soloSucursalActual} />
        : campo.tipo === 'opciones' ? <Selector id={id} value={textoValor(valor)} onValueChange={onChange} disabled={disabled} required={campo.requerido && !filtro} {...aria}>{(filtro || !campo.requerido) && <option value="">Todos</option>}{campo.opciones?.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}</Selector>
        : campo.tipo === 'area' ? <textarea id={id} rows={3} value={textoValor(valor)} maxLength={campo.maximo} disabled={disabled} onChange={(e) => onChange(e.target.value)} {...aria} />
        : unidadCantidad ? <InputCantidad id={id} contexto={unidadCantidad} value={textoValor(valor)} onChange={onChange} required={campo.requerido} disabled={disabled} {...aria} /> : <input id={id} type={campo.tipo === 'fecha' ? 'date' : campo.tipo === 'correo' ? 'email' : 'text'} value={textoValor(valor)} inputMode={campo.tipo === 'decimal' ? 'decimal' : campo.clave === 'dpi' ? 'numeric' : undefined} maxLength={campo.maximo} disabled={disabled} autoComplete="off" onChange={(e) => onChange(campo.clave === 'codigo' ? e.target.value.toUpperCase() : e.target.value)} {...aria} />}
    </>}
    {ayuda && <small id={`${id}-ayuda`} className={error ? styles.errorTexto : formulario.ayudaCampo} role={error ? 'alert' : undefined}>{ayuda}</small>}
  </div>
}
