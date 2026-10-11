import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useRef, useState } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { Selector } from '../../../shared/components/selector/selector'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { prioridadesTraslado } from '../traslado.config'
import { esUuid, fechaValida } from '../traslado-reglas'
import type { FiltrosDocumentoTraslado, PrioridadTraslado } from '../traslado.types'
import { CampoTraslado } from './traslado-campo'
import catalogo from '../../catalogos-farmacia/catalogos.module.css'
import styles from '../traslado.module.css'

type Props = {
  valores: FiltrosDocumentoTraslado
  onAplicar: (valores: FiltrosDocumentoTraslado) => void
  recurso?: 'traslados' | 'despachos' | 'recepciones'
}

const camposFiltro = ['origenSucursalId', 'destinoSucursalId', 'prioridad', 'desde', 'hasta'] as const

export function TrasladoFiltros({ valores, onAplicar, recurso = 'traslados' }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [borrador, setBorrador] = useState<FiltrosDocumentoTraslado>({})
  const [errores, setErrores] = useState<Record<string, string>>({})
  const formulario = useRef<HTMLFormElement>(null)
  const campos = [...camposFiltro, ...(recurso !== 'traslados' ? ['trasladoId' as const] : []), ...(recurso === 'recepciones' ? ['despachoId' as const] : [])]
  const activos = campos.filter(campo => Boolean(valores[campo])).length

  const abrir = () => {
    const copia: FiltrosDocumentoTraslado = {}
    for (const campo of campos) {
      if (campo === 'prioridad') copia.prioridad = valores.prioridad
      else copia[campo] = valores[campo]
    }
    setBorrador(copia)
    setErrores({})
    setAbierto(true)
  }
  const aplicar = () => {
    const siguientes: typeof errores = {}
    for (const campo of ['trasladoId', 'despachoId'] as const) if (borrador[campo] && !esUuid(borrador[campo]!)) siguientes[campo] = 'Indica un identificador UUID válido.'
    for (const campo of ['desde', 'hasta'] as const) {
      if (borrador[campo] && !fechaValida(borrador[campo]!)) siguientes[campo] = 'Indica una fecha válida.'
    }
    if (!siguientes.desde && !siguientes.hasta && borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
      siguientes.desde = 'La fecha inicial no puede superar la final.'
    }
    setErrores(siguientes)
    if (Object.keys(siguientes).length) {
      formulario.current?.querySelector<HTMLInputElement>(`#f-${Object.keys(siguientes)[0]}`)?.focus()
      return
    }
    onAplicar(borrador)
    setAbierto(false)
  }

  return <>
    <button type="button" className={catalogo.botonHerramienta} aria-haspopup="dialog" aria-label={`Filtros de ${recurso}${activos ? `, ${activos} aplicados` : ''}`} data-activo={activos > 0} onClick={abrir}>
      <IconoAccion nombre="filtrar" /><span>Filtros</span>{activos > 0 && <span className={catalogo.contadorFiltros} aria-hidden="true">{activos}</span>}
    </button>
    <ModalEstado abierto={abierto} tipo="informacion" apariencia="formulario" titulo={`Filtrar ${recurso}`} onCerrar={() => setAbierto(false)} textoAccionPrincipal="Aplicar filtros" onAccionPrincipal={() => formulario.current?.requestSubmit()} textoAccionSecundaria="Limpiar" onAccionSecundaria={() => { setBorrador({}); setErrores({}) }} mensaje={<div className={`${catalogo.panelHerramienta} ${styles.modal}`}>
      <p className={catalogo.ayudaHerramienta}>Ajusta los criterios y aplícalos para actualizar la lista.</p>
      <form onSubmitCapture={validarCantidadesAlEnviar} ref={formulario} className={catalogo.camposHerramienta} noValidate onSubmit={event => { event.preventDefault(); aplicar() }}>
        {(['origenSucursalId', 'destinoSucursalId'] as const).map(campo => <CampoTraslado key={campo} nombre={`f-${campo}`} etiqueta={campo === 'origenSucursalId' ? 'Origen' : 'Destino'} requerido={false}>
          <SelectorReferencia id={`f-${campo}`} referencia="sucursales" value={borrador[campo] ?? ''} onChange={valor => setBorrador(actual => ({ ...actual, [campo]: valor || undefined }))} />
        </CampoTraslado>)}
        {recurso !== 'traslados' && <CampoTraslado nombre="f-trasladoId" etiqueta="Traslado (ID)" requerido={false} maxLength={36} error={errores.trasladoId} ayuda="Identificador completo del traslado." value={borrador.trasladoId ?? ''} onChange={valor => setBorrador(actual => ({ ...actual, trasladoId: valor.trim() || undefined }))} />}
        {recurso === 'recepciones' && <CampoTraslado nombre="f-despachoId" etiqueta="Despacho (ID)" requerido={false} maxLength={36} error={errores.despachoId} ayuda="Identificador completo de la guía." value={borrador.despachoId ?? ''} onChange={valor => setBorrador(actual => ({ ...actual, despachoId: valor.trim() || undefined }))} />}
        <CampoTraslado nombre="f-prioridad" etiqueta="Prioridad" requerido={false}>
          <Selector id="f-prioridad" value={borrador.prioridad ?? ''} onValueChange={valor => setBorrador(actual => ({ ...actual, prioridad: valor as PrioridadTraslado || undefined }))}>
            <option value="">Todas las prioridades</option>{Object.entries(prioridadesTraslado).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </Selector>
        </CampoTraslado>
        <CampoTraslado nombre="f-desde" etiqueta="Creado desde" tipo="date" requerido={false} error={errores.desde} value={borrador.desde ?? ''} onChange={valor => setBorrador(actual => ({ ...actual, desde: valor || undefined }))} />
        <CampoTraslado nombre="f-hasta" etiqueta="Creado hasta" tipo="date" requerido={false} error={errores.hasta} value={borrador.hasta ?? ''} onChange={valor => setBorrador(actual => ({ ...actual, hasta: valor || undefined }))} />
      </form>
      {Object.keys(errores).length > 0 && <p className={styles.intro} role="alert">Revisa los campos señalados antes de aplicar los filtros.</p>}
    </div>} />
  </>
}
