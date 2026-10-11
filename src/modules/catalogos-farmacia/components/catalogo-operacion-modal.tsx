import { useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { Selector } from '../../../shared/components/selector/selector'
import { IconoAccion } from '../../../shared/components/icono-accion'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import { cerrarPrecio, homologarProveedor, inactivarRegistro } from '../catalogo-api'
import { fechaNegocio, textoValor } from '../catalogo-reglas'
import type { DefinicionCatalogo, RegistroCatalogo } from '../catalogo.types'
import styles from '../catalogos.module.css'
export type OperacionCatalogo = 'inactivar' | 'homologar' | 'cerrar'
type Props = { catalogo: DefinicionCatalogo; registro: RegistroCatalogo; operacion: OperacionCatalogo; onCerrar: () => void; onCompletado: () => void }
export function CatalogoOperacionModal({ catalogo, registro, operacion, onCerrar, onCompletado }: Props) {
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState(registro.estadoHomologacion === 'EN_EVALUACION' ? 'APROBADO' : 'EN_EVALUACION')
  const [fecha, setFecha] = useState(textoValor(registro.vigenteDesde) > fechaNegocio() ? textoValor(registro.vigenteDesde) : fechaNegocio())
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const titulo = operacion === 'inactivar' ? `Desactivar ${catalogo.singular}` : operacion === 'homologar' ? 'Cambiar homologación' : 'Cerrar vigencia del precio'
  const confirmar = async () => {
    if (procesando) return
    if (motivo.trim().length < 5 || motivo.trim().length > 250) { setError('Escribe un motivo de 5 a 250 caracteres.'); return }
    if (operacion === 'cerrar' && (!fecha || fecha < fechaNegocio() || fecha < textoValor(registro.vigenteDesde) || registro.vigenteHasta && fecha >= textoValor(registro.vigenteHasta))) { setError('El cierre debe ser hoy o después del inicio y debe acortar la vigencia actual.'); return }
    setProcesando(true); setError(null)
    try {
      if (operacion === 'inactivar') await inactivarRegistro(catalogo.clave, registro, motivo.trim())
      else if (operacion === 'homologar') await homologarProveedor(registro, estado, motivo.trim())
      else await cerrarPrecio(registro, fecha, motivo.trim())
      onCompletado()
    } catch (e: unknown) { setError(e instanceof ErrorApi ? e.message : 'No fue posible completar la operación.') }
    finally { setProcesando(false) }
  }
  const cerrar = () => { if (!procesando) onCerrar() }
  return <ModalEstado abierto tipo="advertencia" titulo={titulo} mensaje={<div className={`${gestion.contenidoConfirmacion} ${styles.pagina}`}>
    <div className={gestion.identidadConfirmacion}><span aria-hidden="true">{registro.nombre.slice(0, 2).toUpperCase()}</span><div><strong>{registro.nombre}</strong><small>{registro.codigo}</small></div></div>
    <p>{operacion === 'inactivar' ? 'Dejará de estar disponible para nuevas operaciones. El historial se conserva. Los registros relacionados activos pueden impedir la desactivación.' : operacion === 'homologar' ? `Homologación actual: ${textoValor(registro.estadoHomologacion).replaceAll('_', ' ')}. El cambio quedará registrado en auditoría.` : 'El último día sigue incluido en el periodo. El precio y su historial se conservan; el siguiente precio debe comenzar después del cierre.'}</p>
    {operacion === 'homologar' && <div className={formulario.campo}><label htmlFor="homologacion-estado">Nuevo estado</label><Selector id="homologacion-estado" value={estado} onValueChange={setEstado} disabled={procesando}><option value="EN_EVALUACION" disabled={registro.estadoHomologacion === 'EN_EVALUACION'}>En evaluación</option><option value="APROBADO" disabled={registro.estadoHomologacion === 'APROBADO'}>Aprobado</option><option value="SUSPENDIDO" disabled={registro.estadoHomologacion === 'SUSPENDIDO'}>Suspendido</option></Selector></div>}
    {operacion === 'cerrar' && <div className={formulario.campo}><label htmlFor="cierre-fecha">Último día de vigencia</label><input id="cierre-fecha" type="date" value={fecha} disabled={procesando} min={fechaNegocio()} onChange={(e) => setFecha(e.target.value)} /></div>}
    <label htmlFor="operacion-motivo">Motivo *</label><textarea id="operacion-motivo" rows={3} maxLength={250} value={motivo} disabled={procesando} aria-describedby="operacion-ayuda" onChange={(e) => { setMotivo(e.target.value); setError(null) }} /><small id="operacion-ayuda">{motivo.length}/250 caracteres. Mínimo 5.</small>
    {error && <span role="alert">{error}{error.includes('modific') && ' Cierra el diálogo y actualiza los datos antes de continuar.'}</span>}
  </div>} textoAccionPrincipal={titulo} iconoAccionPrincipal={<IconoAccion nombre="estado" />} textoAccionSecundaria="Cancelar" onAccionPrincipal={() => void confirmar()} onAccionSecundaria={cerrar} onCerrar={cerrar} cargando={procesando} />
}
