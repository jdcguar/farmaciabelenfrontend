import { useEffect, useState } from 'react'
import { puedeAccederPantalla } from '../../../shared/seguridad/navegacion'
import { Selector } from '../../../shared/components/selector/selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { listarUsuarios, obtenerUsuario } from '../../usuarios/usuario-api'
import { listarCaja, obtenerCaja } from '../caja-api'
import { permisoCaja } from '../caja.config'
import { etiquetaRegistroCaja, textoCaja } from '../caja-operaciones'
import type { ConsultaCaja, RecursoCaja, RegistroCaja } from '../caja.types'
import styles from '../caja.module.css'
type Opcion = { id: string; etiqueta: string }
type SelectorCajaProps = { nombre: string; recurso: RecursoCaja | 'usuarios'; value: string; onChange: (v: string) => void; sesion: SesionUsuario; filtros?: ConsultaCaja; estados?: string[]; habilitado?: boolean; error?: string; requerido?: boolean; aceptar?: (r: RegistroCaja) => boolean }
export function SelectorCaja(props: SelectorCajaProps) { return <SelectorCajaContenido key={JSON.stringify({ recurso: props.recurso, filtros: props.filtros, estados: props.estados })} {...props} /> }
function SelectorCajaContenido({ nombre, recurso, value, onChange, sesion, filtros, estados, habilitado = true, error, requerido = true, aceptar }: SelectorCajaProps) {
  const [opciones, setOpciones] = useState<Opcion[]>([]), [pagina, setPagina] = useState(1), [mas, setMas] = useState(false), [revision, setRevision] = useState(0), [fallo, setFallo] = useState(''), [finalizada, setFinalizada] = useState('')
  const autorizado = sesion.permisos.includes(recurso === 'usuarios' ? 'SEGURIDAD.USUARIOS.VER' : permisoCaja(recurso)), filtroClave = JSON.stringify(filtros ?? {}), estadosClave = JSON.stringify(estados ?? [])
  const clave = JSON.stringify({ recurso, filtroClave, estadosClave, pagina, revision }), cargando = autorizado && habilitado && finalizada !== clave
  useEffect(() => {
    if (!autorizado || !habilitado) return
    const c = new AbortController(), estadosUsados = JSON.parse(estadosClave) as string[]
    const solicitud = recurso === 'usuarios' ? listarUsuarios({ pagina, tamanoPagina: 50, estados: ['ACTIVO'] }, c.signal).then(r => ({ items: r.items.map(u => ({ id: u.id, etiqueta: `${u.nombreUsuario} · ${u.empleadoNombre}` })), totalPaginas: r.totalPaginas })) : listarCaja(recurso, { ...JSON.parse(filtroClave) as ConsultaCaja, pagina, tamanoPagina: 50, ...(estadosUsados.length === 1 ? { estado: estadosUsados[0] } : {}) }, c.signal).then(r => ({ items: r.items.filter(d => (!estadosUsados.length || estadosUsados.includes(textoCaja(d, 'estado'))) && (!aceptar || aceptar(d))).map(d => ({ id: d.id, etiqueta: etiquetaRegistroCaja(d) })), totalPaginas: r.totalPaginas }))
    void solicitud.then(r => { if (!c.signal.aborted) { setOpciones(ls => pagina === 1 ? r.items : [...ls, ...r.items.filter(x => !ls.some(v => v.id === x.id))]); setMas(pagina < r.totalPaginas); setFallo('') } }).catch((e: unknown) => { if (!c.signal.aborted) setFallo(e instanceof Error ? e.message : 'No fue posible cargar las opciones.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort()
  }, [autorizado, habilitado, recurso, filtroClave, estadosClave, pagina, clave, aceptar])
  const items = value && !opciones.some(o => o.id === value) ? [{ id: value, etiqueta: `Seleccionado: ${value}` }, ...opciones] : opciones
  if (!autorizado) return <><input id={nombre} value={value} disabled={!habilitado} onChange={e => onChange(e.target.value)} required={requerido} aria-invalid={!!error} aria-describedby={`${nombre}-consulta`} /><small id={`${nombre}-consulta`}>Introduce el UUID del registro autorizado. La consulta de nombres requiere permiso de lectura.</small></>
  return <><Selector id={nombre} value={value} required={requerido} disabled={!habilitado} aria-invalid={!!error} aria-describedby={error ? `${nombre}-ayuda` : undefined} onValueChange={onChange} busquedaRemota={{ cargando, hayMas: mas, onCargarMas: () => setPagina(p => p + 1), error: fallo || null, sinCoincidencias: !opciones.length, onReintentar: () => setRevision(r => r + 1) }}><option value="">Selecciona una opción</option>{items.map(o => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}</Selector>{fallo && <small role="alert">{fallo} <button className={styles.enlace} type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button></small>}</>
}
export function NombreCaja({ recurso, id, sesion, onNavegar }: { recurso: RecursoCaja; id: string; sesion: SesionUsuario; onNavegar: (r: string) => void }) {
  const [registro, setRegistro] = useState<RegistroCaja | null>(null), puede = sesion.permisos.includes(permisoCaja(recurso))
  useEffect(() => { if (!id || !puede) return; const c = new AbortController(); void obtenerCaja(recurso, id, c.signal).then(r => { if (!c.signal.aborted) setRegistro(r) }).catch(() => {}); return () => c.abort() }, [id, recurso, puede])
  const etiqueta = registro?.id === id ? etiquetaRegistroCaja(registro) : id
  return puede && puedeAccederPantalla(`caja-${recurso}`, sesion.permisos) ? <button className={styles.enlace} type="button" onClick={() => onNavegar(`/caja/${recurso}/${id}`)}>{etiqueta}</button> : <span>{etiqueta}</span>
}
export function NombreUsuarioCaja({ id, sesion }: { id: string; sesion: SesionUsuario }) {
  const [nombre, setNombre] = useState<{ id: string; texto: string } | null>(null), puede = sesion.permisos.includes('SEGURIDAD.USUARIOS.VER')
  useEffect(() => { if (!puede || !id || id === sesion.usuarioId) return; const c = new AbortController(); void obtenerUsuario(id, c.signal).then(u => { if (!c.signal.aborted) setNombre({ id, texto: `${u.empleadoNombre} · ${u.nombreUsuario}` }) }).catch(() => {}); return () => c.abort() }, [id, puede, sesion.usuarioId])
  return <span>{id === sesion.usuarioId ? `${sesion.empleadoNombre} · ${sesion.nombreUsuario}` : nombre?.id === id ? nombre.texto : id}</span>
}
