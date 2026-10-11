import { useId, useMemo, useState } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { Icono } from '../../dashboard/components/icono'
import type { PermisoRol } from '../rol.types'
import styles from './permisos-asignados.module.css'

type Props = { permisos: readonly PermisoRol[] }
type Grupo = { codigo: string; nombre: string; permisos: PermisoRol[] }
type Menu = { codigo: string; nombre: string; grupos: Grupo[]; total: number }

const nombres: Record<string, string> = {
  CATALOGOS: 'Catálogos',
  ORGANIZACION: 'Organización',
  SEGURIDAD: 'Seguridad y control de acceso',
  DEPARTAMENTOS: 'Departamentos organizacionales',
  DEPARTAMENTOS_ORGANIZACIONALES: 'Departamentos organizacionales',
  EMPLEADOS: 'Empleados',
  ESTADOS: 'Estados',
  ESTADOS_CATALOGO: 'Estados del catálogo',
  PERMISOS: 'Permisos',
  PUESTOS: 'Puestos',
  ROLES: 'Roles',
  SUCURSALES: 'Sucursales',
  USUARIOS: 'Usuarios',
  GENERAL: 'Permisos generales',
}

const acciones: Record<string, { nombre: string; orden: number }> = {
  VER: { nombre: 'Ver', orden: 0 },
  CREAR: { nombre: 'Crear', orden: 1 },
  ACTUALIZAR: { nombre: 'Editar', orden: 2 },
  INACTIVAR: { nombre: 'Inactivar', orden: 3 },
  ASIGNAR: { nombre: 'Asignar', orden: 4 },
  CAMBIAR_SUCURSAL: { nombre: 'Cambiar sucursal', orden: 5 },
  VER_AUDITORIA: { nombre: 'Auditoría', orden: 6 },
}

function nombreLegible(codigo: string): string {
  if (nombres[codigo]) return nombres[codigo]
  const texto = codigo.replaceAll('_', ' ').toLocaleLowerCase('es-GT')
  return texto.charAt(0).toLocaleUpperCase('es-GT') + texto.slice(1)
}

const normalizar = (valor: string) => valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-GT')

