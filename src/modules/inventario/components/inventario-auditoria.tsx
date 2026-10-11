import { useEffect, useMemo, useState } from 'react'
import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import { PaginacionTabla, type ColumnaTabla, type ColumnFiltersState, type SortingState } from '../../../shared/components/tabla-datos'
import type { EventoAuditoria, Paginado } from '../../catalogos-farmacia/catalogo.types'
import { auditoriaInventario } from '../inventario-api'
import type { RecursoInventario } from '../inventario.types'
import { fechaHora } from '../inventario-reglas'
import { MensajeCarga } from './inventario-datos'
import auditoria from '../../../shared/components/auditoria/auditoria.module.css'
import empleado from '../../empleados/components/empleado-gestion.module.css'

export function InventarioAuditoria({ recurso, id, revision, apariencia }: { recurso: RecursoInventario; id: string; revision: number; apariencia?: 'empleados' }) {
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50)
  const [filtros, setFiltros] = useState<ColumnFiltersState>([]), [orden, setOrden] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [expandido, setExpandido] = useState<string | null>(null), [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState<Paginado<EventoAuditoria> | null>(null), [error, setError] = useState<string | null>(null), [finalizada, setFinalizada] = useState('')
  const parametros = useMemo(() => ({ pagina, tamanoPagina, fecha: String(filtros.find(f => f.id === 'fecha')?.value ?? '') || undefined, orden: orden[0]?.id ?? 'fecha', direccion: orden[0]?.desc === false ? 'asc' : 'desc' }), [filtros, orden, pagina, tamanoPagina])
  const clave = JSON.stringify({ parametros, revision, reintento, recurso, id }), cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void auditoriaInventario(recurso, id, parametros, c.signal).then(r => { if (c.signal.aborted) return; if (pagina > Math.max(1, r.totalPaginas)) { setPagina(Math.max(1, r.totalPaginas)); return }; setResultado(r); setError(null) }).catch((e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar la auditoría.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, id, pagina, parametros, recurso])
  const columnas: ColumnaTabla<EventoAuditoria>[] = [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: e => e.ocurridoEn, celda: e => fechaHora(e.ocurridoEn), ordenable: true, filtro: { tipo: 'fecha', etiqueta: 'Fecha del evento' } },
    { id: 'operacion', titulo: 'Acción', obtenerValor: e => e.tipoOperacion, celda: e => e.tipoOperacion, ordenable: true },
    { id: 'usuario', titulo: 'Realizado por', obtenerValor: e => e.usuarioNombre, celda: e => e.usuarioNombre ?? 'Sistema', ordenable: true },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: e => e.sucursal?.nombre, celda: e => e.sucursal?.nombre ?? 'Sin sucursal', ordenable: true },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: e => e.resumen, celda: e => e.resumen ?? 'Sin resumen', ordenable: true },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: e => e.detalles.length, celda: e => <button type="button" className={auditoria.botonCambios} aria-expanded={expandido === e.id} onClick={() => setExpandido(prev => prev === e.id ? null : e.id)}>{expandido === e.id ? 'Ocultar' : 'Ver cambios'}</button> },
  ]
  return <article className={apariencia === 'empleados' ? empleado.tarjetaDetalle : auditoria.panel} id="inv-auditoria">{apariencia === 'empleados' ? <div className={empleado.tituloHistorial}><div><h2>Auditoría del registro</h2><p>Filtra u ordena desde el encabezado de cada columna.</p></div><div className={empleado.accionesResumen}><span>{cargando || error ? '—' : resultado?.total ?? 0} eventos</span>{filtros.length > 0 && <button type="button" onClick={() => { setFiltros([]); setPagina(1) }}>Limpiar filtros</button>}</div></div> : <div className={auditoria.cabecera}><h2>Pista de auditoría</h2>{filtros.length > 0 && <button type="button" onClick={() => { setFiltros([]); setPagina(1) }}>Limpiar filtros</button>}</div>}
    <MensajeCarga cargando={cargando} error={error} onReintentar={() => setReintento(r => r + 1)} />
    {!cargando && !error && resultado && <><ListaAuditoria descripcion="Auditoría del registro de inventario" datos={resultado.items} columnas={columnas} filtros={filtros} ordenamiento={orden} obtenerIdFila={e => e.id} onFiltrosChange={f => { setFiltros(f); setPagina(1) }} onOrdenamientoChange={o => { setOrden(o); setPagina(1) }} renderizarFilaExpandida={e => e.id === expandido ? <CambiosAuditoria id={`inv-evento-${e.id}`} detalles={e.detalles} formatearValor={v => v ?? 'Sin dato'} /> : null} />
      {!resultado.items.length && <p className={auditoria.estado}>No hay eventos que mostrar.</p>}
      <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={t => { setTamanoPagina(t); setPagina(1) }} />
    </>}
  </article>
}
