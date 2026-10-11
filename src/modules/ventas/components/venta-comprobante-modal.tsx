import { useEffect, useRef, useState } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { guardarArchivoApi, type ArchivoApi } from '../../../shared/api/descargar-archivo-api'
import { generarComprobanteVenta, vistaPreviaComprobanteVenta } from '../venta-api'
import type { DetalleVenta } from '../venta.types'
import { VentaComprobanteResumen } from './venta-comprobante-resumen'
import styles from '../venta.module.css'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'

type Documento = ArchivoApi & { url: string; definitivo: boolean }
export function VentaComprobanteModal({id,version,venta,sucursal,autorizado,onCerrar}:{id:string;version:number;venta:DetalleVenta;sucursal?:string;autorizado:boolean;onCerrar:()=>void}) {
  const [documento,setDocumento]=useState<Documento|null>(null),[error,setError]=useState(''),[finalizada,setFinalizada]=useState(''),[generando,setGenerando]=useState(false),[revision,setRevision]=useState(0)
  const claveSolicitud=`${id}:${autorizado}:${revision}`,cargando=autorizado&&finalizada!==claveSolicitud,mensajeError=autorizado?error:'Se requiere permiso de consulta y generación de comprobantes de Ventas.'
  const iframe=useRef<HTMLIFrameElement>(null),urls=useRef<string[]>([]),archivo=useRef<Documento|null>(null),ocupado=useRef(false),vigente=useRef(true),imprimirPendiente=useRef(false),pdfListo=useRef(false),clave=useRef<string|null>(null)
  useEffect(()=>{vigente.current=true;return()=>{vigente.current=false;urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[]}},[])
  useEffect(()=>{
    const c=new AbortController()
    if(!autorizado)return()=>c.abort()
    void vistaPreviaComprobanteVenta(id,c.signal).then(a=>{if(c.signal.aborted)return;const url=URL.createObjectURL(a.contenido);urls.current.push(url);const d={...a,url,definitivo:false};archivo.current=d;pdfListo.current=false;setDocumento(d)}).catch((e:unknown)=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'No fue posible cargar el comprobante.')}).finally(()=>{if(!c.signal.aborted)setFinalizada(claveSolicitud)})
    return()=>c.abort()
  },[id,autorizado,claveSolicitud])
  async function ejecutar(imprimir:boolean){
    if(ocupado.current||!autorizado||cargando)return
    ocupado.current=true;setGenerando(true);setError('')
    try{
      let d=archivo.current
      if(!d?.definitivo){
        clave.current??=crypto.randomUUID()
        const a=await generarComprobanteVenta(id,{claveIdempotencia:clave.current,version,motivo:'Generar comprobante de venta',evidencia:'Solicitud de comprobante desde Cobro Ventas'})
        if(!vigente.current)return
        const url=URL.createObjectURL(a.contenido);urls.current.push(url);d={...a,url,definitivo:true};archivo.current=d
        imprimirPendiente.current=imprimir;pdfListo.current=false;setDocumento(d)
      }else if(imprimir){if(pdfListo.current)imprimirDocumento();else imprimirPendiente.current=true}
      if(!imprimir)guardarArchivoApi(d)
    }catch(e:unknown){if(vigente.current)setError(e instanceof Error?e.message:'No fue posible generar el comprobante.')}
    finally{ocupado.current=false;if(vigente.current)setGenerando(false)}
  }
  function imprimirDocumento(){
    imprimirPendiente.current=false
    try{const ventana=iframe.current?.contentWindow;if(!ventana)throw new Error('El documento aún está cargando.');ventana.focus();ventana.print()}
    catch{setError('El navegador no permitió imprimir aquí. Abre el PDF y utiliza su opción de impresión.')}
  }
  return <ModalEstado abierto apariencia="formulario" tipo="informacion" titulo="Comprobante de venta" focoInicial="contenido" cargando={generando} mensaje={<div className={styles.contenido}>
    <p>Comprobante interno de la venta. Puedes generar el PDF o enviarlo a impresión.</p>
    {cargando&&<p role="status">Cargando comprobante…</p>}
    {mensajeError&&<div role="alert"><p>{mensajeError}</p>{!documento&&autorizado&&<button type="button" onClick={()=>{setError('');setRevision(r=>r+1)}}>Reintentar</button>}</div>}
    {documento&&autorizado&&<><VentaComprobanteResumen venta={venta} sucursal={sucursal}/><iframe key={documento.url} ref={iframe} className={styles.comprobantePdf} title="PDF del comprobante para impresión" aria-hidden="true" tabIndex={-1} src={documento.url} onLoad={()=>{pdfListo.current=true;if(imprimirPendiente.current)imprimirDocumento()}}/><a className={`${form.botonSecundario} ${styles.abrirComprobante}`} href={documento.url} target="_blank" rel="noopener noreferrer">Abrir PDF en otra pestaña</a></>}
    <div className={styles.accionesComprobante}><button type="button" className={form.botonPrincipal} disabled={!documento||cargando||generando||!autorizado} onClick={()=>void ejecutar(false)}>{generando?'Generando…':'Generar'}</button><button type="button" className={form.botonSecundario} disabled={!documento||cargando||generando||!autorizado} onClick={()=>void ejecutar(true)}>Imprimir</button></div>
  </div>} textoAccionPrincipal="Volver a Cobro Ventas" onAccionPrincipal={onCerrar} onCerrar={onCerrar}/>
}
