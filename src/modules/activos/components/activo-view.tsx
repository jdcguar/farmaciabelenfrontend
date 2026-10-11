import type { RutaActivo } from '../activo.config'
import type { ContextoActivo } from '../activo.types'
import { ActivoListadoView } from './activo-listado-view'
import { ActivoFormularioView } from './activo-formulario-view'
import { ActivoDetalleView } from './activo-detalle-view'
import { AsignacionCrearView } from './asignacion-crear-view'
import { AsignacionRevisionView } from './asignacion-revision-view'
import { DevolucionOperacionView } from './devolucion-operacion-view'
export function ActivoView(props: ContextoActivo & { ruta: RutaActivo }) {
  if (props.ruta.vista === 'listado') return <ActivoListadoView {...props} recurso={props.ruta.recurso} />
  if (props.ruta.vista === 'crear' && props.ruta.recurso === 'asignaciones') return <AsignacionCrearView {...props} />
  if (props.ruta.vista === 'crear' || props.ruta.vista === 'editar') return <ActivoFormularioView {...props} />
  if (props.ruta.vista === 'revision' || props.ruta.vista === 'solicitar') return <AsignacionRevisionView {...props} />
  if (props.ruta.vista === 'recibir' || props.ruta.vista === 'resolver') return <DevolucionOperacionView {...props} />
  return <ActivoDetalleView {...props} />
}
