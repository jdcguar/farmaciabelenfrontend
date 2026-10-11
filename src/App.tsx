import { CajaChicaView } from './modules/caja/components/caja-chica-view'
import { ActivoView } from './modules/activos/components/activo-view'
import { reconocerRutaActivo, puedeRutaActivo } from './modules/activos/activo.config'
import { reconocerRutaCajaChica, puedeVerCajaChica } from './modules/caja/caja-chica.config'
import { puedeGestionarPresupuestos } from './modules/sucursales/finanzas-reglas'
import { PruebaConexionView } from './modules/desarrollo/components/prueba-conexion-view'
import { CosteoView } from './modules/inventario/costeo/costeo-view'
import { reconocerRutaCosteo, puedeCosteo } from './modules/inventario/costeo/costeo.config'
import { useCallback, useEffect, useRef, useState } from 'react'
import { reconocerRutaCompra, puedeRutaCompra } from './modules/compras/compra.config'
import { CompraView } from './modules/compras/components/compra-view'
import { reconocerRutaTraslado, puedeRutaTraslado } from './modules/traslados/traslado.config'
import { TrasladoView } from './modules/traslados/components/traslado-view'
import { CajaView } from './modules/caja/components/caja-view'
import { CobroVentasView } from './modules/caja/components/cobro-ventas-view'
import { reconocerRutaCobroVentas, puedeVerCobroVentas } from './modules/caja/cobro-ventas.config'
import { VentaView } from './modules/ventas/components/venta-view'
import { SanitariaView } from './modules/sanitaria/components/sanitaria-view'
import { reconocerRutaSanitaria, puedeRutaSanitaria } from './modules/sanitaria/sanitaria.config'
import { reconocerRutaVenta, puedeRutaVenta } from './modules/ventas/venta.config'
import { reconocerRutaCaja, puedeRutaCaja } from './modules/caja/caja.config'
import { IlustracionCarga } from './shared/carga/ilustracion-carga'
import { cerrarSesion, obtenerSesionActual } from './modules/autenticacion/autenticacion-api'
import type { SesionUsuario } from './modules/autenticacion/autenticacion.types'
import { InicioSesionView } from './modules/autenticacion/components/inicio-sesion-view'
import { RestablecerContrasenaView } from './modules/autenticacion/components/restablecer-contrasena-view'
import { SolicitarRecuperacionView } from './modules/autenticacion/components/solicitar-recuperacion-view'
import type { MotivoEnlaceRecuperacionNoValido } from './modules/autenticacion/recuperacion.types'
import { DashboardView } from './modules/dashboard/components/dashboard-view'
import { DepartamentoOrganizacionalCrearView } from './modules/departamentos-organizacionales/components/departamento-organizacional-crear-view'
import { DepartamentoOrganizacionalDetalleView } from './modules/departamentos-organizacionales/components/departamento-organizacional-detalle-view'
import { DepartamentoOrganizacionalEditarView } from './modules/departamentos-organizacionales/components/departamento-organizacional-editar-view'
import { DepartamentoOrganizacionalListadoView } from './modules/departamentos-organizacionales/components/departamento-organizacional-listado-view'
import { GaleriaModalesView } from './modules/desarrollo/components/galeria-modales-view'
import { EstadoCatalogoCrearView } from './modules/estados-catalogo/components/estado-catalogo-crear-view'
import { EstadoCatalogoDetalleView } from './modules/estados-catalogo/components/estado-catalogo-detalle-view'
import { EstadoCatalogoEditarView } from './modules/estados-catalogo/components/estado-catalogo-editar-view'
import { EstadoCatalogoListadoView } from './modules/estados-catalogo/components/estado-catalogo-listado-view'
import { EmpleadoCrearView } from './modules/empleados/components/empleado-crear-view'
import { EmpleadoDetalleView } from './modules/empleados/components/empleado-detalle-view'
import { EmpleadoEditarView } from './modules/empleados/components/empleado-editar-view'
import { EmpleadoListadoView } from './modules/empleados/components/empleado-listado-view'
import { PuestoCrearView } from './modules/puestos/components/puesto-crear-view'
import { PuestoDetalleView } from './modules/puestos/components/puesto-detalle-view'
import { PuestoEditarView } from './modules/puestos/components/puesto-editar-view'
import { PuestoListadoView } from './modules/puestos/components/puesto-listado-view'
import { RolCrearView } from './modules/roles/components/rol-crear-view'
import { RolDetalleView } from './modules/roles/components/rol-detalle-view'
import { RolEditarView } from './modules/roles/components/rol-editar-view'
import { RolListadoView } from './modules/roles/components/rol-listado-view'
import { SucursalCrearView } from './modules/sucursales/components/sucursal-crear-view'
import { SucursalDetalleView } from './modules/sucursales/components/sucursal-detalle-view'
import { SucursalEditarView } from './modules/sucursales/components/sucursal-editar-view'
import { SucursalListadoView } from './modules/sucursales/components/sucursal-listado-view'
import { UsuarioCrearView } from './modules/usuarios/components/usuario-crear-view'
import { UsuarioDetalleView } from './modules/usuarios/components/usuario-detalle-view'
import { UsuarioEditarView } from './modules/usuarios/components/usuario-editar-view'
import { UsuarioListadoView } from './modules/usuarios/components/usuario-listado-view'
import { ModalEstado } from './shared/components/modal-estado'
import { CatalogoFarmaciaView } from './modules/catalogos-farmacia/components/catalogo-farmacia-view'
import { reconocerRutaCatalogo } from './modules/catalogos-farmacia/catalogo-rutas'
import { InventarioView } from './modules/inventario/components/inventario-view'
import { puedeRuta, reconocerRutaInventario } from './modules/inventario/inventario.config'
import styles from './App.module.css'
import { pantallaPorRuta } from './shared/seguridad/navegacion'
import { ErrorApi } from './shared/api/cliente-api'

