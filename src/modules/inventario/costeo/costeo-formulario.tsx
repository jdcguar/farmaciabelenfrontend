import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado/modal-estado'
import { Selector } from '../../../shared/components/selector/selector'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { reposicionesParaSugerir, operarCosteo } from './costeo-api'
import { fechaCosteo, mostrarCosto, type FilaCosteo } from './costeo.config'
import estilos from './costeo.module.css'
import visual from './costeo-inventario.module.css'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'

export type AccionCosteo = 'valorar' | 'reposicion' | 'sugerir' | 'aprobar'
type Props = { accion: AccionCosteo; fila?: FilaCosteo; onCerrar: () => void; onCompletado: () => void; onCambiosPendientes: (v: boolean) => void }
export function CosteoFormulario({ accion, fila, onCerrar, onCompletado, onCambiosPendientes }: Props) {
  const [campos, setCampos] = useState<Record<string, string>>({ presentacionId: fila?.presentacionId ?? '', proveedorId: '', reposicionId: '', costoPresentacion: '', costeUnitarioBase: '', margen: '', tasaImpuesto: '', vigenteDesde: fechaCosteo(accion === 'sugerir' ? 1 : 0), vigenteHasta: accion === 'reposicion' ? fechaCosteo(30) : '', motivo: '', evidencia: '' })
  const [incluye, setIncluye] = useState(false), [sucio, setSucio] = useState(false), [enviando, setEnviando] = useState(false), [bloqueado, setBloqueado] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({}), [error, setError] = useState(''), [descartar, setDescartar] = useState(false)
  const [reposiciones, setReposiciones] = useState<FilaCosteo[]>([]), [errorReposicion, setErrorReposicion] = useState(''), [revision, setRevision] = useState(0)
  const solicitud = useRef({ contenido: '', clave: '' }), ocupado = useRef(false), contenedor = useRef<HTMLDivElement>(null)
  useEffect(() => { onCambiosPendientes(sucio); return () => onCambiosPendientes(false) }, [onCambiosPendientes, sucio])
  useEffect(() => {
    if (accion !== 'sugerir' || !campos.presentacionId) return
    const control = new AbortController()
    void reposicionesParaSugerir(campos.presentacionId, control.signal).then(r => {
      if (!control.signal.aborted) { setReposiciones(r.items); if (r.total > 200) setErrorReposicion('Hay más de 200 reposiciones; consulte Compras para acotar la presentación.') }
    }).catch((e: unknown) => { if (!control.signal.aborted) setErrorReposicion(e instanceof Error ? e.message : 'No fue posible consultar reposiciones.') })
    return () => control.abort()
  }, [accion, campos.presentacionId, revision])
  function cambiar(k: string, valor: string) {
    if (k === 'presentacionId') { setReposiciones([]); setErrorReposicion('') }
    setCampos(c => ({ ...c, [k]: valor, ...(k === 'presentacionId' ? { reposicionId: '' } : {}) })); setSucio(true); setErrores(e => ({ ...e, [k]: '' })); setError('')
  }
  const cerrar = () => { if (enviando) return; if (sucio) setDescartar(true); else onCerrar() }
  const campo = (k: string, titulo: string, tipo = 'text', ayuda?: string) => <label className={estilos.campo} htmlFor={'costeo-' + k}>{titulo}<input id={'costeo-' + k} type={tipo} value={campos[k] ?? ''} onChange={e => cambiar(k, e.target.value)} required={k !== 'vigenteHasta' || accion === 'reposicion'} maxLength={tipo === 'date' ? undefined : k === 'motivo' ? 250 : 1000} inputMode={['margen','tasaImpuesto','costeUnitarioBase','costoPresentacion'].includes(k) ? 'decimal' : undefined} aria-invalid={Boolean(errores[k])} aria-describedby={errores[k] ? 'error-' + k : ayuda ? 'ayuda-' + k : undefined} />{ayuda && <small id={'ayuda-' + k}>{ayuda}</small>}{errores[k] && <span className={estilos.error} id={'error-' + k}>{errores[k]}</span>}</label>
  const referencia = (k: 'presentacionId' | 'proveedorId', titulo: string) => <div className={estilos.campo}><label htmlFor={'costeo-' + k}>{titulo}</label><SelectorReferencia id={'costeo-' + k} referencia={k === 'presentacionId' ? 'presentaciones' : 'proveedores'} value={campos[k] ?? ''} onChange={v => cambiar(k,v)} requerido error={errores[k]} />{errores[k] && <span className={estilos.error}>{errores[k]}</span>}</div>
  async function enviar() {
    if (ocupado.current || bloqueado) return
    setError(''); setErrores({})
    const invalidos = contenedor.current?.querySelectorAll<HTMLInputElement>('input:invalid')
    if (invalidos?.length) { invalidos[0]?.reportValidity(); invalidos[0]?.focus(); return }
    const detalle: Record<string, unknown> = accion === 'valorar' ? { sucursalId: fila!.sucursalId, presentacionId: fila!.presentacionId, version: fila!.version, cantidadBaseEsperada: fila!.cantidadBase, costeUnitarioBase: campos.costeUnitarioBase.trim() }
      : accion === 'reposicion' ? { presentacionId: campos.presentacionId, proveedorId: campos.proveedorId, costoPresentacion: campos.costoPresentacion.trim(), vigenteDesde: campos.vigenteDesde, vigenteHasta: campos.vigenteHasta }
      : accion === 'sugerir' ? { presentacionId: campos.presentacionId, reposicionId: campos.reposicionId, margen: campos.margen.trim(), tasaImpuesto: campos.tasaImpuesto.trim(), incluyeImpuestos: incluye, vigenteDesde: campos.vigenteDesde, vigenteHasta: campos.vigenteHasta || null }
      : { version: fila!.version }
    detalle.motivo = campos.motivo.trim(); detalle.evidencia = campos.evidencia.trim()
    const contenido = JSON.stringify({ accion, id: fila?.id, detalle })
    if (solicitud.current.contenido !== contenido) solicitud.current = { contenido, clave: crypto.randomUUID() }
    detalle.claveIdempotencia = solicitud.current.clave
    ocupado.current = true; setEnviando(true)
    try { await operarCosteo(accion === 'valorar' ? 'valoracion' : accion === 'reposicion' ? 'reposiciones' : 'sugerencias', detalle, accion === 'aprobar' ? fila!.id : undefined); setSucio(false); onCompletado() }
    catch (e: unknown) {
      if (e instanceof ErrorApi) { setErrores(Object.fromEntries(e.detalles.map(d => [d.campo,d.mensaje]))); if (e.estadoHttp === 409) setBloqueado(true); setError(e.message) }
      else setError(e instanceof Error ? e.message : 'No fue posible completar la operación.')
      window.setTimeout(() => { const invalidado = contenedor.current?.querySelector<HTMLElement>('[aria-invalid="true"]'); (invalidado ?? contenedor.current)?.focus() }, 0)
    } finally { ocupado.current = false; setEnviando(false) }
  }
  let cuerpo: ReactNode
  if (accion === 'aprobar') cuerpo = <><p className={estilos.ayuda}>Se publicará este precio en el catálogo y se cerrará la vigencia anterior cuando corresponda. Ventas lo utilizará desde la fecha indicada.</p><dl className={estilos.resumen}>{[['Presentación',fila?.presentacion],['Costo promedio',mostrarCosto(fila?.costoPromedioPresentacion,true)],['Reposición',mostrarCosto(fila?.costoReposicion,true)],['Base comercial',mostrarCosto(fila?.baseComercial,true)],['Margen objetivo',String(fila?.margen)+'%'],['Precio neto',mostrarCosto(fila?.precioNeto,true)],['Precio de catálogo',mostrarCosto(fila?.precio,true)],['Incluye impuestos',fila?.incluyeImpuestos ? 'Sí' : 'No'],['Tasa',String(fila?.tasaImpuesto)+'%'],['Vigente desde',fila?.vigenteDesde],['Precio anterior',mostrarCosto(fila?.precioAnterior,true)]].map(([k,v]) => <div key={String(k)}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></>
  else if (accion === 'valorar') cuerpo = <><p className={estilos.ayuda}>Establece el costo documentado del stock actual pendiente. Conserva las ventas anteriores como pendientes y no modifica unidades físicas.</p><dl className={`${estilos.resumen} ${visual.detalle}`}><div><dt>Presentación</dt><dd>{fila?.presentacion}</dd></div><div><dt>Sucursal</dt><dd>{fila?.sucursal}</dd></div><div><dt>Cantidad en unidades base</dt><dd>{mostrarCantidad(fila?.cantidadBase)}</dd></div></dl>{campo('costeUnitarioBase','Costo por unidad base (GTQ neto)','text','Hasta seis decimales; corresponde a la unidad base, no necesariamente a una caja completa.')}</>
  else cuerpo = <div className={estilos.filtros}>{referencia('presentacionId','Presentación')}{accion === 'reposicion' ? <>{referencia('proveedorId','Proveedor aprobado')}{campo('costoPresentacion','Costo neto de reposición por presentación (GTQ)','text','Comparable con el costo de adquisición registrado; documente las condiciones de compra.')}</> : <><div className={estilos.campo}><label htmlFor="costeo-reposicionId">Reposición documentada</label><Selector id="costeo-reposicionId" value={campos.reposicionId ?? ''} onValueChange={v => cambiar('reposicionId',v)} required aria-invalid={Boolean(errores.reposicionId)}><option value="">Seleccione una reposición</option>{reposiciones.map(r => <option key={r.id} value={r.id}>Q {r.costoPresentacion} · {r.proveedor} · hasta {r.vigenteHasta}</option>)}</Selector>{errores.reposicionId && <span className={estilos.error}>{errores.reposicionId}</span>}{errorReposicion && <p className={estilos.error} role="alert">{errorReposicion}<button type="button" onClick={() => setRevision(v => v+1)}>Reintentar</button></p>}</div>{campo('margen','Margen bruto objetivo (%)','text','Mayor o igual a cero y menor que 100.')}{campo('tasaImpuesto','Tasa de impuesto (%)','text','Debe coincidir con la política de las sucursales donde se utilizará el precio.')}<label className={estilos.campo}><span id="costeo-etiqueta-impuestos">Impuestos en el catálogo</span><Selector id="costeo-incluyeImpuestos" aria-labelledby="costeo-etiqueta-impuestos" value={incluye ? 'si' : 'no'} onValueChange={v => { setIncluye(v === 'si'); setSucio(true) }}><option value="no">Precio sin impuestos</option><option value="si">Precio con impuestos incluidos</option></Selector></label></>}{campo('vigenteDesde','Vigente desde','date')}{campo('vigenteHasta',accion === 'reposicion' ? 'Vigente hasta' : 'Vigente hasta (opcional)','date')}</div>
  return <>
    <ModalEstado abierto tipo="informacion" apariencia="formulario" focoInicial="contenido" titulo={{ valorar:'Valorar stock pendiente', reposicion:'Registrar costo de reposición', sugerir:'Generar precio sugerido', aprobar:'Aplicar precio sugerido' }[accion]} mensaje={<div ref={contenedor} tabIndex={-1} className={`${formulario.formulario} ${accion === 'valorar' ? visual.formulario : ''}`}>{error && <p role="alert" className={estilos.error}>{error}</p>}{bloqueado && <p className={estilos.ayuda}>Cierre y actualice los datos antes de intentar otra operación.</p>}<fieldset disabled={enviando || bloqueado}><legend>Datos y evidencia</legend>{cuerpo}<div className={estilos.filtros}>{campo('motivo','Motivo')}{campo('evidencia','Referencia de evidencia')}</div></fieldset></div>} textoAccionPrincipal={bloqueado ? 'Actualizar datos' : accion === 'aprobar' ? 'Aplicar precio' : accion === 'sugerir' ? 'Calcular sugerencia' : 'Guardar'} onAccionPrincipal={bloqueado ? onCerrar : () => { void enviar() }} textoAccionSecundaria="Cancelar" onAccionSecundaria={cerrar} onCerrar={cerrar} cargando={enviando} />
    {descartar && <ModalEstado abierto tipo="advertencia" titulo="Descartar cambios" mensaje="Los datos sin guardar se perderán." textoAccionPrincipal="Continuar editando" onAccionPrincipal={() => setDescartar(false)} textoAccionSecundaria="Descartar" onAccionSecundaria={onCerrar} onCerrar={() => setDescartar(false)} />}
  </>
}
