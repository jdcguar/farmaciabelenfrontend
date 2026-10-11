import { EstadoVencimiento } from './inventario-estado-vencimiento'
import { useEffect, useMemo, useState } from 'react'
import { TablaDatos, PaginacionTabla, type ColumnaTabla, type ColumnFiltersState } from '../../../shared/components/tabla-datos'
import { BotonExportar } from '../../../shared/components/boton-exportar'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { listarInventario, exportarInventario } from '../inventario-api'
import { camposFiltro, consultaMovimientos, etiqueta, etiquetasCampos, grupoMovimiento, tiposMovimiento, vistas } from '../inventario.config'
import type { ConsultaInventario, RegistroInventario, ResultadoListado } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { ValorInventario } from './inventario-datos'
import { CondicionExistencia, IconoPosicion } from './inventario-posicion-identidad'
import { EstadoReserva } from './inventario-estado-reserva'
import { EstadoOperacion } from './inventario-estado-operacion'
import { InventarioReservasExpirar } from './inventario-reservas-expirar'
import { fechaPosicion } from '../inventario-posiciones-formatos'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

export type RecursoPosicion = 'lotes' | 'existencias'
type RecursoListado = RecursoPosicion | 'kardex' | 'reservas' | 'movimientos' | 'bloqueos' | 'cuarentenas' | 'conteos' | 'vencimientos'
const contenidoListado = {
  ajustes: { plural: 'ajustes', resumen: 'Ajustes registrados', detalle: 'Correcciones positivas y negativas, con su referencia, estado y fecha de registro.', vacio: 'No hay ajustes registrados', ayuda: 'Registra un ajuste con su motivo y evidencia para corregir el inventario.', identidad: 'Ajuste de inventario' },
  'carga-inicial': { plural: 'cargas iniciales', resumen: 'Cargas iniciales registradas', detalle: 'Inventario de apertura, fecha de corte y estado de cada carga.', vacio: 'No hay cargas iniciales registradas', ayuda: 'Registra el inventario de apertura para comenzar.', identidad: 'Inventario de apertura' },
  vencimientos: { plural: 'posiciones', resumen: 'Existencias con seguimiento de vencimiento', detalle: 'Stock físico con saldo, ordenado por vencimiento. Cantidades en unidades base.', vacio: 'No hay existencias con saldo', ayuda: 'Las posiciones aparecerán al confirmar ingresos de inventario.', identidad: 'Existencia con seguimiento' },
  cuarentenas: { plural: 'casos', resumen: 'Casos de cuarentena', detalle: 'Consulta las cantidades segregadas, resueltas y su estado por ubicación.', vacio: 'No hay casos de cuarentena', ayuda: 'Los casos se generan al confirmar movimientos de cuarentena.', identidad: 'Stock segregado' },
  conteos: { plural: 'conteos', resumen: 'Conteos físicos registrados', detalle: 'Consulta las ubicaciones en conteo y el estado de sus resultados.', vacio: 'No hay conteos registrados', ayuda: 'Registra un conteo para capturar las cantidades físicas de una ubicación.', identidad: 'Conteo físico' },
  lotes: { plural: 'lotes', resumen: 'Lotes registrados', detalle: 'Consulta la identificación, el origen y las fechas de cada lote.', vacio: 'No hay lotes registrados', ayuda: 'Registra el primer lote para comenzar.', identidad: 'Lote registrado' },
  existencias: { plural: 'existencias', resumen: 'Existencias registradas', detalle: 'Consulta el saldo y filtra por condición desde el encabezado.', vacio: 'No hay existencias registradas', ayuda: 'Las existencias aparecerán al confirmar movimientos de inventario.', identidad: 'Existencia por ubicación' },
  kardex: { plural: 'registros', resumen: 'Registros del kardex', detalle: 'Entradas, salidas y saldos en unidades base, del más reciente al más antiguo.', vacio: 'No hay registros en el kardex', ayuda: 'Los registros aparecerán al confirmar movimientos de inventario.', identidad: 'Movimiento confirmado' },
  reservas: { plural: 'reservas', resumen: 'Reservas registradas', detalle: 'Consulta los compromisos de stock, su estado registrado y su expiración.', vacio: 'No hay reservas registradas', ayuda: 'Registra la primera reserva para comprometer stock disponible.', identidad: 'Reserva de stock' },
  movimientos: { plural: 'movimientos', resumen: 'Movimientos registrados', detalle: 'Consulta el tipo, estado y fecha de las operaciones de inventario.', vacio: 'No hay movimientos registrados', ayuda: 'Registra un movimiento pendiente para comenzar.', identidad: 'Movimiento de inventario' },
  bloqueos: { plural: 'bloqueos', resumen: 'Bloqueos registrados', detalle: 'Consulta las restricciones por producto, lote o ubicación y sus motivos.', vacio: 'No hay bloqueos registrados', ayuda: 'Registra una restricción con su motivo y evidencia.', identidad: 'Restricción de inventario' },
}

