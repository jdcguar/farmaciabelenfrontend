import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { RutaSanitaria, RecursoSanitario } from '../sanitaria.config'
import type { PropsSanitaria } from '../sanitaria.types'
import { SanitariaListadoView } from './sanitaria-listado-view'
import { SanitariaDetalleView } from './sanitaria-detalle-view'
import { SanitariaOperacionView } from './sanitaria-operacion-view'
import styles from '../sanitaria.module.css'
export function SanitariaView({ ruta, consulta, ...props }: { ruta: RutaSanitaria; consulta: string } & PropsSanitaria) { return <ReferenciasCatalogo sesion={props.sesion} onNavegar={props.onNavegar}><div className={styles.modulo}>{ruta.modo === 'listado' ? <SanitariaListadoView vista={ruta.vista} consulta={consulta} {...props}/> : ruta.modo === 'detalle' ? <SanitariaDetalleView vista={ruta.vista as RecursoSanitario} id={ruta.id!} {...props}/> : <SanitariaOperacionView ruta={ruta} consulta={consulta} {...props}/>}</div></ReferenciasCatalogo> }
