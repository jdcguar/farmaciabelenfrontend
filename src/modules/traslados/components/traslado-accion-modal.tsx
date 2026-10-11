import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { decidirTraslado } from '../traslado-api'
import { accionesTraslado } from '../traslado.config'
import { cantidadTexto, entradaDecision, validarDecision } from '../traslado-reglas'
import type { AccionTraslado, DetalleTraslado, ErroresTraslado } from '../traslado.types'
import { CampoTraslado, ErrorTraslado } from './traslado-campo'
import { enfocarError } from '../traslado-dom'
import styles from '../traslado.module.css'
const consecuencias: Record<AccionTraslado, string> = {
  aprobar: 'Decide la cantidad aprobada en la unidad base de cada producto. La disponibilidad se comprobará al guardar; esta acción aún no reserva existencias.',
  rechazar: 'La solicitud quedará rechazada y no podrá prepararse para envío.',
  cancelar: 'El traslado quedará cancelado. Si hay preparaciones pendientes, se liberarán sus reservas.',
  cerrar: 'El traslado quedará cerrado. Las preparaciones pendientes se cancelarán y las cantidades sin despachar quedarán justificadas con este motivo. El cierre requiere resolver incidencias y recepciones pendientes.',
  'habilitar-recepcion': 'Confirma que el destino está disponible para recibir este traslado. Esta acción no confirma el ingreso de productos.',
}
export function TrasladoAccionModal({ accion, traslado, actor, onCerrar, onCompletado, onRecargar, onCambiosPendientes }: { accion: AccionTraslado; traslado: DetalleTraslado; actor: string; onCerrar: () => void; onCompletado: (d: DetalleTraslado) => void; onRecargar: () => void; onCambiosPendientes: (v: boolean) => void }) {
  const [motivo, setMotivo] = useState(''), [control, setControl] = useState(''), [cantidades, setCantidades] = useState(() => Object.fromEntries(traslado.lineas.map(l => [l.id, cantidadTexto(l.solicitadaBase)])))
  const [inicial] = useState(() => JSON.stringify(cantidades)), sucio = !!motivo || !!control || JSON.stringify(cantidades) !== inicial
  const [errores, setErrores] = useState<ErroresTraslado>({}), [error, setError] = useState<unknown>(null), [guardando, setGuardando] = useState(false), [conflicto, setConflicto] = useState(false), [confirmarSalida, setConfirmarSalida] = useState(false)
  const formulario = useRef<HTMLFormElement>(null), envio = useRef(false)
  useEffect(() => { onCambiosPendientes(sucio); return () => onCambiosPendientes(false) }, [onCambiosPendientes, sucio])
  const cerrar = () => { if (envio.current) return; if (sucio) setConfirmarSalida(true); else onCerrar() }
  async function confirmar() {
    if (envio.current || conflicto) return
    const e = validarDecision(accion, traslado, motivo, control, cantidades, actor); setErrores(e); setError(null)
    if (Object.keys(e).length) { setError('Revisa los campos señalados.'); enfocarError(formulario.current); return }
    envio.current = true; setGuardando(true)
    try { const d = await decidirTraslado(traslado.id, accion, entradaDecision(accion, traslado, motivo, control, cantidades)); onCambiosPendientes(false); onCompletado(d) }
    catch (e: unknown) { setError(e); if (e instanceof ErrorApi) { if (e.codigo === 'TRASLADO_MODIFICADO' || e.codigo === 'TRASLADO_ESTADO_INVALIDO') setConflicto(true); setErrores(Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje]))); enfocarError(formulario.current) } }
    finally { envio.current = false; setGuardando(false) }
  }
  return <>
    <ModalEstado abierto={!confirmarSalida} apariencia="formulario" tipo={accion === 'aprobar' || accion === 'habilitar-recepcion' ? 'informacion' : 'advertencia'} titulo={accionesTraslado[accion]} cargando={guardando} textoAccionPrincipal={conflicto ? 'Actualizar traslado' : accionesTraslado[accion]} onAccionPrincipal={() => { if (conflicto) { onCambiosPendientes(false); onRecargar() } else formulario.current?.requestSubmit() }} textoAccionSecundaria="Volver" onAccionSecundaria={cerrar} onCerrar={cerrar} mensaje={<form onSubmitCapture={validarCantidadesAlEnviar} ref={formulario} className={styles.modal} noValidate onSubmit={e => { e.preventDefault(); void confirmar() }}><p className={styles.aviso}><strong>{traslado.numero}</strong><br />{consecuencias[accion]}</p><ErrorTraslado error={error} /><fieldset disabled={guardando || conflicto}>
      {accion === 'aprobar' && <><ErrorTraslado error={errores.lineas} />{traslado.lineas.map((l, i) => <div key={l.id} className={styles.modalLinea}><p><strong>{l.descripcion}</strong><br />Solicitada: {cantidadTexto(l.solicitadaBase)} en unidad base.</p><CampoTraslado nombre={`aprobacion-${i}`} etiqueta="Cantidad aprobada en unidad base" unidadCantidad={{ presentacionId: l.presentacionId }} value={cantidades[l.id] ?? ''} onChange={v => { setCantidades(c => ({ ...c, [l.id]: v })); setErrores({}) }} error={errores[l.id] ?? errores[`lineas.${i}.cantidadAprobadaBase`]} ayuda="0 excluye esta línea; no superar lo solicitado." /></div>)}</>}
      <CampoTraslado nombre="decision-motivo" etiqueta="Motivo de la decisión" area value={motivo} onChange={v => { setMotivo(v); setErrores({}) }} maxLength={250} error={errores.motivo} ayuda="Entre 5 y 250 caracteres." />
      {accion === 'aprobar' && <CampoTraslado nombre="decision-control" etiqueta="Control compensatorio" area value={control} onChange={v => { setControl(v); setErrores({}) }} maxLength={500} requerido={traslado.creadoPorId === actor} error={errores.controlCompensatorio} ayuda={traslado.creadoPorId === actor ? 'Estás aprobando tu propia solicitud: documenta la verificación independiente o el control aplicado.' : 'Opcional, si corresponde; entre 5 y 500 caracteres.'} />}
    </fieldset>{conflicto && <p className={styles.aviso}>La versión cambió. Actualiza el traslado y revisa su estado antes de volver a decidir. Se descartarán los datos de esta decisión.</p>}</form>} />
    <ModalEstado abierto={confirmarSalida} tipo="advertencia" titulo="Decisión sin guardar" mensaje="Los datos de esta decisión aún no se guardaron." textoAccionPrincipal="Seguir editando" onAccionPrincipal={() => setConfirmarSalida(false)} textoAccionSecundaria="Descartar y volver" onAccionSecundaria={() => { onCambiosPendientes(false); onCerrar() }} onCerrar={() => setConfirmarSalida(false)} />
  </>
}
