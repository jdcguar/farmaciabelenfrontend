import { useEffect, useState } from 'react'
import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import { PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import type { EventoAuditoria } from '../../catalogos-farmacia/catalogo.types'
import { auditoriaTraslado } from '../traslado-api'
import { fechaHora } from '../traslado-reglas'
import type { Paginado } from '../traslado.types'
import { CargaTraslado } from './traslado-campo'
import gestion from '../../empleados/components/empleado-gestion.module.css'
import styles from '../traslado.module.css'
export function TrasladoAuditoria({ id, revision, numero = '06' }: { id: string; revision: number; numero?: string }) {
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50), [reintento, setReintento] = useState(0), [expandido, setExpandido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Paginado<EventoAuditoria> | null>(null), [error, setError] = useState<unknown>(null), [finalizada, setFinalizada] = useState('')
  const clave = JSON.stringify({ id, revision, reintento, pagina, tamanoPagina }), cargando = finalizada !== clave
  useEffect(() => { const c = new AbortController(); void auditoriaTraslado(id, pagina, tamanoPagina, c.signal).then(r => { if (!c.signal.aborted) { setResultado(r); setError(null); if (pagina > Math.max(1, r.totalPaginas)) setPagina(Math.max(1, r.totalPaginas)) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort() }, [clave, id, pagina, tamanoPagina])
  const columnas: ColumnaTabla<EventoAuditoria>[] = [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: e => e.ocurridoEn, celda: e => fechaHora(e.ocurridoEn) },
    { id: 'accion', titulo: 'Acción', obtenerValor: e => e.tipoOperacion, celda: e => e.tipoOperacion },
    { id: 'usuario', titulo: 'Realizado por', obtenerValor: e => e.usuarioNombre, celda: e => e.usuarioNombre ?? 'Sistema' },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: e => e.sucursal?.nombre, celda: e => e.sucursal?.nombre ?? 'Sin sucursal' },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: e => e.resumen, celda: e => e.resumen ?? 'Sin resumen' },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: e => e.detalles.length, celda: e => <button type="button" className={styles.enlace} aria-expanded={expandido === e.id} onClick={() => setExpandido(v => v === e.id ? null : e.id)}>{expandido === e.id ? 'Ocultar cambios' : 'Ver cambios'}</button> },
  ]
  return <article id="detalle-auditoria" className={`${gestion.tarjetaDetalle} ${styles.tarjetaCompleta}`}><h2><span className={gestion.numeroSeccion}>{numero}</span>Auditoría</h2><CargaTraslado cargando={cargando} error={error} onReintentar={() => setReintento(v => v + 1)} />{!cargando && !error && resultado && <><ListaAuditoria descripcion="Auditoría del traslado" datos={resultado.items} columnas={columnas} obtenerIdFila={e => e.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} renderizarFilaExpandida={e => e.id === expandido ? <CambiosAuditoria id={`evento-${e.id}`} detalles={e.detalles} formatearValor={v => v ?? 'Sin dato'} /> : null} />{!resultado.items.length && <p className={styles.intro}>No hay eventos registrados.</p>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={v => { setTamanoPagina(v); setPagina(1) }} /></>}</article>
}
