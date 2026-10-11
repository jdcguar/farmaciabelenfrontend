import { useCallback, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { Selector } from '../../../shared/components/selector/selector'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { contextoAperturaCaja, contextoConteoArqueoCaja, listarCaja, obtenerCaja, operarCaja } from '../caja-api'
import { permisoCaja, type RutaCaja } from '../caja.config'
import { camposOperacionCaja, entradaOperacionCaja, obtenerOperacionCaja, puedeOperacionDocumentoCaja, textoCaja, validarCamposCaja, type BorradorOperacionCaja } from '../caja-operaciones'
import { centavosCaja, corporativoCaja, decimalCaja, esMontoCaja, esUuidCaja, totalConteoCaja } from '../caja-reglas'
import { useCargaCaja, useEnvioCaja } from '../caja-hooks'
import type { ConfiguracionCaja, ConteoCaja, ErroresCaja, PoliticaCaja, RegistroCaja, RecursoCaja } from '../caja.types'
import { CampoCaja, CargaCaja, MarcoFormularioCaja } from './caja-comun'
import { SelectorCaja } from './caja-selector'
import { CajaConteo } from './caja-conteo'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import styles from '../caja.module.css'

export function CajaOperacionView({ ruta, sesion, onNavegar, onCambiosPendientes }: { ruta: RutaCaja; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }) {
  const operacion = obtenerOperacionCaja(ruta)!, campos = camposOperacionCaja(operacion, sesion)
  const inicial: BorradorOperacionCaja = Object.fromEntries(campos.map(c => [c.nombre, c.tipo === 'booleano' ? false : c.tipo === 'lista' ? [] : c.personal || c.nombre === 'responsableId' && ruta.recurso === 'arqueos' && !sesion.permisos.includes('CAJA.ARQUEOS.SUPERVISAR') ? sesion.usuarioId : c.nombre === 'sucursalId' ? sesion.sucursal.id : '']))
  const [datos, setDatos] = useState(inicial), [conteoEditado, setConteoEditado] = useState<{ clave: string; lineas: ConteoCaja[] } | null>(null), [alcance, setAlcance] = useState(sesion.sucursal.id), [confirmar, setConfirmar] = useState(false), [resultado, setResultado] = useState<{ id?: string; recurso: RecursoCaja; diferencia: boolean } | null>(null)
  const cargar = useCallback(async (signal: AbortSignal) => {
    if (!ruta.id) return { documento: null, relacionado: null }
    const documento = await obtenerCaja(ruta.recurso, ruta.id, signal)
    const relacionadoId = ruta.recurso === 'remesas' ? textoCaja(documento, 'destinoTurnoId') : ruta.recurso === 'cierres' || ruta.recurso === 'movimientos' ? textoCaja(documento, 'turnoId') : ''
    const relacionado = relacionadoId && sesion.permisos.includes(permisoCaja('turnos')) ? await obtenerCaja('turnos', relacionadoId, signal) : null
    return { documento, relacionado }
  }, [ruta.id, ruta.recurso, sesion.permisos])
  const carga = useCargaCaja(`${ruta.recurso}:${ruta.id ?? 'nuevo'}`, cargar), documento = carga.documento?.documento
  const cajaId = String(datos.cajaId ?? ''), turnoId = String(datos.turnoId ?? ''), destinoId = String(datos.turnoDestinoId ?? ''), sucursalId = String(datos.sucursalId ?? documento?.sucursalId ?? alcance)
  const requiereConteo = !!operacion.conteo, documentoVersion = documento?.version, documentoSucursalId = documento?.sucursalId, transferenciaDestinoId = documento ? textoCaja(documento, 'destinoTurnoId') : '', sucursalRelacionadaId = carga.documento?.relacionado?.sucursalId, politicaHistorica = JSON.stringify(documento?.politica ?? null)
  const cargarConteo = useCallback(async (signal: AbortSignal): Promise<{ denominaciones: string[]; fondoMaximo?: string }> => {
    if (!requiereConteo) return { denominaciones: [] }
    if (ruta.recurso === 'arqueos' && ruta.id) { const contexto = await contextoConteoArqueoCaja(ruta.id, signal); if (documentoVersion !== undefined && contexto.version !== documentoVersion) throw new Error('El arqueo cambió. Vuelve al detalle y revisa su versión.'); return contexto }
    if (ruta.recurso === 'turnos' && !ruta.id) { if (!esUuidCaja(cajaId)) return { denominaciones: [] }; const c = await contextoAperturaCaja(cajaId, signal); return c.politica.configuracion }
    if (ruta.recurso === 'turnos' && documentoSucursalId) return JSON.parse(politicaHistorica) as ConfiguracionCaja
    if (ruta.recurso === 'rendiciones' || ruta.operacion === 'retorno') { const id = ruta.operacion === 'retorno' ? destinoId : turnoId; if (!esUuidCaja(id)) return { denominaciones: [] }; const t = await obtenerCaja('turnos', id, signal); return t.politica as ConfiguracionCaja }
    if (!documentoSucursalId) return { denominaciones: [] }
    const suc = ruta.recurso === 'remesas' && transferenciaDestinoId ? sucursalRelacionadaId : documentoSucursalId
    if (!suc) throw new Error('Consulta el turno destino antes de aceptar la transferencia.')
    const p = await listarCaja<PoliticaCaja>('politicas', { sucursalId: suc, pagina: 1 }, signal)
    if (!p.items[0]) throw new Error('La sucursal necesita una política de denominaciones.')
    return p.items[0].configuracion
  }, [requiereConteo, ruta.id, ruta.recurso, ruta.operacion, cajaId, turnoId, destinoId, documentoVersion, documentoSucursalId, transferenciaDestinoId, sucursalRelacionadaId, politicaHistorica])
  const conteo = useCargaCaja(`${cajaId}:${turnoId}:${destinoId}:${documento?.version ?? ''}`, cargarConteo)
  const claveConteo = JSON.stringify({ cajaId, turnoId, destinoId, version: documento?.version, denominaciones: conteo.documento?.denominaciones })
  const lineas = conteoEditado?.clave === claveConteo ? conteoEditado.lineas : (conteo.documento?.denominaciones ?? []).map(valor => ({ valor, cantidad: '' }))
  const envio = useEnvioCaja(onCambiosPendientes, JSON.stringify(datos) !== JSON.stringify(inicial) || lineas.some(l => l.cantidad !== ''))
  const autorizado = !documento || puedeOperacionDocumentoCaja(ruta, documento, sesion, carga.documento?.relacionado)
  const bloqueado = carga.cargando || !!carga.error || !autorizado || envio.guardando || envio.conflicto || !!resultado || !!(operacion.conteo && (conteo.cargando || conteo.error || !lineas.length))
  function cambiar(k: string, v: string | boolean | string[]) { setDatos(d => ({ ...d, [k]: v })); envio.limpiar() }
  function validar(): ErroresCaja {
    const errores = validarCamposCaja(campos, datos)
    if (operacion.conteo) {
      if (!lineas.length || lineas.length > 30) errores.denominaciones = 'Carga las denominaciones antes de guardar.'
      lineas.forEach((l, i) => { if (!esMontoCaja(l.valor, true) || !/^\d{1,9}$/.test(l.cantidad) || Number(l.cantidad) > 100000000) errores[`denominaciones.${i}.cantidad`] = 'Introduce un entero entre 0 y 100000000.' })
      if (!Object.keys(errores).some(k => k.startsWith('denominaciones')) && !esMontoCaja(decimalCaja(totalConteoCaja(lineas)))) errores.denominaciones = 'El total excede la precisión monetaria permitida.'
      if (!Object.keys(errores).some(k => k.startsWith('denominaciones')) && ruta.recurso === 'turnos' && !ruta.id && conteo.documento?.fondoMaximo && totalConteoCaja(lineas) > centavosCaja(conteo.documento.fondoMaximo)) errores.denominaciones = 'El fondo excede el límite autorizado.'
    }
    if (ruta.recurso === 'arqueos' && ['SORPRESIVO', 'INCIDENCIA'].includes(String(datos.tipo)) && !sesion.permisos.includes('CAJA.ARQUEOS.SUPERVISAR')) errores.tipo = 'Este tipo requiere permiso de supervisión.'
    return errores
  }
  const contenido = () => entradaOperacionCaja(operacion, campos, datos, ruta.id ?? '', documento?.version ?? 0, '', operacion.conteo ? lineas.map(l => ({ valor: l.valor, cantidad: Number(l.cantidad) })) : undefined)
  function guardar() {
    setConfirmar(false)
    void envio.ejecutar(validar(), contenido(), clave => operarCaja(operacion.ruta, operacion.metodo, { ...contenido(), claveIdempotencia: clave }), r => {
      const respuesta = r as Record<string, unknown>, registro = (respuesta.remesa ?? respuesta.correcto ?? respuesta.compensacion ?? respuesta) as RegistroCaja
      setResultado({ id: registro.id ?? ruta.id, recurso: operacion.resultado, diferencia: respuesta.aceptada === false })
    })
  }
  function preparar() { const errores = validar(); if (Object.keys(errores).length) void envio.ejecutar(errores, {}, async () => null, () => {}); else setConfirmar(true) }
  const volver = () => onNavegar(ruta.id ? `/caja/${ruta.recurso}/${ruta.id}` : sesion.permisos.includes(permisoCaja(ruta.recurso)) ? `/caja/${ruta.recurso}` : '/')
  return <><MarcoFormularioCaja titulo={operacion.titulo} sucursal={sesion.sucursal.nombre} secciones={[{ id: 'operacion-datos', titulo: 'Datos del documento' }, ...(operacion.conteo ? [{ id: 'operacion-conteo', titulo: 'Conteo de efectivo' }] : [])]} resumen={<><strong>{operacion.titulo}</strong><p>{operacion.aviso}</p>{documento && <p>Versión a confirmar: {documento.version}</p>}</>} formRef={envio.formulario} error={envio.error} guardando={envio.guardando} onGuardar={preparar} pie={<><p>* Campos obligatorios</p><div><button type="button" className={form.botonSecundario} disabled={envio.guardando || !!resultado} onClick={volver}>Cancelar</button><button type="submit" className={form.botonPrincipal} disabled={bloqueado}>{envio.guardando ? 'Guardando…' : operacion.titulo}</button></div></>}>
    <CargaCaja cargando={carga.cargando} error={carga.error} onReintentar={carga.recargar} />{!autorizado && <p role="alert" className={styles.aviso}>El estado, la sucursal o el responsable del documento no permite esta operación para tu usuario.</p>}{envio.conflicto && <p role="alert" className={styles.aviso}>El documento cambió. Vuelve al detalle, revisa la nueva versión e inicia nuevamente la operación.</p>}
    <fieldset id="operacion-datos" disabled={carga.cargando || !!carga.error || !autorizado || envio.guardando || envio.conflicto || !!resultado}><legend><span className={empleado.numeroSeccion}>01</span>Datos del documento</legend><div className={form.grillaDos}>{corporativoCaja(sesion) && !ruta.id && !campos.some(c => c.nombre === 'sucursalId') && <CampoCaja nombre="alcanceSucursal" etiqueta="Sucursal de los documentos"><SelectorReferencia id="alcanceSucursal" referencia="sucursales" value={alcance} onChange={v => { setAlcance(v); setDatos(inicial); setConteoEditado(null); envio.limpiar() }} /></CampoCaja>}{campos.map(c => <CampoCaja key={c.nombre} nombre={c.nombre} etiqueta={c.etiqueta} ayuda={c.ayuda} requerido={!c.opcional} error={envio.errores[c.nombre]} area={c.tipo === 'area'} tipo={c.tipo === 'fecha' ? 'date' : c.tipo === 'instante' ? 'datetime-local' : 'text'} inputMode={c.tipo === 'monto' ? 'decimal' : undefined} maxLength={c.max ?? (c.tipo === 'monto' ? 16 : undefined)} value={typeof datos[c.nombre] === 'string' ? datos[c.nombre] as string : ''} onChange={v => cambiar(c.nombre, v)}>
      {c.tipo === 'booleano' ? <Selector id={c.nombre} value={String(datos[c.nombre])} onValueChange={v => cambiar(c.nombre, v === 'true')}><option value="false">No</option><option value="true">Sí, lo acepto expresamente</option></Selector> : c.opciones ? <Selector id={c.nombre} value={String(datos[c.nombre])} aria-invalid={!!envio.errores[c.nombre]} onValueChange={v => cambiar(c.nombre, v)}><option value="">Selecciona una opción</option>{Object.entries(c.opciones).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Selector> : c.recurso === 'sucursales' ? <SelectorReferencia id={c.nombre} referencia="sucursales" value={String(datos[c.nombre])} soloSucursalActual={!corporativoCaja(sesion)} disabled={!corporativoCaja(sesion)} onChange={v => cambiar(c.nombre, v)} /> : c.tipo === 'lista' && c.recurso && c.recurso !== 'usuarios' ? <SeleccionMultipleCaja nombre={c.nombre} recurso={c.recurso} ids={datos[c.nombre] as string[]} onChange={v => cambiar(c.nombre, v)} sesion={sesion} sucursalId={sucursalId} estados={c.estados} error={envio.errores[c.nombre]} /> : c.recurso ? <SelectorCaja nombre={c.nombre} recurso={c.recurso} value={String(datos[c.nombre])} onChange={v => cambiar(c.nombre, v)} sesion={sesion} estados={c.estados} filtros={c.recurso === 'usuarios' ? undefined : c.nombre === 'destinoTurnoId' && corporativoCaja(sesion) ? {} : { sucursalId }} aceptar={c.nombre === 'cajaId' && ruta.recurso === 'turnos' && ruta.modo === 'crear' ? esCajaVentas : undefined} habilitado={!c.personal && !(c.nombre === 'responsableId' && ruta.recurso === 'arqueos' && !sesion.permisos.includes('CAJA.ARQUEOS.SUPERVISAR'))} requerido={!c.opcional} error={envio.errores[c.nombre]} /> : undefined}
    </CampoCaja>)}</div></fieldset>
    {operacion.conteo && <fieldset id="operacion-conteo" disabled={envio.guardando || envio.conflicto || !!resultado}><legend><span className={empleado.numeroSeccion}>02</span>Conteo de efectivo</legend><CargaCaja cargando={conteo.cargando} error={conteo.error} onReintentar={conteo.recargar} /><CajaConteo lineas={lineas} onChange={v => { setConteoEditado({ clave: claveConteo, lineas: v }); envio.limpiar() }} errores={envio.errores} disabled={bloqueado} /></fieldset>}
  </MarcoFormularioCaja><ModalEstado abierto={confirmar} tipo="advertencia" titulo={operacion.titulo} mensaje={<><p>{operacion.aviso}</p>{operacion.conteo && lineas.length > 0 && <p>Total declarado: Q {decimalCaja(totalConteoCaja(lineas))}</p>}</>} textoAccionPrincipal="Confirmar y guardar" onAccionPrincipal={guardar} textoAccionSecundaria="Seguir revisando" onAccionSecundaria={() => setConfirmar(false)} onCerrar={() => setConfirmar(false)} /><ModalEstado abierto={!!resultado} tipo={resultado?.diferencia ? 'advertencia' : 'exito'} titulo={resultado?.diferencia ? 'Diferencia registrada; entrega pendiente' : 'Operación guardada'} mensaje={resultado?.diferencia ? 'El conteo no coincide. Se generó una incidencia y se conserva la custodia anterior. La entrega no fue aceptada.' : 'El documento quedó registrado. Consulta el detalle para revisar su estado y los siguientes pasos.'} textoAccionPrincipal={resultado && sesion.permisos.includes(permisoCaja(resultado.recurso)) ? 'Ver documento' : 'Volver'} onAccionPrincipal={() => resultado?.id && sesion.permisos.includes(permisoCaja(resultado.recurso)) ? onNavegar(`/caja/${resultado.recurso}/${resultado.id}`) : volver()} onCerrar={volver} /></>
}

function SeleccionMultipleCaja({ nombre, recurso, ids, onChange, sesion, sucursalId, estados, error }: { nombre: string; recurso: RecursoCaja; ids: string[]; onChange: (v: string[]) => void; sesion: SesionUsuario; sucursalId: string; estados?: string[]; error?: string }) {
  const [seleccionado, setSeleccionado] = useState('')
  return <div className={styles.contenido}><SelectorCaja nombre={nombre} recurso={recurso} value={seleccionado} onChange={setSeleccionado} sesion={sesion} filtros={{ sucursalId }} estados={estados} requerido={false} error={error} /><button type="button" className={form.botonSecundario} disabled={!esUuidCaja(seleccionado) || ids.includes(seleccionado) || ids.length >= 100} onClick={() => { onChange([...ids, seleccionado]); setSeleccionado('') }}>Agregar documento</button>{ids.map((id, i) => <div className={styles.acciones} key={id}><span>{i + 1}. {id}</span><button type="button" className={styles.enlace} aria-label={`Quitar documento ${i + 1}`} onClick={() => onChange(ids.filter(x => x !== id))}>Quitar</button></div>)}</div>
}

function esCajaVentas(caja: RegistroCaja) { return caja.tipo === 'VENTAS' }
