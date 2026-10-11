import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { RutaCaja } from '../caja.config'
import { CajaListadoView } from './caja-listado-view'
import { CajaPoliticaView } from './caja-politica-view'
import { CajaOperacionView } from './caja-operacion-view'
import { CajaDetalleView } from './caja-detalle-view'
import { CajaConsolidadoView } from './caja-consolidado-view'
import styles from '../caja.module.css'
export function CajaView({ ruta, consulta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaCaja; consulta: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const props = { sesion, onNavegar, onCambiosPendientes }
  return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}>{ruta.modo === 'consolidado' ? <CajaConsolidadoView {...props} /> : ruta.modo === 'listado' ? <CajaListadoView recurso={ruta.recurso} consulta={consulta} {...props} /> : ruta.recurso === 'politicas' && (ruta.modo === 'crear' || ruta.modo === 'editar') ? <CajaPoliticaView id={ruta.id} {...props} /> : ruta.modo === 'crear' || ruta.modo === 'operacion' ? <CajaOperacionView ruta={ruta} {...props} /> : <CajaDetalleView ruta={ruta} {...props} />}</div></ReferenciasCatalogo>
}
