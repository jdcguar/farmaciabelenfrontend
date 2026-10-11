import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { TablaDatos } from '../../../shared/components/tabla-datos'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { etiqueta, etiquetasCampos, vistas } from '../inventario.config'
import { fechaHora, textoCantidad } from '../inventario-reglas'
import type { AccionInventario, RegistroInventario } from '../inventario.types'
import { NombreInventario, ValorInventario } from './inventario-datos'
import { InventarioAuditoria } from './inventario-auditoria'
import { IconoPosicion } from './inventario-posicion-identidad'
import { EstadoReserva } from './inventario-estado-reserva'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

type Props = {
  recurso: 'kardex' | 'reservas'; registro: RegistroInventario | null; cargando: boolean; error: string | null
  revisionAuditoria: number; onRecargar: () => void; onAccion: (accion: AccionInventario) => void
}
export function InventarioSeguimientoDetalle({ recurso, registro: r, cargando, error, revisionAuditoria, onRecargar, onAccion }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const auditoria = sesion.permisos.includes('INVENTARIO.ACCESO.VER_AUDITORIA')
  const reserva = recurso === 'reservas'
  if (cargando) return <p className={local.estadoCarga} role="status">Cargando información…</p>
  if (error) return <section className={styles.errorPagina} role="alert"><h1>No se pudo abrir {reserva ? 'la reserva' : 'el registro del kardex'}</h1><p>{error}</p><div><button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver</button><button type="button" onClick={onRecargar}>Reintentar</button></div></section>
  if (!r) return null
  const estado = r.estadoEfectivo ?? r.estado
  const puede = (accion: string) => sesion.permisos.includes(`INVENTARIO.RESERVAS.${accion}`)
  const secciones = reserva ? [
    { id: 'seguimiento-identificacion', titulo: 'Identificación de la reserva', campos: ['referencia', 'sucursalId', 'presentacionId'] },
    { id: 'seguimiento-vigencia', titulo: 'Cantidad y vigencia', campos: ['cantidadBase', 'cantidadAsignadaBase', 'estado', 'estadoEfectivo', 'expiraEn'] },
  ] : [
    { id: 'seguimiento-identificacion', titulo: 'Ubicación y presentación', campos: ['sucursalId', 'presentacionId', 'ubicacionId', 'loteId'] },
    { id: 'seguimiento-saldo', titulo: 'Entradas, salidas y saldo', campos: ['direccion', 'entradaBase', 'salidaBase', 'saldoBase', 'secuencia', 'ocurridoEn'] },
    { id: 'seguimiento-movimiento', titulo: 'Movimiento de origen', campos: ['referencia', 'tipo', 'movimientoId', 'existenciaId', 'detalleId'] },
  ]
  return <section className={styles.pagina} aria-labelledby="titulo-detalle-seguimiento"><div className={styles.detalleLayout}>
    <header className={styles.cabeceraDetalle}>
      <div className={styles.perfilEmpleado}><span className={`${styles.fotoDetalle} ${local.perfilIcono}`}><IconoPosicion /></span><div><p>{vistas[recurso].titulo}</p><h1 id="titulo-detalle-seguimiento">{r.referencia ?? (reserva ? 'Detalle de reserva' : 'Registro del kardex')}</h1>{reserva ? <EstadoReserva valor={estado} /> : <span className={styles.sinDato}>{etiqueta(r.direccion ?? '')} · Secuencia {r.secuencia ?? '—'}</span>}</div></div>
      <div className={styles.resumenPerfil}><span>Presentación</span><strong><ValorInventario campo="presentacionId" registro={r} /></strong><span>{reserva ? 'Cantidad reservada' : 'Saldo de la posición'}</span><strong>{textoCantidad(reserva ? r.cantidadBase : r.saldoBase)} unidades base</strong><span>{reserva ? 'Expiración' : 'Fecha del movimiento'}</span><strong>{fechaHora(reserva ? r.expiraEn : r.ocurridoEn)}</strong></div>
      <div className={styles.accionesCabecera}>
        {reserva && estado === 'ACTIVA' && puede('PREPARAR') && <button className={styles.botonEditar} type="button" onClick={() => onAccion('preparar')}><IconoAccion nombre="guardar" /><span>Preparar por FEFO</span></button>}
        {reserva && ['ACTIVA', 'PREPARADA'].includes(estado ?? '') && puede('CANCELAR') && <button className={styles.botonEstado} type="button" onClick={() => onAccion('cancelar')}>Cancelar reserva</button>}
        <button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver al listado</button><button type="button" onClick={onRecargar}>Actualizar información</button>
      </div>
    </header>
    <div className={styles.detalleContenido}>
      <NavegacionSecciones className={styles.navegacionDetalle} secciones={[{ id: 'seguimiento-informacion', titulo: 'Información general' }, ...(reserva ? [{ id: 'seguimiento-preparacion', titulo: 'Preparación' }] : []), { id: 'seguimiento-registro', titulo: 'Datos del registro' }, ...(auditoria ? [{ id: 'inv-auditoria', titulo: 'Auditoría' }] : [])]} />
      <div id="seguimiento-informacion" className={styles.encabezadoExpediente}><p>{reserva ? 'Ficha de reserva' : 'Ficha del kardex'}</p><h2>Información general</h2></div>
      <div className={styles.grillaDetalle}>{secciones.map((s, i) => <article id={s.id} key={s.id} className={`${styles.tarjetaDetalle} ${i === 2 ? styles.datoCompleto : ''}`}><h2><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</h2><dl>{s.campos.map(c => <div key={c} className={['presentacionId', 'existenciaId', 'detalleId'].includes(c) ? styles.datoCompleto : undefined}><dt>{etiquetasCampos[c]}</dt><dd className={c === 'detalleId' ? local.identificador : undefined}>{c === 'estado' || c === 'estadoEfectivo' ? <EstadoReserva valor={r[c]} /> : <><ValorInventario campo={c} registro={r} />{c.endsWith('Base') && ' unidades base'}</>}</dd></div>)}</dl></article>)}</div>
      {reserva && <article id="seguimiento-preparacion" className={styles.tarjetaDetalle}>
        <h2><span className={styles.numeroSeccion}>03</span>Preparación y posiciones asignadas</h2>
        <p className={local.ayudaFiltros}>{r.utilizable ? 'La preparación es utilizable según la consulta actual.' : estado === 'ACTIVA' ? 'La reserva compromete stock. Prepárala por FEFO para asignar posiciones aptas.' : 'La reserva no tiene una preparación utilizable en este momento.'}</p>
        {r.actualizadoEnConsulta && <p className={local.ayudaFiltros}>Evaluación de aptitud: {fechaHora(r.actualizadoEnConsulta)}</p>}
        {r.incidencias?.map(i => <div className={styles.alertaAdvertencia} role="status" key={i.existenciaId}><p><NombreInventario recurso="existencias" id={i.existenciaId} />: {i.causas.map(etiqueta).join(', ')}</p></div>)}
        {r.asignaciones?.length ? <TablaDatos apariencia="tarjetas" descripcion="Posiciones asignadas a la reserva" datos={r.asignaciones} columnas={[{ id: 'existencia', titulo: 'Posición', obtenerValor: a => a.existenciaId, celda: a => <NombreInventario recurso="existencias" id={a.existenciaId} /> }, { id: 'cantidad', titulo: 'Cantidad base', obtenerValor: a => a.cantidadBase, celda: a => textoCantidad(a.cantidadBase) }]} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} obtenerIdFila={a => a.id} /> : <p className={local.estadoCarga}>No hay posiciones asignadas.</p>}
      </article>}
      <article id="seguimiento-registro" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>04</span>Datos del registro</h2><dl>
        <div><dt>Registrado el</dt><dd>{fechaHora(r.creadoEn)}</dd></div><div><dt>Última actualización</dt><dd>{fechaHora(r.actualizadoEn)}</dd></div><div><dt>Versión</dt><dd>{r.version}</dd></div>
        {reserva && r.cerradoEn && <><div><dt>Cerrado el</dt><dd>{fechaHora(r.cerradoEn)}</dd></div><div className={styles.datoCompleto}><dt>Motivo de cierre</dt><dd>{r.motivoCierre ?? 'Sin dato'}</dd></div></>}
        <div className={styles.datoCompleto}><dt>Identificador</dt><dd className={local.identificador}>{r.id}</dd></div>
      </dl></article>
      {auditoria && <InventarioAuditoria recurso={recurso} id={r.id} revision={revisionAuditoria} apariencia="empleados" />}
    </div>
  </div></section>
}
