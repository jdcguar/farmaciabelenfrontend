import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { RutaCompra } from '../compra.config'
import type { RecursoDocumento } from '../compra.types'
import { CompraListadoView } from './compra-listado-view'
import { CompraDetalleView } from './compra-detalle-view'
import { CompraCrearView } from './compra-crear-view'
import { CompraComparacionView } from './compra-comparacion-view'
import { RecepcionInspeccionView } from './recepcion-inspeccion-view'
import styles from '../compra.module.css'
export function CompraView({ ruta, consulta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaCompra; consulta: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}>
    {ruta.modo === 'listado' ? <CompraListadoView recurso={ruta.recurso} sesion={sesion} consultaInicial={consulta} onNavegar={onNavegar} /> : ruta.modo === 'crear' || ruta.modo === 'revision' ? <CompraCrearView recurso={ruta.recurso as RecursoDocumento} revisionId={ruta.modo === 'revision' ? ruta.id : undefined} consulta={consulta} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} /> : ruta.modo === 'comparacion' ? <CompraComparacionView id={ruta.id!} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} /> : ruta.modo === 'inspeccion' ? <RecepcionInspeccionView id={ruta.id!} etapa={ruta.etapa!} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} /> : <CompraDetalleView recurso={ruta.recurso} id={ruta.id!} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} />}
  </div></ReferenciasCatalogo>
}
