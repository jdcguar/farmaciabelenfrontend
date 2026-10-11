import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { RutaInventario } from '../inventario.config'
import type { RecursoInventario, TipoMovimiento } from '../inventario.types'
import { ReferenciasInventario } from './inventario-datos'
import { InventarioListadoView } from './inventario-listado-view'
import { InventarioDetalleView } from './inventario-detalle-view'
import { InventarioFormularioView } from './inventario-formulario-view'
import { InventarioConteoResultados } from './inventario-conteo-resultados'
import { InventarioDisponibilidadView } from './inventario-disponibilidad-view'
import { InventarioParametrosView } from './inventario-parametros-view'
import { InventarioPosicionesListadoView } from './inventario-posiciones-listado-view'

export function InventarioView({ ruta, consulta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaInventario; consulta: string; sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (valor: boolean) => void }) {
  const query = new URLSearchParams(consulta)
  const contenido = ruta.modo === 'crear' ? <InventarioFormularioView vista={ruta.vista} tipoInicial={query.get('tipo') as TipoMovimiento | null} onCambiosPendientes={onCambiosPendientes} />
    : ruta.modo === 'resultados' ? <InventarioConteoResultados id={ruta.id!} onCambiosPendientes={onCambiosPendientes} />
    : ruta.modo === 'detalle' ? <InventarioDetalleView recurso={ruta.vista as RecursoInventario} id={ruta.id!} />
    : ruta.vista === 'disponibilidad' || ruta.vista === 'fefo' ? <InventarioDisponibilidadView fefo={ruta.vista === 'fefo'} />
    : ruta.vista === 'parametros' ? <InventarioParametrosView onCambiosPendientes={onCambiosPendientes} />
    : ruta.vista === 'carga-inicial' ? <InventarioPosicionesListadoView recurso="movimientos" cargasIniciales />
    : ruta.vista === 'ajustes' ? <InventarioPosicionesListadoView recurso="movimientos" ajustes />
    : ruta.vista === 'lotes' || ruta.vista === 'existencias' || ruta.vista === 'kardex' || ruta.vista === 'reservas' || ruta.vista === 'movimientos' || ruta.vista === 'bloqueos' || ruta.vista === 'cuarentenas' || ruta.vista === 'conteos' || ruta.vista === 'vencimientos' ? <InventarioPosicionesListadoView recurso={ruta.vista} existenciaInicial={query.get('existenciaId') ?? undefined} />
    : <InventarioListadoView recurso={ruta.vista as RecursoInventario | 'vencimientos'} existenciaInicial={query.get('existenciaId') ?? undefined} />
  return <ReferenciasCatalogo sesion={sesion} onNavegar={onNavegar}><ReferenciasInventario>{contenido}</ReferenciasInventario></ReferenciasCatalogo>
}
