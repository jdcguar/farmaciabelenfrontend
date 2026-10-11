import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import auditoriaStyles from '../../../shared/components/auditoria/auditoria.module.css'
import { useEffect, useMemo, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { PaginacionTabla, type ColumnaTabla, type ColumnFiltersState, type SortingState } from '../../../shared/components/tabla-datos'
import { listarAuditoriaPuesto } from '../puesto-api'
import type { AuditoriaPuestoPaginada, EventoAuditoriaPuesto, ListarAuditoriaPuestoParametros, OperacionAuditoriaPuesto, OrdenAuditoriaPuesto } from '../puesto.types'
import styles from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'

type Props = { puestoId: string; revision: number }
const valorTexto = (filtros: ColumnFiltersState, id: string) => { const valor = filtros.find((filtro) => filtro.id === id)?.value; return typeof valor === 'string' && valor.trim() ? valor.trim() : undefined }
const valores = (filtros: ColumnFiltersState, id: string) => { const valor = filtros.find((filtro) => filtro.id === id)?.value; return Array.isArray(valor) && valor.length ? valor.map(String) : undefined }
const fechaHora = (valor: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala' }).format(new Date(valor))
const etiquetaOperacion: Record<OperacionAuditoriaPuesto, string> = { CREAR: 'Creación', ACTUALIZAR: 'Actualización', INACTIVAR: 'Desactivación' }
function valorAuditoria(valor: string | null): string { if (valor === null || valor === '') return 'Sin valor'; if (valor === 'true') return 'Sí'; if (valor === 'false') return 'No'; return valor }
function DetalleCambios({ evento }: { evento: EventoAuditoriaPuesto }) {
  return <CambiosAuditoria id={`detalle-auditoria-puesto-${evento.id}`} detalles={evento.detalles} formatearValor={valorAuditoria} />
}

export function PuestoAuditoria({ puestoId, revision }: Props) {
  const [resultado, setResultado] = useState<AuditoriaPuestoPaginada | null>(null)
  const [pagina, setPagina] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(50)
  const [filtros, setFiltros] = useState<ColumnFiltersState>([])
  const [ordenamiento, setOrdenamiento] = useState<SortingState>([{ id: 'fecha', desc: true }])
  const [error, setError] = useState<string | null>(null)
  const [solicitudFinalizada, setSolicitudFinalizada] = useState('')
  const [reintento, setReintento] = useState(0)
  const [expandido, setExpandido] = useState<string | null>(null)
  const parametros = useMemo<ListarAuditoriaPuestoParametros>(() => { const orden = ordenamiento[0]; return { pagina, tamanoPagina, fecha: valorTexto(filtros, 'fecha'), operaciones: valores(filtros, 'operacion') as OperacionAuditoriaPuesto[] | undefined, usuario: valorTexto(filtros, 'usuario'), sucursal: valorTexto(filtros, 'sucursal'), resumen: valorTexto(filtros, 'resumen'), orden: (orden?.id ?? 'fecha') as OrdenAuditoriaPuesto, direccion: orden?.desc === false ? 'asc' : 'desc' } }, [filtros, ordenamiento, pagina, tamanoPagina])
  const clave = useMemo(() => JSON.stringify({ puestoId, parametros, revision, reintento }), [parametros, puestoId, reintento, revision])
  const cargando = solicitudFinalizada !== clave

  useEffect(() => { const controlador = new AbortController(); void listarAuditoriaPuesto(puestoId, parametros, controlador.signal).then((respuesta) => { setResultado(respuesta); setExpandido(null); setError(null) }).catch((errorActual: unknown) => { if (!controlador.signal.aborted) setError(errorActual instanceof ErrorApi ? errorActual.message : 'No fue posible cargar la pista de auditoría.') }).finally(() => { if (!controlador.signal.aborted) setSolicitudFinalizada(clave) }); return () => controlador.abort() }, [clave, parametros, puestoId])

  const columnas = useMemo<ColumnaTabla<EventoAuditoriaPuesto>[]>(() => [
    { id: 'fecha', titulo: 'Fecha y hora', obtenerValor: (evento) => evento.ocurridoEn, ordenable: true, filtro: { tipo: 'fecha', etiqueta: 'Filtrar por fecha' }, celda: (evento) => fechaHora(evento.ocurridoEn) },
    { id: 'operacion', titulo: 'Operación', obtenerValor: (evento) => evento.tipoOperacion, ordenable: true, filtro: { tipo: 'opciones', etiqueta: 'Seleccionar operación', buscable: false, opciones: Object.entries(etiquetaOperacion).map(([valor, etiqueta]) => ({ valor, etiqueta })) }, celda: (evento) => <span className={styles.etiquetaOperacion}>{etiquetaOperacion[evento.tipoOperacion]}</span> },
    { id: 'usuario', titulo: 'Usuario', obtenerValor: (evento) => evento.usuarioNombre ?? '', ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar usuario', placeholder: 'Nombre de usuario' }, celda: (evento) => evento.usuarioNombre ?? <span className={styles.sinDato}>Sistema</span> },
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: (evento) => evento.sucursal?.nombre ?? '', ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar sucursal', placeholder: 'Sucursal' }, celda: (evento) => evento.sucursal ? <span>{evento.sucursal.nombre}<small className={styles.codigoSecundario}>{evento.sucursal.codigo}</small></span> : <span className={styles.sinDato}>Sin sucursal</span> },
    { id: 'resumen', titulo: 'Resumen', obtenerValor: (evento) => evento.resumen ?? '', ordenable: true, filtro: { tipo: 'texto', etiqueta: 'Filtrar resumen', placeholder: 'Descripción del evento' }, celda: (evento) => evento.resumen ?? <span className={styles.sinDato}>Sin resumen</span> },
    { id: 'cambios', titulo: 'Cambios', obtenerValor: (evento) => evento.detalles.length, celda: (evento) => evento.detalles.length ? <button className={auditoriaStyles.botonCambios} type="button" aria-expanded={expandido === evento.id} aria-controls={`detalle-auditoria-puesto-${evento.id}`} onClick={() => setExpandido((actual) => actual === evento.id ? null : evento.id)}>{expandido === evento.id ? 'Ocultar cambios' : `Ver cambios (${evento.detalles.length})`}</button> : <span className={styles.sinDato}>Sin detalle</span> },
  ], [expandido])

  return <article className={auditoriaStyles.panel} aria-busy={cargando}><div className={auditoriaStyles.cabecera}><div><h2>Pista de auditoría</h2></div><div className={auditoriaStyles.acciones}>{cargando && <span role="status">Actualizando…</span>}{resultado && <span>{resultado.total} {resultado.total === 1 ? 'evento' : 'eventos'}</span>}{filtros.length > 0 && <button type="button" onClick={() => { setFiltros([]); setPagina(1) }}>Limpiar filtros ({filtros.length})</button>}</div></div>{error && <div className={auditoriaStyles.error} role="alert"><span>{error}</span><button type="button" onClick={() => setReintento((valor) => valor + 1)}>Reintentar</button></div>}{!resultado && cargando ? <p className={auditoriaStyles.estado}>Cargando pista de auditoría…</p> : resultado?.items.length ? <div className={auditoriaStyles.contenido}><ListaAuditoria descripcion="Pista de auditoría del puesto" datos={resultado.items} columnas={columnas} filtros={filtros} ordenamiento={ordenamiento} obtenerIdFila={(evento) => evento.id} onFiltrosChange={(siguientes) => { setFiltros(siguientes); setPagina(1) }} onOrdenamientoChange={(siguiente) => { setOrdenamiento(siguiente.length ? siguiente : [{ id: 'fecha', desc: true }]); setPagina(1) }} renderizarFilaExpandida={(evento) => evento.id === expandido ? <DetalleCambios evento={evento} /> : null} /><PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular="evento" unidadPlural="eventos" onPaginaChange={setPagina} onTamanoPaginaChange={(tamano) => { setTamanoPagina(tamano); setPagina(1) }} /></div> : !error ? <p className={auditoriaStyles.estado}>{filtros.length ? 'No hay eventos que coincidan con los filtros.' : 'No hay eventos de auditoría registrados para este puesto.'}</p> : null}</article>
}
