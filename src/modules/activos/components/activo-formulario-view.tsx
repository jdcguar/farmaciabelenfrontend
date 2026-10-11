import { formulario } from '../activo-estilos'
import { useCallback, useState } from 'react'
import { guardarActivo, guardarTipo, obtenerActivo } from '../activo-api'
import { permisoActivo, rutaActivo, type RutaActivo } from '../activo.config'
import { erroresApi, useCambiosActivo, useConsultaActivo } from '../activo-hooks'
import { validarCampos } from '../activo-reglas'
import type { Activo, CamposActivo, CamposTipo, ContextoActivo, TipoActivo } from '../activo.types'
import { CargaActivo, CampoActivo, CampoCondicion, ExitoActivo, FormularioActivo, SeccionActivo } from './activo-comun'
import { SelectorActivo } from './activo-selector'
export function ActivoFormularioView({ ruta, sesion, onNavegar, onCambiosPendientes }: ContextoActivo & { ruta: RutaActivo }) {
  const esTipo = ruta.recurso === 'tipos'
  const [revision, setRevision] = useState(0)
  const [datos, setDatos] = useState<CamposActivo>({ sucursalId: '', tipoId: '', condicion: '', marca: '', modelo: '', numeroSerie: '', descripcion: '' }), [tipo, setTipo] = useState<CamposTipo>({ prefijo: '', nombre: '', descripcion: '' })
  const [inicial, setInicial] = useState(() => JSON.stringify(esTipo ? tipo : datos)), [errores, setErrores] = useState<Record<string, string>>({}), [error, setError] = useState<unknown>(), [guardando, setGuardando] = useState(false), [guardado, setGuardado] = useState<Activo | TipoActivo>()
  const cargar = useCallback(async (s: AbortSignal) => { if (!ruta.id) return null; const r = await obtenerActivo(esTipo ? 'tipos' : 'activos', ruta.id, s); if (s.aborted) return r; if ('prefijo' in r) { const d = { prefijo: r.prefijo, nombre: r.nombre, descripcion: r.descripcion ?? '' }; setTipo(d); setInicial(JSON.stringify(d)) } else { const d = { sucursalId: r.sucursalId, tipoId: r.tipoId, condicion: r.condicion, marca: r.marca, modelo: r.modelo, numeroSerie: r.numeroSerie ?? '', descripcion: r.descripcion }; setDatos(d); setInicial(JSON.stringify(d)) } setError(undefined); setErrores({}); return r }, [esTipo, ruta.id])
  const consulta = useConsultaActivo(`${ruta.id ?? 'nuevo'}:${revision}`, cargar)
  const registro = consulta.dato
  const actuales = esTipo ? tipo : datos
  useCambiosActivo(JSON.stringify(actuales) !== inicial && !guardado, onCambiosPendientes)
  const cambiar = <K extends keyof CamposActivo>(campo: K, valor: CamposActivo[K]) => { setDatos(d => ({ ...d, [campo]: valor })); setErrores({}) }
  const cambiarTipo = (campo: keyof CamposTipo, valor: string) => { setTipo(d => ({ ...d, [campo]: valor })); setErrores({}) }
  const volver = () => onNavegar(sesion.permisos.includes(permisoActivo(ruta.recurso)) ? rutaActivo(ruta.recurso, ruta.id) : '/')
  const bloqueado = Boolean(registro && ('situacion' in registro ? ['ASIGNADO', 'BAJA'].includes(registro.situacion) : !registro.activo))
  const guardar = async () => {
    const fallos = validarCampos(actuales); setErrores(fallos)
    if (Object.keys(fallos).length) { document.getElementById(Object.keys(fallos)[0]!)?.focus(); return }
    setGuardando(true); setError(undefined)
    try { const r = esTipo ? await guardarTipo(tipo, registro as TipoActivo | undefined) : await guardarActivo(datos, registro as Activo | undefined); onCambiosPendientes(false); setGuardado(r) } catch (e) { setError(e); setErrores(erroresApi(e)) } finally { setGuardando(false) }
  }
  if (consulta.cargando || consulta.error) return <CargaActivo {...consulta} onReintentar={() => setRevision(v => v + 1)} />
  return <><FormularioActivo titulo={`${ruta.id ? 'Editar' : 'Crear'} ${esTipo ? 'tipo de activo' : 'activo'}`} identidad={registro ? 'codigo' in registro ? registro.codigo : registro.nombre : undefined} resumen={<><p>{esTipo ? 'El prefijo genera los nuevos códigos. Los códigos ya emitidos se conservan.' : 'Registro administrativo de un activo fijo. Su sucursal queda vinculada permanentemente al crearlo.'}</p>{bloqueado && <p>Este registro no permite edición en su estado actual.</p>}</>} secciones={esTipo ? [{ id: 'identidad', titulo: 'Identificación' }] : [{ id: 'identidad', titulo: 'Sucursal y tipo' }, { id: 'caracteristicas', titulo: 'Características' }]} guardando={guardando} deshabilitado={bloqueado || Boolean(guardado)} error={error} errores={errores} onSubmit={() => void guardar()} onRecargar={ruta.id ? () => setRevision(v => v + 1) : undefined} onCancelar={volver}>
    {esTipo ? <SeccionActivo id="identidad" titulo="Identificación del tipo" numero={1}><div className={formulario.grillaDos}><CampoActivo id="prefijo" etiqueta="Código o prefijo" valor={tipo.prefijo} requerido maximo={20} error={errores.prefijo} onChange={v => cambiarTipo('prefijo', v)} /><CampoActivo id="nombre" etiqueta="Nombre" valor={tipo.nombre} requerido error={errores.nombre} onChange={v => cambiarTipo('nombre', v)} /><CampoActivo id="descripcion" etiqueta="Descripción" valor={tipo.descripcion} multilinea maximo={1000} error={errores.descripcion} onChange={v => cambiarTipo('descripcion', v)} /></div></SeccionActivo> : <>
      <SeccionActivo id="identidad" titulo="Sucursal y tipo de activo" numero={1}><div className={formulario.grillaDos}>{ruta.id && registro && 'sucursal' in registro ? <div className={formulario.campo}><label htmlFor="sucursalId">Sucursal</label><input id="sucursalId" value={registro.sucursal.nombre} readOnly /><small className={formulario.ayudaCampo}>La sucursal se conserva desde el registro inicial.</small></div> : <SelectorActivo recurso="sucursales" id="sucursalId" etiqueta="Sucursal" valor={datos.sucursalId} requerido error={errores.sucursalId} onChange={v => cambiar('sucursalId', v)} />}<SelectorActivo recurso="tipos" id="tipoId" etiqueta="Tipo de activo" valor={datos.tipoId} requerido error={errores.tipoId} seleccionado={registro && 'tipo' in registro ? registro.tipo : undefined} onChange={v => cambiar('tipoId', v)} /></div></SeccionActivo>
      <SeccionActivo id="caracteristicas" titulo="Características físicas" numero={2}><div className={formulario.grillaDos}><CampoCondicion id="condicion" valor={datos.condicion} error={errores.condicion} onChange={v => cambiar('condicion', v)} /><CampoActivo id="marca" etiqueta="Marca" valor={datos.marca} requerido error={errores.marca} onChange={v => cambiar('marca', v)} /><CampoActivo id="modelo" etiqueta="Modelo" valor={datos.modelo} requerido error={errores.modelo} onChange={v => cambiar('modelo', v)} /><CampoActivo id="numeroSerie" etiqueta="Número de serie" valor={datos.numeroSerie} error={errores.numeroSerie} onChange={v => cambiar('numeroSerie', v)} /><CampoActivo id="descripcion" etiqueta="Descripción" valor={datos.descripcion} requerido multilinea maximo={1000} error={errores.descripcion} onChange={v => cambiar('descripcion', v)} /></div></SeccionActivo></>}
  </FormularioActivo><ExitoActivo abierto={Boolean(guardado)} mensaje="El registro se guardó correctamente." onContinuar={() => onNavegar(sesion.permisos.includes(permisoActivo(ruta.recurso)) ? rutaActivo(ruta.recurso, guardado?.id) : '/')} /></>
}
