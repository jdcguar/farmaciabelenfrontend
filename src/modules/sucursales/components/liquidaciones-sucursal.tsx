import { useEffect, useState } from 'react'
import type { ColumnaTabla } from '../../../shared/components/tabla-datos/tabla-datos'
import { consultarFinanzas, descargarComprobante } from '../presupuestos-api'
import type { LiquidacionSucursal, ListaLiquidaciones, MovimientoFinanzas } from '../presupuestos.types'
import { FormularioFinanzas, ResumenFinanzas, TablaFinanzas, type AccionFinanzas } from './finanzas-comun'
import { botonFinanzas, etiqueta, fecha, hoy, mesActual, monto } from '../finanzas-reglas'
import styles from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import local from '../presupuestos.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import cajaStyles from '../../caja/caja.module.css'
import { CargaCaja, ErrorCaja } from '../../caja/components/caja-comun'
import { NombreUsuarioCaja } from '../../caja/components/caja-selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'

export function LiquidacionesSucursal({ sucursalId, liquidacionId: id, sesion, onNavegar, onCambiosPendientes }: { sucursalId: string; liquidacionId: string; sesion: SesionUsuario; onNavegar: (ruta: string) => void; onCambiosPendientes?: (pendientes: boolean) => void }) {
  const permisos = sesion.permisos, puede = (a: string) => permisos.includes('ORGANIZACION.SUCURSALES.' + a), caja = (a: string) => permisos.includes('CAJA.' + a)
  const [lista, setLista] = useState<ListaLiquidaciones | null>(null), [detalle, setDetalle] = useState<LiquidacionSucursal | null>(null), [revision, setRevision] = useState(0), [claveCargada, setClaveCargada] = useState(''), [error, setError] = useState(''), [errorArchivo, setErrorArchivo] = useState<unknown>(null), [descargando, setDescargando] = useState(false), [accion, setAccion] = useState<AccionFinanzas | null>(null), [mensaje, setMensaje] = useState('')
  useEffect(() => { onCambiosPendientes?.(!!accion); return () => onCambiosPendientes?.(false) }, [accion, onCambiosPendientes])
  const claveActual = [sucursalId, revision, id].join(':'); const cargando = claveCargada !== claveActual
  useEffect(() => { const c = new AbortController()
    void Promise.all([consultarFinanzas<ListaLiquidaciones>(sucursalId, 'caja-chica/liquidaciones?pagina=1&tamanoPagina=1', c.signal), consultarFinanzas<LiquidacionSucursal>(sucursalId, 'caja-chica/liquidaciones/' + id, c.signal)]).then(([l, d]) => { if (!c.signal.aborted) { setLista(l); setDetalle(d); setError('') } }).catch(e => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo consultar la liquidación.') }).finally(() => { if (!c.signal.aborted) setClaveCargada(claveActual) }); return () => c.abort()
  }, [sucursalId, revision, id, claveActual])
  function abrir(a: AccionFinanzas) { setAccion(a); setMensaje('') }
  function accionL(l: LiquidacionSucursal, operacion: string, titulo: string, mensaje: string) { abrir({ titulo, ruta: `caja-chica/liquidaciones/${l.id}/${operacion}`, method: 'PATCH', version: l.version, mensaje }) }
  const activa = lista?.activa, d = detalle, operable = d?.estado === 'ABIERTA' && d.periodo === mesActual()
  const movCols: ColumnaTabla<MovimientoFinanzas>[] = [
    { id: 'fecha', titulo: 'Fecha', obtenerValor: r => r.fecha, celda: r => r.fecha },
    { id: 'tipo', titulo: 'Tipo', obtenerValor: r => r.tipo, celda: r => etiqueta(r.tipo) },
    { id: 'motivo', titulo: 'Concepto y comprobante', obtenerValor: r => r.motivo, celda: r => <><p>{r.motivo}</p>{r.comprobante ? botonFinanzas('Descargar ' + r.comprobante.nombre, async () => { setDescargando(true); setErrorArchivo(null); try { await descargarComprobante(sucursalId, r.id, r.comprobante!.nombre) } catch (e) { setErrorArchivo(e) } finally { setDescargando(false) } }, descargando) : <small>{r.evidencia}</small>}{r.originalId && <p>Corrección del movimiento {r.originalId}</p>}</> },
    { id: 'estado', titulo: 'Estado', obtenerValor: r => r.estado, celda: r => etiqueta(r.estado) },
    { id: 'importe', titulo: 'Importe', obtenerValor: r => r.importe, celda: r => monto(r.importe) },
    { id: 'autor', titulo: 'Responsables', obtenerValor: r => r.creadoPorId, celda: r => <><p>Registró: {r.creadoPorId ? <NombreUsuarioCaja id={r.creadoPorId} sesion={sesion} /> : 'Sin registro'}</p><p>Aprobó: {r.aprobadoPorId ? <NombreUsuarioCaja id={r.aprobadoPorId} sesion={sesion} /> : 'Pendiente'}</p><small>{fecha(r.aprobadoEn)}</small></> },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: r => r.id, celda: r => <div className={local.acciones}>
      {r.estado === 'SOLICITADO' && d?.estado !== 'CERRADA' && <>{operable && puede('LIQUIDACIONES_ADMINISTRAR') && caja('MOVIMIENTOS.CONFIRMAR') && botonFinanzas('Confirmar gasto', () => abrir({ titulo: 'Confirmar movimiento de caja chica', ruta: `caja-chica/movimientos/${r.id}/confirmar`, method: 'PATCH', version: r.version, mensaje: `${etiqueta(r.tipo)}: ${monto(r.importe)} · ${r.motivo}. Se requiere un aprobador distinto del solicitante.` }), !!accion)}{puede('LIQUIDACIONES_OPERAR') && caja('MOVIMIENTOS.CANCELAR') && botonFinanzas('Cancelar movimiento', () => abrir({ titulo: 'Cancelar movimiento pendiente', ruta: `caja-chica/movimientos/${r.id}/cancelar`, method: 'PATCH', version: r.version, mensaje: `${monto(r.importe)} · ${r.motivo}` }), !!accion)}</>}
      {r.tipo === 'EGRESO' && r.estado === 'APROBADO' && activa?.estado === 'ABIERTA' && activa.periodo === mesActual() && puede('LIQUIDACIONES_OPERAR') && caja('MOVIMIENTOS.CORREGIR') && botonFinanzas('Solicitar corrección', () => abrir({ titulo: 'Solicitar corrección del gasto', ruta: `caja-chica/liquidaciones/${activa.id}/correcciones`, version: activa.version, extra: { originalId: r.id }, campos: [{ nombre: 'importeCorrecto', etiqueta: 'Importe correcto (GTQ)', tipo: 'decimal', inicial: r.importe }], mensaje: `Se conservará el gasto original. La diferencia se registrará en ${activa.nombre} y requerirá aprobación.` }), !!accion)}
    </div> }
  ]
  const grupos = [...new Set((d?.movimientos ?? []).map(m => (m.fecha ?? '').slice(0, 7)))].sort()
  return <section id="sucursal-caja-chica" className={styles.pagina}>
    <header className={form.encabezadoPagina}><div><h1>Detalle de liquidación</h1><p>{d?.nombre ?? 'Caja chica'}{d ? ` · ${etiqueta(d.estado)}` : ''}</p></div><button type="button" className={form.botonSecundario} onClick={() => onNavegar(`/caja/liquidaciones/${sucursalId}`)}>Volver al listado</button></header>
    <CargaCaja cargando={cargando} error={error} onReintentar={() => setRevision(v => v + 1)} />
    {mensaje && <p role="status">{mensaje}</p>}
    {activa && activa.periodo !== mesActual() && <p className={local.aviso}>Debe cerrar {activa.nombre} para comenzar el nuevo mes. El saldo restante se conservará.</p>}
    {accion && <FormularioFinanzas key={accion.ruta} sucursalId={sucursalId} accion={accion} onCerrar={() => setAccion(null)} onGuardado={() => { setAccion(null); setMensaje('Operación registrada correctamente.'); setRevision(v => v + 1) }} />}
    {d && !cargando && !error && <div className={cajaStyles.contenido}>
      <article className={`${styles.tarjetaDetalle} ${local.panel}`}><h2><span className={styles.numeroSeccion}>01</span>Resumen de la liquidación</h2><ResumenFinanzas valores={{ 'Fondo autorizado': monto(d.fondo), 'Reposiciones confirmadas': monto(d.repuesto), 'Ajustes por correcciones': monto(d.ajustes ?? '0.00'), 'Gastos pendientes': monto(d.comprometido), 'Efectivo disponible': monto(d.disponible), 'Saldo inicial trasladado': monto(d.saldoInicial), 'Egresos acumulados': monto(d.egresosAcumulados ?? d.gastos), 'Gastos netos': monto(d.gastos), 'Saldo final / actual': monto(d.saldo) }} />
        <div className={local.acciones}>{d.estado === 'SOLICITADA' && d.periodo === mesActual() && puede('LIQUIDACIONES_ADMINISTRAR') && botonFinanzas('Autorizar reposición', () => accionL(d, 'aprobar', 'Autorizar liquidación y reposición', `Faltante autorizado: ${monto(d.reposicionNecesaria)}. Esto no confirma entrega de efectivo.`), !!accion)}{operable && !d.confirmadoEn && puede('LIQUIDACIONES_ADMINISTRAR') && botonFinanzas('Confirmar recepción de reposición', () => accionL(d, 'reposicion', 'Confirmar reposición recibida', `Registra la entrega efectiva de ${monto(d.reposicionNecesaria)}. Solo entonces aumentará el saldo disponible.`), !!accion)}</div>
      </article>
      <article className={`${styles.tarjetaDetalle} ${local.panel}`}><h2><span className={styles.numeroSeccion}>02</span>Movimientos</h2>
      <div className={local.acciones}>{operable && puede('LIQUIDACIONES_OPERAR') && caja('MOVIMIENTOS.CREAR') && botonFinanzas('Registrar gasto', () => abrir({ titulo: 'Registrar gasto de caja chica', ruta: `caja-chica/liquidaciones/${d.id}/gastos/con-comprobante`, version: d.version, evidenciaPdf: true, campos: [{ nombre: 'importe', etiqueta: 'Importe del gasto (GTQ)', tipo: 'decimal' }, { nombre: 'fecha', etiqueta: 'Fecha del movimiento', tipo: 'date', inicial: hoy() }], mensaje: 'El gasto quedará pendiente de aprobación y reservará el efectivo correspondiente.' }), !!accion)}{d.estado !== 'CERRADA' && puede('LIQUIDACIONES_OPERAR') && caja('TURNOS.CERRAR') && botonFinanzas('Cerrar liquidación', () => accionL(d, 'cerrar', 'Cerrar liquidación', `El saldo de ${monto(d.saldo)} se conservará. No se aceptarán más movimientos ni se repondrá efectivo automáticamente.`), !!accion)}{botonFinanzas('Actualizar', () => setRevision(v => v + 1), !!accion)}</div>
      <ErrorCaja error={errorArchivo} />
      {grupos.length ? grupos.map(mes => <section key={mes} className={local.grupo}><h3>Movimientos de {mes}</h3><p>Gastos confirmados del mes: <strong>{monto(d.gastosMensuales?.find(g => g.periodo === mes)?.gastos ?? '0.00')}</strong></p><TablaFinanzas descripcion={`Movimientos de ${d.nombre} para ${mes}`} datos={(d.movimientos ?? []).filter(m => m.fecha?.startsWith(mes))} columnas={movCols} /></section>) : <p>No hay movimientos en esta liquidación.</p>}
      {!!d.correcciones?.length && <section className={local.grupo}><h3>Correcciones vinculadas a los gastos originales</h3><TablaFinanzas descripcion="Historia de correcciones conservadas" datos={d.correcciones} columnas={movCols.slice(0, -1)} /></section>}
      </article>
      <article className={`${styles.tarjetaDetalle} ${local.panel} ${local.auditoria}`} aria-label="Auditoría de la liquidación"><h2><span className={styles.numeroSeccion}>03</span>Auditoría de la liquidación</h2><ResumenFinanzas valores={Object.fromEntries([
        { titulo: 'Apertura solicitada', fecha: d.creadoEn, responsable: d.creadoPorId },
        { titulo: 'Reposición autorizada', fecha: d.aprobadoEn, responsable: d.aprobadoPorId },
        { titulo: 'Recepción confirmada', fecha: d.confirmadoEn, responsable: d.confirmadoPorId },
        { titulo: 'Cierre', fecha: d.cerradoEn, responsable: d.cerradoPorId }
      ].map(evento => [evento.titulo, <><span>Fecha: {evento.fecha ? fecha(evento.fecha) : 'Pendiente'}</span><span>Responsable: {evento.responsable ? <NombreUsuarioCaja id={evento.responsable} sesion={sesion} /> : evento.fecha ? 'Sin registro' : 'Pendiente'}</span></>]))} /></article>
    </div>}
  </section>
}
