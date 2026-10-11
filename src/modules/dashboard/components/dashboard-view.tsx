import { puedeAccederPantalla } from '../../../shared/seguridad/navegacion'
import { configActivos, permisoActivo, reconocerRutaActivo, recursosActivos, rutaActivo, tituloRutaActivo } from '../../activos/activo.config'
import { reconocerRutaCobroVentas } from '../../caja/cobro-ventas.config'
import { reconocerRutaCajaChica, permisoVerCajaChica } from '../../caja/caja-chica.config'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import imagotipo from '../../../assets/marca/imagotipo.png'
import isotipo from '../../../assets/marca/isotipo.png'
import { construirUrlApi } from '../../../shared/api/cliente-api'
import { EVENTO_FOTO_EMPLEADO_ACTUALIZADA } from '../../../shared/eventos/eventos-aplicacion'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { catalogos, rutaCatalogo } from '../../catalogos-farmacia/catalogos.config'
import { clavesCatalogo } from '../../catalogos-farmacia/catalogo.types'
import { reconocerRutaCatalogo } from '../../catalogos-farmacia/catalogo-rutas'
import { permisoVista, reconocerRutaInventario, rutaInventario, vistas } from '../../inventario/inventario.config'
import type { VistaInventario } from '../../inventario/inventario.types'
import { compras, recursosCompra, permisoCompra, reconocerRutaCompra, rutaCompra } from '../../compras/compra.config'
import { reconocerRutaTraslado, permisoTraslado, titulosRutaTraslado } from '../../traslados/traslado.config'
import { cajaConfig, recursosCaja, permisoCaja, reconocerRutaCaja, tituloRutaCaja } from '../../caja/caja.config'
import { obtenerOperacionCaja } from '../../caja/caja-operaciones'
import { reconocerRutaVenta, tituloRutaVenta } from '../../ventas/venta.config'
import { reconocerRutaSanitaria, sanitariaConfig, navegacionSanitaria, permisoSanitaria } from '../../sanitaria/sanitaria.config'
import { recursosCosteo, reconocerRutaCosteo } from '../../inventario/costeo/costeo.config'
import { Icono } from './icono'
import { PanelPrincipal } from './panel-principal'
import styles from './dashboard-view.module.css'

type DashboardViewProps = {
  sesion: SesionUsuario
  cerrandoSesion: boolean
  errorCierre: string | null
  onCerrarSesion: () => void
  rutaActual: string
  onNavegar: (ruta: string) => void
  contenido?: ReactNode
}

type SeccionNavegacion = {
  id: string
  etiqueta: string
  icono: Parameters<typeof Icono>[0]['nombre']
  prefijosPermiso?: string[]
  proximamente?: boolean
  submodulos?: SubmoduloNavegacion[]
}

type SubmoduloNavegacion = {
  id: string
  pantallaId?: string
  etiqueta: string
  icono: Parameters<typeof Icono>[0]['nombre']
  rutaListado: string
  rutaCreacion: string
  permisoVer: string
  permisoCrear: string
}

type AccesoRapido = {
  id: string
  pantallaId?: string
  titulo: string
  descripcion: string
  permiso: string
  permisoExacto?: string
  icono: Parameters<typeof Icono>[0]['nombre']
}

const vistasMenuInventario = (Object.keys(vistas) as VistaInventario[]).filter(vista => vista !== 'parametros')

