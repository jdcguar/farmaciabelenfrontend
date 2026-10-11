import { InputCantidad } from '../../../shared/cantidades/input-cantidad'
import type { ContextoCantidad } from '../../../shared/cantidades/cantidad'
import { useEffect, useState } from 'react'
import { Selector } from '../../../shared/components/selector/selector'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import type { ConsultaCatalogo, Referencia } from '../../catalogos-farmacia/catalogo.types'
import { listarInventario, obtenerInventario } from '../inventario-api'
import { vistas } from '../inventario.config'
import type { ConsultaInventario, RecursoInventario, RegistroInventario } from '../inventario.types'
import { textoCantidad } from '../inventario-reglas'
import styles from '../inventario.module.css'
import empleado from '../../empleados/components/empleado-crear-view.module.css'

export type Campo = { clave: string; etiqueta: string; tipo?: 'texto' | 'area' | 'fecha' | 'hora' | 'decimal' | 'entero' | 'opciones'; requerido?: boolean; minimo?: number; maximo?: number; ayuda?: string; referencia?: Referencia; inventario?: 'lotes' | 'existencias' | 'movimientos'; opciones?: { valor: string; etiqueta: string }[] }
export function CampoInventario({ campo, value, onChange, error, disabled, prefijo = 'inv-', consulta = {}, onElegir, soloSucursalActual, criterios, apariencia, textoVacio, unidadCantidad }: {
  campo: Campo; value: string; onChange: (valor: string) => void; error?: string; disabled?: boolean; prefijo?: string
  consulta?: ConsultaInventario; onElegir?: (registro: RegistroInventario) => void; soloSucursalActual?: boolean; criterios?: Pick<ConsultaCatalogo, 'sucursalId' | 'bodegaId' | 'productoId' | 'presentacionId'>
  apariencia?: 'empleados'
  unidadCantidad?: ContextoCantidad
  textoVacio?: string
}) {
  const id = prefijo + campo.clave
  const descripcionId = error ? id + '-error' : campo.ayuda ? id + '-ayuda' : undefined
  const comun = { id, value, disabled, required: campo.requerido, 'aria-invalid': Boolean(error), 'aria-describedby': descripcionId }
  return <div className={apariencia === 'empleados' ? empleado.campo : styles.campo}>
    <label htmlFor={id}>{campo.etiqueta}{campo.requerido && <span aria-hidden="true"> *</span>}</label>
    {campo.referencia ? <SelectorReferencia id={id} referencia={campo.referencia} value={value} onChange={onChange} requerido={campo.requerido} disabled={disabled} error={error} descripcionId={descripcionId} soloSucursalActual={soloSucursalActual} criterios={criterios} textoVacio={textoVacio} />
      : campo.inventario ? <SelectorInventario {...comun} recurso={campo.inventario} consulta={consulta} onChange={onChange} onElegir={onElegir} />
      : campo.tipo === 'opciones' ? <Selector {...comun} onValueChange={onChange}><option value="">Selecciona una opción</option>{campo.opciones?.map(o => <option value={o.valor} key={o.valor}>{o.etiqueta}</option>)}</Selector>
      : campo.tipo === 'area' ? <textarea {...comun} maxLength={campo.maximo ?? 500} onChange={e => onChange(e.target.value)} />
      : unidadCantidad ? <InputCantidad {...comun} contexto={unidadCantidad} onChange={onChange} /> : <input {...comun} type={campo.tipo === 'fecha' ? 'date' : campo.tipo === 'hora' ? 'datetime-local' : 'text'} inputMode={campo.tipo === 'decimal' ? 'decimal' : campo.tipo === 'entero' ? 'numeric' : undefined} maxLength={campo.maximo ?? 150} onChange={e => onChange(e.target.value)} />}
    {error && <small className={apariencia === 'empleados' ? empleado.errorCampo : undefined} id={id + '-error'} role="alert">{error}</small>}
    {!error && campo.ayuda && <small className={apariencia === 'empleados' ? empleado.ayudaCampo : undefined} id={id + '-ayuda'}>{campo.ayuda}</small>}
  </div>
}

