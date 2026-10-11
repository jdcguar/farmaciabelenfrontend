import { useEffect, useState } from 'react'
import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import { PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { auditoriaCompra } from '../compra-api'
import type { EventoAuditoria, Paginado, RecursoCompra } from '../compra.types'
import { fechaHora } from '../compra-reglas'
import { EstadoCargaCompra } from './compra-campo'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import styles from '../compra.module.css'
export function CompraAuditoria({ recurso, id, revision }: { recurso: RecursoCompra; id: string; revision: number }) {
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50), [reintento, setReintento] = useState(0), [expandido, setExpandido] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Paginado<EventoAuditoria> | null>(null), [error, setError] = useState<unknown>(null), [finalizada, setFinalizada] = useState(''), clave = JSON.stringify({ recurso, id, revision, reintento, pagina, tamanoPagina }), cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController(); void auditoriaCompra(recurso, id, pagina, tamanoPagina, c.signal).then(r => { if (!c.signal.aborted) { setResultado(r); setError(null); if (pagina > Math.max(1, r.totalPaginas)) setPagina(Math.max(1, r.totalPaginas)) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort()
  }, [clave, id, pagina, recurso, tamanoPagina])
  const columnas: ColumnaTabla<EventoAuditoria>[] = [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: e => e.ocurridoEn, celda: e => fechaHora(e.ocurridoEn) },
    { id: 'operacion', titulo: 'Acción', obtenerValor: e => e.tipoOperacion, celda: e => e.tipoOperacion },
    { id: 'usuario', titulo: 'Realizado por', obtenerValor: e => e.usuarioNombre, celda: e => e.usuarioNombre ?? 'Sistema' },
    { id: 'sucursal', titulo: 'Sucursal del actor', obtenerValor: e => e.sucursal?.nombre, celda: e => e.sucursal?.nombre ?? 'Sin sucursal' },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: e => e.resumen, celda: e => e.resumen ?? 'Sin resumen' },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: e => e.detalles.length, celda: e => <button type="button" className={styles.enlace} aria-expanded={expandido === e.id} onClick={() => setExpandido(p => p === e.id ? null : e.id)}>{expandido === e.id ? 'Ocultar' : 'Ver cambios'}</button> },
  ]
  return <article id="compra-auditoria" className={gestion.tarjetaDetalle}><div className={styles.panel}><h2>Auditoría</h2><p className={styles.intro}>Historial del registro, del evento más reciente al más antiguo.</p></div><EstadoCargaCompra cargando={cargando} error={error} onReintentar={() => setReintento(r => r + 1)} />{!cargando && !error && resultado && <><ListaAuditoria descripcion="Auditoría de Compras" datos={resultado.items} columnas={columnas} obtenerIdFila={e => e.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} renderizarFilaExpandida={e => e.id === expandido ? <CambiosAuditoria id={`compra-evento-${e.id}`} detalles={e.detalles} formatearValor={v => v ?? 'Sin dato'} /> : null} />{!resultado.items.length && <p className={styles.vacío}>No hay eventos registrados.</p>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={t => { setTamanoPagina(t); setPagina(1) }} /></>}</article>
}
