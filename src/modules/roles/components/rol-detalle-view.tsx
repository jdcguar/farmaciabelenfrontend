import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { useEffect, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { obtenerRol } from '../rol-api'
import type { Rol } from '../rol.types'
import { PermisosAsignados } from './permisos-asignados'
import { RolAuditoria } from './rol-auditoria'
import { RolInactivarModal } from './rol-inactivar-modal'
import styles from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'

type RolDetalleViewProps = {
  rolId: string
  permisos: readonly string[]
  onNavegar: (ruta: string) => void
}

function fechaHora(valor: string | null): string {
  if (!valor) return 'Sin registro'
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guatemala',
  }).format(new Date(valor))
}

export function RolDetalleView({ rolId, permisos, onNavegar }: RolDetalleViewProps) {
  const [rol, setRol] = useState<Rol | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)
  const [confirmarInactivacion, setConfirmarInactivacion] = useState(false)
  const [exitoInactivacion, setExitoInactivacion] = useState(false)
  const puedeEditar = permisos.includes('SEGURIDAD.ROLES.ACTUALIZAR')
  const puedeInactivar = permisos.includes('SEGURIDAD.ROLES.INACTIVAR')
  const puedeVerAuditoria = permisos.includes('SEGURIDAD.ROLES.VER_AUDITORIA')

  useEffect(() => {
    const controlador = new AbortController()
    void obtenerRol(rolId, controlador.signal)
      .then((respuesta) => { setRol(respuesta); setError(null) })
      .catch((errorActual: unknown) => {
        if (!controlador.signal.aborted) setError(errorActual instanceof ErrorApi ? errorActual.message : 'No fue posible cargar el rol.')
      })
    return () => controlador.abort()
  }, [reintento, rolId])

  if (!rol) {
    return (
      <section className={styles.errorPagina} role={error ? 'alert' : undefined}>
        
        <h1>{error ? 'No se pudo cargar el rol' : 'Cargando rol…'}</h1>
        <p>{error ?? 'Estamos consultando la información y los permisos asignados.'}</p>
        {error && <div><button type="button" onClick={() => setReintento((valor) => valor + 1)}>Reintentar</button><button type="button" onClick={() => onNavegar('/seguridad/roles')}>Ver listado</button></div>}
      </section>
    )
  }

  return (
    <section className={styles.pagina}>
      
      <div className={styles.detalleLayout}><header className={styles.cabeceraDetalle}>
        <div className={styles.perfilRol}>
          <span className={styles.iconoRol} aria-hidden="true">{rol.nombre.trim().slice(0, 2).toUpperCase()}</span>
          <div><p>Rol {rol.codigo}</p><h1>{rol.nombre}</h1><span className={`${styles.estado} ${rol.activo ? styles.activo : styles.inactivo}`}>{rol.activo ? 'Activo' : 'Inactivo'}</span></div>
        </div>
        <div className={styles.accionesCabecera}>
          {puedeEditar && <button className={styles.botonEditar} type="button" onClick={() => onNavegar(`/seguridad/roles/${rol.id}/editar`)}><IconoAccion nombre="editar" /><span>Editar información</span></button>}
          {puedeInactivar && rol.activo && rol.codigo !== 'SUPERADMIN' && <button className={styles.botonPeligro} type="button" onClick={() => setConfirmarInactivacion(true)}><IconoAccion nombre="estado" /><span>Desactivar rol</span></button>}
        </div>
      </header><div className={styles.detalleContenido}><NavegacionSecciones secciones={[...[{"id":"rol-detalle-1","titulo":"Información general"},{"id":"rol-detalle-2","titulo":"Control del registro"},{"id":"rol-detalle-3","titulo":"Permisos asignados"}], ...(puedeVerAuditoria ? [{ id: 'rol-auditoria', titulo: 'Auditoría' }] : [])]} />

      <div className={styles.grillaDetalle}>
        <article className={styles.tarjetaDetalle} id="rol-detalle-1">
          <h2><span className={styles.numeroSeccion} aria-hidden="true">01</span> Información general</h2>
          <dl>
            <div><dt>Código</dt><dd>{rol.codigo}</dd></div>
            <div><dt>Estado</dt><dd>{rol.activo ? 'Activo' : 'Inactivo'}</dd></div>
            <div className={styles.datoCompleto}><dt>Descripción</dt><dd>{rol.descripcion ?? 'Sin descripción'}</dd></div>
            {!rol.activo && <div className={styles.datoCompleto}><dt>Motivo de desactivación</dt><dd>{rol.motivoInactivacion ?? 'Sin motivo registrado'}</dd></div>}
          </dl>
        </article>
        <article className={styles.tarjetaDetalle} id="rol-detalle-2">
          <h2><span className={styles.numeroSeccion} aria-hidden="true">02</span> Control del registro</h2>
          <dl>
            <div><dt>Creado</dt><dd>{fechaHora(rol.creadoEn)}</dd></div>
            <div><dt>Última actualización</dt><dd>{fechaHora(rol.actualizadoEn)}</dd></div>
            <div><dt>Versión</dt><dd>{rol.version}</dd></div>
            <div><dt>Total de permisos</dt><dd>{rol.permisos.length}</dd></div>
          </dl>
        </article>
      </div>

      <article className={styles.tarjetaDetalle} id="rol-detalle-3">
        <div className={styles.tituloSeccionDetalle}><div><h2><span className={styles.numeroSeccion} aria-hidden="true">03</span> Permisos asignados</h2></div><span>{rol.permisos.length}</span></div>
        <PermisosAsignados permisos={rol.permisos} />
      </article>

      {puedeVerAuditoria && <div id="rol-auditoria"><RolAuditoria rolId={rol.id} revision={rol.version} /></div>}

      </div></div><RolInactivarModal rol={confirmarInactivacion ? rol : null} onCerrar={() => setConfirmarInactivacion(false)} onInactivado={() => { setConfirmarInactivacion(false); setExitoInactivacion(true) }} />
      <ModalEstado abierto={exitoInactivacion} tipo="exito" titulo="Rol desactivado" mensaje={`El rol ${rol.nombre} fue desactivado correctamente.`} textoAccionPrincipal="Aceptar" onAccionPrincipal={() => onNavegar('/seguridad/roles')} onCerrar={() => onNavegar('/seguridad/roles')} />
    </section>
  )
}
