import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import type { ClaveCatalogo } from '../catalogo.types'
import { catalogos } from '../catalogos.config'
import type { VistaCatalogo } from '../catalogo-rutas'
import { CatalogoDetalleView } from './catalogo-detalle-view'
import { CatalogoFormularioView } from './catalogo-formulario-view'
import { CatalogoListadoView } from './catalogo-listado-view'
import { ReferenciasCatalogo } from './referencia-catalogo'
type Props = { clave: ClaveCatalogo; vista: VistaCatalogo; id?: string; sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (pendientes: boolean) => void }
export function CatalogoFarmaciaView({ clave, vista, id, sesion, onNavegar, onCambiosPendientes }: Props) {
  const catalogo = catalogos[clave]
  return <ReferenciasCatalogo key={`${sesion.usuarioId}-${clave}-${vista}-${id ?? ''}`} sesion={sesion} onNavegar={onNavegar}>
    {vista === 'listado' ? <CatalogoListadoView catalogo={catalogo} /> : vista === 'crear' || vista === 'editar' ? <CatalogoFormularioView catalogo={catalogo} id={vista === 'editar' ? id : undefined} onCambiosPendientes={onCambiosPendientes} /> : <CatalogoDetalleView catalogo={catalogo} id={id!} />}
  </ReferenciasCatalogo>
}
