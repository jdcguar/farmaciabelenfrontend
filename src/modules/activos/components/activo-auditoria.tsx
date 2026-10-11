import { useCallback, useState } from 'react'
import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import { PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import type { EventoAuditoria } from '../../catalogos-farmacia/catalogo.types'
import { auditoriaActivo } from '../activo-api'
import { useConsultaActivo } from '../activo-hooks'
import { fechaActivo } from '../activo-reglas'
import type { Recurso } from '../activo.types'
import { CargaActivo } from './activo-comun'
import detalle from '../../empleados/components/empleado-gestion.module.css'
import styles from '../activos.module.css'
export function ActivoAuditoria({ recurso, id, revision }: { recurso: Recurso; id: string; revision: number }) {
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamano] = useState(50), [reintento, setReintento] = useState(0), [expandido, setExpandido] = useState('')
  const cargar = useCallback((s: AbortSignal) => auditoriaActivo(recurso, id, pagina, tamanoPagina, s), [id, pagina, recurso, tamanoPagina]), consulta = useConsultaActivo(`${recurso}:${id}:${pagina}:${tamanoPagina}:${revision}:${reintento}`, cargar)
  const columnas: ColumnaTabla<EventoAuditoria>[] = [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: e => e.ocurridoEn, celda: e => fechaActivo(e.ocurridoEn) },
    { id: 'operacion', titulo: 'Operación', obtenerValor: e => e.tipoOperacion, celda: e => e.tipoOperacion },
    { id: 'usuario', titulo: 'Realizado por', obtenerValor: e => e.usuarioNombre, celda: e => e.usuarioNombre ?? 'Sistema' },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: e => e.sucursal?.nombre, celda: e => e.sucursal?.nombre ?? 'Sin sucursal' },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: e => e.resumen, celda: e => e.resumen ?? 'Sin resumen' },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: e => e.detalles.length, celda: e => <button type="button" className={detalle.botonCambiosAuditoria} aria-expanded={expandido === e.id} onClick={() => setExpandido(v => v === e.id ? '' : e.id)}>{expandido === e.id ? 'Ocultar cambios' : 'Ver cambios'}</button> },
  ]
  return <article id="auditoria" className={`${detalle.tarjetaDetalle} ${styles.completa}`}><h2>Auditoría</h2><CargaActivo {...consulta} onReintentar={() => setReintento(v => v + 1)} />{consulta.dato && <><ListaAuditoria descripcion="Historial del registro de Activos Fijos" datos={consulta.dato.items} columnas={columnas} obtenerIdFila={e => e.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} renderizarFilaExpandida={e => e.id === expandido ? <CambiosAuditoria id={`auditoria-${e.id}`} detalles={e.detalles} formatearValor={v => v ?? 'Sin dato'} /> : null} />{!consulta.dato.items.length && <p>No hay eventos registrados.</p>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={consulta.dato.total} totalPaginas={consulta.dato.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={v => { setTamano(v); setPagina(1) }} /></>}</article>
}
