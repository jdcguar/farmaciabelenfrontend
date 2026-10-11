import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { etiqueta, etiquetasCampos, grupoMovimiento, vistas } from '../inventario.config'
import { fechaHora } from '../inventario-reglas'
import type { AccionInventario, RegistroInventario } from '../inventario.types'
import { ValorInventario } from './inventario-datos'
import { InventarioAuditoria } from './inventario-auditoria'
import { IconoPosicion } from './inventario-posicion-identidad'
import { EstadoOperacion } from './inventario-estado-operacion'
import { DetalleLineas } from './inventario-lineas-detalle'
import { fechaPosicion } from '../inventario-posiciones-formatos'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

type Props = {
  recurso: 'movimientos' | 'bloqueos'; registro: RegistroInventario | null; cargando: boolean; error: string | null
  revisionAuditoria: number; onRecargar: () => void; onAccion: (accion: AccionInventario) => void
}
export function InventarioOperacionDetalle({ recurso, registro: r, cargando, error, revisionAuditoria, onRecargar, onAccion }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const movimiento = recurso === 'movimientos', cargaInicial = recurso === 'movimientos' && r?.tipo === 'CARGA_INICIAL', ajuste = recurso === 'movimientos' && (r?.tipo === 'AJUSTE_POSITIVO' || r?.tipo === 'AJUSTE_NEGATIVO'), singular = cargaInicial ? 'carga inicial' : ajuste ? 'ajuste' : vistas[recurso].singular
  const rutaListado = cargaInicial ? '/inventario/carga-inicial' : ajuste ? '/inventario/ajustes' : `/inventario/${recurso}`
  const auditoria = sesion.permisos.includes('INVENTARIO.ACCESO.VER_AUDITORIA')
  if (cargando) return <p className={local.estadoCarga} role="status">Cargando información…</p>
  if (error) return <section className={styles.errorPagina} role="alert"><h1>No se pudo abrir el {singular}</h1><p>{error}</p><div><button type="button" onClick={() => onNavegar(rutaListado)}>Volver</button><button type="button" onClick={onRecargar}>Reintentar</button></div></section>
  if (!r) return null
  const grupo = r.tipo ? grupoMovimiento(r.tipo) : vistas[recurso].grupo
  const puede = (accion: string) => sesion.permisos.includes(`INVENTARIO.${grupo}.${accion}`)
  const secciones = movimiento ? [
    { id: 'operacion-identificacion', titulo: 'Identificación del movimiento', campos: ['referencia', 'sucursalId', 'tipo', ...(r.fechaCorte ? ['fechaCorte'] : []), ...(r.movimientoCorregidoId ? ['movimientoCorregidoId'] : []), ...(r.conteoId ? ['conteoId'] : [])] },
    { id: 'operacion-justificantes', titulo: 'Motivo y evidencia', campos: ['motivo', 'evidencia'] },
  ] : [
    { id: 'operacion-identificacion', titulo: 'Alcance de la restricción', campos: ['sucursalId', 'clase', 'alcance', 'objetivoId'] },
    { id: 'operacion-justificantes', titulo: 'Motivo y evidencia', campos: ['motivo', 'evidencia'] },
  ]
  return <section className={styles.pagina} aria-labelledby="titulo-detalle-operacion"><div className={styles.detalleLayout}>
    <header className={styles.cabeceraDetalle}>
      <div className={styles.perfilEmpleado}><span className={`${styles.fotoDetalle} ${local.perfilIcono}`}><IconoPosicion /></span><div><p>{cargaInicial ? 'Carga inicial' : ajuste ? 'Ajustes' : vistas[recurso].titulo}</p><h1 id="titulo-detalle-operacion">{movimiento ? r.referencia : `Bloqueo de ${etiqueta(r.alcance ?? '').toLowerCase()}`}</h1><EstadoOperacion valor={r.estado} /></div></div>
      <div className={styles.resumenPerfil}><span>{movimiento ? 'Tipo de movimiento' : 'Registro restringido'}</span><strong><ValorInventario campo={movimiento ? 'tipo' : 'objetivoId'} registro={r} /></strong><span>Sucursal</span><strong><ValorInventario campo="sucursalId" registro={r} /></strong><span>{movimiento ? 'Fecha de registro' : 'Clase de bloqueo'}</span><strong>{movimiento ? fechaHora(r.creadoEn) : etiqueta(r.clase ?? '')}</strong></div>
      <div className={styles.accionesCabecera}>
        {movimiento && r.estado === 'PENDIENTE' && !r.conteoId && <>{puede('CONFIRMAR') && <button className={styles.botonEditar} type="button" onClick={() => onAccion('confirmar')}><IconoAccion nombre="guardar" /><span>{cargaInicial ? 'Confirmar carga inicial' : ajuste ? 'Confirmar ajuste' : 'Confirmar movimiento'}</span></button>}{puede('ANULAR') && <button className={styles.botonEstado} type="button" onClick={() => onAccion('anular')}>Anular pendiente</button>}</>}
        {!movimiento && r.estado === 'ACTIVO' && r.clase === 'OPERATIVO' && puede('LEVANTAR') && <button className={styles.botonEditar} type="button" onClick={() => onAccion('levantar')}><IconoAccion nombre="estado" /><span>Levantar bloqueo</span></button>}
        <button type="button" onClick={() => onNavegar(rutaListado)}>Volver al listado</button><button type="button" onClick={onRecargar}>Actualizar información</button>
      </div>
    </header>
    <div className={styles.detalleContenido}>
      <NavegacionSecciones className={styles.navegacionDetalle} secciones={[{ id: 'operacion-informacion', titulo: 'Información general' }, ...(movimiento ? [{ id: 'operacion-lineas', titulo: 'Líneas del movimiento' }] : []), { id: 'operacion-registro', titulo: 'Datos del registro' }, ...(auditoria ? [{ id: 'inv-auditoria', titulo: 'Auditoría' }] : [])]} />
      <div id="operacion-informacion" className={styles.encabezadoExpediente}><p>{cargaInicial ? 'Ficha de la carga inicial' : `Ficha del ${singular}`}</p><h2>Información general</h2></div>
      <div className={styles.grillaDetalle}>{secciones.map((s, i) => <article id={s.id} key={s.id} className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</h2><dl>{s.campos.map(c => <div key={c} className={['motivo', 'evidencia', 'objetivoId', 'movimientoCorregidoId'].includes(c) ? styles.datoCompleto : undefined}><dt>{etiquetasCampos[c]}</dt><dd>{c === 'fechaCorte' ? fechaPosicion(r.fechaCorte) : <ValorInventario campo={c} registro={r} />}</dd></div>)}</dl></article>)}</div>
      {movimiento && <article id="operacion-lineas" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>03</span>Líneas del movimiento</h2><DetalleLineas apariencia="empleados" recurso="movimientos" registro={r} /></article>}
      {!movimiento && r.clase === 'SANITARIO' && <div className={styles.alertaAdvertencia} role="status"><p>La evaluación sanitaria, liberación, bajas y destrucción se desarrollarán en su etapa. Este registro conserva la restricción y su evidencia.</p></div>}
      <article id="operacion-registro" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>{movimiento ? '04' : '03'}</span>Datos del registro</h2><dl>
        <div><dt>Registrado el</dt><dd>{fechaHora(r.creadoEn)}</dd></div><div><dt>Última actualización</dt><dd>{fechaHora(r.actualizadoEn)}</dd></div><div><dt>Versión</dt><dd>{r.version}</dd></div>
        {['confirmadoEn', 'motivoAnulacion', 'levantadoEn', 'motivoLevantamiento'].filter(c => r[c as keyof RegistroInventario]).map(c => <div key={c} className={c.startsWith('motivo') ? styles.datoCompleto : undefined}><dt>{etiquetasCampos[c]}</dt><dd><ValorInventario campo={c} registro={r} /></dd></div>)}
        <div className={styles.datoCompleto}><dt>Identificador</dt><dd className={local.identificador}>{r.id}</dd></div>
      </dl></article>
      {auditoria && <InventarioAuditoria recurso={recurso} id={r.id} revision={revisionAuditoria} apariencia="empleados" />}
    </div>
  </div></section>
}
