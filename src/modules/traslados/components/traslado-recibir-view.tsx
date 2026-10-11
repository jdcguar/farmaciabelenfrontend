import { useRef, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { NombreReferencia, SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { obtenerContextoDespacho, registrarRecepcion } from '../traslado-api'
import { cantidadTexto, claveParaContenido, esCantidad } from '../traslado-reglas'
import { diferenciasRecepcion, entradaRecepcion, puedeRegistrarRecepcion, validarRegistroRecepcion } from '../traslado-operaciones-reglas'
import type { BorradorRecepcion, ContextoDespacho, DetalleRecepcion } from '../traslado.types'
import { CampoTraslado, ErrorTraslado } from './traslado-campo'
import { CargaOperacion, FormularioOperacion, NoDisponible, SeccionOperacion } from './traslado-operacion-comun'
import { useCambiosTraslado, useCargaTraslado, useOperacionTraslado } from '../traslado-hooks'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

type Props = { id: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }
export function TrasladoRecibirView(props: Props) {
  const carga = useCargaTraslado(props.id, obtenerContextoDespacho), volver = () => props.onNavegar(`/traslados/despachos/${props.id}`)
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  if (!puedeRegistrarRecepcion(carga.documento, props.sesion)) return <NoDisponible volver={volver} mensaje="Registrar una recepción requiere acceso al destino, permiso RECIBIR y un despacho en tránsito con cantidades pendientes." />
  return <RecepcionFormulario key={`${carga.documento.traslado.version}:${carga.documento.despacho.version}`} {...props} contexto={carga.documento} recargar={carga.recargar} />
}
function RecepcionFormulario({ contexto, sesion, onNavegar, onCambiosPendientes, recargar }: Props & { contexto: ContextoDespacho; recargar: () => void }) {
  const { traslado, despacho, recepciones } = contexto
  const [lineas, setLineas] = useState<BorradorRecepcion[]>(() => despacho.asignaciones.map(a => ({ asignacionId: a.id, incluir: false, numeroLoteObservado: '', vencimientoObservado: '', aceptadaBase: '0', cuarentenaBase: '0', rechazadaBase: '0', destinoUbicacionId: '', cuarentenaUbicacionId: '', incidencia: '' })))
  const [evidencia, setEvidencia] = useState(''), [control, setControl] = useState(''), [creado, setCreado] = useState<DetalleRecepcion | null>(null), operacion = useOperacionTraslado()
  const [inicial] = useState(() => JSON.stringify(lineas)), idempotencia = useRef<{ contenido: string; clave: string } | null>(null), sucio = !!evidencia || !!control || JSON.stringify(lineas) !== inicial
  useCambiosTraslado(sucio && !creado, onCambiosPendientes)
  const disabled = operacion.guardando || operacion.conflicto || !!creado, propias = despacho.despachadoPorId === sesion.usuarioId, seleccionadas = lineas.filter(l => l.incluir).length
  const volver = () => onNavegar(`/traslados/despachos/${despacho.id}`), verRecepcion = () => { if (creado) onNavegar(`/traslados/recepciones/${creado.id}`) }
  function cambiar(i: number, cambios: Partial<BorradorRecepcion>) { setLineas(ls => ls.map((l, indice) => indice === i ? { ...l, ...cambios } : l)); operacion.limpiarErrores() }
  async function guardar() {
    if (creado) return
    const datos = entradaRecepcion(lineas, evidencia, control, '')
    idempotencia.current = claveParaContenido(idempotencia.current, datos)
    await operacion.ejecutar(validarRegistroRecepcion(contexto, lineas, evidencia, control, sesion.usuarioId), () => registrarRecepcion(despacho.id, { ...datos, claveIdempotencia: idempotencia.current!.clave }), r => { onCambiosPendientes(false); setCreado(r) }, lineas.flatMap((l, i) => l.incluir ? [i] : []))
  }
  const diferencias = diferenciasRecepcion(contexto, entradaRecepcion(lineas.filter(l => ['aceptadaBase', 'cuarentenaBase', 'rechazadaBase'].every(k => esCantidad(l[k as 'aceptadaBase'], true))), evidencia, control, '').lineas)
  return <><FormularioOperacion titulo="Registrar recepción" resumen={<><strong>{traslado.numero}</strong><p>Despacho {despacho.id}</p><p>Destino: <NombreReferencia referencia="sucursales" id={traslado.destinoSucursalId} /></p><p>{seleccionadas} asignaciones inspeccionadas</p></>} secciones={[{ id: 'recepcion-inspeccion', titulo: 'Inspección por lote' }, { id: 'recepcion-evidencia', titulo: 'Evidencia y control' }]} operacion={operacion} onGuardar={() => void guardar()} volver={volver} textoGuardar="Registrar recepción" recargar={() => { onCambiosPendientes(false); recargar() }}>
    <SeccionOperacion id="recepcion-inspeccion" numero="01" titulo="Inspección por lote" descripcion="Selecciona los lotes inspeccionados y registra lo observado. Las cantidades se expresan en unidad base de cada producto." disabled={disabled}>
      {recepciones.some(r => r.estado === 'REGISTRADA') && <p className={styles.aviso}>Hay recepciones registradas aún sin confirmar. Sus cantidades todavía no descuentan el saldo en tránsito; revisa esos registros desde el detalle del despacho.</p>}
      <ErrorTraslado error={operacion.errores.lineas} /><div className={styles.lineas}>{despacho.asignaciones.map((a, i) => {
        const l = lineas[i]!, producto = traslado.lineas.find(x => x.id === a.lineaId), p = `lineas.${i}.`, restringida = (esCantidad(l.cuarentenaBase, true) && esCantidad(l.rechazadaBase, true)) ? esCantidad(l.cuarentenaBase) || esCantidad(l.rechazadaBase) : false
        return <div key={a.id} className={styles.linea}><h3>{producto?.descripcion ?? a.lineaId}</h3><p className={styles.intro}>Guía: lote {a.numeroLote ?? 'sin lote'} · Vencimiento {a.fechaVencimiento ?? 'sin vencimiento'} · Pendiente {cantidadTexto(a.pendienteBase)} en unidad base.</p>
          <label className={styles.seleccionLinea}><input type="checkbox" checked={l.incluir} disabled={disabled || !esCantidad(a.pendienteBase) || !l.incluir && seleccionadas >= 100} onChange={e => cambiar(i, { incluir: e.target.checked })} />Inspeccionar asignación {i + 1}</label><ErrorTraslado error={operacion.errores[p + 'asignacionId']} />{l.incluir && <div className={form.grillaDos}>
            <CampoTraslado nombre={p + 'numeroLoteObservado'} etiqueta="Lote observado" requerido={false} maxLength={80} value={l.numeroLoteObservado} onChange={v => cambiar(i, { numeroLoteObservado: v })} error={operacion.errores[p + 'numeroLoteObservado']} ayuda="Vacío indica que no se observó un número de lote." />
            <CampoTraslado nombre={p + 'vencimientoObservado'} etiqueta="Vencimiento observado" tipo="date" requerido={false} value={l.vencimientoObservado} onChange={v => cambiar(i, { vencimientoObservado: v })} error={operacion.errores[p + 'vencimientoObservado']} ayuda="Registra la fecha de la etiqueta; vacío indica sin vencimiento observado." />
            {(['aceptadaBase', 'cuarentenaBase', 'rechazadaBase'] as const).map(k => <CampoTraslado key={k} nombre={p + k} etiqueta={{ aceptadaBase: 'Cantidad aceptada en base', cuarentenaBase: 'Cantidad en cuarentena en base', rechazadaBase: 'Cantidad rechazada en base' }[k]} unidadCantidad={{ presentacionId: producto?.presentacionId }} inputMode="decimal" value={l[k]} onChange={v => cambiar(i, { [k]: v })} error={operacion.errores[p + k]} ayuda="Cantidad no negativa según la precisión de la unidad base." />)}
            {esCantidad(l.aceptadaBase) && <CampoTraslado nombre={p + 'destinoUbicacionId'} etiqueta="Almacenamiento de destino" error={operacion.errores[p + 'destinoUbicacionId']} ayuda="Ubicación activa de almacenamiento de la sucursal destino."><SelectorReferencia id={p + 'destinoUbicacionId'} referencia="ubicaciones" criterios={{ sucursalId: traslado.destinoSucursalId, tipo: 'ALMACENAMIENTO' }} value={l.destinoUbicacionId} requerido error={operacion.errores[p + 'destinoUbicacionId']} descripcionId={p + 'destinoUbicacionId-ayuda'} disabled={disabled} onChange={v => cambiar(i, { destinoUbicacionId: v })} /></CampoTraslado>}
            {restringida && <CampoTraslado nombre={p + 'cuarentenaUbicacionId'} etiqueta="Ubicación de cuarentena" error={operacion.errores[p + 'cuarentenaUbicacionId']} ayuda="Cuarentena y rechazo físico se segregan en esta ubicación del destino."><SelectorReferencia id={p + 'cuarentenaUbicacionId'} referencia="ubicaciones" criterios={{ sucursalId: traslado.destinoSucursalId, tipo: 'CUARENTENA' }} value={l.cuarentenaUbicacionId} requerido error={operacion.errores[p + 'cuarentenaUbicacionId']} descripcionId={p + 'cuarentenaUbicacionId-ayuda'} disabled={disabled} onChange={v => cambiar(i, { cuarentenaUbicacionId: v })} /></CampoTraslado>}
            <CampoTraslado nombre={p + 'incidencia'} etiqueta="Observación / motivo de segregación" area maxLength={500} requerido={restringida} value={l.incidencia} onChange={v => cambiar(i, { incidencia: v })} error={operacion.errores[p + 'incidencia']} ayuda="Obligatorio para cuarentena o rechazo: entre 5 y 500 caracteres." />
          </div>}
        </div>
      })}</div>
    </SeccionOperacion><SeccionOperacion id="recepcion-evidencia" numero="02" titulo="Evidencia y control" descripcion="Deja constancia de la inspección y de la separación de funciones." disabled={disabled}><div className={form.grillaDos}>
      <CampoTraslado nombre="evidencia" etiqueta="Evidencia de recepción" area maxLength={500} value={evidencia} onChange={v => { setEvidencia(v); operacion.limpiarErrores() }} error={operacion.errores.evidencia} ayuda="Referencia documental y resultado de inspección, entre 5 y 500 caracteres." />
      <CampoTraslado nombre="controlCompensatorio" etiqueta="Control compensatorio" area maxLength={500} requerido={propias} value={control} onChange={v => { setControl(v); operacion.limpiarErrores() }} error={operacion.errores.controlCompensatorio} ayuda={propias ? 'También confirmaste la salida: documenta el control independiente aplicado.' : 'Opcional cuando corresponda; entre 5 y 500 caracteres.'} />
    </div></SeccionOperacion>{diferencias.length > 0 && <div className={styles.aviso}><strong>Diferencias observadas</strong>{diferencias.map(d => <p key={d}>{d}</p>)}<p>La observación se conservará. La recepción no podrá confirmarse hasta resolver la diferencia mediante el proceso de incidencias y, cuando corresponda, un traslado complementario.</p></div>}<p className={styles.aviso}>Registrar conserva la inspección sin ingresar existencias. La confirmación desde el detalle volverá a validar saldo, identidad, vida útil, ubicaciones y bloqueos. Cuarentena y rechazo permanecen segregados; una recepción parcial conserva el resto en tránsito.</p>
  </FormularioOperacion><ModalEstado abierto={!!creado} tipo="exito" titulo="Recepción registrada" mensaje="La inspección quedó guardada. Revisa el detalle antes de confirmar el ingreso de productos." textoAccionPrincipal="Ver recepción" onAccionPrincipal={verRecepcion} onCerrar={verRecepcion} /></>
}
