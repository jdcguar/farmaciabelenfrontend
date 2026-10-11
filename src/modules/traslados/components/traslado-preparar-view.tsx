import { useRef, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { obtenerTraslado, prepararDespacho } from '../traslado-api'
import { cantidadTexto, claveParaContenido, esCantidad } from '../traslado-reglas'
import { entradaPreparacion, puedePreparar, validarPreparacion } from '../traslado-operaciones-reglas'
import type { BorradorPreparacion, DetalleDespacho, DetalleTraslado } from '../traslado.types'
import { CampoTraslado, ErrorTraslado } from './traslado-campo'
import { CargaOperacion, FormularioOperacion, NoDisponible, SeccionOperacion } from './traslado-operacion-comun'
import { useCambiosTraslado, useCargaTraslado, useOperacionTraslado } from '../traslado-hooks'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

type Props = { id: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }
export function TrasladoPrepararView(props: Props) {
  const carga = useCargaTraslado(props.id, obtenerTraslado), volver = () => props.onNavegar(`/traslados/${props.id}`)
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  if (!puedePreparar(carga.documento, props.sesion)) return <NoDisponible volver={volver} mensaje="La preparación requiere permiso, acceso al origen, un traslado aprobado y cantidades pendientes por preparar." />
  return <PreparacionFormulario key={`${carga.documento.version}`} {...props} traslado={carga.documento} recargar={carga.recargar} />
}
function PreparacionFormulario({ traslado, onNavegar, onCambiosPendientes, recargar }: Props & { traslado: DetalleTraslado; recargar: () => void }) {
  const [reserva, setReserva] = useState(''), [lineas, setLineas] = useState<BorradorPreparacion[]>(() => traslado.lineas.map(l => ({ lineaId: l.id, incluir: false, cantidadBase: '' }))), [creado, setCreado] = useState<DetalleDespacho | null>(null)
  const operacion = useOperacionTraslado(), idempotencia = useRef<{ contenido: string; clave: string } | null>(null)
  const [inicial] = useState(() => JSON.stringify(lineas)), sucio = !!reserva || JSON.stringify(lineas) !== inicial
  useCambiosTraslado(sucio && !creado, onCambiosPendientes)
  const volver = () => onNavegar(`/traslados/${traslado.id}`), verDespacho = () => { if (creado) onNavegar(`/traslados/despachos/${creado.id}`) }
  const disabled = operacion.guardando || operacion.conflicto || !!creado
  function cambiar(i: number, cambios: Partial<BorradorPreparacion>) { setLineas(ls => ls.map((l, indice) => indice === i ? { ...l, ...cambios } : l)); operacion.limpiarErrores() }
  async function guardar() {
    if (creado) return
    const datos = entradaPreparacion(traslado, reserva, lineas, '')
    idempotencia.current = claveParaContenido(idempotencia.current, datos)
    await operacion.ejecutar(validarPreparacion(traslado, reserva, lineas), () => prepararDespacho(traslado.id, { ...datos, claveIdempotencia: idempotencia.current!.clave }), r => { onCambiosPendientes(false); setCreado(r) }, lineas.flatMap((l, i) => l.incluir ? [i] : []))
  }
  return <><FormularioOperacion titulo="Preparación de despacho" resumen={<><strong>{traslado.numero}</strong><p>Origen: <NombreReferencia referencia="sucursales" id={traslado.origenSucursalId} /></p><p>Destino: <NombreReferencia referencia="sucursales" id={traslado.destinoSucursalId} /></p><p>{lineas.filter(l => l.incluir).length} líneas seleccionadas</p></>} secciones={[{ id: 'preparacion-vigencia', titulo: 'Vigencia de reserva' }, { id: 'preparacion-lineas', titulo: 'Productos y cantidades' }]} operacion={operacion} onGuardar={() => void guardar()} volver={volver} textoGuardar="Preparar despacho" recargar={() => { onCambiosPendientes(false); recargar() }}>
    <SeccionOperacion id="preparacion-vigencia" numero="01" titulo="Vigencia de la reserva" descripcion="Define hasta cuándo estará disponible esta preparación antes de confirmar la salida." disabled={disabled}>
      <CampoTraslado nombre="reservaHasta" etiqueta="Reservar hasta (hora de Guatemala)" tipo="datetime-local" value={reserva} onChange={v => { setReserva(v); operacion.limpiarErrores() }} error={operacion.errores.reservaHasta} ayuda="Fecha y hora futuras, zona de Guatemala (UTC−06:00)." />
      <p className={styles.intro}>{traslado.recepcionHabilitadaEn ? 'El destino habilitó la recepción.' : 'El destino deberá habilitar la recepción antes de confirmar la salida.'}</p>
    </SeccionOperacion>
    <SeccionOperacion id="preparacion-lineas" numero="02" titulo="Productos y cantidades" descripcion="Selecciona las líneas y cantidades en unidad base. El servidor asignará lotes aptos por FEFO, respetando reservas y vida útil." disabled={disabled}>
      <ErrorTraslado error={operacion.errores.lineas} /><div className={styles.lineas}>{traslado.lineas.map((l, i) => {
        const borrador = lineas[i]!, pendiente = traslado.pendientes.find(p => p.lineaId === l.id)?.porPrepararBase ?? '0', disponible = esCantidad(pendiente)
        return <div key={l.id} className={styles.linea}><h3>{l.descripcion}</h3><p className={styles.intro}>Aprobada: {cantidadTexto(l.aprobadaBase)} · Por preparar: {cantidadTexto(pendiente)} en unidad base · Vida útil mínima: {l.vidaUtilMinimaDias} días.</p><label className={styles.seleccionLinea}><input type="checkbox" checked={borrador.incluir} disabled={!disponible || disabled} onChange={e => cambiar(i, { incluir: e.target.checked })} />Incluir {l.descripcion}</label>{borrador.incluir && <div className={form.grillaDos}><CampoTraslado nombre={`lineas.${i}.cantidadBase`} etiqueta="Cantidad a preparar en unidad base" unidadCantidad={{ presentacionId: l.presentacionId }} value={borrador.cantidadBase} onChange={v => cambiar(i, { cantidadBase: v })} error={operacion.errores[`lineas.${i}.cantidadBase`]} ayuda={`Máximo: ${cantidadTexto(pendiente)}. Respeta la precisión de la unidad base.`} /></div>}</div>
      })}</div>
    </SeccionOperacion><p className={styles.aviso}>Preparar reserva las existencias y registra los lotes asignados. La salida de inventario se confirma desde el detalle del despacho. Si vence la reserva, cancela la preparación y genera otra.</p>
  </FormularioOperacion><ModalEstado abierto={!!creado} tipo="exito" titulo="Despacho preparado" mensaje="Los productos quedaron reservados. Revisa los lotes asignados y confirma la salida cuando corresponda." textoAccionPrincipal="Ver despacho" onAccionPrincipal={verDespacho} onCerrar={verDespacho} /></>
}
