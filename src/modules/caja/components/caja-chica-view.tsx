import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { LiquidacionesSucursal } from '../../sucursales/components/liquidaciones-sucursal'
import type { RutaCajaChica } from '../caja-chica.config'
import { CajaChicaListados } from './caja-chica-listados'
import styles from '../caja.module.css'

export function CajaChicaView({ ruta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaCajaChica; sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (pendientes: boolean) => void }) {
  return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}>
    {ruta.modo === 'detalle' ? <LiquidacionesSucursal sucursalId={ruta.sucursalId!} liquidacionId={ruta.id!} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} /> : <CajaChicaListados modo={ruta.modo} sucursalInicial={ruta.sucursalId} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} />}
  </div></ReferenciasCatalogo>
}