type EstadoAplicacion =
  | { tipo: 'comprobando' }
  | { tipo: 'sin-sesion' }
  | { tipo: 'con-sesion'; sesion: SesionUsuario }

type NotificacionInicio = {
  titulo: string
  mensaje: string
}

type DestinoPendiente =
  | { tipo: 'ruta'; ruta: string }
  | { tipo: 'cerrar-sesion' }

function obtenerNotificacionEnlace(
  motivo: MotivoEnlaceRecuperacionNoValido,
  modo: 'activacion' | 'recuperacion',
): NotificacionInicio {
  const esActivacion = modo === 'activacion'
  if (motivo === 'utilizado') {
    return {
      titulo: 'Este enlace ya fue utilizado',
      mensaje: esActivacion
        ? 'La cuenta ya fue activada con este enlace. Inicia sesión con tu contraseña.'
        : 'La contraseña ya fue cambiada con este enlace. Inicia sesión con tu nueva contraseña.',
    }
  }

  if (motivo === 'expirado') {
    return {
      titulo: 'Este enlace ya caducó',
      mensaje: esActivacion
        ? 'Solicita al administrador que reenvíe un nuevo enlace de activación.'
        : 'Solicita un nuevo enlace de recuperación para cambiar tu contraseña.',
    }
  }

  if (motivo === 'reemplazado') {
    return {
      titulo: 'Existe un enlace más reciente',
      mensaje: 'Este enlace dejó de ser válido porque se generó uno nuevo. Revisa el correo más reciente.',
    }
  }

  return {
    titulo: 'El enlace no es válido',
    mensaje: esActivacion
      ? 'Solicita al administrador que reenvíe un nuevo enlace de activación.'
      : 'Solicita un nuevo enlace de recuperación e inténtalo nuevamente.',
  }
}