function SelectorInventario({ recurso, consulta, onChange, onElegir, ...props }: {
  id: string; value: string; disabled?: boolean; required?: boolean; 'aria-invalid': boolean; 'aria-describedby'?: string
  recurso: RecursoInventario; consulta: ConsultaInventario; onChange: (id: string) => void; onElegir?: (registro: RegistroInventario) => void
}) {
  const { sesion, resolver } = useContextoCatalogo()
  const [items, setItems] = useState<{ registro: RegistroInventario; nombre: string }[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [finalizada, setFinalizada] = useState('')
  const [fallo, setFallo] = useState<{ clave: string; mensaje: string } | null>(null)
  const [revision, setRevision] = useState(0)
  const filtros = JSON.stringify(consulta)
  const [filtrosPrevios, setFiltrosPrevios] = useState(filtros)
  if (filtros !== filtrosPrevios) { setFiltrosPrevios(filtros); setPagina(1); setItems([]) }
  const clave = JSON.stringify({ recurso, filtros, pagina, revision })
  const autorizado = sesion.permisos.includes(`INVENTARIO.${vistas[recurso].grupo}.VER`)
  const cargando = autorizado && clave !== finalizada
  useEffect(() => {
    if (!autorizado) return
    const c = new AbortController()
    const lotes = new Map<string, Promise<RegistroInventario>>()
    const nombre = async (r: RegistroInventario) => {
      if (r.numero) return r.numero
      if (r.referencia) return `${r.referencia} · ${r.tipo ?? ''}`
      const partes: string[] = []
      for (const [ref, id] of [['presentaciones', r.presentacionId], ['ubicaciones', r.ubicacionId]] as const) {
        if (!id) continue
        if (!sesion.permisos.includes(`CATALOGOS.${ref.toUpperCase()}.VER`)) { partes.push(`Referencia ${id}`); continue }
        try { const v = await resolver(ref, id); partes.push(`${v.codigo} · ${v.nombre}`) } catch { partes.push(`Referencia ${id}`) }
      }
      let lote = 'Sin lote'
      if (r.loteId) {
        lote = `Lote ${r.loteId}`
        if (sesion.permisos.includes('INVENTARIO.LOTES.VER')) {
          try {
            if (!lotes.has(r.loteId)) lotes.set(r.loteId, obtenerInventario('lotes', r.loteId, c.signal))
            const registro = await lotes.get(r.loteId)!
            lote = `Lote ${registro.numero ?? r.loteId}`
          } catch { /* Mantener la referencia si el lote no está disponible. */ }
        }
      }
      return `${partes.join(' / ')} · ${r.condicion ?? ''} · ${textoCantidad(r.cantidadBase)} unidades base · ${lote}`
    }
    void listarInventario(recurso, { ...JSON.parse(filtros) as ConsultaInventario, pagina, tamanoPagina: 50 }, c.signal).then(async resultado => {
      const nuevos = await Promise.all(resultado.items.map(async registro => ({ registro, nombre: await nombre(registro) })))
      if (c.signal.aborted) return
      setItems(previos => pagina === 1 ? nuevos : [...previos, ...nuevos.filter(n => !previos.some(p => p.registro.id === n.registro.id))]); setTotalPaginas(resultado.totalPaginas); setFallo(null)
    }).catch((e: unknown) => { if (!c.signal.aborted) setFallo({ clave, mensaje: e instanceof Error ? e.message : 'No se pudieron cargar las opciones.' }) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [autorizado, clave, filtros, pagina, recurso, resolver, sesion.permisos])
  return <Selector {...props} onValueChange={id => { onChange(id); const r = items.find(o => o.registro.id === id); if (r) onElegir?.(r.registro) }} busquedaRemota={{ cargando, hayMas: pagina < totalPaginas, onCargarMas: () => setPagina(p => p + 1), error: !autorizado ? `Se requiere permiso para consultar ${vistas[recurso].titulo.toLowerCase()}.` : fallo?.clave === clave ? fallo.mensaje : null, onReintentar: () => setRevision(r => r + 1), sinCoincidencias: !items.length }}>
    <option value="">Selecciona una opción</option>
    {props.value && !items.some(o => o.registro.id === props.value) && <option value={props.value}>Selección actual · {props.value}</option>}
    {items.map(o => <option key={o.registro.id} value={o.registro.id}>{o.nombre}</option>)}
  </Selector>
}