export function InventarioPosicionesListadoView({ recurso, existenciaInicial, cargasIniciales = false, ajustes = false }: { recurso: RecursoListado; existenciaInicial?: string; cargasIniciales?: boolean; ajustes?: boolean }) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const [consulta, setConsulta] = useState<ConsultaInventario>({ pagina: 1, tamanoPagina: 50, existenciaId: recurso === 'kardex' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existenciaInicial ?? '') ? existenciaInicial : undefined })
  const [borrador, setBorrador] = useState<ConsultaInventario>({})
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [resultado, setResultado] = useState<ResultadoListado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [finalizada, setFinalizada] = useState('')
  const vistaListado = cargasIniciales ? 'carga-inicial' : ajustes ? 'ajustes' : recurso
  const vista = vistas[vistaListado]
  const consultaServidor = useMemo(() => consultaMovimientos(consulta, cargasIniciales, ajustes), [consulta, cargasIniciales, ajustes])
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const puedeCrear = ajustes ? sesion.permisos.includes('INVENTARIO.AJUSTES.CREAR') : cargasIniciales ? sesion.permisos.includes('INVENTARIO.CARGA_INICIAL.CREAR') : recurso === 'cuarentenas' ? sesion.permisos.includes('INVENTARIO.CUARENTENA.CREAR') : recurso === 'movimientos' ? tiposMovimiento.some(t => sesion.permisos.includes(`INVENTARIO.${grupoMovimiento(t)}.CREAR`)) : Boolean(vista.crear && sesion.permisos.includes(`INVENTARIO.${vista.grupo}.CREAR`))
  const rutaCreacion = ajustes ? '/inventario/ajustes/nuevo' : cargasIniciales ? '/inventario/carga-inicial/nuevo' : recurso === 'cuarentenas' ? '/inventario/movimientos/nuevo?tipo=CUARENTENA' : `/inventario/${recurso}/nuevo`
  const nuevoTexto = ajustes ? 'Registrar ajuste' : cargasIniciales ? 'Registrar carga inicial' : recurso === 'cuarentenas' ? 'Segregar stock' : recurso === 'conteos' ? 'Nuevo conteo' : recurso === 'reservas' ? 'Nueva reserva' : recurso === 'movimientos' ? 'Nuevo movimiento' : recurso === 'bloqueos' ? 'Nuevo bloqueo' : 'Nuevo lote'
  const filtrosPermitidos = camposFiltro(recurso)
  const contenido = contenidoListado[vistaListado]
  const campoEstado = recurso === 'existencias' ? 'condicion' : recurso === 'vencimientos' ? 'estadoVencimiento' : 'estado'
  const clave = JSON.stringify({ consulta: consultaServidor, revision, recurso })
  const cargando = clave !== finalizada
  const filtrosActivos = Object.entries(consulta).filter(([k, v]) => !['pagina', 'tamanoPagina'].includes(k) && Boolean(v)).length
  const plural = contenido.plural
  const rangoInvalido = Boolean(borrador.desde && borrador.hasta && borrador.desde > borrador.hasta)
  useEffect(() => {
    const controlador = new AbortController()
    void listarInventario(recurso, consultaServidor, controlador.signal).then(r => {
      if (controlador.signal.aborted) return
      if ((consulta.pagina ?? 1) > Math.max(1, r.totalPaginas)) {
        setConsulta(c => ({ ...c, pagina: Math.max(1, r.totalPaginas) })); return
      }
      setResultado(r); setError(null)
    }).catch((e: unknown) => {
      if (!controlador.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar el listado.')
    }).finally(() => { if (!controlador.signal.aborted) setFinalizada(clave) })
    return () => controlador.abort()
  }, [clave, consulta, consultaServidor, recurso])

  const columnas = useMemo<ColumnaTabla<RegistroInventario>[]>(() => [
    ...(vista.campos ?? []).map(campo => ({
      id: campo, titulo: etiquetasCampos[campo], obtenerValor: (r: RegistroInventario) => r[campo as keyof RegistroInventario],
      celda: (r: RegistroInventario) => campo === 'estadoVencimiento' ? <EstadoVencimiento valor={r.estadoVencimiento} /> : campo === 'estado' ? recurso === 'reservas' ? <EstadoReserva valor={r.estado} /> : <EstadoOperacion valor={r.estado} /> : campo === 'condicion' ? <CondicionExistencia valor={r.condicion} />
        : campo === 'fechaIngreso' || campo === 'fechaVencimiento' || campo === 'fechaCorte' ? fechaPosicion(r[campo])
        : campo === 'numero' || ['existencias', 'kardex', 'cuarentenas', 'vencimientos'].includes(recurso) && campo === 'presentacionId' || ['reservas', 'movimientos', 'conteos'].includes(recurso) && campo === 'referencia' || recurso === 'bloqueos' && campo === 'objetivoId'
          ? <div className={styles.identidadEmpleado}><span className={`${styles.avatarEmpleado} ${local.avatar}`} aria-hidden="true"><IconoPosicion /></span><span><strong><ValorInventario campo={campo} registro={r} /></strong><small>{recurso === 'kardex' ? `${etiqueta(r.direccion ?? '')} · Secuencia ${r.secuencia ?? '—'}` : contenido.identidad}</small></span></div>
          : campo.endsWith('Base') ? <span><strong><ValorInventario campo={campo} registro={r} /></strong>{campo === 'cantidadBase' && <small className={styles.sinDato}> unidades base</small>}</span>
            : <ValorInventario campo={campo} registro={r} />,
      filtro: campo === campoEstado && vista.estados ? { tipo: 'opciones' as const, etiqueta: recurso === 'existencias' ? 'Filtrar por condición' : 'Filtrar por estado', opciones: vista.estados.map(v => ({ valor: v, etiqueta: etiqueta(v) })), seleccionUnica: true, buscable: false } : undefined,
    })),
    ...(corporativo && recurso !== 'lotes' ? [{ id: 'sucursalId', titulo: 'Sucursal', obtenerValor: (r: RegistroInventario) => r.sucursalId, celda: (r: RegistroInventario) => <ValorInventario campo="sucursalId" registro={r} /> }] : []),
    { id: 'acciones', titulo: 'Acciones', tituloSoloLectores: true, obtenerValor: r => r.id, celda: r => <div className={styles.accionesFila}><button type="button" disabled={recurso === 'vencimientos' && !sesion.permisos.includes('INVENTARIO.EXISTENCIAS.VER')} title="Ver detalle" aria-label={`Ver detalle de ${r.numero ?? r.referencia ?? vista.singular}`} onClick={() => onNavegar(`/inventario/${recurso === 'vencimientos' ? 'existencias' : recurso}/${r.id}`)}><IconoAccion nombre="ver" /></button></div> },
  ], [campoEstado, contenido.identidad, corporativo, onNavegar, recurso, sesion.permisos, vista])
  const cambiar = (campo: keyof ConsultaInventario, valor: string) => setConsulta(c => ({ ...c, [campo]: valor || undefined, ...(campo === 'presentacionId' ? { loteId: undefined, ...(recurso === 'kardex' ? { existenciaId: undefined } : {}) } : {}), pagina: 1 }))
  const limpiar = () => setConsulta({ pagina: 1, tamanoPagina: consulta.tamanoPagina })
  const cambiarEstado = (filtros: ColumnFiltersState) => {
    const valor = filtros.find(f => f.id === campoEstado)?.value
    cambiar('estado', Array.isArray(valor) ? String(valor.at(-1) ?? '') : '')
  }
  const campoFiltro = (clave: keyof ConsultaInventario, nombre: string, extra: Partial<Parameters<typeof CampoInventario>[0]['campo']> = {}) =>
    <CampoInventario apariencia="empleados" prefijo="filtro-posicion-" campo={{ clave, etiqueta: nombre, ...extra }} value={String(borrador[clave] ?? '')} onChange={valor => setBorrador(b => ({ ...b, [clave]: valor || undefined, ...(['presentacionId', 'sucursalId', 'ubicacionId', 'loteId'].includes(clave) && recurso === 'kardex' ? { existenciaId: undefined } : {}), ...(clave === 'presentacionId' ? { loteId: undefined } : {}) }))} consulta={{ presentacionId: borrador.presentacionId, sucursalId: borrador.sucursalId, ubicacionId: borrador.ubicacionId, loteId: borrador.loteId }} error={clave === 'desde' && rangoInvalido ? 'El inicio debe ser anterior o igual al final.' : undefined} />
  const accionesComplementarias = <>
    {recurso === 'bloqueos' && sesion.permisos.includes('INVENTARIO.BLOQUEOS.CREAR') && <button type="button" onClick={() => onNavegar('/inventario/movimientos/nuevo?tipo=BLOQUEO')}>Bloquear cantidad</button>}
  </>

  return <section className={styles.pagina} aria-labelledby="titulo-posiciones">
    <header className={styles.cabeceraPagina}><div className={styles.filaCabeceraEmpleados}>
      <div className={styles.tituloPagina}><h1 id="titulo-posiciones">{vista.titulo}</h1></div>
      <div className={styles.accionesListado}>
        {recurso === 'reservas' && sesion.permisos.includes('INVENTARIO.RESERVAS.EXPIRAR') && <InventarioReservasExpirar sucursalInicial={consulta.sucursalId ?? sesion.sucursal.id} onActualizado={() => setRevision(v => v + 1)} />}
        {(cargasIniciales || ajustes) && <button type="button" className={local.botonSecundarioListado} onClick={() => onNavegar('/inventario/movimientos')}>Volver a movimientos</button>}
        {recurso !== 'vencimientos' && <BotonExportar deshabilitado={cargando || Boolean(error) || !resultado?.total} onExportar={async formato => { setErrorExportacion(null); try { await exportarInventario(recurso, consultaServidor, formato) } catch (e: unknown) { setErrorExportacion(e instanceof Error ? e.message : 'No se pudo exportar.') } }} />}
        {recurso === 'vencimientos' && <button type="button" className={local.botonSecundarioListado} onClick={() => onNavegar('/inventario/parametros')}>Configurar alertas de vencimiento</button>}
        {puedeCrear && <button type="button" className={styles.botonPrimario} onClick={() => onNavegar(rutaCreacion)}><span aria-hidden="true">+</span>{nuevoTexto}</button>}
      </div>
    </div></header>
    <div className={styles.herramientasListado}><div className={`${styles.barraBusqueda} ${['reservas', 'vencimientos'].includes(recurso) ? local.barraReservas : ''}`}>
      <div className={styles.busquedaGeneral}>
        <div className={local.consultaPresentacion}>
          <svg className={local.iconoConsulta} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          {recurso === 'conteos' ? <CampoInventario apariencia="empleados" textoVacio="Buscar por ubicación" prefijo="consulta-posicion-" campo={{ clave: 'ubicacionId', etiqueta: 'Buscar por ubicación', referencia: 'ubicaciones' }} value={consulta.ubicacionId ?? ''} onChange={v => cambiar('ubicacionId', v)} criterios={{ sucursalId: corporativo ? consulta.sucursalId : sesion.sucursal.id }} /> : recurso === 'bloqueos' ? <CampoInventario apariencia="empleados" textoVacio="Consultar por sucursal" prefijo="consulta-posicion-" campo={{ clave: 'sucursalId', etiqueta: 'Consultar por sucursal', referencia: 'sucursales' }} value={corporativo ? consulta.sucursalId ?? '' : sesion.sucursal.id} onChange={v => cambiar('sucursalId', v)} soloSucursalActual={!corporativo} /> : <CampoInventario apariencia="empleados" textoVacio="Buscar por presentación" prefijo="consulta-posicion-" campo={{ clave: 'presentacionId', etiqueta: 'Buscar por presentación', referencia: 'presentaciones' }} value={consulta.presentacionId ?? ''} onChange={v => cambiar('presentacionId', v)} />}
        </div>
        <small>{recurso === 'conteos' ? 'Busca y selecciona una ubicación para consultar sus conteos.' : recurso === 'bloqueos' ? 'La consulta incluye los bloqueos corporativos aplicables a la sucursal.' : `Busca y selecciona una presentación para consultar sus ${plural}.`}</small>
      </div>
      <div className={`${styles.filtrosRapidos} ${['reservas', 'vencimientos'].includes(recurso) ? local.filtrosReservas : ''}`} role="group" aria-label="Filtros del listado">
        <button type="button" aria-pressed={!vista.estados ? !filtrosActivos : !consulta.estado} onClick={() => !vista.estados ? limpiar() : cambiar('estado', '')}>Todos</button>
        {(vista.estados ?? []).map(v => <button key={v} type="button" aria-pressed={consulta.estado === v} onClick={() => cambiar('estado', v)}><span className={['APTA', 'ACTIVA', 'PREPARADA', 'CONSUMIDA', 'CONFIRMADO', 'LEVANTADO', 'RESUELTA', 'CONCILIADO', 'VIGENTE'].includes(v) ? styles.puntoACTIVO : ['BLOQUEADA', 'CANCELADA', 'ACTIVO', 'ANULADO', 'CANCELADO', 'VENCIDO', 'CRITICO'].includes(v) ? styles.puntoRETIRADO : ['EXPIRADA', 'CERRADO', 'DESCONOCIDO'].includes(v) ? styles.puntoINACTIVO : styles.puntoSUSPENDIDO} aria-hidden="true" />{etiqueta(v)}</button>)}
        <button type="button" onClick={() => { setBorrador(consulta); setFiltrosAbiertos(true) }}>Filtros{filtrosActivos ? ` (${filtrosActivos})` : ''}</button>
      </div>
      <div className={`${styles.resumenResultados} ${['reservas', 'vencimientos'].includes(recurso) ? local.resumenReservas : ''}`} aria-live="polite"><strong>{cargando || error ? '—' : resultado?.total.toLocaleString('es-GT') ?? '—'}</strong><span>{resultado?.total === 1 ? vista.singular : plural}</span></div>
    </div></div>
    {errorExportacion && <div className={styles.alertaError} role="alert"><p>{errorExportacion}</p><button type="button" onClick={() => setErrorExportacion(null)}>Cerrar</button></div>}
    {!cargando && error && <div className={styles.alertaError} role="alert"><p>{error}</p><button type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button></div>}
    {!cargando && !error && resultado && !resultado.items.length ? <div className={styles.estadoVacio}>
      <span aria-hidden="true"><IconoAccion nombre="sin-registros" /></span><h2>{filtrosActivos ? 'Sin coincidencias' : contenido.vacio}</h2><p>{filtrosActivos ? 'Prueba con otros filtros o limpia la consulta.' : contenido.ayuda}</p>
      {filtrosActivos ? <button type="button" onClick={limpiar}>Limpiar filtros</button> : puedeCrear && <button type="button" onClick={() => onNavegar(rutaCreacion)}>{nuevoTexto}</button>}
      {recurso === 'bloqueos' && <div className={styles.accionesResumen}>{accionesComplementarias}</div>}
    </div> : <div className={styles.panelTabla} aria-busy={cargando}>
      <div className={styles.resumenTabla}><div className={styles.resumenContenido}><strong>{contenido.resumen}</strong><small>{contenido.detalle}</small></div><div className={styles.accionesResumen}>
        <span>{!cargando && !error && resultado?.total ? `${(resultado.pagina - 1) * resultado.tamanoPagina + 1}–${Math.min(resultado.pagina * resultado.tamanoPagina, resultado.total)} de ${resultado.total} ${resultado.total === 1 ? vista.singular : plural}` : '—'}</span>
        {filtrosActivos > 0 && <button type="button" onClick={limpiar}>Limpiar filtros ({filtrosActivos})</button>}
        {accionesComplementarias}
      </div></div>
      {cargando && <p className={local.estadoCarga} role="status">Cargando {plural}…</p>}
      {!cargando && !error && resultado && <>
        <div className={['cuarentenas', 'vencimientos'].includes(recurso) ? local.tablaOperacion : undefined}><TablaDatos apariencia="tarjetas" descripcion={vista.titulo} datos={resultado.items} columnas={columnas} filtros={consulta.estado ? [{ id: campoEstado, value: [consulta.estado] }] : []} ordenamiento={[]} onFiltrosChange={cambiarEstado} onOrdenamientoChange={() => {}} obtenerIdFila={r => r.id} /></div>
        <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular={vista.singular} unidadPlural={plural} onPaginaChange={pagina => setConsulta(c => ({ ...c, pagina }))} onTamanoPaginaChange={tamanoPagina => setConsulta(c => ({ ...c, pagina: 1, tamanoPagina }))} />
      </>}
    </div>}
    <ModalEstado abierto={filtrosAbiertos} apariencia="formulario" tipo="informacion" titulo={`Filtrar ${plural}`} mensaje={<>
      <p className={local.ayudaFiltros}>{recurso === 'lotes' ? 'El filtro de sucursal muestra lotes con existencias en esa sucursal.' : corporativo ? 'Consulta todas las sucursales autorizadas o selecciona una.' : `Sucursal: ${sesion.sucursal.codigo} · ${sesion.sucursal.nombre}`}</p>
      <div className={local.grillaFiltros}>
        {corporativo && campoFiltro('sucursalId', 'Sucursal', { referencia: 'sucursales' })}
        {ajustes && campoFiltro('tipo', 'Tipo de ajuste', { tipo: 'opciones', opciones: ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'].map(valor => ({ valor, etiqueta: etiqueta(valor) })) })}
        {filtrosPermitidos.presentacion && campoFiltro('presentacionId', 'Presentación', { referencia: 'presentaciones' })}
        {filtrosPermitidos.ubicacion && campoFiltro('ubicacionId', 'Ubicación', { referencia: 'ubicaciones' })}
        {filtrosPermitidos.lote && campoFiltro('loteId', 'Lote', { inventario: 'lotes' })}
        {recurso === 'kardex' && campoFiltro('existenciaId', 'Existencia', { inventario: 'existencias' })}
        {campoFiltro('desde', 'Registrado desde', { tipo: 'fecha' })}{campoFiltro('hasta', 'Registrado hasta', { tipo: 'fecha' })}
      </div>
    </>} textoAccionPrincipal="Aplicar filtros" textoAccionSecundaria="Cancelar" onAccionPrincipal={() => { if (rangoInvalido) { document.getElementById('filtro-posicion-desde')?.focus(); return }; setConsulta({ ...borrador, pagina: 1 }); setFiltrosAbiertos(false) }} onAccionSecundaria={() => setFiltrosAbiertos(false)} onCerrar={() => setFiltrosAbiertos(false)} iconoAccionPrincipal={<IconoAccion nombre="filtrar" />} />
  </section>
}