function App() {
  const [ubicacion, setUbicacion] = useState(
    () => `${window.location.pathname}${window.location.search}`,
  )
  const [estado, setEstado] = useState<EstadoAplicacion>({ tipo: 'comprobando' })
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)
  const [notificacionInicio, setNotificacionInicio] = useState<NotificacionInicio | null>(null)
  const [destinoPendiente, setDestinoPendiente] = useState<DestinoPendiente | null>(null)
  const ubicacionRef = useRef(ubicacion)
  const cambiosPendientesRef = useRef(false)

  const urlActual = new URL(ubicacion, window.location.origin)
  const esPruebaConexion = urlActual.pathname === '/prueba-conexion'
  const esVistaRecuperacion = [
    '/recuperar-contrasena',
    '/restablecer-contrasena',
    '/activar-cuenta',
  ].includes(urlActual.pathname)
  const esGaleriaModales = import.meta.env.DEV
    && urlActual.pathname === '/componentes/modales'

  const navegarSinBloqueo = useCallback((ruta: string) => {
    window.history.pushState(null, '', ruta)
    ubicacionRef.current = ruta
    setUbicacion(ruta)
  }, [])

  const navegar = useCallback((ruta: string) => {
    if (ruta === ubicacionRef.current) return
    if (cambiosPendientesRef.current) {
      setDestinoPendiente({ tipo: 'ruta', ruta })
      return
    }
    navegarSinBloqueo(ruta)
  }, [navegarSinBloqueo])

  const actualizarCambiosPendientes = useCallback((pendientes: boolean) => {
    cambiosPendientesRef.current = pendientes
  }, [])

  const manejarEnlaceNoValido = useCallback((
    motivo: MotivoEnlaceRecuperacionNoValido,
    modo: 'activacion' | 'recuperacion',
  ) => {
    window.history.replaceState(null, '', '/')
    ubicacionRef.current = '/'
    setUbicacion('/')
    setNotificacionInicio(obtenerNotificacionEnlace(motivo, modo))
  }, [])

  useEffect(() => {
    const manejarNavegacion = () => {
      const destino = `${window.location.pathname}${window.location.search}`
      // Los enlaces a secciones solo cambian el hash y conservan el formulario.
      if (destino === ubicacionRef.current) return
      if (cambiosPendientesRef.current) {
        window.history.pushState(null, '', ubicacionRef.current)
        setDestinoPendiente({ tipo: 'ruta', ruta: destino })
        return
      }
      ubicacionRef.current = destino
      setUbicacion(destino)
    }

    window.addEventListener('popstate', manejarNavegacion)
    return () => window.removeEventListener('popstate', manejarNavegacion)
  }, [])

  useEffect(() => {
    const advertirAntesDeCerrar = (event: BeforeUnloadEvent) => {
      if (!cambiosPendientesRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', advertirAntesDeCerrar)
    return () => window.removeEventListener('beforeunload', advertirAntesDeCerrar)
  }, [])

  useEffect(() => {
    if (esVistaRecuperacion || esGaleriaModales || esPruebaConexion) {
      return
    }

    const controlador = new AbortController()

    void obtenerSesionActual(controlador.signal)
      .then((sesion) => setEstado({ tipo: 'con-sesion', sesion }))
      .catch(() => {
        if (!controlador.signal.aborted) {
          setEstado({ tipo: 'sin-sesion' })
        }
      })

    return () => controlador.abort()
  }, [esGaleriaModales, esVistaRecuperacion, esPruebaConexion])

  // Reconsulta los permisos al navegar o volver a la aplicación. No mantiene viva
  // una sesión inactiva mediante polling ni descarta cambios por un fallo de red.
  useEffect(() => {
    if (estado.tipo !== 'con-sesion') return
    const controlador = new AbortController()
    let consultando = false
    const actualizar = async () => {
      if (consultando || document.visibilityState === 'hidden') return
      consultando = true
      try {
        const sesion = await obtenerSesionActual(controlador.signal, true)
        if (!controlador.signal.aborted) setEstado(actual => actual.tipo === 'con-sesion'
          && actual.sesion.usuarioId === sesion.usuarioId ? { tipo: 'con-sesion', sesion } : actual)
      } catch (error) {
        if (!controlador.signal.aborted && error instanceof ErrorApi && error.estadoHttp === 401) {
          setEstado({ tipo: 'sin-sesion' })
        }
      } finally { consultando = false }
    }
    const alVolver = () => { void actualizar() }
    void actualizar()
    window.addEventListener('focus', alVolver)
    window.addEventListener('permisos-actualizados', alVolver)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      controlador.abort()
      window.removeEventListener('focus', alVolver)
      window.removeEventListener('permisos-actualizados', alVolver)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [ubicacion, estado.tipo])

  const manejarCierreSesion = async () => {
    setCerrandoSesion(true)
    setErrorCierre(null)

    try {
      await cerrarSesion()
      cambiosPendientesRef.current = false
      setEstado({ tipo: 'sin-sesion' })
    } catch {
      setErrorCierre('No fue posible cerrar la sesión. Inténtalo nuevamente.')
    } finally {
      setCerrandoSesion(false)
    }
  }

  const solicitarCierreSesion = () => {
    if (cambiosPendientesRef.current) {
      setDestinoPendiente({ tipo: 'cerrar-sesion' })
      return
    }
    void manejarCierreSesion()
  }

  const continuarSinGuardar = () => {
    const destino = destinoPendiente
    cambiosPendientesRef.current = false
    setDestinoPendiente(null)
    if (destino?.tipo === 'ruta') navegarSinBloqueo(destino.ruta)
    else if (destino?.tipo === 'cerrar-sesion') void manejarCierreSesion()
  }

  if (esPruebaConexion) {
    return <PruebaConexionView />
  }

  if (esGaleriaModales) {
    return <GaleriaModalesView onVolver={() => navegar('/')} />
  }

  if (urlActual.pathname === '/recuperar-contrasena') {
    return <SolicitarRecuperacionView onVolver={() => navegar('/')} />
  }

  if (urlActual.pathname === '/restablecer-contrasena') {
    return (
      <RestablecerContrasenaView
        key={urlActual.searchParams.get('token') ?? 'sin-token'}
        token={urlActual.searchParams.get('token')}
        modo="recuperacion"
        onVolver={() => navegar('/')}
        onEnlaceNoValido={manejarEnlaceNoValido}
      />
    )
  }

  if (urlActual.pathname === '/activar-cuenta') {
    return (
      <RestablecerContrasenaView
        key={urlActual.searchParams.get('token') ?? 'sin-token'}
        token={urlActual.searchParams.get('token')}
        modo="activacion"
        onVolver={() => navegar('/')}
        onEnlaceNoValido={manejarEnlaceNoValido}
      />
    )
  }

  if (estado.tipo === 'comprobando') {
    return (
      <main className={styles.comprobandoSesion} aria-busy="true">
        <span className={styles.comprobandoSimbolo}>
          <IlustracionCarga />
        </span>
        <p>Comprobando sesión…</p>
      </main>
    )
  }

  if (estado.tipo === 'sin-sesion') {
    return (
      <>
        <InicioSesionView
          onSesionIniciada={(sesion) => setEstado({ tipo: 'con-sesion', sesion })}
          onRecuperarContrasena={() => {
            setNotificacionInicio(null)
            navegar('/recuperar-contrasena')
          }}
        />
        <ModalEstado
          abierto={Boolean(notificacionInicio)}
          tipo="informacion"
          titulo={notificacionInicio?.titulo ?? ''}
          mensaje={notificacionInicio?.mensaje ?? ''}
          textoAccionPrincipal="Entendido"
          onAccionPrincipal={() => setNotificacionInicio(null)}
          onCerrar={() => setNotificacionInicio(null)}
        />
      </>
    )
  }

  const permisos = estado.sesion.permisos
  const puedeVerEmpleados = permisos.includes('ORGANIZACION.EMPLEADOS.VER')
  const puedeCrearEmpleados = permisos.includes('ORGANIZACION.EMPLEADOS.CREAR')
  const puedeActualizarEmpleados = permisos.includes('ORGANIZACION.EMPLEADOS.ACTUALIZAR')
  const puedeVerRoles = permisos.includes('SEGURIDAD.ROLES.VER')
  const puedeCrearRoles = permisos.includes('SEGURIDAD.ROLES.CREAR')
    && permisos.includes('SEGURIDAD.PERMISOS.VER')
    && permisos.includes('SEGURIDAD.PERMISOS.ASIGNAR')
  const puedeActualizarRoles = permisos.includes('SEGURIDAD.ROLES.ACTUALIZAR')
  const puedeGestionarPermisosRol = permisos.includes('SEGURIDAD.PERMISOS.VER')
    && permisos.includes('SEGURIDAD.PERMISOS.ASIGNAR')
  const puedeVerUsuarios = permisos.includes('SEGURIDAD.USUARIOS.VER')
  const puedeCrearUsuarios = permisos.includes('SEGURIDAD.USUARIOS.CREAR')
  const puedeActualizarUsuarios = permisos.includes('SEGURIDAD.USUARIOS.ACTUALIZAR')
  const puedeVerEstados = permisos.includes('CATALOGOS.ESTADOS.VER')
  const puedeCrearEstados = permisos.includes('CATALOGOS.ESTADOS.CREAR')
  const puedeActualizarEstados = permisos.includes('CATALOGOS.ESTADOS.ACTUALIZAR')
  const puedeVerDepartamentos = permisos.includes('ORGANIZACION.DEPARTAMENTOS.VER')
  const puedeCrearDepartamentos = permisos.includes('ORGANIZACION.DEPARTAMENTOS.CREAR')
  const puedeActualizarDepartamentos = permisos.includes('ORGANIZACION.DEPARTAMENTOS.ACTUALIZAR')
  const puedeVerPuestos = permisos.includes('ORGANIZACION.PUESTOS.VER')
  const puedeCrearPuestos = permisos.includes('ORGANIZACION.PUESTOS.CREAR')
  const puedeActualizarPuestos = permisos.includes('ORGANIZACION.PUESTOS.ACTUALIZAR')
  const puedeVerSucursales = permisos.includes('ORGANIZACION.SUCURSALES.VER')
  const puedeCrearSucursales = permisos.includes('ORGANIZACION.SUCURSALES.CREAR')
  const puedeActualizarSucursales = permisos.includes('ORGANIZACION.SUCURSALES.ACTUALIZAR')
  const coincidenciaEmpleado = urlActual.pathname.match(/^\/empleados\/([^/]+?)(\/editar)?$/)
  const coincidenciaRol = urlActual.pathname.match(/^\/seguridad\/roles\/([^/]+?)(\/editar)?$/)
  const coincidenciaUsuario = urlActual.pathname.match(/^\/seguridad\/usuarios\/([^/]+?)(\/editar)?$/)
  const coincidenciaEstado = urlActual.pathname.match(/^\/catalogos\/estados\/([^/]+?)(\/editar)?$/)
  const coincidenciaDepartamento = urlActual.pathname.match(/^\/organizacion\/departamentos\/([^/]+?)(\/editar)?$/)
  const coincidenciaPuesto = urlActual.pathname.match(/^\/organizacion\/puestos\/([^/]+?)(\/editar)?$/)
  const coincidenciaSucursal = urlActual.pathname.match(/^\/organizacion\/sucursales\/([^/]+?)(\/editar)?$/)
  const sinPermiso = (mensaje: string) => (
    <section className={styles.sinPermiso} aria-labelledby="titulo-sin-permiso">
      <span aria-hidden="true">!</span>
      <h1 id="titulo-sin-permiso">Acceso no autorizado</h1>
      <p>{mensaje}</p>
      <button type="button" onClick={() => navegar('/')}>Volver al inicio</button>
    </section>
  )

  let contenido
  const rutaActivos = reconocerRutaActivo(urlActual.pathname)
  const rutaCatalogoFarmacia = reconocerRutaCatalogo(urlActual.pathname)
  const rutaInventario = reconocerRutaInventario(urlActual.pathname)
  const rutaCompras = reconocerRutaCompra(urlActual.pathname)
  const rutaTraslados = reconocerRutaTraslado(urlActual.pathname)
  const rutaCobroVentas = reconocerRutaCobroVentas(urlActual.pathname)
  const rutaCajaChica = reconocerRutaCajaChica(urlActual.pathname)
  const rutaCaja = reconocerRutaCaja(urlActual.pathname)
  const rutaVenta = reconocerRutaVenta(urlActual.pathname)
  const rutaSanitaria = reconocerRutaSanitaria(urlActual.pathname)
  const recursoCosteo = reconocerRutaCosteo(urlActual.pathname)
  const pantallaActual = pantallaPorRuta(ubicacion)
  if (pantallaActual && !permisos.includes(pantallaActual.permiso)) {
    contenido = sinPermiso(`Tu usuario no tiene acceso a ${pantallaActual.nombre}.`)
  } else if (rutaActivos) {
    contenido = puedeRutaActivo(rutaActivos, permisos)
      ? <ActivoView key={urlActual.pathname} ruta={rutaActivos} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Activos Fijos.')
  } else if (urlActual.pathname.startsWith('/activos')) {
    contenido = sinPermiso('La vista de Activos Fijos solicitada no está disponible.')
  } else if (recursoCosteo) {
    contenido = puedeCosteo(recursoCosteo, permisos)
      ? <CosteoView key={urlActual.pathname + urlActual.search} recurso={recursoCosteo} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para consultar costos.')
  } else if (rutaSanitaria) {
    contenido = puedeRutaSanitaria(rutaSanitaria, permisos)
      ? <SanitariaView key={urlActual.pathname + urlActual.search} ruta={rutaSanitaria} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Gestión sanitaria.')
  } else if (urlActual.pathname.startsWith('/sanitaria')) {
    contenido = sinPermiso('La vista de Gestión sanitaria solicitada no está disponible.')
  } else if (rutaVenta) {
    contenido = puedeRutaVenta(rutaVenta, permisos)
      ? <VentaView key={urlActual.pathname + urlActual.search} ruta={rutaVenta} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Ventas y dispensación.')
  } else if (urlActual.pathname.startsWith('/ventas')) {
    contenido = sinPermiso('La vista de Ventas solicitada no está disponible.')
  } else if (rutaCobroVentas) {
    contenido = puedeVerCobroVentas(permisos) && (!rutaCobroVentas.accion || permisos.includes(rutaCobroVentas.accion === 'fiscal' ? 'VENTAS.FISCAL.PROCESAR' : rutaCobroVentas.accion === 'comprobante' ? 'VENTAS.VENTAS.COMPROBANTE' : 'VENTAS.VENTAS.CONFIRMAR'))
      ? <CobroVentasView key={urlActual.pathname} ruta={rutaCobroVentas} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : <p>No tienes permiso para acceder a Cobro Ventas.</p>
  } else if (rutaCajaChica) {
    contenido = puedeVerCajaChica(permisos, estado.sesion.sucursal.id, rutaCajaChica.sucursalId)
      ? <CajaChicaView key={urlActual.pathname} ruta={rutaCajaChica} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene acceso a la caja chica de esta sucursal.')
  } else if (rutaCaja) {
    contenido = puedeRutaCaja(rutaCaja, permisos)
      ? <CajaView key={urlActual.pathname + urlActual.search} ruta={rutaCaja} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Caja.')
  } else if (urlActual.pathname.startsWith('/caja')) {
    contenido = sinPermiso('La vista de Caja solicitada no está disponible.')
  } else if (rutaTraslados) {
    contenido = puedeRutaTraslado(rutaTraslados, permisos)
      ? <TrasladoView key={urlActual.pathname + urlActual.search} ruta={rutaTraslados} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Traslados.')
  } else if (urlActual.pathname.startsWith('/traslados')) {
    contenido = sinPermiso('La vista de Traslados solicitada no está disponible.')
  } else if (rutaCompras) {
    contenido = puedeRutaCompra(rutaCompras, permisos)
      ? <CompraView key={urlActual.pathname + urlActual.search} ruta={rutaCompras} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de Compras y Recepción.')
  } else if (urlActual.pathname.startsWith('/compras')) {
    contenido = sinPermiso('La vista de Compras y Recepción solicitada no está disponible.')
  } else if (rutaInventario) {
    contenido = puedeRuta(rutaInventario, permisos)
      ? <InventarioView key={urlActual.pathname + urlActual.search} ruta={rutaInventario} consulta={urlActual.search} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para esta operación de inventario.')
  } else if (urlActual.pathname.startsWith('/inventario')) {
    contenido = sinPermiso('La vista de inventario solicitada no está disponible.')
  } else if (rutaCatalogoFarmacia) {
    contenido = permisos.includes(rutaCatalogoFarmacia.permiso)
      ? <CatalogoFarmaciaView {...rutaCatalogoFarmacia} sesion={estado.sesion} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para realizar esta acción en el catálogo.')
  } else if (urlActual.pathname === '/empleados') {
    contenido = puedeVerEmpleados
      ? <EmpleadoListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar empleados.')
  } else if (urlActual.pathname === '/empleados/nuevo') {
    contenido = puedeCrearEmpleados
      ? <EmpleadoCrearView
          sucursalActualId={estado.sesion.sucursal.id}
          onNavegar={navegar}
          onCambiosPendientes={actualizarCambiosPendientes}
        />
      : sinPermiso('Tu usuario no tiene permiso para registrar empleados.')
  } else if (coincidenciaEmpleado?.[2] === '/editar') {
    contenido = puedeActualizarEmpleados
      ? <EmpleadoEditarView key={coincidenciaEmpleado[1]!} empleadoId={coincidenciaEmpleado[1]!} permisos={permisos} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar empleados.')
  } else if (coincidenciaEmpleado) {
    contenido = puedeVerEmpleados
      ? <EmpleadoDetalleView key={coincidenciaEmpleado[1]!} empleadoId={coincidenciaEmpleado[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar empleados.')
  } else if (urlActual.pathname === '/seguridad/roles') {
    contenido = puedeVerRoles
      ? <RolListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar roles.')
  } else if (urlActual.pathname === '/seguridad/roles/nuevo') {
    contenido = puedeCrearRoles
      ? <RolCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene los permisos necesarios para crear roles y asignar permisos.')
  } else if (coincidenciaRol?.[2] === '/editar') {
    contenido = puedeActualizarRoles
      ? <RolEditarView key={coincidenciaRol[1]!} rolId={coincidenciaRol[1]!} puedeGestionarPermisos={puedeGestionarPermisosRol} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar roles.')
  } else if (coincidenciaRol) {
    contenido = puedeVerRoles
      ? <RolDetalleView key={coincidenciaRol[1]!} rolId={coincidenciaRol[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar roles.')
  } else if (urlActual.pathname === '/seguridad/usuarios') {
    contenido = puedeVerUsuarios
      ? <UsuarioListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar usuarios.')
  } else if (urlActual.pathname === '/seguridad/usuarios/nuevo') {
    contenido = puedeCrearUsuarios
      ? <UsuarioCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para crear usuarios.')
  } else if (coincidenciaUsuario?.[2] === '/editar') {
    contenido = puedeActualizarUsuarios
      ? <UsuarioEditarView key={coincidenciaUsuario[1]!} usuarioId={coincidenciaUsuario[1]!} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar usuarios.')
  } else if (coincidenciaUsuario) {
    contenido = puedeVerUsuarios
      ? <UsuarioDetalleView key={coincidenciaUsuario[1]!} usuarioId={coincidenciaUsuario[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar usuarios.')
  } else if (urlActual.pathname === '/catalogos/estados') {
    contenido = puedeVerEstados
      ? <EstadoCatalogoListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar el catálogo de estados.')
  } else if (urlActual.pathname === '/catalogos/estados/nuevo') {
    contenido = puedeCrearEstados
      ? <EstadoCatalogoCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para crear estados.')
  } else if (coincidenciaEstado?.[2] === '/editar') {
    contenido = puedeActualizarEstados
      ? <EstadoCatalogoEditarView key={coincidenciaEstado[1]!} estadoId={coincidenciaEstado[1]!} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar estados.')
  } else if (coincidenciaEstado) {
    contenido = puedeVerEstados
      ? <EstadoCatalogoDetalleView key={coincidenciaEstado[1]!} estadoId={coincidenciaEstado[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar estados.')
  } else if (urlActual.pathname === '/organizacion/departamentos') {
    contenido = puedeVerDepartamentos
      ? <DepartamentoOrganizacionalListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar departamentos organizacionales.')
  } else if (urlActual.pathname === '/organizacion/departamentos/nuevo') {
    contenido = puedeCrearDepartamentos
      ? <DepartamentoOrganizacionalCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para crear departamentos organizacionales.')
  } else if (coincidenciaDepartamento?.[2] === '/editar') {
    contenido = puedeActualizarDepartamentos
      ? <DepartamentoOrganizacionalEditarView key={coincidenciaDepartamento[1]!} departamentoId={coincidenciaDepartamento[1]!} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar departamentos organizacionales.')
  } else if (coincidenciaDepartamento) {
    contenido = puedeVerDepartamentos
      ? <DepartamentoOrganizacionalDetalleView key={coincidenciaDepartamento[1]!} departamentoId={coincidenciaDepartamento[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar departamentos organizacionales.')
  } else if (urlActual.pathname === '/organizacion/puestos') {
    contenido = puedeVerPuestos
      ? <PuestoListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar puestos organizacionales.')
  } else if (urlActual.pathname === '/organizacion/puestos/nuevo') {
    contenido = puedeCrearPuestos
      ? <PuestoCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para crear puestos organizacionales.')
  } else if (coincidenciaPuesto?.[2] === '/editar') {
    contenido = puedeActualizarPuestos
      ? <PuestoEditarView key={coincidenciaPuesto[1]!} puestoId={coincidenciaPuesto[1]!} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar puestos organizacionales.')
  } else if (coincidenciaPuesto) {
    contenido = puedeVerPuestos
      ? <PuestoDetalleView key={coincidenciaPuesto[1]!} puestoId={coincidenciaPuesto[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar puestos organizacionales.')
  } else if (urlActual.pathname === '/organizacion/sucursales') {
    contenido = puedeVerSucursales
      ? <SucursalListadoView permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar sucursales.')
  } else if (urlActual.pathname === '/organizacion/sucursales/nuevo') {
    contenido = puedeCrearSucursales
      ? <SucursalCrearView onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para crear sucursales.')
  } else if (coincidenciaSucursal?.[2] === '/editar') {
    contenido = puedeActualizarSucursales || puedeVerSucursales && puedeGestionarPresupuestos(permisos)
      ? <SucursalEditarView permisos={permisos} key={coincidenciaSucursal[1]!} sucursalId={coincidenciaSucursal[1]!} onNavegar={navegar} onCambiosPendientes={actualizarCambiosPendientes} />
      : sinPermiso('Tu usuario no tiene permiso para actualizar sucursales.')
  } else if (coincidenciaSucursal) {
    contenido = puedeVerSucursales
      ? <SucursalDetalleView key={coincidenciaSucursal[1]!} sucursalId={coincidenciaSucursal[1]!} permisos={permisos} onNavegar={navegar} />
      : sinPermiso('Tu usuario no tiene permiso para consultar sucursales.')
  }

  return (
    <>
      <DashboardView
        sesion={estado.sesion}
        cerrandoSesion={cerrandoSesion}
        errorCierre={errorCierre}
        onCerrarSesion={solicitarCierreSesion}
        rutaActual={urlActual.pathname}
        onNavegar={navegar}
        contenido={contenido}
      />
      <ModalEstado
        abierto={Boolean(destinoPendiente)}
        tipo="advertencia"
        titulo="Cambios sin guardar"
        mensaje="Hay cambios en el formulario que todavía no se han guardado. Si continúas, se perderán."
        textoAccionPrincipal="Seguir editando"
        onAccionPrincipal={() => setDestinoPendiente(null)}
        textoAccionSecundaria="Salir sin guardar"
        onAccionSecundaria={continuarSinGuardar}
        onCerrar={() => setDestinoPendiente(null)}
      />
    </>
  )
}

export default App