const secciones: SeccionNavegacion[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: 'inicio' },
  { id: 'activos', etiqueta: 'Activos Fijos', icono: 'inventario', prefijosPermiso: ['ACTIVOS.'], submodulos: recursosActivos.map(recurso => ({ id: recurso === 'mis-devoluciones' ? 'activos-mis-devoluciones' : configActivos[recurso].pantalla, pantallaId: configActivos[recurso].pantalla, etiqueta: configActivos[recurso].titulo, icono: 'inventario' as const, rutaListado: rutaActivo(recurso), rutaCreacion: configActivos[recurso].crear ? `${rutaActivo(recurso)}/nuevo` : '', permisoVer: permisoActivo(recurso), permisoCrear: configActivos[recurso].crear ? permisoActivo(recurso, configActivos[recurso].crear) : '' })) },
  { id: 'sanitaria', etiqueta: 'Gestión sanitaria', icono: 'inventario', prefijosPermiso: ['SANITARIA.'], submodulos: navegacionSanitaria.map(v => ({ id: `sanitaria-${v}`, etiqueta: sanitariaConfig[v].titulo, icono: 'inventario' as const, rutaListado: `/sanitaria/${v}`, rutaCreacion: '', permisoVer: permisoSanitaria(v), permisoCrear: '' })) },
  { id: 'caja', etiqueta: 'Caja y flujo de efectivo', icono: 'ventas', prefijosPermiso: ['CAJA.', permisoVerCajaChica], submodulos: [
    { id: 'caja-cobro-ventas', etiqueta: 'Cobro Ventas', icono: 'ventas', rutaListado: '/caja/cobro-ventas', rutaCreacion: '', permisoVer: 'CAJA.MOVIMIENTOS.COBRAR', permisoCrear: '' },
    { id: 'caja-chica', etiqueta: 'Caja chica', icono: 'ventas', rutaListado: '/caja/chica', rutaCreacion: '', permisoVer: permisoVerCajaChica, permisoCrear: '' },
    { id: 'caja-liquidaciones', etiqueta: 'Liquidaciones', icono: 'ventas', rutaListado: '/caja/liquidaciones', rutaCreacion: '', permisoVer: permisoVerCajaChica, permisoCrear: '' },
    { id: 'caja-consolidado', etiqueta: 'Flujo de efectivo', icono: 'reportes', rutaListado: '/caja/consolidado', rutaCreacion: '', permisoVer: permisoCaja('cierres'), permisoCrear: '' },
    ...recursosCaja.map(recurso => ({ id: `caja-${recurso}`, etiqueta: cajaConfig[recurso].titulo, icono: 'ventas' as const, rutaListado: `/caja/${recurso}`, rutaCreacion: cajaConfig[recurso].crear ? `/caja/${recurso}/nuevo` : '', permisoVer: permisoCaja(recurso), permisoCrear: cajaConfig[recurso].crear ? permisoCaja(recurso, cajaConfig[recurso].crear) : '' })),
  ] },
  { id: 'ventas', etiqueta: 'Ventas y dispensación', icono: 'ventas', prefijosPermiso: ['VENTAS.'], submodulos: [
    { id: 'ventas-operaciones', etiqueta: 'Ventas', icono: 'ventas', rutaListado: '/ventas', rutaCreacion: '', permisoVer: 'VENTAS.VENTAS.VER', permisoCrear: '' },
    { id: 'ventas-politicas', etiqueta: 'Políticas de ventas', icono: 'catalogos', rutaListado: '/ventas/politicas', rutaCreacion: '', permisoVer: 'VENTAS.POLITICAS.VER', permisoCrear: '' },
    { id: 'ventas-contingencias', etiqueta: 'Contingencias manuales', icono: 'ventas', rutaListado: '/ventas/contingencias', rutaCreacion: '/ventas/contingencias/nueva', permisoVer: 'VENTAS.CONTINGENCIA.VER', permisoCrear: 'VENTAS.CONTINGENCIA.AUTORIZAR' },
  ] },
  { id: 'traslados', etiqueta: 'Traslados', icono: 'inventario', prefijosPermiso: ['TRASLADOS.'], submodulos: [
    { id: 'traslados-operaciones', etiqueta: 'Traslados', icono: 'inventario', rutaListado: '/traslados', rutaCreacion: '/traslados/nuevo', permisoVer: permisoTraslado(), permisoCrear: permisoTraslado('CREAR') },
    { id: 'traslados-despachos', etiqueta: 'Despachos', icono: 'inventario', rutaListado: '/traslados/despachos', rutaCreacion: '', permisoVer: permisoTraslado(), permisoCrear: '' },
    { id: 'traslados-recepciones', etiqueta: 'Recepciones', icono: 'inventario', rutaListado: '/traslados/recepciones', rutaCreacion: '', permisoVer: permisoTraslado(), permisoCrear: '' },
  ] },
  { id: 'inventario', etiqueta: 'Inventario', icono: 'inventario', prefijosPermiso: ['INVENTARIO.'], submodulos: vistasMenuInventario.map(vista => ({
    id: `inventario-${vista}`, etiqueta: vistas[vista].titulo, icono: 'inventario' as const,
    rutaListado: rutaInventario(vista), rutaCreacion: vista === 'cuarentenas' ? '/inventario/movimientos/nuevo?tipo=CUARENTENA' : `${rutaInventario(vista)}/nuevo`,
    permisoVer: permisoVista(vista), permisoCrear: vista === 'carga-inicial' || vista === 'ajustes' ? '' : vista === 'cuarentenas' ? 'INVENTARIO.CUARENTENA.CREAR' : vistas[vista].crear ? `INVENTARIO.${vistas[vista].grupo}.CREAR` : '',
  })) },
  { id: 'compras', etiqueta: 'Compras y recepción', icono: 'compras', prefijosPermiso: ['COMPRAS.'], submodulos: recursosCompra.map(recurso => ({
    id: `compras-${recurso}`, etiqueta: compras[recurso].titulo, icono: 'compras' as const,
    rutaListado: rutaCompra(recurso), rutaCreacion: `${rutaCompra(recurso)}/nuevo`,
    permisoVer: permisoCompra(recurso), permisoCrear: recurso === 'obligaciones' ? '' : permisoCompra(recurso, 'CREAR'),
  })) },
  {
    id: 'catalogos',
    etiqueta: 'Catálogos',
    icono: 'catalogos',
    prefijosPermiso: ['CATALOGOS.'],
    submodulos: [
      ...clavesCatalogo.map((clave) => ({
        id: clave, etiqueta: catalogos[clave].titulo, icono: 'catalogos' as const,
        rutaListado: rutaCatalogo(clave), rutaCreacion: `${rutaCatalogo(clave)}/nuevo`,
        permisoVer: `CATALOGOS.${catalogos[clave].permiso}.VER`, permisoCrear: `CATALOGOS.${catalogos[clave].permiso}.CREAR`,
      })),
      {
        id: 'estados',
        etiqueta: 'Estados',
        icono: 'estado',
        rutaListado: '/catalogos/estados',
        rutaCreacion: '/catalogos/estados/nuevo',
        permisoVer: 'CATALOGOS.ESTADOS.VER',
        permisoCrear: 'CATALOGOS.ESTADOS.CREAR',
      },
    ],
  },
  {
    id: 'organizacion',
    etiqueta: 'Organización',
    icono: 'organizacion',
    prefijosPermiso: ['ORGANIZACION.'],
    submodulos: [
      {
        id: 'empleados',
        etiqueta: 'Empleados',
        icono: 'empleados',
        rutaListado: '/empleados',
        rutaCreacion: '/empleados/nuevo',
        permisoVer: 'ORGANIZACION.EMPLEADOS.VER',
        permisoCrear: 'ORGANIZACION.EMPLEADOS.CREAR',
      },
      {
        id: 'departamentos',
        etiqueta: 'Departamentos',
        icono: 'departamento',
        rutaListado: '/organizacion/departamentos',
        rutaCreacion: '/organizacion/departamentos/nuevo',
        permisoVer: 'ORGANIZACION.DEPARTAMENTOS.VER',
        permisoCrear: 'ORGANIZACION.DEPARTAMENTOS.CREAR',
      },
      {
        id: 'puestos',
        etiqueta: 'Puestos',
        icono: 'puesto',
        rutaListado: '/organizacion/puestos',
        rutaCreacion: '/organizacion/puestos/nuevo',
        permisoVer: 'ORGANIZACION.PUESTOS.VER',
        permisoCrear: 'ORGANIZACION.PUESTOS.CREAR',
      },
      {
        id: 'sucursales',
        etiqueta: 'Sucursales',
        icono: 'sucursal',
        rutaListado: '/organizacion/sucursales',
        rutaCreacion: '/organizacion/sucursales/nuevo',
        permisoVer: 'ORGANIZACION.SUCURSALES.VER',
        permisoCrear: 'ORGANIZACION.SUCURSALES.CREAR',
      },
    ],
  },
  {
    id: 'seguridad',
    etiqueta: 'Seguridad',
    icono: 'seguridad',
    prefijosPermiso: ['SEGURIDAD.'],
    submodulos: [
      {
        id: 'roles',
        etiqueta: 'Roles y permisos',
        icono: 'roles',
        rutaListado: '/seguridad/roles',
        rutaCreacion: '/seguridad/roles/nuevo',
        permisoVer: 'SEGURIDAD.ROLES.VER',
        permisoCrear: 'SEGURIDAD.ROLES.CREAR',
      },
      {
        id: 'usuarios',
        etiqueta: 'Usuarios',
        icono: 'usuarios',
        rutaListado: '/seguridad/usuarios',
        rutaCreacion: '/seguridad/usuarios/nuevo',
        permisoVer: 'SEGURIDAD.USUARIOS.VER',
        permisoCrear: 'SEGURIDAD.USUARIOS.CREAR',
      },
    ],
  },
  { id: 'reportes', etiqueta: 'Reportes', icono: 'reportes', prefijosPermiso: ['REPORTES.'], proximamente: true },
]

