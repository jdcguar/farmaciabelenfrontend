import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { etiquetasCampos, vistas } from '../inventario.config'
import { fechaHora, textoCantidad } from '../inventario-reglas'
import type { RegistroInventario } from '../inventario.types'
import { ValorInventario } from './inventario-datos'
import { InventarioAuditoria } from './inventario-auditoria'
import { CondicionExistencia, IconoPosicion } from './inventario-posicion-identidad'
import { fechaPosicion } from '../inventario-posiciones-formatos'
import type { RecursoPosicion } from './inventario-posiciones-listado-view'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

type Props = {
  recurso: RecursoPosicion; registro: RegistroInventario | null; cargando: boolean; error: string | null
  revisionAuditoria: number; onRecargar: () => void
}

export function InventarioPosicionDetalle({ recurso, registro: r, cargando, error, revisionAuditoria, onRecargar }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const auditoria = sesion.permisos.includes('INVENTARIO.ACCESO.VER_AUDITORIA')
  if (cargando) return <p className={local.estadoCarga} role="status">Cargando información…</p>
  if (error) return <section className={styles.errorPagina} role="alert"><h1>No se pudo abrir {recurso === 'lotes' ? 'el lote' : 'la existencia'}</h1><p>{error}</p><div><button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver</button><button type="button" onClick={onRecargar}>Reintentar</button></div></section>
  if (!r) return null
  const secciones = recurso === 'lotes' ? [
    { id: 'lote-identificacion', titulo: 'Identificación del lote', campos: ['numero', 'presentacionId'] },
    { id: 'lote-fechas', titulo: 'Fechas del lote', campos: ['fechaIngreso', 'fechaFabricacion', 'fechaVencimiento'] },
    { id: 'lote-origen', titulo: 'Origen y trazabilidad', campos: ['proveedorId', 'referenciaOrigen'] },
  ] : [
    { id: 'existencia-ubicacion', titulo: 'Ubicación y presentación', campos: ['sucursalId', 'ubicacionId', 'presentacionId', 'loteId'] },
    { id: 'existencia-saldo', titulo: 'Saldo y condición', campos: ['cantidadBase', 'condicion', 'secuencia'] },
  ]
  return <section className={styles.pagina} aria-labelledby="titulo-detalle-posicion">
    <div className={styles.detalleLayout}>
      <header className={styles.cabeceraDetalle}>
        <div className={styles.perfilEmpleado}><span className={`${styles.fotoDetalle} ${local.perfilIcono}`}><IconoPosicion /></span><div><p>{vistas[recurso].titulo}</p><h1 id="titulo-detalle-posicion">{recurso === 'lotes' ? r.numero : 'Detalle de existencia'}</h1>{recurso === 'existencias' && <CondicionExistencia valor={r.condicion} />}</div></div>
        <div className={styles.resumenPerfil}><span>Presentación</span><strong><ValorInventario campo="presentacionId" registro={r} /></strong>
          {recurso === 'lotes' ? <><span>Referencia de origen</span><strong>{r.referenciaOrigen}</strong></> : <><span>Saldo físico</span><strong>{textoCantidad(r.cantidadBase)} unidades base</strong><span>Ubicación</span><strong><ValorInventario campo="ubicacionId" registro={r} /></strong></>}
        </div>
        <div className={styles.accionesCabecera}>
          {recurso === 'existencias' && sesion.permisos.includes('INVENTARIO.KARDEX.VER') && <button className={styles.botonEditar} type="button" onClick={() => onNavegar(`/inventario/kardex?existenciaId=${r.id}`)}><IconoAccion nombre="ver" /><span>Ver kardex</span></button>}
          <button type="button" onClick={() => onNavegar(`/inventario/${recurso}`)}>Volver al listado</button>
          <button type="button" onClick={onRecargar}>Actualizar información</button>
        </div>
      </header>
      <div className={styles.detalleContenido}>
        <NavegacionSecciones className={styles.navegacionDetalle} secciones={[{ id: 'posicion-informacion', titulo: 'Información general' }, { id: 'posicion-registro', titulo: 'Datos del registro' }, ...(auditoria ? [{ id: 'inv-auditoria', titulo: 'Auditoría' }] : [])]} />
        <div id="posicion-informacion" className={styles.encabezadoExpediente}><p>{recurso === 'lotes' ? 'Ficha del lote' : 'Ficha de existencia'}</p><h2>Información general</h2></div>
        <div className={styles.grillaDetalle}>{secciones.map((s, i) => <article id={s.id} key={s.id} className={`${styles.tarjetaDetalle} ${i === 2 ? styles.datoCompleto : ''}`}>
          <h2><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</h2>
          <dl>{s.campos.map(c => <div key={c} className={['presentacionId', 'referenciaOrigen'].includes(c) ? styles.datoCompleto : undefined}><dt>{etiquetasCampos[c]}</dt><dd>{c === 'condicion' ? <CondicionExistencia valor={r.condicion} /> : c === 'fechaIngreso' || c === 'fechaFabricacion' || c === 'fechaVencimiento' ? fechaPosicion(r[c]) : <><ValorInventario campo={c} registro={r} />{c === 'cantidadBase' && ' unidades base'}</>}</dd></div>)}</dl>
        </article>)}</div>
        <article id="posicion-registro" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>{String(secciones.length + 1).padStart(2, '0')}</span>Datos del registro</h2><dl>
          <div><dt>Registrado el</dt><dd>{fechaHora(r.creadoEn)}</dd></div><div><dt>Última actualización</dt><dd>{fechaHora(r.actualizadoEn)}</dd></div><div><dt>Versión</dt><dd>{r.version}</dd></div><div className={styles.datoCompleto}><dt>Identificador</dt><dd className={local.identificador}>{r.id}</dd></div>
        </dl></article>
        {auditoria && <InventarioAuditoria recurso={recurso} id={r.id} revision={revisionAuditoria} apariencia="empleados" />}
      </div>
    </div>
  </section>
}
