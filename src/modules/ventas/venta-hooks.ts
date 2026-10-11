import { useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../shared/api/cliente-api'
import { claveVenta } from './venta-reglas'
import { enfocarErrorCaja } from '../caja/caja-foco'
import type { ErroresVenta } from './venta.types'
export { useCargaCaja as useCargaVenta } from '../caja/caja-hooks'
export function useEnvioVenta(onCambiosPendientes:(v:boolean)=>void,sucio:boolean){
  const[errores,setErrores]=useState<ErroresVenta>({}),[error,setError]=useState<unknown>(null),[guardando,setGuardando]=useState(false),[conflicto,setConflicto]=useState(false),[completado,setCompletado]=useState(false)
  const formulario=useRef<HTMLFormElement>(null),enviando=useRef(false),clave=useRef<{contenido:string;clave:string}|null>(null)
  useEffect(()=>{onCambiosPendientes((sucio||guardando)&&!completado);return()=>onCambiosPendientes(false)},[onCambiosPendientes,sucio,guardando,completado])
  async function ejecutar<T>(fallos:ErroresVenta,datos:unknown,guardar:(clave:string)=>Promise<T>,exito:(r:T)=>void){if(enviando.current||conflicto||completado)return;setErrores(fallos);setError(null);if(Object.keys(fallos).length){setError('Revisa los campos señalados.');enfocarErrorCaja(formulario.current);return}clave.current=claveVenta(clave.current,datos);enviando.current=true;setGuardando(true);try{const r=await guardar(clave.current.clave);setCompletado(true);onCambiosPendientes(false);exito(r)}catch(e){setError(e);if(e instanceof ErrorApi){setErrores(Object.fromEntries(e.detalles.map(d=>[d.campo.replace(/^configuracion\./,''),d.mensaje])));if(['VENTA_MODIFICADA','VENTA_IDEMPOTENCIA_INCOMPATIBLE','VENTA_PRECIO_O_CONDICION_CAMBIO','VENTA_TOTAL_NO_ACEPTADO','VENTA_RESERVA_NO_VIGENTE','VENTA_RESERVA_EXPIRADA','VENTA_LOTE_NO_APTO'].includes(e.codigo))setConflicto(true);enfocarErrorCaja(formulario.current)}}finally{enviando.current=false;setGuardando(false)}}
  return{errores,error,guardando,conflicto,completado,formulario,ejecutar,limpiar:()=>{setError(null);setErrores({})}}
}
