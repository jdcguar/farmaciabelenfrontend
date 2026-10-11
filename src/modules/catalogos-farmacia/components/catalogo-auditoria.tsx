import { useEffect, useMemo, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import auditoria from '../../../shared/components/auditoria/auditoria.module.css'
import { PaginacionTabla, type ColumnaTabla, type ColumnFiltersState, type SortingState } from '../../../shared/components/tabla-datos'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import { listarAuditoria } from '../catalogo-api'
import { textoValor } from '../catalogo-reglas'
import { camposDe } from '../catalogos.config'
import type { ConsultaAuditoria, DefinicionCatalogo, EventoAuditoria, Paginado } from '../catalogo.types'
import styles from '../catalogos.module.css'
const operaciones = { CREAR: 'Creación', ACTUALIZAR: 'Actualización', INACTIVAR: 'Desactivación', HOMOLOGAR: 'Homologación', EXPORTAR: 'Exportación', CERRAR_VIGENCIA: 'Cierre de vigencia', ACTUALIZAR_IMAGEN: 'Actualización de imagen', ELIMINAR_IMAGEN: 'Eliminación de imagen' }
const fechaHora = (fecha: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala' }).format(new Date(fecha))
const filtroTexto = (filtros: ColumnFiltersState, id: string) => textoValor(filtros.find((item) => item.id === id)?.value) || undefined
export function CatalogoAuditoria({ catalogo, registroId, revision }: { catalogo: DefinicionCatalogo; registroId: string; revision: number }) {
  const [resultado, setResultado] = useState<Paginado<EventoAuditoria> | null>(null)
  const [pagina, setPagina] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(50)
  const [filtros, setFiltros] = useState<ColumnFiltersState>([])
  const [ordenamiento, setOrdenamiento] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [expandido, setExpandido] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finalizada, setFinalizada] = useState('')
  const [reintento, setReintento] = useState(0)
  const parametros = useMemo<ConsultaAuditoria>(() => {
    const acciones = filtros.find((item) => item.id === 'operacion')?.value
    return { pagina, tamanoPagina, fecha: filtroTexto(filtros, 'fecha'), usuario: filtroTexto(filtros, 'usuario'), sucursal: filtroTexto(filtros, 'sucursal'), resumen: filtroTexto(filtros, 'resumen'), operaciones: Array.isArray(acciones) && acciones.length ? acciones.join(',') : undefined, orden: ordenamiento[0]?.id ?? 'fecha', direccion: ordenamiento[0]?.desc === false ? 'asc' : 'desc' }
  }, [filtros, ordenamiento, pagina, tamanoPagina])
  const clave = JSON.stringify({ parametros, revision, reintento })
  const cargando = clave !== finalizada
  useEffect(() => {
    const controlador = new AbortController()
    void listarAuditoria(catalogo.clave, registroId, parametros, controlador.signal).then((items) => {
      if (controlador.signal.aborted) return
      if (pagina > Math.max(1, items.totalPaginas)) { setPagina(Math.max(1, items.totalPaginas)); return }
      setResultado(items); setError(null); setExpandido(null)
    }).catch((e: unknown) => { if (!controlador.signal.aborted) setError(e instanceof ErrorApi ? e.message : 'No fue posible cargar la auditoría.') }).finally(() => { if (!controlador.signal.aborted) setFinalizada(clave) })
    return () => controlador.abort()
  }, [catalogo.clave, clave, pagina, parametros, registroId])
  const columnas = useMemo<ColumnaTabla<EventoAuditoria>[]>(() => [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: (e) => e.ocurridoEn, ordenable: true, filtro: { tipo: 'fecha', etiqueta: 'Fecha del evento' }, celda: (e) => fechaHora(e.ocurridoEn) },
    { id: 'operacion', titulo: 'Acción', obtenerValor: (e) => e.tipoOperacion, ordenable: true, filtro: { tipo: 'opciones', etiqueta: 'Acciones', buscable: false, opciones: Object.entries(operaciones).map(([valor, etiqueta]) => ({ valor, etiqueta })) }, celda: (e) => operaciones[e.tipoOperacion as keyof typeof operaciones] ?? e.tipoOperacion },
    { id: 'usuario', titulo: 'Realizado por', obtenerValor: (e) => e.usuarioNombre, ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar usuario' }, celda: (e) => e.usuarioNombre ?? 'SISTEMA' },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: (e) => e.sucursal?.nombre, ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar sucursal' }, celda: (e) => e.sucursal ? `${e.sucursal.codigo} · ${e.sucursal.nombre}` : 'Sin sucursal' },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: (e) => e.resumen, ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar resumen' }, celda: (e) => e.resumen ?? 'Sin resumen' },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: (e) => e.detalles.length, celda: (e) => e.detalles.length ? <button type="button" className={auditoria.botonCambios} aria-expanded={e.id === expandido} aria-controls={`auditoria-cambios-${e.id}`} onClick={() => setExpandido((actual) => actual === e.id ? null : e.id)}>{e.id === expandido ? 'Ocultar cambios' : `Ver cambios (${e.detalles.length})`}</button> : 'Sin detalle' },
  ], [expandido])
  return <article className={auditoria.panel} aria-busy={cargando}><div className={auditoria.cabecera}><h2>Pista de auditoría</h2><div className={auditoria.acciones}>{filtros.length > 0 && <button type="button" onClick={() => { setFiltros([]); setPagina(1) }}>Limpiar filtros</button>}</div></div>
    {cargando ? <p role="status" className={auditoria.estado}>Cargando auditoría…</p> : error ? <div className={`${gestion.alertaError} ${styles.error}`} role="alert"><p>{error}</p><button type="button" onClick={() => setReintento((r) => r + 1)}>Reintentar</button></div> : resultado && <div className={auditoria.contenido}>
      <ListaAuditoria descripcion={`Auditoría de ${catalogo.singular}`} datos={resultado.items} columnas={columnas} filtros={filtros} ordenamiento={ordenamiento} obtenerIdFila={(e) => e.id} onFiltrosChange={(siguientes) => { setFiltros(siguientes); setPagina(1) }} onOrdenamientoChange={(siguiente) => { setOrdenamiento(siguiente.length ? siguiente : [{ id: 'fecha', desc: true }]); setPagina(1) }} renderizarFilaExpandida={(evento) => evento.id === expandido ? <CambiosAuditoria id={`auditoria-cambios-${evento.id}`} detalles={evento.detalles.map((detalle) => ({ ...detalle, etiquetaPropiedad: detalle.etiquetaPropiedad ?? camposDe(catalogo).find((campo) => campo.clave === detalle.nombrePropiedad)?.etiqueta ?? detalle.nombrePropiedad }))} formatearValor={(valor) => valor === 'true' ? 'Sí' : valor === 'false' ? 'No' : valor || 'Sin valor'} /> : null} />
      {!resultado.items.length && <p className={auditoria.estado}>{filtros.length ? 'No hay eventos que coincidan con los filtros.' : 'No hay eventos de auditoría registrados.'}</p>}
      <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={(tamano) => { setTamanoPagina(tamano); setPagina(1) }} />
    </div>}
  </article>
}