for (const [recurso, config] of Object.entries(recursosCosteo)) {
  secciones.find(s => s.id === config.grupo)?.submodulos?.push({ id: `costeo-${recurso}`, etiqueta: config.titulo, icono: 'reportes', rutaListado: config.ruta, rutaCreacion: '', permisoVer: config.permiso, permisoCrear: '' })
}

const accesos: AccesoRapido[] = [
  ...recursosActivos.map(recurso => ({ id: recurso === 'mis-devoluciones' ? 'activos-mis-devoluciones' : configActivos[recurso].pantalla, pantallaId: configActivos[recurso].pantalla, titulo: configActivos[recurso].titulo, descripcion: `Consulta y gestión de ${configActivos[recurso].titulo.toLowerCase()}.`, permiso: permisoActivo(recurso), icono: 'inventario' as const })),
  ...Object.entries(recursosCosteo).map(([recurso, config]) => ({ id: `costeo-${recurso}`, titulo: config.titulo, descripcion: config.descripcion, permiso: config.permiso, permisoExacto: config.permiso, icono: 'reportes' as const })),
  ...navegacionSanitaria.map(v => ({ id: `sanitaria-${v}`, titulo: sanitariaConfig[v].titulo, descripcion: sanitariaConfig[v].descripcion, permiso: `SANITARIA.${sanitariaConfig[v].grupo}.`, permisoExacto: permisoSanitaria(v), icono: 'inventario' as const })),
  { id: 'ventas-operaciones', titulo: 'Ventas y dispensación', descripcion: 'Venta en efectivo, reservas, recetas y entrega trazable.', permiso: 'VENTAS.VENTAS.', permisoExacto: 'VENTAS.VENTAS.VER', icono: 'ventas' },
  { id: 'ventas-politicas', titulo: 'Políticas de ventas', descripcion: 'Impuestos, reservas y catálogo autorizado de contingencia.', permiso: 'VENTAS.POLITICAS.', permisoExacto: 'VENTAS.POLITICAS.VER', icono: 'catalogos' },
  { id: 'ventas-contingencias', titulo: 'Contingencias manuales', descripcion: 'Digitación de folios, conciliación independiente e incidencias.', permiso: 'VENTAS.CONTINGENCIA.', permisoExacto: 'VENTAS.CONTINGENCIA.VER', icono: 'ventas' },
  { id: 'caja-cobro-ventas', titulo: 'Cobro Ventas', descripcion: 'Consulta y cobra las ventas preparadas en tu sucursal.', permiso: 'CAJA.MOVIMIENTOS.COBRAR', permisoExacto: 'CAJA.MOVIMIENTOS.COBRAR', icono: 'ventas' },
  { id: 'caja-chica', titulo: 'Caja chica', descripcion: 'Fondos fijos asignados a cada sucursal.', permiso: permisoVerCajaChica, permisoExacto: permisoVerCajaChica, icono: 'ventas' },
  { id: 'caja-liquidaciones', titulo: 'Liquidaciones', descripcion: 'Liquidaciones, gastos y reposiciones por sucursal.', permiso: permisoVerCajaChica, permisoExacto: permisoVerCajaChica, icono: 'ventas' },
  { id: 'caja-consolidado', titulo: 'Flujo de efectivo', descripcion: 'Saldos actuales y flujo del período por sucursal.', permiso: 'CAJA.CIERRES.', permisoExacto: permisoCaja('cierres'), icono: 'reportes' },
  ...recursosCaja.map(recurso => ({ id: `caja-${recurso}`, titulo: cajaConfig[recurso].titulo, descripcion: `Consulta y control de ${cajaConfig[recurso].titulo.toLowerCase()}.`, permiso: `CAJA.${cajaConfig[recurso].grupo}.`, permisoExacto: permisoCaja(recurso), icono: 'ventas' as const })),
  { id: 'traslados-operaciones', titulo: 'Traslados', descripcion: 'Solicitudes de abastecimiento y traslado entre puntos de atención.', permiso: 'TRASLADOS.OPERACIONES.', icono: 'inventario' },
  { id: 'traslados-despachos', titulo: 'Despachos', descripcion: 'Preparación y salida de los traslados autorizados.', permiso: 'TRASLADOS.OPERACIONES.VER', permisoExacto: 'TRASLADOS.OPERACIONES.VER', icono: 'inventario' },
  { id: 'traslados-recepciones', titulo: 'Recepciones', descripcion: 'Consulta y recepción de los traslados de tu sucursal.', permiso: 'TRASLADOS.OPERACIONES.VER', permisoExacto: 'TRASLADOS.OPERACIONES.VER', icono: 'inventario' },
  ...recursosCompra.map(recurso => ({ id: `compras-${recurso}`, titulo: compras[recurso].titulo, descripcion: compras[recurso].descripcion, permiso: `COMPRAS.${recurso.toUpperCase()}.`, permisoExacto: permisoCompra(recurso), icono: 'compras' as const })),
  ...vistasMenuInventario.map(vista => ({ id: `inventario-${vista}`, titulo: vistas[vista].titulo, descripcion: vistas[vista].descripcion, permiso: `INVENTARIO.${vistas[vista].grupo}.`, permisoExacto: permisoVista(vista), icono: 'inventario' as const })),
  ...clavesCatalogo.map((clave) => ({ id: clave, titulo: catalogos[clave].titulo, descripcion: catalogos[clave].descripcion, permiso: `CATALOGOS.${catalogos[clave].permiso}.`, icono: 'catalogos' as const })),
  {
    id: 'estados',
    titulo: 'Configurar estados',
    descripcion: 'Configura los estados de tus registros.',
    permiso: 'CATALOGOS.ESTADOS.',
    icono: 'estado' as const,
  },
  {
    id: 'empleados',
    titulo: 'Gestionar personal',
    descripcion: 'Gestiona el personal de tu farmacia.',
    permiso: 'ORGANIZACION.EMPLEADOS.',
    icono: 'empleados' as const,
  },
  {
    id: 'departamentos',
    titulo: 'Organizar áreas',
    descripcion: 'Organiza las áreas de trabajo.',
    permiso: 'ORGANIZACION.DEPARTAMENTOS.',
    icono: 'departamento' as const,
  },
  {
    id: 'puestos',
    titulo: 'Definir puestos',
    descripcion: 'Define los cargos de cada área.',
    permiso: 'ORGANIZACION.PUESTOS.',
    icono: 'puesto' as const,
  },
  {
    id: 'sucursales',
    titulo: 'Gestionar sucursales',
    descripcion: 'Administra tus puntos de atención.',
    permiso: 'ORGANIZACION.SUCURSALES.',
    icono: 'sucursal' as const,
  },
  {
    id: 'usuarios',
    titulo: 'Administrar usuarios',
    descripcion: 'Administra las cuentas del sistema.',
    permiso: 'SEGURIDAD.USUARIOS.',
    icono: 'usuarios' as const,
  },
  {
    id: 'roles',
    titulo: 'Configurar accesos',
    descripcion: 'Define responsabilidades y accesos.',
    permiso: 'SEGURIDAD.ROLES.',
    icono: 'roles' as const,
  },
]

