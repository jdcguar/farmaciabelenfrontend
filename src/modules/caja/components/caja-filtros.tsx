import { useRef, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import type { ConsultaCaja, RecursoCaja } from '../caja.types'
import { corporativoCaja, esUuidCaja } from '../caja-reglas'
import { cajaConfig } from '../caja.config'
import { CampoCaja } from './caja-comun'
import { enfocarErrorCaja } from '../caja-foco'
import catalogo from '../../catalogos-farmacia/catalogos.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../caja.module.css'
export function CajaFiltros({ recurso, valores, sesion, onAplicar }: { recurso: RecursoCaja; valores: ConsultaCaja; sesion: SesionUsuario; onAplicar: (v: ConsultaCaja) => void }) {
  const [abierto, setAbierto] = useState(false), [borrador, setBorrador] = useState<ConsultaCaja>({}), [errores, setErrores] = useState<Record<string, string>>({}), formulario = useRef<HTMLFormElement>(null)
  const admiteTurno = ['movimientos', 'arqueos', 'cierres', 'remesas', 'rendiciones'].includes(recurso)
  const activos = ['sucursalId', 'cajaId', 'turnoId', 'desde', 'hasta'].filter(k => !!valores[k as keyof ConsultaCaja]).length
  function aplicar() {
    const e: typeof errores = {}
    for (const k of ['sucursalId', 'cajaId', 'turnoId'] as const) if (borrador[k] && !esUuidCaja(borrador[k]!)) e[`f-${k}`] = 'Usa un identificador UUID válido.'
    for (const k of ['desde', 'hasta'] as const) { const v = borrador[k]; if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)) e[`f-${k}`] = 'Indica una fecha válida.' }
    if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) e['f-desde'] = 'La fecha inicial no puede superar la final.'
    setErrores(e); if (Object.keys(e).length) { enfocarErrorCaja(formulario.current); return }
    onAplicar(borrador); setAbierto(false)
  }
  return <><button type="button" className={catalogo.botonHerramienta} data-activo={activos > 0} aria-haspopup="dialog" aria-label={`Filtros de ${cajaConfig[recurso].titulo}${activos ? `, ${activos} aplicados` : ''}`} onClick={() => { setBorrador({ sucursalId: valores.sucursalId, cajaId: valores.cajaId, turnoId: valores.turnoId, desde: valores.desde, hasta: valores.hasta }); setErrores({}); setAbierto(true) }}><IconoAccion nombre="filtrar" />Filtros{activos > 0 && <span className={catalogo.contadorFiltros}>{activos}</span>}</button><ModalEstado abierto={abierto} tipo="informacion" apariencia="formulario" titulo={`Filtrar ${cajaConfig[recurso].titulo.toLowerCase()}`} onCerrar={() => setAbierto(false)} textoAccionPrincipal="Aplicar filtros" onAccionPrincipal={() => formulario.current?.requestSubmit()} textoAccionSecundaria="Limpiar" onAccionSecundaria={() => { setBorrador({}); setErrores({}) }} mensaje={<form ref={formulario} noValidate className={`${styles.modal} ${form.formulario}`} onSubmit={e => { e.preventDefault(); aplicar() }}>{corporativoCaja(sesion) && <CampoCaja nombre="f-sucursalId" etiqueta="Sucursal" requerido={false} error={errores['f-sucursalId']}><SelectorReferencia id="f-sucursalId" referencia="sucursales" value={borrador.sucursalId ?? ''} descripcionId={errores['f-sucursalId'] ? 'f-sucursalId-ayuda' : undefined} error={errores['f-sucursalId']} onChange={v => setBorrador(d => ({ ...d, sucursalId: v }))} /></CampoCaja>}{recurso === 'turnos' && <CampoCaja nombre="f-cajaId" etiqueta="Identificador de caja" requerido={false} ayuda="UUID de la caja; puedes copiarlo desde su detalle." error={errores['f-cajaId']} value={borrador.cajaId ?? ''} onChange={v => setBorrador(d => ({ ...d, cajaId: v }))} />}{admiteTurno && <CampoCaja nombre="f-turnoId" etiqueta="Identificador de turno" requerido={false} error={errores['f-turnoId']} value={borrador.turnoId ?? ''} onChange={v => setBorrador(d => ({ ...d, turnoId: v }))} />}{(['desde', 'hasta'] as const).map(k => <CampoCaja key={k} nombre={`f-${k}`} etiqueta={k === 'desde' ? 'Creado desde' : 'Creado hasta'} requerido={false} tipo="date" error={errores[`f-${k}`]} value={borrador[k] ?? ''} onChange={v => setBorrador(d => ({ ...d, [k]: v }))} />)}<p className={styles.aviso}>Las fechas filtran el registro en el sistema según Guatemala.</p></form>} /></>
}
