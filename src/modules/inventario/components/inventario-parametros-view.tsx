import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { obtenerParametros, guardarParametros } from '../inventario-api'
import { validarUmbrales } from '../inventario-consultas-reglas'
import { fechaHora } from '../inventario-reglas'
import type { ParametrosInventario } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { IconoPosicion } from './inventario-posicion-identidad'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import formulario from '../../empleados/components/empleado-crear-view.module.css'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

export function InventarioParametrosView({ onCambiosPendientes }: { onCambiosPendientes: (valor: boolean) => void }) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const [parametros, setParametros] = useState<ParametrosInventario | null>(null), [datos, setDatos] = useState({ alertaDias: '', preventivoDias: '', criticoDias: '', motivo: '' })
  const [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState(-1), [error, setError] = useState<string | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null), [errores, setErrores] = useState<Record<string, string>>({}), [conflicto, setConflicto] = useState(false)
  const [dirty, setDirty] = useState(false), [guardando, setGuardando] = useState(false), [exito, setExito] = useState(false)
  const enviando = useRef(false), cargando = revision !== finalizada
  const editable = sesion.permisos.includes('INVENTARIO.VENCIMIENTOS.CONFIGURAR') && sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  useEffect(() => { onCambiosPendientes(dirty); return () => onCambiosPendientes(false) }, [dirty, onCambiosPendientes])
  useEffect(() => {
    const c = new AbortController()
    void obtenerParametros(c.signal).then(r => { if (!c.signal.aborted) { setParametros(r); setDatos({ alertaDias: String(r.alertaDias), preventivoDias: String(r.preventivoDias), criticoDias: String(r.criticoDias), motivo: '' }); setDirty(false); setError(null); setErrorCarga(null); setErrores({}); setConflicto(false) } }).catch((e: unknown) => { if (!c.signal.aborted) setErrorCarga(e instanceof Error ? e.message : 'No se pudo cargar la configuración.') }).finally(() => { if (!c.signal.aborted) setFinalizada(revision) })
    return () => c.abort()
  }, [revision])
  function cambiar(campo: keyof typeof datos, valor: string) { setDatos(d => ({ ...d, [campo]: valor })); setDirty(true); setErrores({}); setError(null) }
  async function guardar(e: FormEvent) {
    e.preventDefault(); if (!parametros || !editable || enviando.current || cargando || errorCarga || conflicto) return
    const validacion = validarUmbrales(datos); setErrores(validacion)
    if (Object.keys(validacion).length) { document.getElementById('inv-' + Object.keys(validacion)[0])?.focus(); return }
    enviando.current = true; setGuardando(true); setError(null)
    try { const r = await guardarParametros({ version: parametros.version, alertaDias: Number(datos.alertaDias), preventivoDias: Number(datos.preventivoDias), criticoDias: Number(datos.criticoDias), motivo: datos.motivo.trim() }); setParametros(r); setDatos(d => ({ ...d, motivo: '' })); setDirty(false); onCambiosPendientes(false); setExito(true) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo guardar la configuración.'); setConflicto(e instanceof ErrorApi && e.estadoHttp === 409) }
    finally { setGuardando(false); enviando.current = false }
  }
  const secciones = [{ id: 'alertas-umbrales', titulo: 'Umbrales de alerta', descripcion: 'Días para clasificar el stock próximo a vencer.' }, ...(editable ? [{ id: 'alertas-motivo', titulo: 'Motivo del cambio', descripcion: 'Justificante de la nueva configuración corporativa.' }] : [])]
  return <section aria-labelledby="titulo-alertas"><header className={formulario.encabezadoPagina}><h1 id="titulo-alertas">Configurar alertas de vencimiento</h1><span className={formulario.indicadorFormulario}>{editable ? 'Configuración corporativa' : 'Solo consulta'}</span></header>
    {cargando && <p className={local.estadoCarga} role="status">Cargando configuración…</p>}
    {!cargando && errorCarga && <div className={styles.alertaError} role="alert"><p>{errorCarga}</p><button type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button></div>}
    {!cargando && !errorCarga && parametros && <>
      {!editable && <div className={styles.alertaAdvertencia} role="status"><p>Consulta de parámetros. Su modificación requiere permiso de configuración y acceso corporativo.</p></div>}
      {error && <div className={styles.alertaError} role="alert"><p>{error}</p><button type="button" disabled={guardando} onClick={() => setRevision(r => r + 1)}>Descartar cambios y recargar</button></div>}
      <form onSubmitCapture={validarCantidadesAlEnviar} noValidate onSubmit={e => void guardar(e)} className={formulario.formulario} aria-busy={guardando}>
        <fieldset className={formulario.panelPerfil}><legend>Resumen de configuración</legend><div className={formulario.selectorFoto}><div className={`${formulario.vistaPreviaFoto} ${local.perfilIcono}`}><IconoPosicion /></div><div className={formulario.controlesFoto}><strong>Alertas corporativas</strong><p>El producto se considera vencido desde su fecha de vencimiento, según el día de Guatemala.</p><p>Alerta ≥ preventivo ≥ crítico.</p><p>Versión {parametros.version} · Actualizado: {fechaHora(parametros.actualizadoEn)}</p></div></div>
          <nav className={formulario.navegacionFormulario} aria-label="Secciones de configuración"><p>{editable ? 'Completa la configuración' : 'Consulta los umbrales'}</p>{secciones.map((s, i) => <a key={s.id} href={`#${s.id}`} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}><span>{String(i + 1).padStart(2, '0')}</span><div>{s.titulo}<small>{s.descripcion}</small></div></a>)}</nav>
        </fieldset>
        <fieldset id="alertas-umbrales" disabled={guardando || conflicto || !editable}><legend><span className={formulario.numeroSeccion}>01</span>Umbrales de alerta</legend><p className={formulario.descripcionSeccion}>Valores entre 0 y 36500 días. Se aplican a las consultas de todas las sucursales.</p><div className={formulario.grillaDos}>{(['alertaDias', 'preventivoDias', 'criticoDias'] as const).map(c => <CampoInventario apariencia="empleados" key={c} campo={{ clave: c, etiqueta: c === 'alertaDias' ? 'Alerta (días)' : c === 'preventivoDias' ? 'Preventivo (días)' : 'Crítico (días)', tipo: 'entero', requerido: true }} value={datos[c]} onChange={v => cambiar(c, v)} error={errores[c]} disabled={guardando || conflicto || !editable} />)}</div></fieldset>
        {editable && <fieldset id="alertas-motivo" disabled={guardando || conflicto}><legend><span className={formulario.numeroSeccion}>02</span>Motivo del cambio</legend><p className={formulario.descripcionSeccion}>Documenta por qué se actualizan los umbrales corporativos.</p><CampoInventario apariencia="empleados" campo={{ clave: 'motivo', etiqueta: 'Motivo del cambio', tipo: 'area', requerido: true, maximo: 250 }} value={datos.motivo} onChange={v => cambiar('motivo', v)} error={errores.motivo} disabled={guardando || conflicto} /></fieldset>}
        <div className={formulario.accionesFormulario}><p>{editable ? '* Campos obligatorios' : 'Configuración en modo consulta'}</p><div><button type="button" className={formulario.botonSecundario} disabled={guardando} onClick={() => onNavegar('/inventario/vencimientos')}><IconoAccion nombre="cancelar" className={formulario.iconoBoton} /><span>Volver a vencimientos</span></button>{editable && <button type="submit" className={formulario.botonPrincipal} disabled={guardando || conflicto || !dirty}><IconoAccion nombre="guardar" className={formulario.iconoBoton} /><span>{guardando ? 'Guardando…' : 'Guardar configuración'}</span></button>}</div></div>
      </form>
    </>}
    <ModalEstado abierto={exito} tipo="exito" titulo="Configuración actualizada" mensaje="Los nuevos umbrales se aplican a las consultas de vencimientos." textoAccionPrincipal="Continuar" onCerrar={() => setExito(false)} onAccionPrincipal={() => setExito(false)} />
  </section>
}
