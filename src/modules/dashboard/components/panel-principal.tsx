import { useEffect, useRef, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { Icono } from './icono'
import { buscarModulos, normalizarBusqueda, paginarPanel, type AreaPanel } from './panel-principal.modelo'
import styles from './panel-principal.module.css'

type PanelPrincipalProps = {
  sesion: SesionUsuario
  areas: AreaPanel[]
  onAbrirModulo: (id: string) => void
}

export function PanelPrincipal({ sesion, areas, onAbrirModulo }: PanelPrincipalProps) {
  const [areaId, setAreaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [esCompacto, setEsCompacto] = useState(() => window.matchMedia('(max-width: 42rem)').matches)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const busquedaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const consulta = window.matchMedia('(max-width: 42rem)')
    const actualizar = (event: MediaQueryListEvent) => {
      setEsCompacto(event.matches)
      setPagina(1)
    }
    consulta.addEventListener('change', actualizar)
    return () => consulta.removeEventListener('change', actualizar)
  }, [])

  const areaActual = areas.find((area) => area.id === areaId)
  const buscando = normalizarBusqueda(busqueda).length > 0
  const mostrandoAreas = !areaActual && !buscando
  const todosModulos = buscarModulos(areas, buscando ? busqueda : '')
  const modulos = buscando ? todosModulos : todosModulos.filter((modulo) => modulo.areaId === areaActual?.id)
  const paginaAreas = paginarPanel(areas, pagina, esCompacto ? 3 : 9)
  const paginaModulos = paginarPanel(modulos, pagina, esCompacto ? 3 : 6)
  const datosPagina = mostrandoAreas ? paginaAreas : paginaModulos
  const titulo = buscando ? 'Resultados de búsqueda' : areaActual?.etiqueta ?? 'Explora tus áreas'
  const descripcion = buscando
    ? 'Encuentra módulos de cualquier área de tu farmacia.'
    : areaActual?.descripcion ?? 'Selecciona un área para ver sus módulos.'

  const abrirArea = (id: string) => {
    setAreaId(id)
    setPagina(1)
    tituloRef.current?.focus()
  }

  const volverAreas = () => {
    setAreaId(null)
    setBusqueda('')
    setPagina(1)
    tituloRef.current?.focus()
  }

  return (
    <div className={styles.panel}>
      <section className={styles.bienvenida} aria-labelledby="titulo-dashboard">
        <div><h1 id="titulo-dashboard">Hola, {sesion.empleadoNombre.trim().split(/\s+/)[0]}.</h1><p>Tu farmacia, a un acceso de distancia.</p></div>
        <div className={styles.sucursal}><Icono nombre="sucursal" /><div><span>Sucursal activa</span><strong>{sesion.sucursal.nombre}</strong></div></div>
      </section>

      {areas.length > 0 ? (
        <section className={styles.directorio} aria-labelledby="titulo-directorio">
          <div className={styles.cabecera}>
            <div className={styles.contexto}>
              {!mostrandoAreas && <button className={styles.volver} type="button" onClick={volverAreas} aria-label="Volver a todas las áreas"><Icono nombre="flecha" /></button>}
              <div><h2 ref={tituloRef} tabIndex={-1} id="titulo-directorio">{titulo}</h2><p>{descripcion}</p></div>
            </div>
            <label className={styles.busqueda}>
              <Icono nombre="buscar" />
              <input ref={busquedaRef} type="search" aria-label="Buscar en todos los módulos" placeholder="Buscar un módulo…" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1) }} />
              {busqueda && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { setBusqueda(''); setPagina(1); busquedaRef.current?.focus() }}><Icono nombre="cerrar" /></button>}
            </label>
          </div>

          {datosPagina.total > 0 ? (
            <>
              <div className={styles.cuadricula}>
                {mostrandoAreas ? paginaAreas.elementos.map((area) => (
                  <button key={area.id} type="button" className={styles.tarjetaArea} onClick={() => abrirArea(area.id)} aria-label={`Ver módulos de ${area.etiqueta}`}>
                    <span className={styles.iconoArea}><Icono nombre={area.icono} /></span>
                    <span className={styles.textoTarjeta}><strong>{area.etiqueta}</strong><span>{area.accesos.length} {area.accesos.length === 1 ? 'módulo disponible' : 'módulos disponibles'}</span></span>
                    <Icono nombre="chevron" className={styles.flecha} />
                  </button>
                )) : paginaModulos.elementos.map((modulo) => (
                  <button key={`${modulo.areaId}-${modulo.id}`} type="button" className={styles.tarjetaModulo} onClick={() => onAbrirModulo(modulo.id)} aria-label={`Abrir ${modulo.nombre}`}>
                    <span className={styles.iconoModulo}><Icono nombre={modulo.icono} /></span>
                    <span className={styles.textoTarjeta}><strong>{modulo.nombre}</strong>{buscando && <span>{modulo.areaNombre}</span>}</span>
                    <Icono nombre="flecha" className={styles.flecha} />
                  </button>
                ))}
              </div>

              <div className={styles.pieDirectorio}>
                <p role="status" aria-live="polite">{datosPagina.inicio}–{datosPagina.fin} de {datosPagina.total} {mostrandoAreas ? (datosPagina.total === 1 ? 'área' : 'áreas') : (datosPagina.total === 1 ? 'módulo' : 'módulos')}</p>
                {datosPagina.totalPaginas > 1 && <nav className={styles.paginacion} aria-label={mostrandoAreas ? 'Páginas de áreas' : 'Páginas de módulos'}>
                  <button type="button" disabled={datosPagina.pagina === 1} onClick={() => setPagina(datosPagina.pagina - 1)} aria-label="Página anterior"><Icono nombre="chevron" /></button>
                  <span>Página {datosPagina.pagina} de {datosPagina.totalPaginas}</span>
                  <button type="button" disabled={datosPagina.pagina === datosPagina.totalPaginas} onClick={() => setPagina(datosPagina.pagina + 1)} aria-label="Página siguiente"><Icono nombre="chevron" /></button>
                </nav>}
              </div>
            </>
          ) : (
            <div className={styles.vacio} role="status"><Icono nombre="buscar" /><h3>No encontramos ese módulo</h3><p>Prueba otro nombre o consulta todas las áreas.</p><button type="button" onClick={volverAreas}>Ver todas las áreas</button></div>
          )}
        </section>
      ) : (
        <section className={styles.vacio}><Icono nombre="permisos" /><h2>Aún no tienes herramientas asignadas</h2><p>Solicita a tu administrador los accesos que necesitas para trabajar.</p></section>
      )}
    </div>
  )
}
