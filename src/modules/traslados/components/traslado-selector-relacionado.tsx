import { useEffect, useState } from 'react'
import { Selector } from '../../../shared/components/selector/selector'
import { listarTraslados } from '../traslado-api'
import type { DetalleTraslado, Traslado } from '../traslado.types'
import { CampoTraslado } from './traslado-campo'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'

export function TrasladoSelectorRelacionado({ traslado, value, onChange, disabled, error }: { traslado: DetalleTraslado; value: string; onChange: (id: string) => void; disabled: boolean; error?: string }) {
  const [sentido, setSentido] = useState('directo'), [pagina, setPagina] = useState(1), [revision, setRevision] = useState(0), [items, setItems] = useState<Traslado[]>([]), [totalPaginas, setTotalPaginas] = useState(0), [fallo, setFallo] = useState(false), [finalizada, setFinalizada] = useState('')
  const origen = sentido === 'directo' ? traslado.origenSucursalId : traslado.destinoSucursalId, destino = sentido === 'directo' ? traslado.destinoSucursalId : traslado.origenSucursalId
  const clave = `${origen}:${destino}:${pagina}:${revision}`, cargando = clave !== finalizada
  useEffect(() => {
    const c = new AbortController()
    void listarTraslados({ origenSucursalId: origen, destinoSucursalId: destino, estado: 'CERRADO', pagina, tamanoPagina: 50 }, c.signal).then(r => {
      if (!c.signal.aborted) { setItems(v => pagina === 1 ? r.items : [...new Map([...v, ...r.items].map(t => [t.id, t])).values()]); setTotalPaginas(r.totalPaginas); setFallo(false) }
    }).catch(() => { if (!c.signal.aborted) setFallo(true) }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, origen, destino, pagina])
  return <div className={form.grillaDos}>
    <CampoTraslado nombre="sentidoRelacionado" etiqueta="Sentido del traslado relacionado" ayuda="Consulta documentos cerrados de los mismos puntos."><Selector id="sentidoRelacionado" value={sentido} disabled={disabled || cargando} aria-describedby="sentidoRelacionado-ayuda" onValueChange={v => { setSentido(v); setPagina(1); setItems([]); onChange('') }}><option value="directo">Mismo sentido</option><option value="inverso">Sentido inverso / retorno</option></Selector></CampoTraslado>
    <CampoTraslado nombre="trasladoRelacionadoId" etiqueta="Traslado cerrado" error={error} ayuda="La selección se verifica contra la recepción efectiva del producto observado."><Selector id="trasladoRelacionadoId" value={value} disabled={disabled} required aria-invalid={!!error} aria-describedby="trasladoRelacionadoId-ayuda" onValueChange={onChange} busquedaRemota={{ cargando, hayMas: pagina < totalPaginas, onCargarMas: () => { if (!cargando) setPagina(v => v + 1) }, error: fallo ? 'No se pudieron consultar los traslados cerrados.' : null, onReintentar: () => setRevision(v => v + 1), sinCoincidencias: !cargando && !items.filter(t => t.id !== traslado.id).length }}><option value="">Selecciona un traslado cerrado</option>{items.filter(t => t.id !== traslado.id).map(t => <option key={t.id} value={t.id}>{t.numero}</option>)}</Selector></CampoTraslado>
  </div>
}
