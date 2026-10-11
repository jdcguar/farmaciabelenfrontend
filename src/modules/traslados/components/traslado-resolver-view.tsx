import { useCallback, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { Selector } from '../../../shared/components/selector/selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { obtenerContextoIncidencia, obtenerTraslado, resolverIncidencia } from '../traslado-api'
import { errorRelacionado, puedeJustificar, puedeResolver, resolucionesIncidencia, tiposIncidencia, validarResolucion } from '../traslado-incidencias-reglas'
import { cantidadTexto } from '../traslado-reglas'
import { useCambiosTraslado, useCargaTraslado, useOperacionTraslado } from '../traslado-hooks'
import type { ContextoIncidencia, ResolucionIncidencia, ResolucionTraslado } from '../traslado.types'
import { CampoTraslado, CargaTraslado } from './traslado-campo'
import { CargaOperacion, FormularioOperacion, NoDisponible, SeccionOperacion, TablaControl } from './traslado-operacion-comun'
import { TrasladoSelectorRelacionado } from './traslado-selector-relacionado'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

type Props = { id: string; incidenciaId: string; justificar: boolean; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }
const cargarRelacionado = (id: string, signal?: AbortSignal) => id ? obtenerTraslado(id, signal) : Promise.resolve(null)
export function TrasladoResolverView(props: Props) {
  const obtener = useCallback((_clave: string, signal?: AbortSignal) => obtenerContextoIncidencia(props.id, props.incidenciaId, signal), [props.id, props.incidenciaId])
  const carga = useCargaTraslado(`${props.id}:${props.incidenciaId}`, obtener), volver = () => props.onNavegar(`/traslados/${props.id}`)
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  const c = carga.documento
  if (!(props.justificar ? puedeJustificar(c.traslado, c.incidencia, props.sesion) : puedeResolver(c.traslado, c.incidencia, props.sesion))) return <NoDisponible volver={volver} mensaje="Resolver requiere una incidencia abierta, permiso RESOLVER_INCIDENCIA y acceso al traslado. Justificar faltantes exige además alcance corporativo y un faltante asignado." />
  return <ResolverFormulario key={`${c.traslado.version}:${c.incidencia.id}:${c.incidencia.version}:${props.justificar}`} {...props} contexto={c} recargar={carga.recargar} />
}
function ResolverFormulario({ contexto, justificar, sesion, onNavegar, onCambiosPendientes, recargar }: Props & { contexto: ContextoIncidencia; recargar: () => void }) {
  const { traslado, incidencia, asignacion, despacho } = contexto
  const [datos, setDatos] = useState<ResolucionTraslado>({ version: incidencia.version, resolucion: justificar ? 'FALTANTE_JUSTIFICADO' : 'ACLARADA', motivo: '', evidencia: '', trasladoRelacionadoId: null, controlCompensatorio: null }), [confirmar, setConfirmar] = useState(false), [completada, setCompletada] = useState(false)
  const [inicial] = useState(() => JSON.stringify(datos)), operacion = useOperacionTraslado(), relacionada = useCargaTraslado(datos.trasladoRelacionadoId ?? '', cargarRelacionado)
  useCambiosTraslado(!completada && JSON.stringify(datos) !== inicial, onCambiosPendientes)
  const volver = () => onNavegar(`/traslados/${traslado.id}`), disabled = operacion.guardando || operacion.conflicto || completada
  const titulo = justificar ? 'Justificar faltante' : 'Resolver incidencia'
  const cambiar = (d: Partial<ResolucionTraslado>) => { setDatos(v => ({ ...v, ...d })); setConfirmar(false); operacion.limpiarErrores() }
  const fallos = () => validarResolucion(contexto, datos, sesion, relacionada.cargando || relacionada.error ? null : relacionada.documento)
  async function revisar() {
    await operacion.ejecutar(fallos(), () => Promise.resolve(), () => setConfirmar(true))
  }
  async function guardar() {
    await operacion.ejecutar(fallos(), () => resolverIncidencia(incidencia.id, { ...datos, motivo: datos.motivo.trim(), evidencia: datos.evidencia.trim(), controlCompensatorio: datos.controlCompensatorio?.trim() || null }), () => { setConfirmar(false); onCambiosPendientes(false); setCompletada(true) })
    // El control requerido es corregible; los demás conflictos exigen actualizar el contexto.
    setConfirmar(false)
  }
  const aviso = datos.resolucion === 'FALTANTE_JUSTIFICADO' ? `Se justificarán ${cantidadTexto(incidencia.cantidadBase)} unidades base pendientes bajo autorización corporativa. No se registrará una recepción física ni se repondrá stock.` : datos.resolucion === 'TRASLADO_RELACIONADO' ? 'Se guardará el vínculo con el traslado cerrado seleccionado. Relacionar no descuenta ni recibe automáticamente el saldo pendiente del traslado original.' : 'Se cerrará la investigación como aclarada. Esta resolución no cambia las cantidades en tránsito ni justifica un faltante.'
  const detalleRelacionado = relacionada.documento && !relacionada.cargando && !relacionada.error ? relacionada.documento : null
  const errorSeleccion = detalleRelacionado ? errorRelacionado(contexto, detalleRelacionado) : null
  return <><FormularioOperacion titulo={titulo} resumen={<><strong>{traslado.numero}</strong><p>{tiposIncidencia[incidencia.tipo]} · Abierta</p><p>{cantidadTexto(incidencia.cantidadBase)} en unidad base</p></>} secciones={[{ id: 'resolver-original', titulo: 'Incidencia original' }, { id: 'resolver-decision', titulo: 'Resolución' }, { id: 'resolver-evidencia', titulo: 'Evidencia y control' }]} operacion={operacion} onGuardar={() => void revisar()} volver={volver} textoGuardar={titulo} recargar={() => { onCambiosPendientes(false); recargar() }}>
    <SeccionOperacion id="resolver-original" numero="01" titulo="Incidencia original" descripcion="La descripción y evidencia originales se conservan." disabled={disabled}><TablaControl datos={[
      ['Descripción', incidencia.descripcion], ['Evidencia original', incidencia.evidencia], ['Cantidad observada en base', cantidadTexto(incidencia.cantidadBase)], ['Versión de incidencia', incidencia.version], ...(asignacion ? [['Producto', traslado.lineas.find(l => l.id === asignacion.lineaId)?.descripcion ?? asignacion.lineaId], ['Lote de la guía', asignacion.numeroLote ?? 'Sin lote'], ['Pendiente en tránsito · base', despacho?.estado === 'EN_TRANSITO' ? cantidadTexto(asignacion.pendienteBase) : 'La asignación ya no está en tránsito']] as [string, string][] : []),
    ]} /></SeccionOperacion>
    <SeccionOperacion id="resolver-decision" numero="02" titulo="Resolución" descripcion="Elige el resultado de la investigación y registra su motivo." disabled={disabled}><div className={form.grillaDos}>
      <CampoTraslado nombre="resolucion" etiqueta="Resolución" error={operacion.errores.resolucion}><Selector id="resolucion" value={datos.resolucion} required disabled={disabled || justificar} aria-invalid={!!operacion.errores.resolucion} aria-describedby="resolucion-ayuda" onValueChange={v => cambiar({ resolucion: v as ResolucionIncidencia, trasladoRelacionadoId: null })}>{Object.entries(resolucionesIncidencia).filter(([v]) => v !== 'FALTANTE_JUSTIFICADO' || puedeJustificar(traslado, incidencia, sesion)).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Selector></CampoTraslado>
      <CampoTraslado nombre="motivo" etiqueta="Motivo de la resolución" area maxLength={250} value={datos.motivo} onChange={v => cambiar({ motivo: v })} error={operacion.errores.motivo} ayuda="Entre 5 y 250 caracteres." />
    </div>{datos.resolucion === 'TRASLADO_RELACIONADO' && <><TrasladoSelectorRelacionado traslado={traslado} value={datos.trasladoRelacionadoId ?? ''} onChange={v => cambiar({ trasladoRelacionadoId: v || null })} disabled={disabled} error={operacion.errores.trasladoRelacionadoId} />{datos.trasladoRelacionadoId && <CargaTraslado cargando={relacionada.cargando} error={relacionada.error} onReintentar={relacionada.recargar} />}{detalleRelacionado && <div className={styles.aviso}><strong>{detalleRelacionado.numero}</strong><p role={errorSeleccion ? 'alert' : undefined}>{errorSeleccion ?? 'Documento cerrado con recepción efectiva suficiente para esta incidencia.'}</p><p>El servidor volverá a verificar la relación antes de resolver.</p></div>}</>}</SeccionOperacion>
    <SeccionOperacion id="resolver-evidencia" numero="03" titulo="Evidencia y control" descripcion="Documenta la investigación y la separación de funciones." disabled={disabled}><div className={form.grillaDos}>
      <CampoTraslado nombre="evidencia" etiqueta="Evidencia de resolución" area maxLength={500} value={datos.evidencia} onChange={v => cambiar({ evidencia: v })} error={operacion.errores.evidencia} ayuda="Entre 5 y 500 caracteres; se conservará en la auditoría de la resolución." />
      <CampoTraslado nombre="controlCompensatorio" etiqueta="Control compensatorio" area maxLength={500} requerido={false} value={datos.controlCompensatorio ?? ''} onChange={v => cambiar({ controlCompensatorio: v || null })} error={operacion.errores.controlCompensatorio} ayuda="Si registraste esta incidencia, documenta el control independiente aplicado; entre 5 y 500 caracteres." />
    </div></SeccionOperacion><p className={styles.aviso}>{aviso}</p>
  </FormularioOperacion><ModalEstado abierto={confirmar} apariencia="formulario" tipo="advertencia" titulo={titulo} mensaje={<><p><strong>{traslado.numero}</strong></p><p>{aviso}</p><p>Motivo: {datos.motivo}</p>{datos.trasladoRelacionadoId && <p>Traslado relacionado: {detalleRelacionado?.numero ?? datos.trasladoRelacionadoId}</p>}</>} cargando={operacion.guardando} textoAccionPrincipal="Confirmar resolución" onAccionPrincipal={() => void guardar()} textoAccionSecundaria="Seguir revisando" onAccionSecundaria={() => setConfirmar(false)} onCerrar={() => { if (!operacion.guardando) setConfirmar(false) }} /><ModalEstado abierto={completada} tipo="exito" titulo="Incidencia resuelta" mensaje="La resolución se guardó. Revisa el detalle del traslado para consultar las cantidades, la relación y la auditoría actualizadas." textoAccionPrincipal="Ver traslado" onAccionPrincipal={volver} onCerrar={volver} /></>
}
