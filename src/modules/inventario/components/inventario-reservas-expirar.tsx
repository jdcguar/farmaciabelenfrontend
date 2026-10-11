import { useRef, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { expirarReservas } from '../inventario-api'
import { CampoInventario } from './inventario-campo'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

export function InventarioReservasExpirar({ sucursalInicial, onActualizado }: { sucursalInicial: string; onActualizado: () => void }) {
  const { sesion } = useContextoCatalogo()
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const [abierto, setAbierto] = useState(false), [sucursal, setSucursal] = useState(sucursalInicial)
  const [error, setError] = useState<string | null>(null), [mensaje, setMensaje] = useState<string | null>(null), [guardando, setGuardando] = useState(false)
  const enviando = useRef(false)
  async function ejecutar() {
    if (enviando.current) return
    if (!sucursal) { setError('Selecciona una sucursal.'); document.getElementById('expirar-sucursalId')?.focus(); return }
    enviando.current = true; setGuardando(true); setError(null)
    try { const r = await expirarReservas(sucursal); setAbierto(false); setMensaje(`${r.expiradas} reservas cerradas. Límite por operación: ${r.limiteLote}.`); onActualizado() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.') }
    finally { setGuardando(false); enviando.current = false }
  }
  return <>
    <button type="button" className={local.botonSecundarioListado} onClick={() => { setSucursal(corporativo ? sucursalInicial : sesion.sucursal.id); setError(null); setAbierto(true) }}>Cerrar reservas expiradas</button>
    <ModalEstado abierto={abierto} apariencia="formulario" tipo="advertencia" titulo="Cerrar reservas expiradas" cargando={guardando} mensaje={<div className={local.contenidoModal}>
      <p>Se cerrarán hasta 200 reservas vencidas de la sucursal elegida. Puedes repetir la operación si quedan más.</p>
      <CampoInventario apariencia="empleados" prefijo="expirar-" campo={{ clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales', requerido: true }} value={sucursal} onChange={setSucursal} soloSucursalActual={!corporativo} disabled={guardando} />
      {error && <div className={styles.alertaError} role="alert"><p>{error}</p></div>}
    </div>} textoAccionPrincipal="Cerrar expiradas" onAccionPrincipal={() => void ejecutar()} textoAccionSecundaria="Cancelar" onAccionSecundaria={() => setAbierto(false)} onCerrar={() => setAbierto(false)} />
    <ModalEstado abierto={Boolean(mensaje)} tipo="exito" titulo="Operación completada" mensaje={mensaje} textoAccionPrincipal="Continuar" onAccionPrincipal={() => setMensaje(null)} onCerrar={() => setMensaje(null)} />
  </>
}