function agrupar(permisos: readonly PermisoRol[]): Menu[] {
  const menus = new Map<string, Menu>()
  for (const permiso of permisos) {
    const partes = permiso.codigo.split('.')
    const codigoMenu = partes[0] || 'OTROS'
    const codigoGrupo = partes.length > 2 ? partes[1] || 'GENERAL' : 'GENERAL'
    let menu = menus.get(codigoMenu)
    if (!menu) {
      menu = { codigo: codigoMenu, nombre: nombreLegible(codigoMenu), grupos: [], total: 0 }
      menus.set(codigoMenu, menu)
    }
    let grupo = menu.grupos.find((actual) => actual.codigo === codigoGrupo)
    if (!grupo) {
      grupo = { codigo: codigoGrupo, nombre: nombreLegible(codigoGrupo), permisos: [] }
      menu.grupos.push(grupo)
    }
    grupo.permisos.push(permiso)
    menu.total++
  }
  for (const menu of menus.values()) {
    menu.grupos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-GT'))
    for (const grupo of menu.grupos) {
      grupo.permisos.sort((a, b) => (acciones[a.accion]?.orden ?? 99) - (acciones[b.accion]?.orden ?? 99)
        || a.nombre.localeCompare(b.nombre, 'es-GT') || a.codigo.localeCompare(b.codigo))
    }
  }
  return [...menus.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-GT'))
}

export function PermisosAsignados({ permisos }: Props) {
  const id = useId()
  const [busqueda, setBusqueda] = useState('')
  const [filtroMenu, setFiltroMenu] = useState('')
  const menus = useMemo(() => agrupar(permisos), [permisos])
  const menuActivo = menus.some((menu) => menu.codigo === filtroMenu) ? filtroMenu : ''
  const termino = normalizar(busqueda.trim())
  const visibles = menus.filter((menu) => !menuActivo || menu.codigo === menuActivo).map((menu) => ({
    ...menu,
    grupos: menu.grupos.map((grupo) => ({
      ...grupo,
      permisos: grupo.permisos.filter((permiso) => normalizar(`${menu.nombre} ${grupo.nombre} ${permiso.nombre} ${permiso.codigo} ${acciones[permiso.accion]?.nombre ?? permiso.accion}`).includes(termino)),
    })).filter((grupo) => grupo.permisos.length > 0),
  })).filter((menu) => menu.grupos.length > 0)
  const totalVisible = visibles.reduce((total, menu) => total + menu.grupos.reduce((suma, grupo) => suma + grupo.permisos.length, 0), 0)
  const totalGrupos = menus.reduce((total, menu) => total + menu.grupos.length, 0)

  if (permisos.length === 0) {
    return <div className={styles.vacio}><IconoAccion nombre="sin-registros" /><p>Este rol no tiene permisos asignados.</p></div>
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.herramientas}>
        <p>{menus.length} {menus.length === 1 ? 'menú' : 'menús'} <span aria-hidden="true">·</span> {totalGrupos} {totalGrupos === 1 ? 'submódulo' : 'submódulos'}</p>
        <label className={styles.busqueda} htmlFor={`${id}-buscar`}>
          <span className={styles.soloLectores}>Buscar permisos asignados</span>
          <IconoAccion nombre="buscar" />
          <input id={`${id}-buscar`} type="search" placeholder="Buscar permiso o código…" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
        </label>
      </div>
      <nav className={styles.filtros} aria-label="Filtrar permisos asignados por menú">
        <button type="button" aria-pressed={!menuActivo} onClick={() => setFiltroMenu('')}>Todos <span>{permisos.length}</span></button>
        {menus.map((menu) => <button type="button" key={menu.codigo} aria-pressed={menuActivo === menu.codigo} onClick={() => setFiltroMenu(menu.codigo)}>{menu.nombre}<span>{menu.total}</span></button>)}
      </nav>
      <p className={styles.resultados} role="status">{totalVisible} de {permisos.length} permisos asignados</p>
      <div className={styles.menus}>
        {visibles.map((menu) => (
          <section className={styles.menu} key={menu.codigo} aria-labelledby={`${id}-${menu.codigo}`}>
            <header className={styles.cabeceraMenu}>
              <span className={styles.iconoMenu}><Icono nombre={menu.codigo === 'ORGANIZACION' ? 'organizacion' : menu.codigo === 'CATALOGOS' ? 'catalogos' : 'seguridad'} /></span>
              <h3 id={`${id}-${menu.codigo}`}>{menu.nombre}</h3>
              <span>{menu.grupos.reduce((total, grupo) => total + grupo.permisos.length, 0)} permisos</span>
            </header>
            <div className={styles.grupos}>
              {menu.grupos.map((grupo) => (
                <section className={styles.grupo} key={grupo.codigo} aria-labelledby={`${id}-${menu.codigo}-${grupo.codigo}`}>
                  <header className={styles.cabeceraGrupo}><h4 id={`${id}-${menu.codigo}-${grupo.codigo}`}>{grupo.nombre}</h4><span aria-label={`${grupo.permisos.length} ${grupo.permisos.length === 1 ? 'permiso' : 'permisos'}`}>{grupo.permisos.length}</span></header>
                  <ul className={styles.lista}>
                    {grupo.permisos.map((permiso) => (
                      <li className={styles.permiso} key={permiso.id}>
                        <div className={styles.identidad}><strong>{permiso.nombre}</strong><code>{permiso.codigo}</code></div>
                        <span className={styles.accion}><IconoPermiso accion={permiso.accion} />{acciones[permiso.accion]?.nombre ?? nombreLegible(permiso.accion)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        ))}
        {totalVisible === 0 && <div className={styles.vacio}><IconoAccion nombre="buscar" /><p>No hay permisos que coincidan con la búsqueda.</p><button type="button" onClick={() => { setBusqueda(''); setFiltroMenu('') }}>Mostrar todos los permisos</button></div>}
      </div>
    </div>
  )
}

function IconoPermiso({ accion }: { accion: string }) {
  switch (accion) {
    case 'VER': return <IconoAccion nombre="ver" />
    case 'CREAR': return <IconoAccion nombre="agregar" />
    case 'ACTUALIZAR': return <IconoAccion nombre="editar" />
    case 'INACTIVAR': return <IconoAccion nombre="estado" />
    case 'VER_AUDITORIA': return <Icono nombre="reloj" />
    case 'CAMBIAR_SUCURSAL': return <Icono nombre="sucursal" />
    default: return <Icono nombre="llave" />
  }
}
