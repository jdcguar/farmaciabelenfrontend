import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { cancelarDespacho, cancelarRecepcion, confirmarRecepcion, despacharTraslado, registrarCustodia } from '../traslado-api'
import { validarCustodia, validarMotivo, validarSalida } from '../traslado-operaciones-reglas'
import type { ContextoDespacho, DetalleRecepcion } from '../traslado.types'
import { CampoTraslado, ErrorTraslado } from './traslado-campo'
import { useCambiosTraslado, useOperacionTraslado } from '../traslado-hooks'
import styles from '../traslado.module.css'

export type AccionDocumento = 'despachar' | 'cancelar-despacho' | 'custodia' | 'confirmar-recepcion' | 'cancelar-recepcion'
const titulos: Record<AccionDocumento, string> = { despachar: 'Confirmar salida', 'cancelar-despacho': 'Cancelar preparación', custodia: 'Registrar cambio de custodia', 'confirmar-recepcion': 'Confirmar recepción', 'cancelar-recepcion': 'Cancelar recepción' }
const consecuencias: Record<AccionDocumento, string> = {
  despachar: 'Confirma la salida de inventario en origen. Los productos quedarán en tránsito bajo custodia; la reserva se consumirá.',
  'cancelar-despacho': 'Cancela esta preparación y libera sus reservas. No cancela los otros despachos del traslado.',
  custodia: 'Registra un nuevo responsable y conserva el historial de custodia, condiciones y evidencia.',
  'confirmar-recepcion': 'Confirma el ingreso de las cantidades inspeccionadas. La aceptación irá a almacenamiento y la cuarentena o el rechazo quedarán segregados. El saldo restante seguirá en tránsito.',
  'cancelar-recepcion': 'Cancela este registro de inspección sin mover existencias. La evidencia se conserva y el saldo sigue pendiente de recepción.',
}
export function TrasladoDocumentoAccion({ accion, contexto, recepcion, onCerrar, onCompletado, onRecargar, onCambiosPendientes }: { accion: AccionDocumento; contexto: ContextoDespacho; recepcion?: DetalleRecepcion; onCerrar: () => void; onCompletado: () => void; onRecargar: () => void; onCambiosPendientes: (v: boolean) => void }) {
  const [datos, setDatos] = useState({ custodio: '', responsable: '', transporte: '', condiciones: '', evidencia: '', costeTransporte: '0.00', controlCompensatorio: '', motivo: '' }), [salir, setSalir] = useState(false)
  const { errores, error, guardando, conflicto, formulario, ejecutar, limpiarErrores } = useOperacionTraslado(), [inicial] = useState(() => JSON.stringify(datos)), sucio = JSON.stringify(datos) !== inicial
  useCambiosTraslado(sucio, onCambiosPendientes)
  const cambiar = (k: keyof typeof datos, valor: string) => { setDatos(d => ({ ...d, [k]: valor })); limpiarErrores() }
  const cerrar = () => { if (!guardando) { if (sucio) setSalir(true); else onCerrar() } }
  async function guardar() {
    const { despacho } = contexto
    const salida = { version: despacho.version, custodio: datos.custodio.trim(), transporte: datos.transporte.trim(), condiciones: datos.condiciones.trim(), evidencia: datos.evidencia.trim(), costeTransporte: datos.costeTransporte.trim(), controlCompensatorio: datos.controlCompensatorio.trim() || null }
    const custodia = { version: despacho.version, responsable: datos.responsable.trim(), condiciones: datos.condiciones.trim(), evidencia: datos.evidencia.trim() }
    const fallos = accion === 'despachar' ? validarSalida(salida) : accion === 'custodia' ? validarCustodia(custodia) : accion === 'confirmar-recepcion' ? {} : validarMotivo(datos.motivo)
    await ejecutar(fallos, async () => {
      if (accion === 'despachar') return despacharTraslado(despacho.id, salida)
      if (accion === 'custodia') return registrarCustodia(despacho.id, custodia)
      if (accion === 'cancelar-despacho') return cancelarDespacho(despacho.id, { version: despacho.version, motivo: datos.motivo.trim(), controlCompensatorio: null })
      if (!recepcion) throw new Error('No se encontró la recepción de esta operación.')
      if (accion === 'confirmar-recepcion') return confirmarRecepcion(recepcion.id, recepcion.version)
      return cancelarRecepcion(recepcion.id, { version: recepcion.version, motivo: datos.motivo.trim(), controlCompensatorio: null })
    }, () => { onCambiosPendientes(false); onCompletado() })
  }
  const campo = (clave: keyof typeof datos, etiqueta: string, ayuda: string, maxLength: number, area = true, requerido = true) => <CampoTraslado nombre={clave} etiqueta={etiqueta} value={datos[clave]} onChange={v => cambiar(clave, v)} error={errores[clave]} ayuda={ayuda} maxLength={maxLength} area={area} requerido={requerido} inputMode={clave === 'costeTransporte' ? 'decimal' : undefined} />
  return <><ModalEstado abierto={!salir} tipo={accion.startsWith('cancelar') ? 'advertencia' : 'informacion'} apariencia="formulario" titulo={titulos[accion]} cargando={guardando} onCerrar={cerrar} textoAccionPrincipal={conflicto ? 'Actualizar documento' : titulos[accion]} onAccionPrincipal={() => { if (conflicto) { onCambiosPendientes(false); onRecargar() } else formulario.current?.requestSubmit() }} textoAccionSecundaria="Volver" onAccionSecundaria={cerrar} mensaje={<form onSubmitCapture={validarCantidadesAlEnviar} ref={formulario} className={styles.modal} noValidate onSubmit={e => { e.preventDefault(); void guardar() }}>
    <p className={styles.aviso}><strong>{contexto.traslado.numero}</strong><br />{consecuencias[accion]}</p><ErrorTraslado error={error} /><fieldset disabled={guardando || conflicto}>
      {accion === 'despachar' && <>{campo('custodio', 'Custodio de la salida', 'Entre 3 y 150 caracteres.', 150, false)}{campo('transporte', 'Transporte', 'Identifica el medio de transporte, entre 3 y 250 caracteres.', 250, false)}{campo('costeTransporte', 'Coste de transporte (GTQ)', 'Coste logístico, hasta 2 decimales; 0 indica sin coste.', 16, false)}{campo('controlCompensatorio', 'Control compensatorio', 'Necesario si también preparaste este despacho. Documenta la revisión independiente (5 a 500 caracteres).', 500, true, false)}</>}
      {accion === 'custodia' && campo('responsable', 'Nuevo responsable de custodia', 'Entre 3 y 150 caracteres.', 150, false)}
      {(accion === 'custodia' || accion === 'despachar') && <>{campo('condiciones', 'Condiciones de transporte y conservación', 'Entre 5 y 500 caracteres.', 500)}{campo('evidencia', 'Evidencia', 'Referencia documental de la entrega y verificación, entre 5 y 500 caracteres.', 500)}</>}
      {accion.startsWith('cancelar') && campo('motivo', 'Motivo de cancelación', 'Entre 5 y 250 caracteres.', 250)}
    </fieldset>{conflicto && <p className={styles.aviso}>Actualiza y revisa el documento antes de continuar. Se descartarán los datos de esta operación.</p>}
  </form>} /><ModalEstado abierto={salir} tipo="advertencia" titulo="Datos sin guardar" mensaje="Los datos de esta operación aún no se guardaron." textoAccionPrincipal="Seguir editando" onAccionPrincipal={() => setSalir(false)} textoAccionSecundaria="Descartar y volver" onAccionSecundaria={() => { onCambiosPendientes(false); onCerrar() }} onCerrar={() => setSalir(false)} /></>
}
