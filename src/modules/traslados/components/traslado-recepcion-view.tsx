import { useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { obtenerContextoRecepcion } from '../traslado-api'
import { cantidadTexto, fechaHora } from '../traslado-reglas'
import { diferenciasRecepcion, permiteNodo, puedeConfirmarRecepcion } from '../traslado-operaciones-reglas'
import { TrasladoAuditoria } from './traslado-auditoria'
import { TrasladoDocumentoAccion, type AccionDocumento } from './traslado-documento-accion'
import { CargaOperacion, DetalleOperacion, TablaControl, TarjetaOperacion } from './traslado-operacion-comun'
import { useCargaTraslado } from '../traslado-hooks'
import gestion from '../../empleados/components/empleado-gestion.module.css'
import styles from '../traslado.module.css'

export function TrasladoRecepcionView({ id, sesion, onNavegar, onCambiosPendientes }: { id: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const carga = useCargaTraslado(id, obtenerContextoRecepcion), [accion, setAccion] = useState<AccionDocumento | null>(null), [exito, setExito] = useState('')
  const volver = () => onNavegar(carga.documento ? `/traslados/despachos/${carga.documento.despacho.id}` : '/traslados')
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  const contexto = carga.documento, { traslado, despacho, recepcion } = contexto, verAuditoria = sesion.permisos.includes('TRASLADOS.ACCESO.VER_AUDITORIA')
  const diferencias = recepcion.estado === 'REGISTRADA' ? diferenciasRecepcion(contexto, recepcion.lineas) : []
  const controlRequerido = recepcion.estado === 'REGISTRADA' && despacho.despachadoPorId === sesion.usuarioId && !recepcion.controlCompensatorio
  const recargar = () => { setAccion(null); carga.recargar() }
  return <><DetalleOperacion titulo="Detalle de recepción" identidad={recepcion.id} estado={<span className={styles.estado} data-estado={recepcion.estado}>{{ REGISTRADA: 'Registrada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada' }[recepcion.estado]}</span>} volver={volver} recargar={recargar} exito={exito} resumen={<>
    <span>Traslado</span><strong><button type="button" className={styles.enlace} onClick={() => onNavegar(`/traslados/${traslado.id}`)}>{traslado.numero}</button></strong><span>Despacho</span><strong><button type="button" className={styles.enlace} onClick={volver}>{despacho.id}</button></strong><span>Destino</span><strong><NombreReferencia referencia="sucursales" id={traslado.destinoSucursalId} /></strong><span>Fecha de registro</span><strong>{fechaHora(recepcion.creadoEn)}</strong>
  </>} acciones={<>
    {puedeConfirmarRecepcion(contexto, sesion) && !diferencias.length && <button type="button" className={gestion.botonEditar} onClick={() => setAccion('confirmar-recepcion')}>Confirmar recepción</button>}
    {recepcion.estado === 'REGISTRADA' && permiteNodo(traslado, sesion, 'CANCELAR_RECEPCION', 'destino') && <button type="button" className={gestion.botonEstado} onClick={() => setAccion('cancelar-recepcion')}>Cancelar recepción</button>}
  </>} secciones={[{ id: 'rec-detalle-inspeccion', titulo: 'Inspección' }, { id: 'rec-detalle-evidencia', titulo: 'Evidencia' }, { id: 'rec-detalle-control', titulo: 'Control' }, ...(verAuditoria ? [{ id: 'detalle-auditoria', titulo: 'Auditoría' }] : [])]}>
    <TarjetaOperacion id="rec-detalle-inspeccion" numero="01" titulo="Inspección registrada">
      <p className={styles.intro}>{recepcion.estado === 'REGISTRADA' ? 'La inspección está guardada. Todavía no se ha confirmado el ingreso de existencias.' : recepcion.estado === 'CONFIRMADA' ? 'El ingreso está confirmado. Las cantidades restringidas permanecen segregadas; su liberación corresponde al proceso de Inventario.' : 'La inspección fue cancelada. Se conserva su evidencia y no produjo ingreso de existencias.'}</p>
      {diferencias.length > 0 && <div className={styles.aviso} role="status"><strong>La inspección presenta diferencias</strong>{diferencias.map(d => <p key={d}>{d}</p>)}<p>Conserva la evidencia y tramita la diferencia mediante incidencias. Si corresponde, cancela esta recepción y registra una nueva conforme. Un sobrante requiere el traslado complementario autorizado antes de incorporarlo.</p></div>}
      {controlRequerido && <p className={styles.aviso}>También confirmaste la salida y este registro no contiene control compensatorio. La recepción debe confirmarla otro actor autorizado, o cancelarse y registrarse nuevamente con el control documentado.</p>}
      <div className={styles.detalleLineas}>{recepcion.lineas.map((l, i) => {
        const a = despacho.asignaciones.find(x => x.id === l.asignacionId), producto = traslado.lineas.find(x => x.id === a?.lineaId)
        return <article key={l.id}><h3>{producto?.descripcion ?? `Asignación ${i + 1}`}</h3><TablaControl datos={[
          ['Lote de la guía', a?.numeroLote ?? 'Sin lote'], ['Lote observado', l.numeroLoteObservado ?? 'Sin lote observado'], ['Vencimiento de la guía', a?.fechaVencimiento ?? 'Sin vencimiento'], ['Vencimiento observado', l.vencimientoObservado ?? 'Sin vencimiento observado'],
          ['Aceptada en unidad base', cantidadTexto(l.aceptadaBase)], ['Cuarentena en unidad base', cantidadTexto(l.cuarentenaBase)], ['Rechazada en unidad base', cantidadTexto(l.rechazadaBase)],
          ['Almacenamiento', l.destinoUbicacionId ? <NombreReferencia key="almacenamiento" referencia="ubicaciones" id={l.destinoUbicacionId} /> : 'Sin ubicación de aceptación'], ['Cuarentena / rechazo', l.cuarentenaUbicacionId ? <NombreReferencia key="cuarentena" referencia="ubicaciones" id={l.cuarentenaUbicacionId} /> : 'Sin ubicación restringida'], ['Observación', l.incidencia ?? 'Sin observación adicional'],
        ]} /></article>
      })}</div>
    </TarjetaOperacion><TarjetaOperacion id="rec-detalle-evidencia" numero="02" titulo="Evidencia y separación de funciones"><TablaControl datos={ [['Evidencia', recepcion.evidencia], ['Control compensatorio', recepcion.controlCompensatorio ?? 'Sin control compensatorio registrado']] } /></TarjetaOperacion>
    <TarjetaOperacion id="rec-detalle-control" numero="03" titulo="Control del registro"><TablaControl datos={ [['Creada', fechaHora(recepcion.creadoEn)], ['Confirmada', fechaHora(recepcion.confirmadaEn)], ['Confirmada por (identificador)', recepcion.confirmadaPorId ?? 'Sin confirmación'], ['Movimiento de ingreso (identificador)', recepcion.movimientoId ?? 'Sin ingreso confirmado'], ['Versión de recepción', recepcion.version], ['Versión de despacho', despacho.version], ['Versión de traslado', traslado.version], ['Motivo de cancelación', recepcion.motivoCancelacion ?? 'Sin cancelación']] } /></TarjetaOperacion>
    {verAuditoria && <TrasladoAuditoria id={traslado.id} revision={traslado.version} numero="04" />}
  </DetalleOperacion>{accion && <TrasladoDocumentoAccion key={`${accion}:${recepcion.version}`} accion={accion} contexto={contexto} recepcion={recepcion} onCerrar={() => setAccion(null)} onCambiosPendientes={onCambiosPendientes} onRecargar={recargar} onCompletado={() => { setExito('La operación se completó correctamente.'); recargar() }} />}</>
}
