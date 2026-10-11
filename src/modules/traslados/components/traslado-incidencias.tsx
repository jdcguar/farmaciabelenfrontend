import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { puedeComplementario, puedeIncidencia, puedeJustificar, puedeResolver, resolucionesIncidencia, tiposIncidencia } from '../traslado-incidencias-reglas'
import { cantidadTexto, fechaHora } from '../traslado-reglas'
import type { DetalleTraslado } from '../traslado.types'
import { TablaControl } from './traslado-operacion-comun'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../traslado.module.css'

export function TrasladoIncidencias({ traslado, sesion, onNavegar }: { traslado: DetalleTraslado; sesion: SesionUsuario; onNavegar: (ruta: string) => void }) {
  return <><div className={styles.accionesIncidencia}>
    {puedeIncidencia(traslado, sesion) && <button type="button" className={form.botonPrincipal} onClick={() => onNavegar(`/traslados/${traslado.id}/incidencias/nueva`)}>Registrar incidencia</button>}
    {puedeComplementario(traslado, sesion) && traslado.incidencias.some(i => i.estado === 'ABIERTA') && <button type="button" className={form.botonSecundario} onClick={() => onNavegar(`/traslados/${traslado.id}/complementario`)}>Crear traslado complementario</button>}
  </div>{traslado.incidencias.length ? traslado.incidencias.map((i, indice) => <article key={i.id}>
    <h3>Incidencia {indice + 1} · {tiposIncidencia[i.tipo]}</h3><span className={styles.estado} data-estado={i.estado}>{i.estado === 'ABIERTA' ? 'Abierta' : 'Resuelta'}</span>
    <p>{i.descripcion}</p><TablaControl datos={[
      ['Cantidad observada en base', cantidadTexto(i.cantidadBase)], ['Evidencia original', i.evidencia], ['Asignación de referencia', i.asignacionId ?? 'Sin asignación'], ['Versión de incidencia', i.version], ['Resolución', i.resolucion ? resolucionesIncidencia[i.resolucion] : 'Pendiente'], ['Motivo de resolución', i.motivoResolucion ?? 'Sin resolución'], ['Resuelta', fechaHora(i.resueltaEn)],
    ]} />{i.trasladoRelacionadoId && <p>Traslado relacionado: <button type="button" className={styles.enlace} onClick={() => onNavegar(`/traslados/${i.trasladoRelacionadoId}`)}>{i.trasladoRelacionadoId}</button></p>}
    <div className={styles.accionesIncidencia}>
      {puedeResolver(traslado, i, sesion) && <button type="button" className={form.botonSecundario} onClick={() => onNavegar(`/traslados/${traslado.id}/incidencias/${i.id}/resolver`)}>Resolver incidencia {indice + 1}</button>}
      {puedeJustificar(traslado, i, sesion) && <button type="button" className={form.botonSecundario} onClick={() => onNavegar(`/traslados/${traslado.id}/incidencias/${i.id}/justificar`)}>Justificar faltante {indice + 1}</button>}
    </div>
  </article>) : <p className={styles.intro}>No hay incidencias registradas.</p>}</>
}
