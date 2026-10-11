import { mostrarCantidad } from '../../../shared/cantidades/cantidad'
import { useEffect, useState } from 'react'
import { Selector } from '../../../shared/components/selector/selector'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { listarInventario } from '../../inventario/inventario-api'
import { obtenerInventario } from '../../inventario/inventario-api'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import type { RecursoInventario, ConsultaInventario } from '../../inventario/inventario.types'
import { listarSanitaria } from '../sanitaria-api'
import { permisoSanitaria, type VistaSanitaria } from '../sanitaria.config'
import { textoSanitario, type ConsultaSanitaria, type DocumentoSanitario } from '../sanitaria.types'
import { nombreDocumentoSanitario } from '../sanitaria.config'
export function SelectorDocumentoSanitaria({ nombre, vista, inventario, filtros = {}, value, onChange, sesion, requerido = true, error, disabled, opcionesFijas }: { nombre: string; vista?: VistaSanitaria; inventario?: RecursoInventario; filtros?: ConsultaSanitaria & ConsultaInventario; value: string; onChange: (v: string, e?: DocumentoSanitario) => void; sesion: SesionUsuario; requerido?: boolean; error?: string; disabled?: boolean; opcionesFijas?: DocumentoSanitario[] }) {
  const { resolver } = useContextoCatalogo(), [referencias, setReferencias] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<{ base: string; items: DocumentoSanitario[]; mas: boolean }>({ base: '', items: [], mas: false }), [pagina, setPagina] = useState(1), [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState(''), [fallo, setFallo] = useState('')
  const base = JSON.stringify({ vista, inventario, filtros }), clave = JSON.stringify({ base, pagina, revision }), puede = opcionesFijas !== undefined || sesion.permisos.includes(vista ? permisoSanitaria(vista) : `INVENTARIO.${inventario === 'existencias' ? 'EXISTENCIAS' : inventario === 'lotes' ? 'LOTES' : 'BLOQUEOS'}.VER`)
  const [anterior, setAnterior] = useState(base); if (base !== anterior) { setAnterior(base); setPagina(1) }
  useEffect(() => {
    if (!puede || opcionesFijas !== undefined || disabled) return
    const c = new AbortController(), f = JSON.parse(base).filtros
    const consulta = vista ? listarSanitaria(vista, { ...f, pagina, tamanoPagina: 50 }, c.signal) : listarInventario(inventario!, { ...f, pagina, tamanoPagina: 50 }, c.signal)
    void consulta.then(r => { if (!c.signal.aborted) { const items = r.items as DocumentoSanitario[]; setResultado(a => ({ base, items: pagina === 1 || a.base !== base ? items : [...a.items, ...items.filter(x => !a.items.some(y => y.id === x.id))], mas: pagina < r.totalPaginas })); setFallo('') } }).catch((e: unknown) => { if (!c.signal.aborted) setFallo(e instanceof Error ? e.message : 'No fue posible cargar registros.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) }); return () => c.abort()
  }, [base, clave, disabled, inventario, opcionesFijas, pagina, puede, vista])
  useEffect(() => {
    if (inventario !== 'existencias' || resultado.base !== base) return
    let vigente = true
    for (const e of resultado.items) {
      const u = textoSanitario(e, 'ubicacionId'), l = textoSanitario(e, 'loteId')
      if (u && sesion.permisos.includes('CATALOGOS.UBICACIONES.VER')) void resolver('ubicaciones', u).then(x => { if (vigente) setReferencias(rs => ({ ...rs, [u]: `${x.codigo} · ${x.nombre}` })) }).catch(() => {})
      if (l && sesion.permisos.includes('INVENTARIO.LOTES.VER')) void obtenerInventario('lotes', l).then(x => { if (vigente) setReferencias(rs => ({ ...rs, [l]: textoSanitario(x as DocumentoSanitario, 'numero') })) }).catch(() => {})
    }
    return () => { vigente = false }
  }, [inventario, resultado, base, resolver, sesion.permisos])
  const items = opcionesFijas ?? (resultado.base === base && !(pagina === 1 && clave !== finalizada) ? resultado.items : []), etiqueta = (e: DocumentoSanitario) => inventario === 'existencias' ? `${textoSanitario(e, 'numeroLote') || referencias[textoSanitario(e, 'loteId')] || (e.loteId ? 'Lote identificado' : 'Sin lote')} · ${textoSanitario(e, 'condicion')} · ${mostrarCantidad(e.cantidadBase)} base · ${referencias[textoSanitario(e, 'ubicacionId')] || 'Ubicación identificada'}` : `${inventario === 'lotes' ? textoSanitario(e, 'numero') || 'Lote identificado' : nombreDocumentoSanitario(e)}${textoSanitario(e, 'cantidadBase') && vista === 'evaluaciones' ? ` · ${mostrarCantidad(e.cantidadBase)} base` : ''}`
  return <><Selector id={nombre} value={value} onValueChange={v => onChange(v, items.find(e => e.id === v))} required={requerido} disabled={disabled || !puede} aria-invalid={!!error} aria-describedby={error ? `${nombre}-ayuda` : undefined} busquedaRemota={opcionesFijas === undefined ? { cargando: puede && !disabled && clave !== finalizada, hayMas: resultado.base === base && resultado.mas, onCargarMas: () => setPagina(p => p + 1), error: fallo || null, sinCoincidencias: !items.length, onReintentar: () => setRevision(r => r + 1) } : undefined}><option value="">Selecciona un registro</option>{value && !items.some(e => e.id === value) && <option value={value}>Registro seleccionado</option>}{items.map(e => <option key={e.id} value={e.id}>{etiqueta(e)}</option>)}</Selector>{!puede && <small>Tu usuario necesita permiso de consulta para seleccionar este registro.</small>}</>
}
