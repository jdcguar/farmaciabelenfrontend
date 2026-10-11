import { puedeAccederRuta } from '../../../shared/seguridad/navegacion'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { Selector } from '../../../shared/components/selector/selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { catalogos, rutaCatalogo } from '../catalogos.config'
import { cargarMunicipios, listarReferencias, obtenerReferencia, type CriteriosReferencia } from '../catalogo-api'
import type { OpcionReferencia, Referencia } from '../catalogo.types'
import styles from '../catalogos.module.css'
import { ContextoReferencias, useContextoCatalogo, type ContextoCatalogo } from '../catalogo-contexto'

export function ReferenciasCatalogo({ sesion, onNavegar, children }: { sesion: SesionUsuario; onNavegar: (ruta: string) => void; children: ReactNode }) {
  const claveAcceso = JSON.stringify([sesion.usuarioId, sesion.sucursal.id, [...sesion.permisos].sort()])
  // Renovar la sesión no debe repetir las referencias si el acceso sigue igual.
  const cache = useRef({claveAcceso, solicitudes:new Map<string, Promise<OpcionReferencia>>()})
  const municipios = useRef<Promise<OpcionReferencia[]> | null>(null)
  const {id:sucursalId,codigo:sucursalCodigo,nombre:sucursalNombre} = sesion.sucursal
  const resolver = useCallback<ContextoCatalogo['resolver']>((referencia, id) => {
    if(cache.current.claveAcceso!==claveAcceso)cache.current={claveAcceso,solicitudes:new Map()}
    const solicitudes=cache.current.solicitudes
    if (referencia === 'sucursales' && id === sucursalId) return Promise.resolve({ id:sucursalId, codigo:sucursalCodigo, nombre:sucursalNombre, activo:true })
    const clave = `${referencia}:${id}`
    const anterior = solicitudes.get(clave)
    if (anterior) return anterior
    const solicitud = referencia === 'municipios'
      ? (municipios.current ??= cargarMunicipios().catch((error: unknown) => { municipios.current = null; throw error })).then((items) => {
          const encontrado = items.find((item) => item.id === id)
          if (!encontrado) throw new Error('Municipio no disponible')
          return encontrado
        })
      : obtenerReferencia(referencia, id)
    solicitudes.set(clave, solicitud)
    // Conservar 403 hasta que cambie el acceso; permitir reintentos de fallos transitorios.
    void solicitud.catch((error:unknown) => { if (!(error instanceof ErrorApi && error.estadoHttp === 403)) solicitudes.delete(clave) })
    return solicitud
  }, [claveAcceso, sucursalId, sucursalCodigo, sucursalNombre])
  const contexto = useMemo<ContextoCatalogo>(() => ({sesion,onNavegar,resolver}), [sesion,onNavegar,resolver])
  return <ContextoReferencias.Provider value={contexto}>{children}</ContextoReferencias.Provider>
}
function permisoReferencia(referencia: Referencia) {
  if (referencia === 'municipios') return null
  return referencia === 'sucursales' ? 'ORGANIZACION.SUCURSALES.VER' : `CATALOGOS.${catalogos[referencia].permiso}.VER`
}
export function NombreReferencia({ referencia, id }: { referencia: Referencia; id: string }) {
  const { resolver, sesion, onNavegar } = useContextoCatalogo()
  const [opcion, setOpcion] = useState<OpcionReferencia | null>(null)
  const [error, setError] = useState(false)
  const permiso = permisoReferencia(referencia)
  const autorizado = !permiso || sesion.permisos.includes(permiso) || (referencia === 'sucursales' && id === sesion.sucursal.id)
  useEffect(() => {
    let vigente = true
    if (id && autorizado) void resolver(referencia, id).then((item) => { if (vigente) { setOpcion(item); setError(false) } }).catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [autorizado, id, referencia, resolver])
  if (!id) return <span>Sin asignación</span>
  const actual = opcion?.id === id ? opcion : null
  const etiqueta = actual ? `${actual.codigo} · ${actual.nombre}` : error || !autorizado ? id : 'Cargando referencia…'
  if (!actual || referencia === 'municipios' || permiso && !sesion.permisos.includes(permiso)) return <span title={error ? 'No fue posible consultar la referencia.' : undefined}>{etiqueta}</span>
  const ruta = referencia === 'sucursales' ? `/organizacion/sucursales/${id}` : `${rutaCatalogo(referencia)}/${id}`
  if (!puedeAccederRuta(ruta, sesion.permisos)) return <span>{etiqueta}</span>
  return <button type="button" className={styles.enlaceReferencia} onClick={() => onNavegar(ruta)}>{etiqueta}</button>
}
type Props = { id: string; referencia: Referencia; value: string; onChange: (id: string) => void; requerido?: boolean; disabled?: boolean; error?: string; descripcionId?: string; excluirEmpaque?: boolean; soloSucursalActual?: boolean; criterios?: CriteriosReferencia; textoVacio?: string }
export function SelectorReferencia({ id, referencia, value, onChange, requerido, disabled, error, descripcionId, excluirEmpaque, soloSucursalActual, criterios, textoVacio }: Props) {
  const { sesion, resolver } = useContextoCatalogo()
  const [resultado, setResultado] = useState<{ consulta: string; items: OpcionReferencia[] }>({ consulta: '', items: [] })
  const [seleccionada, setSeleccionada] = useState<OpcionReferencia | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [consulta, setConsulta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [finalizada, setFinalizada] = useState('')
  const [fallo, setFallo] = useState<{ clave: string; mensaje: string } | null>(null)
  const [revision, setRevision] = useState(0)
  const permiso = permisoReferencia(referencia)
  const autorizado = !permiso || sesion.permisos.includes(permiso)
  const sucursalFija = referencia === 'sucursales' && soloSucursalActual
  const criteriosClave = JSON.stringify(criterios ?? {})
  const [criteriosPrevios, setCriteriosPrevios] = useState(criteriosClave)
  if (criteriosPrevios !== criteriosClave) { setCriteriosPrevios(criteriosClave); setPagina(1); setResultado({ consulta: '', items: [] }) }
  const claveSolicitud = JSON.stringify({ referencia, consulta, pagina, revision, criteriosClave })
  const cargando = autorizado && !sucursalFija && finalizada !== claveSolicitud
  const errorCarga = !autorizado && !sucursalFija ? `Se requiere ${permiso} para elegir una referencia.` : fallo?.clave === claveSolicitud ? fallo.mensaje : null
  useEffect(() => {
    if (busqueda.trim().slice(0, 150) === consulta) return
    const timer = window.setTimeout(() => { setConsulta(busqueda.trim().slice(0, 150)); setPagina(1) }, 350)
    return () => window.clearTimeout(timer)
  }, [busqueda, consulta])
  useEffect(() => {
    let vigente = true
    if (value && (!permiso || autorizado || referencia === 'sucursales' && value === sesion.sucursal.id)) void resolver(referencia, value).then((item) => { if (vigente) setSeleccionada(item) }).catch(() => { if (vigente) setSeleccionada(null) })
    return () => { vigente = false }
  }, [autorizado, permiso, referencia, resolver, sesion.sucursal.id, value])
  useEffect(() => {
    if (sucursalFija || !autorizado) return
    const controlador = new AbortController()
    const solicitud = referencia === 'municipios'
      ? cargarMunicipios(controlador.signal).then((opciones) => ({ items: opciones, totalPaginas: 1 }))
      : listarReferencias(referencia, consulta, pagina, controlador.signal, JSON.parse(criteriosClave) as Props['criterios'])
    void solicitud.then((resultado) => {
      if (controlador.signal.aborted) return
      setResultado((anterior) => ({ consulta, items: pagina === 1 || anterior.consulta !== consulta ? resultado.items : [...anterior.items, ...resultado.items.filter((item) => !anterior.items.some((previo) => previo.id === item.id))] }))
      setTotalPaginas(resultado.totalPaginas); setFallo(null)
    }).catch((e: unknown) => { if (!controlador.signal.aborted) setFallo({ clave: claveSolicitud, mensaje: e instanceof ErrorApi ? e.message : 'No fue posible cargar las opciones.' }) }).finally(() => { if (!controlador.signal.aborted) setFinalizada(claveSolicitud) })
    return () => controlador.abort()
  }, [autorizado, claveSolicitud, consulta, criteriosClave, pagina, referencia, sucursalFija])
  const items = sucursalFija ? [{ ...sesion.sucursal, activo: true }] : resultado.consulta === consulta && !(cargando && pagina === 1) ? resultado.items : []
  const opciones = items.filter((item) => (!excluirEmpaque || item.dimension !== 'EMPAQUE') && (!(referencia === 'bodegas' && soloSucursalActual) || item.sucursalId === sesion.sucursal.id))
  const sinCoincidencias = opciones.length === 0
  if (value && !opciones.some((item) => item.id === value)) opciones.unshift(seleccionada?.id === value ? seleccionada : { id: value, codigo: '', nombre: value, activo: false })
  return <div className={styles.referenciaControl}>
    <Selector id={id} value={value} required={requerido} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={descripcionId} onValueChange={onChange}
      busquedaRemota={referencia === 'municipios' || sucursalFija ? undefined : { onBuscar: setBusqueda, cargando: cargando || busqueda.trim() !== consulta, hayMas: pagina < totalPaginas, onCargarMas: () => setPagina((actual) => actual + 1), error: errorCarga, sinCoincidencias, onReintentar: () => setRevision((actual) => actual + 1) }}>
      <option value="">{textoVacio ?? (requerido ? 'Selecciona una opción' : 'Sin selección')}</option>
      {opciones.map((item) => <option key={item.id} value={item.id} disabled={!item.activo && item.id !== value}>{item.codigo ? `${item.codigo} · ` : ''}{item.nombre}{!item.activo ? ' (inactivo o no disponible)' : ''}</option>)}
    </Selector>
    {errorCarga && <small role="alert" className={styles.errorTexto}>{errorCarga} <button type="button" className={styles.enlaceReferencia} onClick={() => setRevision((actual) => actual + 1)}>Reintentar</button></small>}
    {referencia === 'municipios' && cargando && <small role="status">Cargando municipios…</small>}
  </div>
}
