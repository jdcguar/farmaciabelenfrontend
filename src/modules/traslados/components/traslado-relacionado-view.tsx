import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { obtenerTraslado } from '../traslado-api'
import { puedeComplementario, puedeRetorno } from '../traslado-incidencias-reglas'
import { useCargaTraslado } from '../traslado-hooks'
import { CargaOperacion, NoDisponible } from './traslado-operacion-comun'
import { TrasladoCrearView } from './traslado-crear-view'

export function TrasladoRelacionadoView({ id, modo, sesion, onNavegar, onCambiosPendientes }: { id: string; modo: 'retorno' | 'complementario'; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const carga = useCargaTraslado(id, obtenerTraslado), volver = () => onNavegar(`/traslados/${id}`)
  if (carga.cargando || carga.error || !carga.documento) return <CargaOperacion {...carga} volver={volver} />
  if (!(modo === 'retorno' ? puedeRetorno(carga.documento, sesion) : puedeComplementario(carga.documento, sesion))) return <NoDisponible volver={volver} mensaje={modo === 'retorno' ? 'Solicitar un retorno requiere un traslado despachado y permiso CREAR en el destino del nuevo retorno (origen del traslado original), o alcance corporativo.' : 'Crear un complementario requiere acceso a un punto participante, permiso CREAR y un traslado preparado, en tránsito o recibido.'} />
  return <TrasladoCrearView key={`${id}:${modo}:${carga.documento.version}`} sesion={sesion} onNavegar={onNavegar} onCambiosPendientes={onCambiosPendientes} relacionada={{ traslado: carga.documento, modo }} />
}
