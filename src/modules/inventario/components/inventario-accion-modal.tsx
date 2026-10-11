import { useRef, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { ejecutarAccion } from '../inventario-api'
import { etiqueta } from '../inventario.config'
import type { AccionInventario, RecursoInventario, RegistroInventario } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { ValorInventario } from './inventario-datos'
import styles from '../inventario.module.css'
import empleado from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

const acciones: Record<AccionInventario, { titulo: string; mensaje: string }> = {
  confirmar: { titulo: 'Confirmar movimiento', mensaje: 'Se actualizarán las existencias y se registrarán las entradas o salidas en el kardex. El movimiento confirmado conservará su historial.' },
  anular: { titulo: 'Anular movimiento pendiente', mensaje: 'El movimiento quedará anulado. Al estar pendiente, no ha cambiado las existencias.' },
  preparar: { titulo: 'Preparar reserva', mensaje: 'Se asignarán posiciones aptas según FEFO. La preparación conserva el compromiso existente y no genera una salida física.' },
  cancelar: { titulo: 'Cancelar registro', mensaje: 'Se cancelará este registro. En reservas se libera el compromiso; en conteos se retira la congelación sin ajustar existencias.' },
  levantar: { titulo: 'Levantar bloqueo operativo', mensaje: 'Se levantará este bloqueo. Las demás restricciones activas sobre el inventario seguirán aplicándose.' },
  cerrar: { titulo: 'Cerrar conteo físico', mensaje: 'Los resultados quedarán cerrados para edición. La ubicación seguirá congelada hasta conciliar o cancelar.' },
  conciliar: { titulo: 'Conciliar conteo físico', mensaje: 'Las diferencias se convertirán en ajustes confirmados y actualizarán existencias y kardex. Revisa las cantidades antes de continuar.' },
}
export function InventarioAccionModal({ recurso, registro, accion, onCerrar, onActualizado, onRecargar, apariencia }: { recurso: RecursoInventario; registro: RegistroInventario; accion: AccionInventario; onCerrar: () => void; onActualizado: (r: RegistroInventario) => void; onRecargar: () => void; apariencia?: 'empleados' }) {
  const [motivo, setMotivo] = useState('')
  const [evidencia, setEvidencia] = useState('')
  const [dias, setDias] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const enviando = useRef(false)
  const conMotivo = !['confirmar', 'preparar'].includes(accion)
  const titulo = apariencia && recurso === 'conteos' && accion === 'cancelar' ? 'Cancelar conteo' : apariencia && recurso === 'reservas' && accion === 'cancelar' ? 'Cancelar reserva' : acciones[accion].titulo
  const mensaje = apariencia && recurso === 'conteos' && accion === 'cancelar' ? 'Se cancelará el conteo y se retirará la congelación de la ubicación sin ajustar las existencias. Registra el motivo de la cancelación.' : apariencia && recurso === 'reservas' && accion === 'cancelar' ? 'Se cancelará la reserva y se liberará el compromiso de stock. Registra el motivo de la cancelación.' : acciones[accion].mensaje
  async function ejecutar() {
    if (enviando.current || conflicto) return
    if (conMotivo && motivo.trim().length < 5 || accion === 'levantar' && evidencia.trim().length < 5 || accion === 'preparar' && (!/^\d+$/.test(dias) || Number(dias) > 36500)) { setError('Completa los justificantes (mínimo 5 caracteres) y verifica los días de vida útil.'); return }
    enviando.current = true; setGuardando(true); setError(null)
    try { const r = await ejecutarAccion(recurso, registro.id, accion, { version: registro.version, ...(conMotivo ? { motivo: motivo.trim() } : {}), ...(accion === 'levantar' ? { evidencia: evidencia.trim() } : {}), ...(accion === 'preparar' ? { vidaUtilMinimaDias: Number(dias) } : {}) }); onActualizado(r); onCerrar() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); setConflicto(e instanceof ErrorApi && e.estadoHttp === 409) }
    finally { setGuardando(false); enviando.current = false }
  }
  return <ModalEstado abierto tipo="advertencia" titulo={titulo} apariencia="formulario" cargando={guardando} textoAccionPrincipal={conflicto ? 'Recargar registro' : titulo} onAccionPrincipal={conflicto ? onRecargar : () => void ejecutar()} textoAccionSecundaria="Cancelar" onAccionSecundaria={onCerrar} onCerrar={onCerrar} mensaje={<div className={apariencia ? local.contenidoModal : `${styles.lista} ${styles.modulo}`}>
    <strong>{apariencia && recurso === 'bloqueos' ? `Bloqueo de ${etiqueta(registro.alcance ?? '').toLowerCase()}` : registro.numero ?? registro.referencia ?? `Registro ${registro.id}`}</strong>{apariencia && recurso === 'bloqueos' && <ValorInventario campo="objetivoId" registro={registro} />}<p>{mensaje}</p><small>Versión revisada: {registro.version}</small>
    {conMotivo && <CampoInventario apariencia={apariencia} prefijo="accion-" campo={{ clave: 'motivo', etiqueta: 'Motivo de la operación', tipo: 'area', requerido: true, maximo: 250 }} value={motivo} onChange={setMotivo} disabled={guardando} />}
    {accion === 'levantar' && <CampoInventario apariencia={apariencia} prefijo="accion-" campo={{ clave: 'evidencia', etiqueta: 'Evidencia del levantamiento', tipo: 'area', requerido: true, maximo: 500 }} value={evidencia} onChange={setEvidencia} disabled={guardando} />}
    {accion === 'preparar' && <CampoInventario apariencia={apariencia} prefijo="accion-" campo={{ clave: 'vidaUtilMinimaDias', etiqueta: 'Vida útil mínima (días)', tipo: 'entero', requerido: true, ayuda: 'Se verifica durante la selección de los lotes.' }} value={dias} onChange={setDias} disabled={guardando} />}
    {error && <p className={apariencia ? empleado.alertaError : styles.error} role="alert">{error}{conflicto && ' Recarga el registro para revisar su estado actual.'}</p>}
  </div>} />
}
