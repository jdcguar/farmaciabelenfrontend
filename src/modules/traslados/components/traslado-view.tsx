import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { RutaTraslado } from '../traslado.config'
import { TrasladoListadoView } from './traslado-listado-view'
import { TrasladoDocumentosListadoView } from './traslado-documentos-listado-view'
import { TrasladoCrearView } from './traslado-crear-view'
import { TrasladoDetalleView } from './traslado-detalle-view'
import { TrasladoPrepararView } from './traslado-preparar-view'
import { TrasladoDespachoView } from './traslado-despacho-view'
import { TrasladoRecibirView } from './traslado-recibir-view'
import { TrasladoRecepcionView } from './traslado-recepcion-view'
import { TrasladoIncidenciaView } from './traslado-incidencia-view'
import { TrasladoResolverView } from './traslado-resolver-view'
import { TrasladoRelacionadoView } from './traslado-relacionado-view'
import styles from '../traslado.module.css'
export function TrasladoView({ ruta, consulta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaTraslado; consulta: string; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const props = { id: ruta.id!, sesion, onNavegar, onCambiosPendientes }
  if (ruta.modo === 'despachos' || ruta.modo === 'recepciones') return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}><TrasladoDocumentosListadoView recurso={ruta.modo} sesion={sesion} consulta={consulta} onNavegar={onNavegar} /></div></ReferenciasCatalogo>
  if (ruta.modo === 'incidencia' || ruta.modo === 'resolver' || ruta.modo === 'justificar' || ruta.modo === 'retorno' || ruta.modo === 'complementario') return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}>{ruta.modo === 'incidencia' ? <TrasladoIncidenciaView {...props} /> : ruta.modo === 'resolver' || ruta.modo === 'justificar' ? <TrasladoResolverView {...props} incidenciaId={ruta.incidenciaId!} justificar={ruta.modo === 'justificar'} /> : <TrasladoRelacionadoView {...props} modo={ruta.modo} />}</div></ReferenciasCatalogo>
  return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><div className={styles.modulo}>{ruta.modo === 'listado' ? <TrasladoListadoView sesion={sesion} consulta={consulta} onNavegar={onNavegar} /> : ruta.modo === 'crear' ? <TrasladoCrearView sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} /> : ruta.modo === 'preparar' ? <TrasladoPrepararView {...props} /> : ruta.modo === 'despacho' ? <TrasladoDespachoView {...props} /> : ruta.modo === 'recibir' ? <TrasladoRecibirView {...props} /> : ruta.modo === 'recepcion' ? <TrasladoRecepcionView {...props} /> : <TrasladoDetalleView {...props} />}</div></ReferenciasCatalogo>
}