function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function formatearFecha(): string {
  const texto = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatearExpiracion(fecha: string): string {
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return 'Activa'

  return new Intl.DateTimeFormat('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(valor)
}

function AvatarSesion({ sesion }: { sesion: SesionUsuario }) {
  const [revisionFoto, setRevisionFoto] = useState(0)
  const [mostrarFoto, setMostrarFoto] = useState(true)

  useEffect(() => {
    const actualizarFoto = (event: Event) => {
      const detalle = (event as CustomEvent<{ empleadoId?: string }>).detail
      if (detalle?.empleadoId !== sesion.empleadoId) return

      setMostrarFoto(true)
      setRevisionFoto(Date.now())
    }

    window.addEventListener(EVENTO_FOTO_EMPLEADO_ACTUALIZADA, actualizarFoto)
    return () => window.removeEventListener(EVENTO_FOTO_EMPLEADO_ACTUALIZADA, actualizarFoto)
  }, [sesion.empleadoId])

  return (
    <span className={styles.avatar} aria-hidden="true">
      <span>{obtenerIniciales(sesion.empleadoNombre)}</span>
      {mostrarFoto && (
        <img
          src={`${construirUrlApi('/autenticacion/mi-foto')}?v=${revisionFoto}`}
          alt=""
          crossOrigin="use-credentials"
          onError={() => setMostrarFoto(false)}
        />
      )}
    </span>
  )
}

export function DashboardView({
  sesion,
  cerrandoSesion,
  errorCierre,
  onCerrarSesion,
  rutaActual,
  onNavegar,
  contenido,
}: DashboardViewProps) {
  const [esPantallaMovil, setEsPantallaMovil] = useState(
    () => window.matchMedia('(max-width: 58rem)').matches,
  )
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [sidebarOculto, setSidebarOculto] = useState(false)
  const [despliegueManual, setDespliegueManual] = useState<{
    ruta: string
    seccionId: string | null | undefined
  }>({ ruta: rutaActual, seccionId: undefined })
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const [avisoModulo, setAvisoModulo] = useState<string | null>(null)
  const perfilRef = useRef<HTMLDivElement>(null)

  if (despliegueManual.ruta !== rutaActual) {
    setDespliegueManual({ ruta: rutaActual, seccionId: undefined })
    setMenuMovilAbierto(false)
  }

  const permisos = useMemo(() => new Set(sesion.permisos), [sesion.permisos])
  const submodulosVisibles = (seccion: SeccionNavegacion) =>
    (seccion.submodulos ?? []).filter(submodulo => puedeAccederPantalla(submodulo.pantallaId ?? submodulo.id, sesion.permisos) && (seccion.id !== 'activos' || permisos.has(submodulo.permisoVer) || Boolean(submodulo.rutaCreacion && permisos.has(submodulo.permisoCrear))))
  const ordenNavegacion = ['inicio', 'ventas', 'caja', 'inventario', 'sanitaria', 'compras', 'traslados', 'activos', 'organizacion', 'seguridad', 'catalogos', 'reportes']
  const navegacionVisible = secciones.filter(seccion => seccion.id === 'inicio' || submodulosVisibles(seccion).length > 0)
    .sort((a, b) => ordenNavegacion.indexOf(a.id) - ordenNavegacion.indexOf(b.id))
  const accesosVisibles = accesos.filter(acceso => puedeAccederPantalla(acceso.pantallaId ?? acceso.id, sesion.permisos) && (!acceso.pantallaId || navegacionVisible.some(s => submodulosVisibles(s).some(m => m.id === acceso.id))))
  const descripcionAreas: Record<string, string> = {
    activos: 'Registro administrativo, custodia de empleados y devolución de activos fijos.',
    sanitaria: 'Cuarentena, evaluación técnica, alertas, retiros y evidencia sanitaria.',
    ventas: 'Venta presencial, dispensación farmacéutica y regularización de folios.',
    caja: 'Turnos, efectivo, custodia, depósitos y rendiciones.',
    traslados: 'Abastecimiento y seguimiento entre puntos de atención.',
    compras: 'Necesidades, proveedores, entregas y autorización para pago.',
    inventario: 'Existencias, trazabilidad y protección del stock.',
    organizacion: 'Tu equipo y tus puntos de atención.',
    seguridad: 'Cuentas y permisos de acceso.',
    catalogos: 'Configuración de tus registros.',
  }
  const gruposAccesos = secciones
    .map((seccion) => ({
      ...seccion,
      descripcion: descripcionAreas[seccion.id] ?? '',
      accesos: accesosVisibles.filter((acceso) =>
        seccion.submodulos?.some((submodulo) => submodulo.id === acceso.id),
      ).map((acceso) => ({
        ...acceso,
        nombre: seccion.submodulos?.find((submodulo) => submodulo.id === acceso.id)?.etiqueta ?? acceso.titulo,
      })),
    }))
    .filter((seccion) => seccion.accesos.length > 0)
    .sort((a, b) => ordenNavegacion.indexOf(a.id) - ordenNavegacion.indexOf(b.id))
  const esVistaEmpleados = rutaActual.startsWith('/empleados')
  const esVistaDepartamentos = rutaActual.startsWith('/organizacion/departamentos')
  const esVistaPuestos = rutaActual.startsWith('/organizacion/puestos')
  const esVistaSucursales = rutaActual.startsWith('/organizacion/sucursales')
  const esVistaRoles = rutaActual.startsWith('/seguridad/roles')
  const esVistaUsuarios = rutaActual.startsWith('/seguridad/usuarios')
  const esVistaEstados = rutaActual.startsWith('/catalogos/estados')
  const catalogoActual = reconocerRutaCatalogo(rutaActual)
  const inventarioActual = reconocerRutaInventario(rutaActual.split('?')[0]!)
  const comprasActual = reconocerRutaCompra(rutaActual.split('?')[0]!)
  const trasladosActual = reconocerRutaTraslado(rutaActual.split('?')[0]!)
  const cobroActual = reconocerRutaCobroVentas(rutaActual.split('?')[0]!)
  const cajaChicaActual = reconocerRutaCajaChica(rutaActual.split('?')[0]!)
  const cajaActual = reconocerRutaCaja(rutaActual.split('?')[0]!)
  const ventaActual = reconocerRutaVenta(rutaActual.split('?')[0]!)
  const sanitariaActual = reconocerRutaSanitaria(rutaActual.split('?')[0]!)
  const costeoActual = reconocerRutaCosteo(rutaActual)
  const activoActual = reconocerRutaActivo(rutaActual)
  const tituloPagina = activoActual ? tituloRutaActivo(activoActual) : cobroActual ? 'Cobro Ventas' : cajaChicaActual ? (cajaChicaActual.modo === 'fondos' ? 'Caja chica' : cajaChicaActual.modo === 'detalle' ? 'Detalle de liquidación' : 'Liquidaciones') : costeoActual ? recursosCosteo[costeoActual].titulo : sanitariaActual ? sanitariaConfig[sanitariaActual.vista].titulo : ventaActual ? tituloRutaVenta(ventaActual) : cajaActual ? (cajaActual.modo === 'operacion' ? obtenerOperacionCaja(cajaActual)?.titulo ?? tituloRutaCaja(cajaActual) : tituloRutaCaja(cajaActual)) : trasladosActual
    ? titulosRutaTraslado[trasladosActual.modo]
    : comprasActual
    ? `${comprasActual.modo === 'crear' ? 'Nueva ' : comprasActual.modo === 'detalle' ? 'Detalle de ' : comprasActual.modo === 'revision' ? 'Revisión de ' : comprasActual.modo === 'comparacion' ? 'Comparación de ' : comprasActual.modo === 'inspeccion' ? 'Inspección de ' : ''}${comprasActual.modo === 'listado' ? compras[comprasActual.recurso].titulo : compras[comprasActual.recurso].singular}`
    : inventarioActual
    ? `${inventarioActual.modo === 'crear' ? 'Registrar ' : inventarioActual.modo === 'detalle' ? 'Detalle de ' : inventarioActual.modo === 'resultados' ? 'Captura de ' : ''}${['lotes', 'existencias', 'reservas', 'kardex', 'movimientos', 'bloqueos', 'cuarentenas', 'conteos'].includes(inventarioActual.vista) && inventarioActual.modo !== 'listado' ? vistas[inventarioActual.vista].singular : vistas[inventarioActual.vista].titulo}`
    : catalogoActual
    ? catalogoActual.vista === 'listado' ? catalogos[catalogoActual.clave].titulo
      : `${catalogoActual.vista === 'crear' ? 'Crear' : catalogoActual.vista === 'editar' ? 'Editar' : 'Detalle de'} ${catalogos[catalogoActual.clave].singular}`
    : rutaActual === '/empleados'
    ? 'Empleados'
    : rutaActual === '/empleados/nuevo'
      ? 'Registrar empleado'
      : rutaActual.endsWith('/editar') && esVistaEmpleados
        ? 'Editar empleado'
        : esVistaEmpleados
          ? 'Detalle del empleado'
          : rutaActual === '/organizacion/departamentos'
            ? 'Departamentos organizacionales'
            : rutaActual === '/organizacion/departamentos/nuevo'
              ? 'Crear departamento'
              : rutaActual.endsWith('/editar') && esVistaDepartamentos
                ? 'Editar departamento'
                : esVistaDepartamentos
                  ? 'Detalle del departamento'
                  : rutaActual === '/organizacion/puestos'
                    ? 'Puestos organizacionales'
                    : rutaActual === '/organizacion/puestos/nuevo'
                      ? 'Crear puesto'
                      : rutaActual.endsWith('/editar') && esVistaPuestos
                        ? 'Editar puesto'
                        : esVistaPuestos
                          ? 'Detalle del puesto'
                          : rutaActual === '/organizacion/sucursales'
                            ? 'Sucursales'
                            : rutaActual === '/organizacion/sucursales/nuevo'
                              ? 'Crear sucursal'
                              : rutaActual.endsWith('/editar') && esVistaSucursales
                                ? 'Editar sucursal'
                                : esVistaSucursales
                                  ? 'Detalle de la sucursal'
                          : rutaActual === '/seguridad/usuarios'
                            ? 'Usuarios'
                            : rutaActual === '/seguridad/usuarios/nuevo'
                              ? 'Crear usuario'
                              : rutaActual.endsWith('/editar') && esVistaUsuarios
                                ? 'Editar usuario'
                                : esVistaUsuarios
                                  ? 'Detalle del usuario'
                          : rutaActual === '/seguridad/roles'
            ? 'Roles y permisos'
            : rutaActual === '/seguridad/roles/nuevo'
              ? 'Crear rol'
              : rutaActual.endsWith('/editar') && esVistaRoles
                ? 'Editar rol'
                : esVistaRoles
                  ? 'Detalle del rol'
                  : rutaActual === '/catalogos/estados'
                    ? 'Catálogo de estados'
                    : rutaActual === '/catalogos/estados/nuevo'
                      ? 'Crear estado'
                      : rutaActual.endsWith('/editar') && esVistaEstados
                        ? 'Editar estado'
                        : esVistaEstados
                          ? 'Detalle del estado'
                          : 'Inicio'
  const rolesTexto = sesion.roles.length > 0
    ? sesion.roles.map((rol) => rol.nombre).join(', ')
    : 'Sin rol asignado'
  const sidebarVisible = esPantallaMovil ? menuMovilAbierto : !sidebarOculto

  useEffect(() => {
    const consulta = window.matchMedia('(max-width: 58rem)')
    const actualizarPantalla = (event: MediaQueryListEvent) => {
      setEsPantallaMovil(event.matches)
      if (!event.matches) setMenuMovilAbierto(false)
    }

    consulta.addEventListener('change', actualizarPantalla)
    return () => consulta.removeEventListener('change', actualizarPantalla)
  }, [])

  useEffect(() => {
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuMovilAbierto(false)
        setPerfilAbierto(false)
      }
    }

    const manejarClickExterior = (event: MouseEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(event.target as Node)) {
        setPerfilAbierto(false)
      }
    }

    document.addEventListener('keydown', manejarEscape)
    document.addEventListener('mousedown', manejarClickExterior)
    return () => {
      document.removeEventListener('keydown', manejarEscape)
      document.removeEventListener('mousedown', manejarClickExterior)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = esPantallaMovil && menuMovilAbierto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [esPantallaMovil, menuMovilAbierto])

  const abrirSidebar = () => {
    if (esPantallaMovil) setMenuMovilAbierto(true)
    else setSidebarOculto(false)
  }

  const ocultarSidebar = () => {
    setDespliegueManual({ ruta: rutaActual, seccionId: null })
    if (esPantallaMovil) setMenuMovilAbierto(false)
    else setSidebarOculto(true)
  }

  const anunciarModulo = (nombre: string) => {
    setDespliegueManual({ ruta: rutaActual, seccionId: null })
    setAvisoModulo(`${nombre} se integrará en la siguiente etapa del frontend.`)
    setMenuMovilAbierto(false)
  }

  const manejarSeccion = (seccion: SeccionNavegacion) => {
    if (submodulosVisibles(seccion).length > 0) {
      setDespliegueManual({
        ruta: rutaActual,
        seccionId: seccionExpandidaId === seccion.id ? null : seccion.id,
      })
      return
    }

    setDespliegueManual({ ruta: rutaActual, seccionId: null })
    setMenuMovilAbierto(false)
    if (seccion.id === 'inicio') {
      onNavegar('/')
      return
    }
    anunciarModulo(seccion.etiqueta)
  }

  const manejarSubmodulo = (submodulo: SubmoduloNavegacion) => {
    setDespliegueManual({ ruta: rutaActual, seccionId: undefined })
    setMenuMovilAbierto(false)
    onNavegar(
      permisos.has(submodulo.permisoVer)
        ? submodulo.rutaListado
        : submodulo.rutaCreacion,
    )
  }

  const submoduloActivo = (submodulo: SubmoduloNavegacion) => {
    if (activoActual && submodulo.rutaListado.startsWith('/activos')) return submodulo.rutaListado === rutaActivo(activoActual.recurso)
    if (costeoActual) return submodulo.id === `costeo-${costeoActual}`
    if (submodulo.id === 'inventario-vencimientos' && inventarioActual?.vista === 'parametros') return true
    if (submodulo.id.startsWith('ventas-') && ventaActual) return submodulo.id === (ventaActual.modo === 'politica' ? 'ventas-politicas' : ['contingencias','contingencia','autorizar','digitalizar','cerrar'].includes(ventaActual.modo) ? 'ventas-contingencias' : 'ventas-operaciones')
    if (submodulo.id === 'caja-consolidado') return cajaActual?.modo === 'consolidado'
    if (submodulo.id === 'traslados-operaciones' && trasladosActual) return !['despachos', 'despacho', 'recibir', 'recepciones', 'recepcion'].includes(trasladosActual.modo)
    return rutaActual.split('?')[0] === submodulo.rutaListado || rutaActual.startsWith(`${submodulo.rutaListado}/`)
  }

  const seccionActiva = (seccion: SeccionNavegacion) =>
    (seccion.id === 'activos' && Boolean(activoActual)) ||
    (costeoActual !== null && seccion.id === recursosCosteo[costeoActual].grupo) ||
    (seccion.id === 'inicio' && rutaActual === '/') ||
    (seccion.id === 'sanitaria' && Boolean(sanitariaActual)) ||
    (seccion.id === 'ventas' && Boolean(ventaActual)) ||
    (seccion.id === 'caja' && Boolean(cajaActual || cajaChicaActual || cobroActual)) ||
    (seccion.id === 'inventario' && Boolean(inventarioActual)) ||
    (seccion.id === 'compras' && Boolean(comprasActual)) ||
    (seccion.id === 'traslados' && Boolean(trasladosActual)) ||
    (seccion.id === 'catalogos' && (esVistaEstados || Boolean(catalogoActual))) ||
    (seccion.id === 'organizacion' && (esVistaEmpleados || esVistaDepartamentos || esVistaPuestos || esVistaSucursales)) ||
    (seccion.id === 'seguridad' && (esVistaRoles || esVistaUsuarios))

  // El despliegue manual pertenece a la ruta donde se abrió. Al navegar,
  // solo se despliega la sección de destino, incluso con Atrás/Adelante.
  const seccionExpandidaId = despliegueManual.ruta === rutaActual && despliegueManual.seccionId !== undefined
    ? despliegueManual.seccionId
    : navegacionVisible.find((seccion) => seccionActiva(seccion) && submodulosVisibles(seccion).length > 0)?.id

  const abrirHerramienta = (acceso: AccesoRapido) => {
    const submodulo = secciones.flatMap((seccion) => seccion.submodulos ?? [])
      .find((modulo) => modulo.id === acceso.id)
    if (submodulo) manejarSubmodulo(submodulo)
  }

  return (
    <div className={styles.aplicacion}>
      <a className={styles.saltarContenido} href="#contenido-principal">Saltar al contenido principal</a>

      <aside
        id="navegacion-principal"
        className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarAbierto : styles.sidebarOculto}`}
        aria-label="Navegación principal"
        aria-hidden={!sidebarVisible}
        inert={!sidebarVisible ? true : undefined}
      >
        <div className={styles.marcaSidebar}>
          <a href="/" onClick={(event) => { event.preventDefault(); setDespliegueManual({ ruta: rutaActual, seccionId: null }); onNavegar('/'); setMenuMovilAbierto(false) }} aria-label={`${sesion.nombreUsuario}, ir a Inicio`}>
            <img src={imagotipo} alt="Farmacia Belén" />
            <strong className={styles.codigoUsuarioMarca}>{sesion.nombreUsuario}</strong>
          </a>
          <button className={styles.cerrarMenu} type="button" onClick={ocultarSidebar} aria-label="Ocultar menú lateral">
            <Icono nombre="cerrar" />
          </button>
        </div>

        <nav className={styles.navegacion} aria-label="Módulos del sistema">
          <p className={styles.etiquetaNavegacion}>Tu farmacia</p>
          <ul>
            {navegacionVisible.map((seccion) => {
              const submodulos = submodulosVisibles(seccion)
              const tieneSubmodulos = submodulos.length > 0
              const expandida = tieneSubmodulos && seccionExpandidaId === seccion.id
              const idSubmodulos = `submodulos-${seccion.id}`
              return (
                <li key={seccion.id}>
                  <button
                    className={`${seccionActiva(seccion) ? styles.enlaceActivo : styles.enlaceNavegacion} ${expandida ? styles.enlaceExpandido : ''}`}
                    type="button"
                    aria-current={!tieneSubmodulos && seccionActiva(seccion) ? 'page' : undefined}
                    aria-expanded={tieneSubmodulos ? expandida : undefined}
                    aria-controls={tieneSubmodulos ? idSubmodulos : undefined}
                    onClick={() => manejarSeccion(seccion)}
                  >
                    <Icono nombre={seccion.icono} />
                    <span>{seccion.etiqueta}</span>
                    {seccion.proximamente && <small>Pronto</small>}
                    {tieneSubmodulos && <Icono nombre="chevron" className={`${styles.indicadorDespliegue} ${expandida ? styles.indicadorDespliegueAbierto : ''}`} />}
                  </button>
                  {expandida && (
                    <ul id={idSubmodulos} className={styles.listaSubmodulos} aria-label={`Submódulos de ${seccion.etiqueta}`}>
                      {submodulos.map((submodulo) => (
                        <li key={submodulo.id}>
                          <button
                            className={`${styles.enlaceSubmodulo} ${submoduloActivo(submodulo) ? styles.enlaceSubmoduloActivo : ''}`}
                            type="button"
                            aria-current={submoduloActivo(submodulo) ? 'page' : undefined}
                            onClick={() => manejarSubmodulo(submodulo)}
                          >
                            <Icono nombre={submodulo.icono} /><span>{submodulo.etiqueta}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

      </aside>

      {esPantallaMovil && menuMovilAbierto && <button className={styles.fondoMenu} type="button" aria-label="Cerrar menú de navegación" onClick={ocultarSidebar} />}

      <div className={`${styles.areaPrincipal} ${!sidebarVisible ? styles.areaPrincipalExpandida : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerInicio}>
            <button
              className={styles.botonIcono}
              type="button"
              onClick={sidebarVisible ? ocultarSidebar : abrirSidebar}
              aria-label={sidebarVisible ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
              aria-controls="navegacion-principal"
              aria-expanded={sidebarVisible}
            ><Icono nombre="menu" /></button>
            <div className={styles.tituloHeader}>
              <span>Farmacia Belén</span>
              <Icono nombre="chevron" />
              <strong>{contenido == null ? 'Panel principal' : tituloPagina}</strong>
            </div>
          </div>
          <div className={styles.accionesHeader}>
            <span className={styles.fechaHeader}><Icono nombre="calendario" />{formatearFecha()}</span>
            <button className={styles.botonIcono} type="button" aria-label="Notificaciones, ninguna pendiente" onClick={() => setAvisoModulo('No tienes notificaciones pendientes.')}><Icono nombre="campana" /></button>
            <div className={styles.perfil} ref={perfilRef}>
              <button className={styles.botonPerfil} type="button" onClick={() => setPerfilAbierto((abierto) => !abierto)} aria-label={`Cuenta de ${sesion.empleadoNombre}`} aria-expanded={perfilAbierto} aria-controls="menu-perfil">
                <AvatarSesion sesion={sesion} />
                <span className={styles.identidadHeader}><strong>{sesion.empleadoNombre}</strong><small>Mi perfil</small></span>
                <Icono nombre="chevron" />
              </button>
              {perfilAbierto && (
                <div id="menu-perfil" className={styles.menuPerfil}>
                  <div className={styles.cabeceraCuenta}><strong>{sesion.empleadoNombre}</strong><span>@{sesion.nombreUsuario}</span></div>
                  <dl className={styles.datosCuenta}>
                    <div><dt>Empleado</dt><dd>{sesion.empleadoCodigo}</dd></div>
                    <div><dt>{sesion.roles.length === 1 ? 'Rol' : 'Roles'}</dt><dd>{rolesTexto}</dd></div>
                    <div><dt>Sesión hasta</dt><dd>{formatearExpiracion(sesion.expiraEn)}</dd></div>
                  </dl>
                  <button type="button" onClick={onCerrarSesion} disabled={cerrandoSesion}><Icono nombre="salir" />{cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="contenido-principal" className={`${styles.contenido} ${contenido == null ? styles.contenidoDashboard : ''}`}>
          {avisoModulo && <div className={styles.avisoInformativo} role="status"><Icono nombre="informacion" /><p>{avisoModulo}</p><button type="button" onClick={() => setAvisoModulo(null)} aria-label="Cerrar aviso"><Icono nombre="cerrar" /></button></div>}
          {errorCierre && <div className={styles.avisoError} role="alert"><strong>No se pudo cerrar la sesión.</strong><span>{errorCierre}</span></div>}
          {sesion.debeCambiarContrasena && (
            <section className={styles.avisoContrasena} aria-labelledby="titulo-aviso-contrasena">
              <Icono nombre="seguridad" />
              <div><strong id="titulo-aviso-contrasena">Actualiza tu contraseña</strong><p>Tu cuenta requiere un cambio de contraseña para operar módulos protegidos.</p></div>
              <button type="button" onClick={() => anunciarModulo('Cambio de contraseña')}>Actualizar ahora</button>
            </section>
          )}

          {contenido ?? <PanelPrincipal sesion={sesion} areas={gruposAccesos} onAbrirModulo={(id) => {
            const acceso = accesosVisibles.find((item) => item.id === id)
            if (acceso) abrirHerramienta(acceso)
          }} />}
        </main>

        <footer className={styles.footer}>
          <span className={styles.marcaFooter}><img src={isotipo} alt="" />Farmacia Belén<span>© {new Date().getFullYear()}</span></span>
          <span className={styles.sucursalFooter}><Icono nombre="sucursal" />{sesion.sucursal.nombre}<span className={styles.version}>v1.0.0</span></span>
        </footer>
      </div>
    </div>
  )
}
