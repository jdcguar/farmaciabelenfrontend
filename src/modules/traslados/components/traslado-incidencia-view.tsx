import { useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { Selector } from '../../../shared/components/selector/selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { obtenerDespacho, obtenerTraslado, registrarIncidencia } from '../traslado-api'
import { cantidadTexto, esCantidad } from '../traslado-reglas'
import { puedeIncidencia, tiposIncidencia, validarIncidencia } from '../traslado-incidencias-reglas'
import { useCambiosTraslado, useCargaTraslado, useOperacionTraslado } from '../traslado-hooks'
import type { DetalleTraslado, RegistroIncidencia, TipoIncidencia } from '../traslado.types'
import { CampoTraslado, CargaTraslado, ErrorTraslado } from './traslado-campo'
import { CargaOperacion, FormularioOperacion, NoDisponible, SeccionOperacion } from './traslado-operacion-comun'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

type Props = { id: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }
const cargarGuia = (id: string, signal?: AbortSignal) => id ? obtenerDespacho(id, signal) : Promise.resolve(null)
export function TrasladoIncidenciaView(props: Props) {
  const carga = useCargaTraslado(props.id, obtenerTraslado), volver = () => props.onNavegar(`/traslados/${props.id}`)
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  if (!puedeIncidencia(carga.documento, props.sesion)) return <NoDisponible volver={volver} mensaje="Registrar incidencias requiere permiso INCIDENCIAS en un punto participante y un traslado preparado, en tránsito o recibido." />
  return <IncidenciaFormulario key={carga.documento.version} {...props} traslado={carga.documento} recargar={carga.recargar} />
}
function IncidenciaFormulario({ traslado, onNavegar, onCambiosPendientes, recargar }: Props & { traslado: DetalleTraslado; recargar: () => void }) {
  const [datos, setDatos] = useState<RegistroIncidencia>({ version: traslado.version, tipo: 'OTRA', asignacionId: null, cantidadBase: '0', descripcion: '', evidencia: '' }), [despachoId, setDespachoId] = useState(''), [creada, setCreada] = useState(false)
  const guia = useCargaTraslado(despachoId, cargarGuia), operacion = useOperacionTraslado(), [inicial] = useState(() => JSON.stringify(datos))
  useCambiosTraslado(!creada && (!!despachoId || JSON.stringify(datos) !== inicial), onCambiosPendientes)
  const volver = () => onNavegar(`/traslados/${traslado.id}`), disabled = operacion.guardando || operacion.conflicto || creada
  const cambiar = (d: Partial<RegistroIncidencia>) => { setDatos(v => ({ ...v, ...d })); operacion.limpiarErrores() }
  async function guardar() {
    if (creada) return
    const fallos = validarIncidencia(traslado, datos, guia.cargando || guia.error ? null : guia.documento)
    if (datos.tipo === 'FALTANTE' && !despachoId) fallos.despachoId = 'Selecciona un despacho en tránsito para consultar la asignación faltante.'
    if (despachoId && (guia.cargando || guia.error)) fallos.asignacionId = 'Espera la guía o reintenta su consulta antes de guardar.'
    await operacion.ejecutar(fallos, () => registrarIncidencia(traslado.id, { ...datos, cantidadBase: datos.cantidadBase.trim(), descripcion: datos.descripcion.trim(), evidencia: datos.evidencia.trim() }), () => { onCambiosPendientes(false); setCreada(true) })
  }
  const seleccionada = guia.documento?.asignaciones.find(a => a.id === datos.asignacionId)
  return <><FormularioOperacion titulo="Registrar incidencia" resumen={<><strong>{traslado.numero}</strong><p>Documenta una diferencia y conserva su evidencia.</p></>} secciones={[{ id: 'incidencia-diferencia', titulo: 'Diferencia observada' }, { id: 'incidencia-evidencia', titulo: 'Descripción y evidencia' }]} operacion={operacion} onGuardar={() => void guardar()} volver={volver} textoGuardar="Registrar incidencia" recargar={() => { onCambiosPendientes(false); recargar() }}>
    <SeccionOperacion id="incidencia-diferencia" numero="01" titulo="Diferencia observada" descripcion="Indica el tipo, la cantidad en unidad base y, cuando corresponda, la asignación de la guía." disabled={disabled}><div className={form.grillaDos}>
      <CampoTraslado nombre="tipo" etiqueta="Tipo de incidencia" error={operacion.errores.tipo}><Selector id="tipo" value={datos.tipo} required disabled={disabled} aria-invalid={!!operacion.errores.tipo} aria-describedby="tipo-ayuda" onValueChange={v => { cambiar({ tipo: v as TipoIncidencia, asignacionId: null }); setDespachoId('') }}>{Object.entries(tiposIncidencia).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Selector></CampoTraslado>
      <CampoTraslado nombre="cantidadBase" etiqueta="Cantidad observada en base" unidadCantidad={{ presentacionId: traslado.lineas.find(l => l.id === seleccionada?.lineaId)?.presentacionId }} inputMode="decimal" value={datos.cantidadBase} onChange={v => cambiar({ cantidadBase: v })} error={operacion.errores.cantidadBase} ayuda={datos.tipo === 'FALTANTE' ? 'Cantidad positiva según su unidad; debe seguir pendiente en tránsito.' : 'Cantidad no negativa según su unidad; 0 documenta una diferencia sin cantidad.'} />
      <CampoTraslado nombre="despachoId" etiqueta="Despacho de referencia" requerido={datos.tipo === 'FALTANTE'} error={operacion.errores.despachoId} ayuda="Selecciona la guía para consultar sus asignaciones."><Selector id="despachoId" value={despachoId} required={datos.tipo === 'FALTANTE'} disabled={disabled} aria-invalid={!!operacion.errores.despachoId} aria-describedby="despachoId-ayuda" onValueChange={v => { setDespachoId(v); cambiar({ asignacionId: null }) }}><option value="">Sin despacho</option>{traslado.despachos.filter(d => datos.tipo === 'FALTANTE' ? d.estado === 'EN_TRANSITO' : d.estado !== 'CANCELADO').map((d, i) => <option key={d.id} value={d.id}>Despacho {i + 1} · {d.id}</option>)}</Selector></CampoTraslado>
      <CampoTraslado nombre="asignacionId" etiqueta="Asignación de referencia" requerido={datos.tipo === 'FALTANTE'} error={operacion.errores.asignacionId} ayuda="El faltante exige una asignación despachada con saldo pendiente."><Selector id="asignacionId" value={datos.asignacionId ?? ''} required={datos.tipo === 'FALTANTE'} disabled={disabled || !despachoId || guia.cargando || !!guia.error} aria-invalid={!!operacion.errores.asignacionId} aria-describedby="asignacionId-ayuda" onValueChange={v => cambiar({ asignacionId: v || null })}><option value="">Sin asignación</option>{!guia.cargando && !guia.error && guia.documento?.asignaciones.map(a => <option key={a.id} value={a.id} disabled={datos.tipo === 'FALTANTE' && !esCantidad(a.pendienteBase)}>{traslado.lineas.find(l => l.id === a.lineaId)?.descripcion ?? a.lineaId} · {a.numeroLote ?? 'sin lote'} · pendiente {cantidadTexto(a.pendienteBase)}</option>)}</Selector></CampoTraslado>
    </div>{despachoId && <CargaTraslado cargando={guia.cargando} error={guia.error} onReintentar={guia.recargar} />}{seleccionada && !guia.cargando && <p className={styles.aviso}>Lote de la guía: {seleccionada.numeroLote ?? 'sin lote'} · Vencimiento: {seleccionada.fechaVencimiento ?? 'sin vencimiento'} · Pendiente: {cantidadTexto(seleccionada.pendienteBase)} en unidad base. La incidencia conserva esta asignación.</p>}</SeccionOperacion>
    <SeccionOperacion id="incidencia-evidencia" numero="02" titulo="Descripción y evidencia" descripcion="Registra lo sucedido y la referencia documental que permite investigarlo." disabled={disabled}><div className={form.grillaDos}><CampoTraslado nombre="descripcion" etiqueta="Descripción de la incidencia" area maxLength={500} value={datos.descripcion} onChange={v => cambiar({ descripcion: v })} error={operacion.errores.descripcion} ayuda="Entre 5 y 500 caracteres." /><CampoTraslado nombre="evidencia" etiqueta="Evidencia" area maxLength={500} value={datos.evidencia} onChange={v => cambiar({ evidencia: v })} error={operacion.errores.evidencia} ayuda="Entre 5 y 500 caracteres." /></div></SeccionOperacion>
    <ErrorTraslado error={operacion.errores.solicitud} /><p className={styles.aviso}>Registrar abre la investigación. No ingresa sobrantes, sustituye lotes ni justifica faltantes. La resolución se realiza por separado y conserva la evidencia original.</p>
  </FormularioOperacion><ModalEstado abierto={creada} tipo="exito" titulo="Incidencia registrada" mensaje="La incidencia quedó abierta y su evidencia se conservó. Puedes consultarla en el seguimiento del traslado." textoAccionPrincipal="Ver traslado" onAccionPrincipal={volver} onCerrar={volver} /></>
}
