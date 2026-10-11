import { puedeAccederPantalla } from '../../../shared/seguridad/navegacion'
import { useEffect, useId, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { listarCajaChica, consultarFinanzas } from '../../sucursales/presupuestos-api'
import type { FondoCajaChica, LiquidacionCajaChica, PaginaFinanzas, ListaLiquidaciones } from '../../sucursales/presupuestos.types'
import { FormularioFinanzas, TablaFinanzas, type AccionFinanzas } from '../../sucursales/components/finanzas-comun'
import { fecha, monto, etiqueta } from '../../sucursales/finanzas-reglas'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { CargaCaja } from './caja-comun'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import local from '../../sucursales/presupuestos.module.css'
import styles from '../caja.module.css'

const estadosLiquidacion = [{ valor: 'SOLICITADA', etiqueta: 'Solicitada' }, { valor: 'ABIERTA', etiqueta: 'Abierta' }, { valor: 'CERRADA', etiqueta: 'Cerrada' }]

export function CajaChicaListados({ modo, sucursalInicial, sesion, onNavegar, onCambiosPendientes }: { modo: 'fondos' | 'liquidaciones'; sucursalInicial?: string; sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const corporativo = sesion.permisos.includes('ORGANIZACION.SUCURSALES.FINANZAS_CORPORATIVO'), esFondo = modo === 'fondos', titulo = esFondo ? 'Caja chica' : 'Liquidaciones'
  const [sucursalId, setSucursal] = useState(sucursalInicial ?? (corporativo ? '' : sesion.sucursal.id)), [periodo, setPeriodo] = useState(''), [estado, setEstado] = useState(''), [pagina, setPagina] = useState(1), [tamanoPagina, setTamano] = useState(50), [revision, setRevision] = useState(0)
  const [lista, setLista] = useState<PaginaFinanzas<FondoCajaChica | LiquidacionCajaChica> | null>(null), [contexto, setContexto] = useState<ListaLiquidaciones | null>(null), [error, setError] = useState<unknown>(null), [finalizada, setFinalizada] = useState(''), [accion, setAccion] = useState<(AccionFinanzas & { sucursalId?: string }) | null>(null), [mensaje, setMensaje] = useState('')
  const prefijo = useId(), clave = JSON.stringify({ modo, sucursalId, periodo, estado, pagina, tamanoPagina, revision }), cargando = finalizada !== clave
  useEffect(() => { onCambiosPendientes(!!accion); return () => onCambiosPendientes(false) }, [accion, onCambiosPendientes])
  useEffect(() => { const c = new AbortController(), q = new URLSearchParams({ pagina: String(pagina), tamanoPagina: String(tamanoPagina), ...(sucursalId ? { sucursalId } : {}), ...(!esFondo && periodo ? { periodo } : {}), ...(!esFondo && estado ? { estado } : {}) })
    void Promise.all([listarCajaChica(modo, q.toString(), c.signal), !esFondo && sucursalId ? consultarFinanzas<ListaLiquidaciones>(sucursalId, 'caja-chica/liquidaciones?pagina=1&tamanoPagina=1', c.signal) : Promise.resolve(null)]).then(([l, ctx]) => { if (!c.signal.aborted) { setLista(l); setContexto(ctx); setError(null); if (pagina > Math.max(1, l.totalPaginas)) setPagina(Math.max(1, l.totalPaginas)) } }).catch(e => { if (!c.signal.aborted) setError(e) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort()
  }, [clave, modo, esFondo, sucursalId, periodo, estado, pagina, tamanoPagina])
  const puedeModificarFondo = sesion.permisos.includes('ORGANIZACION.SUCURSALES.LIQUIDACIONES_ADMINISTRAR')
  const puedeCrearFondo = puedeModificarFondo && sesion.permisos.includes('CAJA.CAJAS.CREAR')
  const puedeNueva = sesion.permisos.includes('ORGANIZACION.SUCURSALES.LIQUIDACIONES_OPERAR')
  function crear() {
    setMensaje('')
    setAccion(esFondo ? { titulo: 'Crear caja chica', ruta: 'caja-chica/fondo', sucursalSeleccionable: corporativo, campos: [...(corporativo ? [{ nombre: 'sucursalId', etiqueta: 'Sucursal', tipo: 'sucursal' as const, inicial: sucursalId }] : []), { nombre: 'importe', etiqueta: 'Fondo autorizado por liquidación (GTQ)', tipo: 'decimal' }], mensaje: 'Se creará o vinculará una única caja chica por sucursal. Asignar el fondo no confirma entrega de efectivo.' } : { titulo: 'Solicitar nueva liquidación', ruta: 'caja-chica/liquidaciones', mensaje: `Se trasladará el saldo restante de ${monto(contexto?.fondo?.saldo ?? '0.00')}. Administración autorizará la reposición del faltante.` })
  }
  function modificar(f: FondoCajaChica) {
    setMensaje('')
    setAccion({ titulo: 'Modificar fondo autorizado', ruta: 'caja-chica/fondo', method: 'PATCH', version: f.version, sucursalId: f.sucursalId,
      campos: [{ nombre: 'importe', etiqueta: 'Nuevo fondo autorizado (GTQ)', tipo: 'decimal', inicial: f.fondo }],
      mensaje: `${f.sucursal.codigo} · ${f.sucursal.nombre}. Fondo actual: ${monto(f.fondo)}. El cambio se aplicará a las siguientes liquidaciones y conservará el monto de las existentes. No entrega efectivo; la reposición requiere confirmación. Para reducirlo, debe cubrir el efectivo existente y el fondo de la liquidación activa.` })
  }
  const columnas: ColumnaTabla<FondoCajaChica | LiquidacionCajaChica>[] = [
    { id: 'sucursal', titulo: 'Sucursal', obtenerValor: r => r.sucursal.nombre, celda: r => `${r.sucursal.codigo} · ${r.sucursal.nombre}` },
    { id: 'nombre', titulo: esFondo ? 'Caja chica' : 'Liquidación', obtenerValor: r => r.nombre, celda: r => r.nombre },
    { id: 'estado', titulo: 'Estado', obtenerValor: r => r.estado, celda: r => <span className={styles.estado} data-estado={r.estado}>{esFondo ? r.estado.toLowerCase() : etiqueta(r.estado)}</span> },
    { id: 'fondo', titulo: 'Fondo autorizado', obtenerValor: r => r.fondo, celda: r => monto(r.fondo) },
    ...(!esFondo ? [{ id: 'gastos', titulo: 'Gastos', obtenerValor: (r: FondoCajaChica | LiquidacionCajaChica) => 'gastos' in r ? r.gastos : '', celda: (r: FondoCajaChica | LiquidacionCajaChica) => monto('gastos' in r ? r.gastos : '0.00') }] : []),
    { id: 'saldo', titulo: 'Saldo', obtenerValor: r => r.saldo, celda: r => monto(r.saldo) },
    { id: 'disponible', titulo: 'Disponible', obtenerValor: r => r.disponible, celda: r => monto(r.disponible) },
    { id: 'fecha', titulo: 'Registrado', obtenerValor: r => r.creadoEn, celda: r => fecha(r.creadoEn) },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: r => r.id, celda: r => <div className={gestion.accionesFila}>{puedeAccederPantalla('caja-liquidaciones', sesion.permisos) && <button type="button" aria-label={esFondo ? `Ver liquidaciones de ${r.sucursal.nombre}` : `Ver detalle de ${r.nombre}`} onClick={() => onNavegar(esFondo ? `/caja/liquidaciones/${r.sucursalId}` : `/caja/liquidaciones/${r.sucursalId}/${r.id}`)}><IconoAccion nombre="ver" /></button>}{esFondo && puedeModificarFondo && 'cajaId' in r && <button type="button" aria-label={`Modificar fondo de ${r.sucursal.nombre}`} title="Modificar fondo" disabled={!!accion} onClick={() => modificar(r)}><IconoAccion nombre="editar" /></button>}</div> }
  ]
  return <section className={gestion.pagina}><header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>{titulo}</h1><div className={gestion.accionesListado}>
    {(esFondo ? puedeCrearFondo : puedeNueva) && <button type="button" className={gestion.botonPrimario} onClick={crear} disabled={!!accion || cargando || !!error || (!esFondo && (!sucursalId || !contexto?.fondo || !!contexto.activa))}><IconoAccion nombre="agregar" />{esFondo ? 'Crear Caja Chica' : 'Nueva liquidación'}</button>}
  </div></div><p>{esFondo ? 'Fondos fijos por sucursal. La creación se realiza desde Administración.' : 'Liquidaciones sucesivas, gastos y reposiciones por sucursal.'}</p></header>
    <HerramientasListado mostrarEstados={!esFondo} opcionesEstado={estadosLiquidacion} filtros={estado ? [{ id: 'estado', value: [estado] }] : []} onFiltrosChange={f => { const v = f.find(x => x.id === 'estado')?.value; setEstado(Array.isArray(v) && typeof v[0] === 'string' ? v[0] : ''); setPagina(1) }} total={!cargando && !error ? lista?.total : undefined} unidadSingular={esFondo ? 'caja chica' : 'liquidación'} unidadPlural={esFondo ? 'cajas chicas' : 'liquidaciones'}><div className={local.filtro}>
      {corporativo ? <div className={form.campo}><label htmlFor={prefijo + 'sucursal'}>Sucursal</label><SelectorReferencia id={prefijo + 'sucursal'} referencia="sucursales" textoVacio="Todas las sucursales" value={sucursalId} disabled={!!accion} onChange={id => { setSucursal(id); setPagina(1) }} /></div> : <span>Sucursal: {sesion.sucursal.nombre}</span>}
      {!esFondo && <label htmlFor={prefijo + 'periodo'}>Mes<input id={prefijo + 'periodo'} type="month" value={periodo} disabled={!!accion} onChange={e => { setPeriodo(e.target.value); setPagina(1) }} /></label>}
    </div></HerramientasListado>
    {!esFondo && puedeNueva && !sucursalId && <p className={styles.aviso}>Selecciona una sucursal para solicitar una liquidación.</p>}
    {!esFondo && !cargando && !error && contexto?.activa && <p className={styles.aviso}>Ya existe una liquidación activa: {contexto.activa.nombre}. Debes cerrarla antes de solicitar otra.</p>}
    {!esFondo && sucursalId && !cargando && !error && !contexto?.fondo && <p className={styles.aviso}>Administración debe crear la caja chica de esta sucursal antes de solicitar liquidaciones.</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    <div className={gestion.panelTabla}><div className={gestion.resumenTabla}><h2>{esFondo ? 'Cajas chicas creadas' : 'Liquidaciones registradas'}</h2><button type="button" className={form.botonSecundario} disabled={cargando || !!accion} onClick={() => setRevision(v => v + 1)}>Actualizar</button></div><CargaCaja cargando={cargando} error={error} onReintentar={() => setRevision(v => v + 1)} />
      {!cargando && !error && lista && <>{lista.items.length ? <TablaFinanzas descripcion={esFondo ? 'Cajas chicas por sucursal' : 'Liquidaciones de caja chica'} datos={lista.items} columnas={columnas} /> : <div className={gestion.estadoVacio}><h2>{sucursalId || periodo || estado ? 'Sin coincidencias' : 'Sin registros'}</h2><p>{esFondo ? 'No hay cajas chicas creadas para esta consulta.' : 'No hay liquidaciones para esta consulta.'}</p></div>}<PaginacionTabla apariencia="tarjetas" pagina={lista.pagina} tamanoPagina={lista.tamanoPagina} total={lista.total} totalPaginas={lista.totalPaginas} unidadSingular={esFondo ? 'caja chica' : 'liquidación'} unidadPlural={esFondo ? 'cajas chicas' : 'liquidaciones'} onPaginaChange={setPagina} onTamanoPaginaChange={n => { setTamano(n); setPagina(1) }} />
      {!esFondo && !!contexto?.gastosMensuales.length && <article className={gestion.tarjetaDetalle}><h2>Total mensual de gastos de la sucursal</h2><dl>{contexto.gastosMensuales.filter(g => !periodo || g.periodo === periodo).map(g => <div key={g.periodo}><dt>{g.periodo}</dt><dd>{monto(g.gastos)}</dd></div>)}</dl><p>Excluye reposiciones y saldos trasladados.</p></article>}</>}
    </div>
    {accion && <FormularioFinanzas sucursalId={accion.sucursalId || sucursalId || sesion.sucursal.id} accion={accion} onCerrar={() => setAccion(null)} onGuardado={r => { setAccion(null); onCambiosPendientes(false); if (!esFondo) { const l = r as { id: string }; onNavegar(`/caja/liquidaciones/${sucursalId}/${l.id}`) } else { setMensaje(accion.method === 'PATCH' ? 'Fondo autorizado modificado. Se aplicará a las siguientes liquidaciones.' : 'Caja chica creada correctamente.'); setRevision(v => v + 1) } }} />}
  </section>
}
