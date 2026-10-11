import { useEffect, useMemo, useState } from 'react'
import { TablaDatos, PaginacionTabla, type ColumnaTabla, type ColumnFiltersState } from '../../../shared/components/tabla-datos'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { BotonExportar } from '../../../shared/components/boton-exportar'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { expirarReservas, exportarInventario, listarInventario } from '../inventario-api'
import { camposFiltro, etiqueta, etiquetasCampos, vistas } from '../inventario.config'
import type { ConsultaInventario, RecursoInventario, RegistroInventario, ResultadoListado } from '../inventario.types'
import { fechaHora } from '../inventario-reglas'
import { CampoInventario } from './inventario-campo'
import { MensajeCarga, ValorInventario } from './inventario-datos'
import styles from '../inventario.module.css'

export function InventarioListadoView({ recurso, existenciaInicial }: { recurso: RecursoInventario | 'vencimientos'; existenciaInicial?: string }) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const [consulta, setConsulta] = useState<ConsultaInventario>({ pagina: 1, tamanoPagina: 50, existenciaId: recurso === 'kardex' && /^[0-9a-f-]{36}$/i.test(existenciaInicial ?? '') ? existenciaInicial : undefined })
  const [resultado, setResultado] = useState<ResultadoListado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finalizada, setFinalizada] = useState('')
  const [revision, setRevision] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)
  const [expirar, setExpirar] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const vista = vistas[recurso]
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const sucursal = consulta.sucursalId || sesion.sucursal.id
  const clave = JSON.stringify({ consulta, revision, recurso })
  const cargando = clave !== finalizada
  const filtros = camposFiltro(recurso)
  useEffect(() => {
    const c = new AbortController()
    void listarInventario(recurso, consulta, c.signal).then(r => {
      if (c.signal.aborted) return
      if ((consulta.pagina ?? 1) > Math.max(1, r.totalPaginas)) { setConsulta(prev => ({ ...prev, pagina: Math.max(1, r.totalPaginas) })); return }
      setResultado(r); setError(null)
    }).catch((e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar el listado.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, consulta, recurso])
  const columnas = useMemo<ColumnaTabla<RegistroInventario>[]>(() => [
    ...(vista.campos ?? []).map(campo => ({ id: campo, titulo: etiquetasCampos[campo] ?? campo, obtenerValor: (r: RegistroInventario) => r[campo as keyof RegistroInventario], celda: (r: RegistroInventario) => <ValorInventario campo={campo} registro={r} />, filtro: ['estado', 'condicion', 'estadoVencimiento'].includes(campo) && vista.estados ? { tipo: 'opciones' as const, etiqueta: `Filtrar ${etiquetasCampos[campo].toLowerCase()}`, opciones: vista.estados.map(v => ({ valor: v, etiqueta: etiqueta(v) })), seleccionUnica: true, buscable: false } : undefined })),
    ...(corporativo && recurso !== 'lotes' ? [{ id: 'sucursalId', titulo: 'Sucursal', obtenerValor: (r: RegistroInventario) => r.sucursalId, celda: (r: RegistroInventario) => <ValorInventario campo="sucursalId" registro={r} /> }] : []),
    { id: 'acciones', titulo: 'Acciones', obtenerValor: r => r.id, celda: r => <div className={gestion.accionesFila}><button type="button" aria-label={`Ver detalle de ${r.numero ?? r.referencia ?? vista.singular}`} title="Ver detalle" onClick={() => onNavegar(`/inventario/${recurso === 'vencimientos' ? 'existencias' : recurso}/${r.id}`)} disabled={recurso === 'vencimientos' && !sesion.permisos.includes('INVENTARIO.EXISTENCIAS.VER')}><IconoAccion nombre="ver" /></button></div> },
  ], [corporativo, onNavegar, recurso, sesion.permisos, vista])
  const cambiar = (campo: keyof ConsultaInventario, valor: string) => setConsulta(c => ({ ...c, [campo]: valor || undefined, ...(campo === 'presentacionId' ? { loteId: undefined } : {}), pagina: 1 }))
  const filtrosTabla: ColumnFiltersState = consulta.estado ? [{ id: 'estado', value: [consulta.estado] }] : []
  const cambiarEstado = (f: ColumnFiltersState) => { const estado = f.find(f => f.id === 'estado')?.value; cambiar('estado', Array.isArray(estado) ? String(estado.at(-1) ?? '') : '') }
  const puedeCrear = vista.crear && sesion.permisos.includes(`INVENTARIO.${vista.grupo}.CREAR`)
  const hayFiltros = Object.entries(consulta).some(([k, v]) => !['pagina', 'tamanoPagina'].includes(k) && v)
  return <section className={`${gestion.pagina} ${styles.modulo}`}>
    <header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>{vista.titulo}</h1><div className={`${gestion.accionesListado} ${styles.acciones}`}>
      {recurso !== 'vencimientos' && <BotonExportar deshabilitado={cargando || Boolean(error)} onExportar={async formato => { setExportError(null); try { await exportarInventario(recurso, consulta, formato) } catch (e: unknown) { setExportError(e instanceof Error ? e.message : 'No se pudo exportar.') } }} />}
      {puedeCrear && <button type="button" className={gestion.botonPrimario} onClick={() => onNavegar(`/inventario/${recurso}/nuevo`)}><IconoAccion nombre="agregar" />Registrar {vista.singular}</button>}
      {recurso === 'cuarentenas' && sesion.permisos.includes('INVENTARIO.CUARENTENA.CREAR') && <button type="button" className={gestion.botonPrimario} onClick={() => onNavegar('/inventario/movimientos/nuevo?tipo=CUARENTENA')}>Segregar stock</button>}
      {recurso === 'bloqueos' && sesion.permisos.includes('INVENTARIO.BLOQUEOS.CREAR') && <button type="button" className={styles.secundario} onClick={() => onNavegar('/inventario/movimientos/nuevo?tipo=BLOQUEO')}>Bloquear cantidad</button>}
      {recurso === 'vencimientos' && <button type="button" className={styles.secundario} onClick={() => onNavegar('/inventario/parametros')}>Configurar alertas de vencimiento</button>}
    </div></div><p className={styles.descripcion}>{vista.descripcion}</p></header>
    <HerramientasListado filtros={filtrosTabla} onFiltrosChange={cambiarEstado} opcionesEstado={(vista.estados ?? []).map(v => ({ valor: v, etiqueta: etiqueta(v) }))} total={cargando ? undefined : resultado?.total} unidadSingular={vista.singular} unidadPlural="registros">
      <div className={styles.campo}><strong>Consulta por sucursal</strong><span>{corporativo ? consulta.sucursalId ? 'Sucursal seleccionada' : 'Todas las sucursales autorizadas' : `${sesion.sucursal.codigo} · ${sesion.sucursal.nombre}`}</span><small>{recurso === 'lotes' ? 'Los lotes son compartidos; el filtro de sucursal requiere existencias en ella.' : 'Los filtros consultan todos los registros del servidor.'}</small></div>
    </HerramientasListado>
    <div className={`${gestion.panelTabla} ${styles.filtros}`}>
      {corporativo && <CampoInventario campo={{ clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales' }} value={consulta.sucursalId ?? ''} onChange={v => cambiar('sucursalId', v)} />}
      {filtros.presentacion && <CampoInventario campo={{ clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones' }} value={consulta.presentacionId ?? ''} onChange={v => cambiar('presentacionId', v)} />}
      {filtros.ubicacion && <CampoInventario campo={{ clave: 'ubicacionId', etiqueta: 'Ubicación', referencia: 'ubicaciones' }} value={consulta.ubicacionId ?? ''} onChange={v => cambiar('ubicacionId', v)} />}
      {filtros.lote && <CampoInventario campo={{ clave: 'loteId', etiqueta: 'Lote', inventario: 'lotes' }} value={consulta.loteId ?? ''} onChange={v => cambiar('loteId', v)} consulta={{ presentacionId: consulta.presentacionId }} />}
      <CampoInventario campo={{ clave: 'desde', etiqueta: 'Registrado desde', tipo: 'fecha' }} value={consulta.desde ?? ''} onChange={v => cambiar('desde', v)} error={consulta.desde && consulta.hasta && consulta.desde > consulta.hasta ? 'El inicio debe ser anterior al final.' : undefined} />
      <CampoInventario campo={{ clave: 'hasta', etiqueta: 'Registrado hasta', tipo: 'fecha' }} value={consulta.hasta ?? ''} onChange={v => cambiar('hasta', v)} />
    </div>
    {recurso === 'cuarentenas' && <p className={styles.aviso}>La liberación sanitaria, las bajas y la destrucción se desarrollarán en su etapa. Los casos y cantidades segregadas conservan su trazabilidad.</p>}
    {exportError && <div role="alert" className={styles.error}>{exportError}</div>}
    <div className={gestion.panelTabla} aria-busy={cargando}><div className={styles.cabeceraTabla}><strong>{vista.titulo}</strong><div className={styles.acciones}>
      {hayFiltros && <button type="button" className={styles.secundario} onClick={() => setConsulta({ pagina: 1, tamanoPagina: consulta.tamanoPagina })}>Limpiar filtros</button>}
      <button type="button" className={styles.secundario} onClick={() => setRevision(r => r + 1)} disabled={cargando}>Actualizar</button>
      {recurso === 'reservas' && sesion.permisos.includes('INVENTARIO.RESERVAS.EXPIRAR') && <button type="button" className={styles.secundario} onClick={() => setExpirar(true)}>Cerrar reservas expiradas</button>}
    </div></div>
      <MensajeCarga error={error} cargando={cargando} onReintentar={() => setRevision(r => r + 1)} />
      {!cargando && !error && resultado && <><TablaDatos apariencia="tarjetas" descripcion={vista.titulo} datos={resultado.items} columnas={columnas} filtros={consulta.estado ? [{ id: recurso === 'existencias' ? 'condicion' : recurso === 'vencimientos' ? 'estadoVencimiento' : 'estado', value: [consulta.estado] }] : []} ordenamiento={[]} onFiltrosChange={f => cambiarEstado(f.map(v => ({ ...v, id: 'estado' })))} onOrdenamientoChange={() => {}} obtenerIdFila={r => r.id} />
        {!resultado.items.length && <div className={gestion.estadoVacio}><span><IconoAccion nombre="sin-registros" /></span><h2>{hayFiltros ? 'Sin coincidencias' : 'No hay registros'}</h2><p>{hayFiltros ? 'Prueba con otros filtros o limpia la consulta.' : 'Los registros aparecerán cuando se realicen operaciones de inventario.'}</p></div>}
        <PaginacionTabla apariencia="tarjetas" pagina={resultado.pagina} tamanoPagina={resultado.tamanoPagina} total={resultado.total} totalPaginas={resultado.totalPaginas} unidadSingular={vista.singular} unidadPlural="registros" onPaginaChange={p => setConsulta(c => ({ ...c, pagina: p }))} onTamanoPaginaChange={t => setConsulta(c => ({ ...c, pagina: 1, tamanoPagina: t }))} /><p className={styles.descripcion}>Consultado: {fechaHora(resultado.actualizadoEn)}</p>
      </>}
    </div>
    <ModalEstado abierto={expirar} tipo="advertencia" titulo="Cerrar reservas expiradas" mensaje={<><p>Se cerrarán hasta 200 reservas vencidas de la sucursal elegida. Puedes repetir la operación si quedan más.</p><CampoInventario prefijo="expirar-" campo={{ clave: 'sucursalId', etiqueta: 'Sucursal', referencia: 'sucursales', requerido: true }} value={sucursal} onChange={v => cambiar('sucursalId', v)} soloSucursalActual={!corporativo} disabled={procesando} />{error && <p role="alert">{error}</p>}</>} cargando={procesando} textoAccionPrincipal="Cerrar expiradas" textoAccionSecundaria="Cancelar" onAccionSecundaria={() => setExpirar(false)} onCerrar={() => setExpirar(false)} onAccionPrincipal={() => { if (procesando || !sucursal) return; setProcesando(true); void expirarReservas(sucursal).then(r => { setExpirar(false); setMensaje(`${r.expiradas} reservas cerradas. Límite por operación: ${r.limiteLote}.`); setRevision(v => v + 1) }).catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo completar.')).finally(() => setProcesando(false)) }} />
    <ModalEstado abierto={Boolean(mensaje)} tipo="exito" titulo="Operación completada" mensaje={mensaje} textoAccionPrincipal="Continuar" onCerrar={() => setMensaje(null)} onAccionPrincipal={() => setMensaje(null)} />
  </section>
}
