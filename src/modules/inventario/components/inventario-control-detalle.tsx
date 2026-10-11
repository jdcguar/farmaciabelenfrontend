import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { etiquetasCampos, vistas } from '../inventario.config'
import { fechaHora } from '../inventario-reglas'
import type { AccionInventario, RegistroInventario } from '../inventario.types'
import { ValorInventario, NombreInventario } from './inventario-datos'
import { InventarioAuditoria } from './inventario-auditoria'
import { IconoPosicion } from './inventario-posicion-identidad'
import { EstadoOperacion } from './inventario-estado-operacion'
import { DetalleLineas, TablaSimple } from './inventario-lineas-detalle'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

type Props = {
  recurso: 'cuarentenas' | 'conteos'; registro: RegistroInventario | null; cargando: boolean; error: string | null
  revisionAuditoria: number; onRecargar: () => void; onAccion: (accion: AccionInventario) => void
}
export function InventarioControlDetalle({ recurso, registro: r, cargando, error, revisionAuditoria, onRecargar, onAccion }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const conteo = recurso === 'conteos', auditoria = sesion.permisos.includes('INVENTARIO.ACCESO.VER_AUDITORIA')
  const puede = (accion: string) => sesion.permisos.includes(`INVENTARIO.CONTEOS.${accion}`)
  if (cargando) return <p className={local.estadoCarga} role="status">Cargando información…</p>
  if (error) return <section className={styles.errorPagina} role="alert"><h1>No se pudo abrir el {vistas[recurso].singular}</h1><p>{error}</p><div><button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver</button><button type="button" onClick={onRecargar}>Reintentar</button></div></section>
  if (!r) return null
  const secciones = [
    { titulo: conteo ? 'Identificación del conteo' : 'Stock en cuarentena', campos: conteo ? ['referencia', 'sucursalId', 'ubicacionId'] : ['sucursalId', 'presentacionId', 'ubicacionId', 'loteId', 'existenciaId', 'cantidadBase', 'resueltoBase', 'detalleId'] },
    { titulo: 'Motivo y evidencia', campos: ['motivo', 'evidencia'] },
  ]
  return <section className={styles.pagina} aria-labelledby="titulo-control"><div className={styles.detalleLayout}>
    <header className={styles.cabeceraDetalle}>
      <div className={styles.perfilEmpleado}><span className={`${styles.fotoDetalle} ${local.perfilIcono}`}><IconoPosicion /></span><div><p>{vistas[recurso].titulo}</p><h1 id="titulo-control">{conteo ? r.referencia : 'Caso de cuarentena'}</h1><EstadoOperacion valor={r.estado} /></div></div>
      <div className={styles.resumenPerfil}><span>{conteo ? 'Ubicación a contar' : 'Presentación segregada'}</span><strong><ValorInventario campo={conteo ? 'ubicacionId' : 'presentacionId'} registro={r} /></strong><span>Sucursal</span><strong><ValorInventario campo="sucursalId" registro={r} /></strong><span>Fecha de registro</span><strong>{fechaHora(r.creadoEn)}</strong></div>
      <div className={styles.accionesCabecera}>
        {conteo && r.estado === 'ABIERTO' && <>{puede('REGISTRAR') && <button type="button" className={styles.botonEditar} onClick={() => onNavegar(`/inventario/conteos/${r.id}/resultados`)}><IconoAccion nombre="guardar" /><span>Registrar cantidades</span></button>}{puede('CERRAR') && <button type="button" className={styles.botonEstado} onClick={() => onAccion('cerrar')}>Cerrar conteo</button>}</>}
        {conteo && r.estado === 'CERRADO' && puede('CONCILIAR') && sesion.permisos.includes('INVENTARIO.AJUSTES.CONFIRMAR') && <button type="button" className={styles.botonEditar} onClick={() => onAccion('conciliar')}><IconoAccion nombre="guardar" /><span>Conciliar diferencias</span></button>}
        {conteo && ['ABIERTO', 'CERRADO'].includes(r.estado ?? '') && puede('CANCELAR') && <button type="button" className={styles.botonEstado} onClick={() => onAccion('cancelar')}>Cancelar conteo</button>}
        <button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver al listado</button><button type="button" onClick={onRecargar}>Actualizar información</button>
      </div>
    </header>
    <div className={styles.detalleContenido}>
      <NavegacionSecciones className={styles.navegacionDetalle} secciones={[{ id: 'control-informacion', titulo: 'Información general' }, ...(conteo ? [{ id: 'control-resultados', titulo: 'Resultados del conteo' }, ...(r.ajustes?.length ? [{ id: 'control-ajustes', titulo: 'Ajustes de conciliación' }] : [])] : []), { id: 'control-registro', titulo: 'Datos del registro' }, ...(auditoria ? [{ id: 'inv-auditoria', titulo: 'Auditoría' }] : [])]} />
      <div id="control-informacion" className={styles.encabezadoExpediente}><p>Ficha del {vistas[recurso].singular}</p><h2>Información general</h2></div>
      <div className={styles.grillaDetalle}>{secciones.map((s, i) => <article key={s.titulo} className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</h2><dl>{s.campos.map(c => <div key={c} className={['motivo', 'evidencia', 'existenciaId', 'detalleId'].includes(c) ? styles.datoCompleto : undefined}><dt>{etiquetasCampos[c] ?? (c === 'detalleId' ? 'Detalle del movimiento' : c)}</dt><dd className={c === 'detalleId' ? local.identificador : undefined}><ValorInventario campo={c} registro={r} /></dd></div>)}</dl></article>)}</div>
      {conteo ? <><div className={styles.alertaAdvertencia} role="status"><p>{['ABIERTO', 'CERRADO'].includes(r.estado ?? '') ? 'La ubicación permanece congelada para movimientos físicos hasta conciliar o cancelar. Guardar resultados no modifica las existencias.' : r.estado === 'CONCILIADO' ? 'El conteo fue conciliado y la congelación de la ubicación fue retirada.' : 'El conteo fue cancelado sin ajustar las existencias.'}</p></div><article id="control-resultados" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>03</span>Resultados del conteo</h2><p className={local.ayudaFiltros}>Cantidades esperadas, contadas y diferencias en unidades base.</p><DetalleLineas apariencia="empleados" recurso="conteos" registro={r} /></article>
        {Boolean(r.ajustes?.length) && <article id="control-ajustes" className={styles.tarjetaDetalle}><h2>Ajustes de conciliación</h2><TablaSimple apariencia="empleados" datos={r.ajustes ?? []} columnas={[{ id: 'movimiento', titulo: 'Movimiento', obtenerValor: a => a.id, celda: a => <NombreInventario recurso="movimientos" id={a.id} /> }, { id: 'tipo', titulo: 'Tipo', obtenerValor: a => a.tipo, celda: a => <ValorInventario campo="tipo" registro={a} /> }, { id: 'estado', titulo: 'Estado', obtenerValor: a => a.estado, celda: a => <EstadoOperacion valor={a.estado} /> }]} /></article>}</> : <div className={styles.alertaAdvertencia} role="status"><p>La evaluación sanitaria, liberación, bajas y destrucción se desarrollarán en su etapa. Este registro conserva la restricción y su evidencia. Las cantidades se expresan en unidades base.</p></div>}
      <article id="control-registro" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>{conteo ? '04' : '03'}</span>Datos del registro</h2><dl><div><dt>Registrado el</dt><dd>{fechaHora(r.creadoEn)}</dd></div><div><dt>Última actualización</dt><dd>{fechaHora(r.actualizadoEn)}</dd></div><div><dt>Versión</dt><dd>{r.version}</dd></div>{['cerradoEn', 'motivoCierre'].filter(c => r[c as keyof RegistroInventario]).map(c => <div key={c}><dt>{etiquetasCampos[c]}</dt><dd><ValorInventario campo={c} registro={r} /></dd></div>)}<div className={styles.datoCompleto}><dt>Identificador</dt><dd className={local.identificador}>{r.id}</dd></div></dl></article>
      {auditoria && <InventarioAuditoria apariencia="empleados" recurso={recurso} id={r.id} revision={revisionAuditoria} />}
    </div>
  </div></section>
}
