import { useEffect, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { obtenerContextoDespacho } from '../traslado-api'
import { cantidadTexto, fechaHora } from '../traslado-reglas'
import { permiteNodo, puedeRegistrarRecepcion, reservaVigente, trasladoOperable } from '../traslado-operaciones-reglas'
import type { AsignacionTraslado } from '../traslado.types'
import { TrasladoAuditoria } from './traslado-auditoria'
import { BotonComprobanteTraslado } from './boton-comprobante-traslado'
import { TrasladoDocumentoAccion, type AccionDocumento } from './traslado-documento-accion'
import { CargaOperacion, DetalleOperacion, TablaControl, TarjetaOperacion } from './traslado-operacion-comun'
import { useCargaTraslado } from '../traslado-hooks'
import gestion from '../../empleados/components/empleado-gestion.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

export function TrasladoDespachoView({ id, sesion, onNavegar, onCambiosPendientes }: { id: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const carga = useCargaTraslado(id, obtenerContextoDespacho), [accion, setAccion] = useState<AccionDocumento | null>(null), [exito, setExito] = useState(''), [ahora, setAhora] = useState(Date.now)
  useEffect(() => {
    const hasta = carga.documento?.despacho.reservaHasta
    if (!hasta || !reservaVigente(hasta, ahora)) return
    const timer = window.setTimeout(() => setAhora(Date.now()), Math.min(2147483647, Math.max(1, Date.parse(hasta) - Date.now() + 10)))
    return () => window.clearTimeout(timer)
  }, [carga.documento, ahora])
  const volver = () => onNavegar(carga.documento ? `/traslados/${carga.documento.traslado.id}` : '/traslados')
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  const contexto = carga.documento, { traslado, despacho, recepciones } = contexto, operable = trasladoOperable(traslado), vigente = reservaVigente(despacho.reservaHasta, ahora)
  const verAuditoria = sesion.permisos.includes('TRASLADOS.ACCESO.VER_AUDITORIA')
  const columnas: ColumnaTabla<AsignacionTraslado>[] = [
    { id: 'producto', titulo: 'Producto / presentación', obtenerValor: a => a.lineaId, celda: a => <strong>{traslado.lineas.find(l => l.id === a.lineaId)?.descripcion ?? a.lineaId}</strong> },
    { id: 'lote', titulo: 'Lote asignado', obtenerValor: a => a.numeroLote, celda: a => a.numeroLote ?? 'Sin lote' },
    { id: 'vencimiento', titulo: 'Vencimiento', obtenerValor: a => a.fechaVencimiento, celda: a => a.fechaVencimiento ?? 'Sin vencimiento' },
    ...(['cantidadBase', 'recibidaBase', 'justificadaBase', 'pendienteBase'] as const).map(k => ({ id: k, titulo: { cantidadBase: 'Asignada en base', recibidaBase: 'Recibida en base', justificadaBase: 'Justificada en base', pendienteBase: 'Pendiente en base' }[k], obtenerValor: (a: AsignacionTraslado) => a[k], celda: (a: AsignacionTraslado) => cantidadTexto(a[k]) })),
  ]
  const recargar = () => { setAccion(null); carga.recargar() }
  return <><DetalleOperacion titulo="Detalle del despacho" identidad={despacho.id} estado={<span className={styles.estado} data-estado={despacho.estado}>{ { PREPARADO: 'Preparado', EN_TRANSITO: 'En tránsito', RECIBIDO: 'Recibido', CANCELADO: 'Cancelado' }[despacho.estado]}</span>} resumen={<><span>Traslado</span><strong><button type="button" className={styles.enlace} onClick={volver}>{traslado.numero}</button></strong><span>Origen</span><strong><NombreReferencia referencia="sucursales" id={traslado.origenSucursalId} /></strong><span>Destino</span><strong><NombreReferencia referencia="sucursales" id={traslado.destinoSucursalId} /></strong><span>Reserva hasta</span><strong>{fechaHora(despacho.reservaHasta)}</strong></>} volver={volver} recargar={recargar} exito={exito} acciones={<>
    {operable && despacho.estado === 'PREPARADO' && vigente && traslado.recepcionHabilitadaEn && permiteNodo(traslado, sesion, 'DESPACHAR', 'origen') && <button type="button" className={gestion.botonEditar} onClick={() => setAccion('despachar')}>Confirmar salida</button>}
    {puedeRegistrarRecepcion(contexto, sesion) && <button type="button" className={gestion.botonEditar} onClick={() => onNavegar(`/traslados/despachos/${id}/recepciones/nueva`)}>Registrar recepción</button>}
    {operable && despacho.estado === 'EN_TRANSITO' && permiteNodo(traslado, sesion, 'CUSTODIA', 'participante') && <button type="button" className={gestion.botonEstado} onClick={() => setAccion('custodia')}>Registrar cambio de custodia</button>}
    {operable && despacho.estado === 'PREPARADO' && permiteNodo(traslado, sesion, 'CANCELAR', 'origen') && <button type="button" className={gestion.botonEstado} onClick={() => setAccion('cancelar-despacho')}>Cancelar preparación</button>}
  </>} secciones={[{ id: 'despacho-guia', titulo: 'Guía y lotes' }, { id: 'despacho-transporte', titulo: 'Transporte' }, { id: 'despacho-custodia', titulo: 'Custodia' }, { id: 'despacho-recepciones', titulo: 'Recepciones' }, { id: 'despacho-control', titulo: 'Control' }, ...(verAuditoria ? [{ id: 'detalle-auditoria', titulo: 'Auditoría' }] : [])]}>
    <TarjetaOperacion id="despacho-guia" numero="01" titulo="Guía y lotes asignados">
      {despacho.estado === 'PREPARADO' && !vigente && <p role="status" className={styles.aviso}>La reserva venció. Cancela esta preparación y prepara un despacho nuevo antes de enviar los productos.</p>}
      {despacho.estado === 'PREPARADO' && !traslado.recepcionHabilitadaEn && <p className={styles.aviso}>El destino aún debe habilitar la recepción desde el detalle del traslado antes de confirmar la salida.</p>}
      <p className={styles.intro}>Cantidades en unidad base de cada producto. {despacho.estado === 'PREPARADO' ? 'Los lotes están reservados; todavía no se confirmó su salida.' : despacho.estado === 'CANCELADO' ? 'La preparación fue cancelada y sus reservas liberadas. Estas asignaciones se conservan como historia.' : 'La recepción parcial mantiene el resto en tránsito; las cantidades justificadas se muestran por separado.'}</p>
      <TablaDatos apariencia="tarjetas" descripcion="Lotes del despacho" datos={despacho.asignaciones} columnas={columnas} obtenerIdFila={a => a.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} />
    </TarjetaOperacion>
    <TarjetaOperacion id="despacho-transporte" numero="02" titulo="Transporte y salida"><TablaControl datos={[
      ['Salida confirmada', fechaHora(despacho.despachadoEn)], ['Custodio actual', despacho.custodio ?? 'Sin asignar'], ['Transporte', despacho.transporte ?? 'Sin registrar'], ['Condiciones', despacho.condiciones ?? 'Sin registrar'], ['Evidencia de salida', despacho.evidencia ?? 'Sin registrar'], ['Coste logístico (GTQ)', despacho.costeTransporte],
    ]} /></TarjetaOperacion>
    <TarjetaOperacion id="despacho-custodia" numero="03" titulo="Historial de custodia"><div className={styles.detalleLineas}>{despacho.custodias.length ? despacho.custodias.map(c => <article key={c.id}><h3>{c.responsable}</h3><TablaControl datos={ [['Fecha', fechaHora(c.ocurridoEn)], ['Condiciones', c.condiciones], ['Evidencia', c.evidencia], ['Registrado por (identificador)', c.registradoPorId ?? 'Sin registro']] } /></article>) : <p className={styles.intro}>Todavía no hay entregas de custodia registradas.</p>}</div></TarjetaOperacion>
    <TarjetaOperacion id="despacho-recepciones" numero="04" titulo="Recepciones del despacho"><div className={styles.detalleLineas}>{recepciones.length ? recepciones.map((r, i) => <article key={r.id}><h3>Recepción {i + 1} · {{ REGISTRADA: 'Registrada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada' }[r.estado]}</h3><p>Registrada: {fechaHora(r.creadoEn)} · Confirmada: {fechaHora(r.confirmadaEn)}</p><div className={styles.accionesDocumento}><button type="button" className={form.botonSecundario} onClick={() => onNavegar(`/traslados/recepciones/${r.id}`)}>Ver recepción {i + 1}</button><BotonComprobanteTraslado recurso="recepciones" id={r.id} referencia={`recepción ${r.id}`} /></div></article>) : <p className={styles.intro}>No hay recepciones registradas para este despacho.</p>}</div></TarjetaOperacion>
    <TarjetaOperacion id="despacho-control" numero="05" titulo="Control del despacho"><TablaControl datos={ [['Creado', fechaHora(despacho.creadoEn)], ['Versión del despacho', despacho.version], ['Versión del traslado', traslado.version], ['Confirmado por (identificador)', despacho.despachadoPorId ?? 'Sin registro'], ['Movimiento de salida (identificador)', despacho.movimientoId ?? 'Sin salida confirmada'], ['Motivo de cancelación', despacho.motivoCancelacion ?? 'Sin cancelación']] } /></TarjetaOperacion>
    {verAuditoria && <TrasladoAuditoria id={traslado.id} revision={traslado.version} />}
  </DetalleOperacion>{accion && <TrasladoDocumentoAccion key={`${accion}:${despacho.version}`} accion={accion} contexto={contexto} onCerrar={() => setAccion(null)} onCambiosPendientes={onCambiosPendientes} onRecargar={recargar} onCompletado={() => { setExito('La operación se completó correctamente.'); recargar() }} />}</>
}
