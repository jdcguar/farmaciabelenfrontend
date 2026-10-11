import { useCallback, useEffect, useRef, useState } from 'react'
import type { SesionUsuario } from '../../autenticacion/autenticacion.types'
import { SelectorReferencia, ReferenciasCatalogo } from '../../catalogos-farmacia/components/referencia-catalogo'
import { NombreUsuarioCaja, SelectorCaja } from './caja-selector'
import { TablaDatos, PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { HerramientasListado } from '../../../shared/components/gestion-modulo/herramientas-listado'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { listarCobrosVenta } from '../../ventas/venta-api'
import { useCargaVenta } from '../../ventas/venta-hooks'
import { dineroVenta, esUuidVenta, fechaHoraVenta, fechaRealVenta } from '../../ventas/venta-reglas'
import type { ConsultaCobroVenta, Venta, VentaCobro } from '../../ventas/venta.types'
import { CargaVenta, CampoVenta, ErrorVenta, EstadoVenta } from '../../ventas/components/venta-comun'
import { VentaOperacionView } from '../../ventas/components/venta-operacion-view'
import { VentaDetalleView } from '../../ventas/components/venta-detalle-view'
import type { RutaCobroVentas } from '../cobro-ventas.config'
import { rutaCobroVentas, estadoPreparacionCobro } from '../cobro-ventas.config'
import gestion from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import styles from '../../ventas/venta.module.css'

type Props = { ruta: RutaCobroVentas; sesion: SesionUsuario; onNavegar: (r: string) => void; onCambiosPendientes: (v: boolean) => void }
const estados = [{valor:'PENDIENTES',etiqueta:'Pendientes'}, {valor:'COBRADAS',etiqueta:'Cobradas'}, {valor:'CANCELADAS',etiqueta:'Canceladas'}, {valor:'ANULADAS',etiqueta:'Anuladas'}]
export function CobroVentasView(props: Props) {
  return <ReferenciasCatalogo sesion={props.sesion} onNavegar={props.onNavegar}><div className={styles.modulo}>{props.ruta.id && props.ruta.detalle
    ? <VentaDetalleView id={props.ruta.id} sesion={props.sesion} onNavegar={props.onNavegar} rutaVolver={rutaCobroVentas} rutaOperacion={a => ['confirmar', 'fiscal', 'comprobante'].includes(a) ? `${rutaCobroVentas}/${props.ruta.id}/${a === 'confirmar' ? 'cobrar' : a}` : `/ventas/${props.ruta.id}/${a}`} />
    : props.ruta.id ? <VentaOperacionView id={props.ruta.id} accion={props.ruta.accion ?? 'confirmar'} rutaVolver={rutaCobroVentas} sesion={props.sesion} onNavegar={props.onNavegar} onCambiosPendientes={props.onCambiosPendientes}/>
    : <BandejaCobros sesion={props.sesion} onNavegar={props.onNavegar}/>}</div></ReferenciasCatalogo>
}
function BandejaCobros({sesion,onNavegar}: Pick<Props,'sesion'|'onNavegar'>) {
  const [criterios,setCriterios] = useState<ConsultaCobroVenta>({sucursalId:sesion.sucursal.id,estado:'PENDIENTES'})
  const [pagina,setPagina]=useState(1), [tamanoPagina,setTamanoPagina]=useState(50), [busqueda,setBusqueda]=useState(''), [reloj,setReloj]=useState(Date.now)
  const clave=JSON.stringify({...criterios,pagina,tamanoPagina})
  const cargar=useCallback((signal: AbortSignal)=>listarCobrosVenta(JSON.parse(clave) as ConsultaCobroVenta,signal).then(r=>{if(!signal.aborted)setPagina(p=>Math.min(p,Math.max(1,r.totalPaginas)));return r}),[clave])
  const carga=useCargaVenta(clave,cargar), r=carga.documento
  const recargar=carga.recargar, actualizarRef=useRef(recargar)
  useEffect(()=>{actualizarRef.current=recargar},[recargar])
  useEffect(()=>{const t=window.setTimeout(()=>{setCriterios(c=>({...c,busqueda:busqueda.trim()||undefined}));setPagina(1)},350);return()=>window.clearTimeout(t)},[busqueda])
  useEffect(()=>{const t=window.setInterval(()=>setReloj(Date.now()),1000);return()=>window.clearInterval(t)},[])
  // Actualizar al volver a la pestaña mantiene visible el trabajo de otros vendedores.
  useEffect(()=>{const actualizar=()=>actualizarRef.current();window.addEventListener('focus',actualizar);const t=window.setInterval(actualizar,30000);return()=>{window.removeEventListener('focus',actualizar);window.clearInterval(t)}},[])
  const limpiar=()=>{setCriterios({sucursalId:sesion.sucursal.id,estado:'PENDIENTES'});setBusqueda('');setPagina(1)}
  const ver=(e:Venta)=>onNavegar(`${rutaCobroVentas}/${e.id}`)
  function impedimento(e:Venta) {
    const estado=estadoPreparacionCobro(e,reloj)
    if(estado!=='Lista para cobrar')return estado
    if(!e.creadoPorId||e.creadoPorId===sesion.usuarioId)return 'Debe cobrar otra persona'
    if(!sesion.permisos.includes('VENTAS.VENTAS.CONFIRMAR'))return 'Sin permiso de cobro de ventas'
    if(r?.estadoTurno!=='ABIERTO')return 'Requiere tu turno abierto'
    return ''
  }
  const columnas: ColumnaTabla<VentaCobro>[] = [
    {id:'numero',titulo:'Venta',obtenerValor:e=>e.numero,celda:e=><button type="button" className={styles.enlace} onClick={()=>ver(e)}>{e.numero}</button>},
    {id:'fecha',titulo:'Registrada',obtenerValor:e=>e.creadoEn,celda:e=>fechaHoraVenta(e.creadoEn)},
    {id:'cliente',titulo:'Cliente',obtenerValor:e=>e.clienteNombre??'',celda:e=><span>{e.clienteNombre||'Cliente sin nombre registrado'}</span>},
    {id:'vendedor',titulo:'Vendedor',obtenerValor:e=>e.creadoPorId??'',celda:e=>e.creadoPorId?<NombreUsuarioCaja id={e.creadoPorId} sesion={sesion}/>:<span>Sin responsable registrado</span>},
    {id:'total',titulo:'Total GTQ',obtenerValor:e=>e.total,celda:e=><span className={styles.dinero}>{dineroVenta(e.total)}</span>},
    {id:'estado',titulo:'Estado',obtenerValor:e=>e.estado,celda:e=><><EstadoVenta estado={e.estado}/><small className={styles.contextoListado}>{estadoPreparacionCobro(e,reloj)}</small></>},
    {id:'acciones',titulo:'Acciones',obtenerValor:e=>e.id,celda:e=><div className={styles.contenido}><div className={styles.accionesCobro}><div className={gestion.accionesFila}><button type="button" aria-label={`Ver ${e.numero}`} onClick={()=>ver(e)}><IconoAccion nombre="ver"/></button></div>{!impedimento(e)&&<button type="button" className={form.botonPrincipal} onClick={()=>onNavegar(`${rutaCobroVentas}/${e.id}/cobrar`)}>Cobrar</button>}</div>{['BORRADOR','PREPARADA'].includes(e.estado)&&impedimento(e)&&<small>{impedimento(e)}</small>}</div>},
  ]
  return <section className={gestion.pagina}>
    <header className={gestion.cabeceraPagina}><div className={gestion.filaCabecera}><h1>Cobro Ventas</h1></div><p>Cobra las ventas preparadas por los vendedores de la sucursal. El cobro y la salida de inventario se confirman juntos.</p></header>
    <div className={styles.resumen}>{sesion.permisos.includes('VENTAS.ACCESO.CORPORATIVO')?<div className={styles.selectorListado}><CampoVenta nombre="cobros-sucursal" etiqueta="Sucursal"><SelectorReferencia id="cobros-sucursal" referencia="sucursales" value={criterios.sucursalId??sesion.sucursal.id} requerido onChange={v=>{setCriterios(c=>({...c,sucursalId:v||sesion.sucursal.id}));setPagina(1)}}/></CampoVenta></div>:<p>Sucursal: <strong>{sesion.sucursal.nombre}</strong></p>}
    <p role="status">{carga.cargando?'Consultando tu turno…':carga.error?'No se pudo consultar el turno.':r?.estadoTurno==='ABIERTO'?'Tu turno está abierto. Se asignará automáticamente al cobrar.':r?.estadoTurno==='AMBIGUO'?'Hay más de un turno abierto a tu nombre en esta sucursal. Regulariza los turnos para cobrar.':'No tienes un turno abierto en esta sucursal. Abre tu turno para cobrar.'}</p></div>
    <HerramientasListado filtros={criterios.estado==='TODOS'?[]:[{id:'estado',value:[criterios.estado??'PENDIENTES']}]} opcionesEstado={estados} onFiltrosChange={f=>{const v=f.find(x=>x.id==='estado')?.value;setCriterios(c=>({...c,estado:Array.isArray(v)&&v.length?String(v[0]):'TODOS'}));setPagina(1)}} total={!carga.cargando&&!carga.error?r?.total:undefined} unidadSingular="venta" unidadPlural="ventas" disposicion="estados-con-filtros" accionesEstado={<FiltrosCobros criterios={criterios} sesion={sesion} onAplicar={d=>{setCriterios(c=>({...c,clienteId:d.clienteId,vendedorId:d.vendedorId,desde:d.desde,hasta:d.hasta}));setPagina(1)}}/>} filtrosAdicionales={<form role="search" className={gestion.busquedaGeneral} onSubmit={e=>{e.preventDefault();setCriterios(c=>({...c,busqueda:busqueda.trim()||undefined}));setPagina(1)}}><div className={gestion.controlBusquedaGeneral}><IconoAccion nombre="buscar" className={gestion.iconoBusquedaGeneral}/><input type="search" aria-label="Buscar por número de venta" placeholder="Buscar por número de venta" maxLength={100} value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>{busqueda&&<button type="button" aria-label="Limpiar búsqueda" onClick={()=>setBusqueda('')}>×</button>}</div></form>}/>
    <div className={gestion.panelTabla} aria-busy={carga.cargando}><div className={gestion.resumenTabla}><div><strong>Ventas para caja</strong><small>El vendedor y el cajero deben ser personas distintas.</small></div><div className={gestion.accionesResumen}><button type="button" onClick={limpiar}>Restablecer pendientes</button><button type="button" disabled={carga.cargando} onClick={carga.recargar}>Actualizar</button></div></div><CargaVenta cargando={carga.cargando} error={carga.error} onReintentar={carga.recargar}/>{r&&!carga.error&&<>{r.items.length?<TablaDatos apariencia="tarjetas" descripcion="Cobro de ventas" columnas={columnas} datos={r.items} obtenerIdFila={e=>e.id} filtros={[]} ordenamiento={[]} onFiltrosChange={()=>{}} onOrdenamientoChange={()=>{}}/>:<div className={gestion.estadoVacio}><h2>Sin ventas {criterios.estado==='PENDIENTES'?'pendientes':'para estos filtros'}</h2><p>Las ventas aparecerán aquí cuando los vendedores las registren.</p></div>}<PaginacionTabla apariencia="tarjetas" pagina={pagina} tamanoPagina={tamanoPagina} total={r.total} totalPaginas={r.totalPaginas} unidadSingular="venta" unidadPlural="ventas" onPaginaChange={setPagina} onTamanoPaginaChange={v=>{setTamanoPagina(v);setPagina(1)}}/></>}</div>
  </section>
}
function FiltrosCobros({criterios,sesion,onAplicar}:{criterios:ConsultaCobroVenta;sesion:SesionUsuario;onAplicar:(c:ConsultaCobroVenta)=>void}) {
  const [abierto,setAbierto]=useState(false),[datos,setDatos]=useState<ConsultaCobroVenta>({}),[error,setError]=useState('')
  const aplicar=()=>{if(['clienteId','vendedorId'].some(k=>{const v=datos[k as 'clienteId'|'vendedorId'];return v&&!esUuidVenta(v)})||[datos.desde,datos.hasta].some(v=>v&&!fechaRealVenta(v))||datos.desde&&datos.hasta&&datos.desde>datos.hasta){setError('Revisa los filtros y el rango de fechas.');return}onAplicar(datos);setAbierto(false)}
  return <><button type="button" className={form.botonSecundario} onClick={()=>{setDatos(criterios);setError('');setAbierto(true)}}>Filtros avanzados</button><ModalEstado abierto={abierto} apariencia="formulario" tipo="informacion" titulo="Filtrar cobros de ventas" mensaje={<div className={styles.contenido}><ErrorVenta error={error}/><div className={form.grillaDos}><CampoVenta nombre="cobros-cliente" etiqueta="Cliente" requerido={false}><SelectorReferencia id="cobros-cliente" referencia="clientes" value={datos.clienteId??''} onChange={v=>setDatos(d=>({...d,clienteId:v||undefined}))}/></CampoVenta><CampoVenta nombre="cobros-vendedor" etiqueta="Vendedor" requerido={false}><SelectorCaja nombre="cobros-vendedor" recurso="usuarios" sesion={sesion} value={datos.vendedorId??''} requerido={false} onChange={v=>setDatos(d=>({...d,vendedorId:v||undefined}))}/></CampoVenta>{(['desde','hasta'] as const).map(k=><CampoVenta key={k} nombre={`cobros-${k}`} etiqueta={k==='desde'?'Registrada desde':'Registrada hasta'} requerido={false} tipo="date" value={datos[k]??''} onChange={v=>setDatos(d=>({...d,[k]:v||undefined}))}/>)}</div></div>} textoAccionPrincipal="Aplicar filtros" onAccionPrincipal={aplicar} textoAccionSecundaria="Limpiar" onAccionSecundaria={()=>{onAplicar({});setAbierto(false)}} onCerrar={()=>setAbierto(false)}/></>
}

