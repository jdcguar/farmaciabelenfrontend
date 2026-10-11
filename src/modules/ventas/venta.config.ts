import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import type { DetalleVenta } from './venta.types'
export const estadosVenta = { BORRADOR:'Borrador',PREPARADA:'Preparada',CONFIRMADA:'Confirmada',CANCELADA:'Cancelada',ANULADA:'Anulada' }
export const estadosFiscal = { PENDIENTE:'Pendiente',SIN_PROVEEDOR:'Proveedor FEL pendiente',PROCESANDO:'En proceso',CERTIFICADO:'Certificado',ERROR:'Revisar resultado',ANULACION_PENDIENTE:'Anulación pendiente',ANULADO:'Anulado' }
export const accionesVenta = {
  preparar:{titulo:'Preparar venta',permiso:'VENTAS.PREPARAR',aviso:'Se actualizarán precios y se reservarán lotes aptos. Comunica el total antes de cobrar.'},
  cancelar:{titulo:'Cancelar venta',permiso:'VENTAS.CANCELAR',aviso:'Se liberarán las reservas y se conservará el historial de la venta.'},
  receta:{titulo:'Registrar receta',permiso:'RECETAS.REGISTRAR',aviso:'Registra solo los datos necesarios del paciente y prescriptor. Esta información será privada.'},
  'validar-receta':{titulo:'Validar receta',permiso:'RECETAS.VALIDAR',aviso:'El responsable técnico registra su decisión y la evidencia de revisión.'},
  fracciones:{titulo:'Validar fraccionamiento',permiso:'DISPENSACION.FRACCIONAR',aviso:'Registra apertura, vigencia de uso y trazabilidad de cada asignación fraccionada.'},
  verificar:{titulo:'Verificar dispensación',permiso:'DISPENSACION.VERIFICAR',aviso:'Coteja presentación, cantidades, lotes, receta y condiciones técnicas antes del cobro.'},
  confirmar:{titulo:'Cobrar venta',permiso:'VENTAS.CONFIRMAR',aviso:'Se confirmarán juntos el cobro en efectivo y la salida por lote. Revisa el total aceptado y el cambio.'},
  entregar:{titulo:'Registrar entrega',permiso:'DISPENSACION.ENTREGAR',aviso:'Confirma la entrega física solo después del cobro y de la verificación técnica.'},
  anular:{titulo:'Anular venta',permiso:'VENTAS.ANULAR',aviso:'Se compensará el cobro en el turno indicado y se retornará el producto a cuarentena. Requiere autorizador independiente.'},
  fiscal:{titulo:'Procesar documento fiscal',permiso:'FISCAL.PROCESAR',aviso:'Sin proveedor FEL se conservará el documento pendiente. Un comprobante interno no sustituye la factura.'},
  comprobante:{titulo:'Descargar comprobante',permiso:'VENTAS.COMPROBANTE',aviso:'Se registrará la impresión del comprobante interno; las reimpresiones se identifican como copia.'},
  adjuntar:{titulo:'Adjuntar evidencia privada',permiso:'RECETAS.ADJUNTAR',aviso:'PDF, PNG o JPEG de hasta 10 MB. Los archivos requieren permiso de consulta de recetas.'},
  conciliar:{titulo:'Conciliar venta manual',permiso:'CONTINGENCIA.CONCILIAR',aviso:'Se incorporará la venta del folio una sola vez, con sus lotes y efectivo. Las diferencias quedan pendientes sin forzar saldos.'},
} as const
export type AccionVenta = keyof typeof accionesVenta
export type RutaVenta = { modo:'listado'|'nuevo'|'detalle'|'editar'|'operacion'|'politica'|'contingencias'|'contingencia'|'autorizar'|'digitalizar'|'cerrar'; id?:string; accion?:AccionVenta }
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function reconocerRutaVenta(ruta:string):RutaVenta|null {
  const [base,p,q,r,extra]=ruta.replace(/^\//,'').split('/');if(base!=='ventas'||extra!==undefined)return null
  if(!p)return{modo:'listado'}
  if(p==='nuevo'&&!q)return{modo:'nuevo'}
  if(p==='politicas'&&!q)return{modo:'politica'}
  if(p==='contingencias'){if(!q)return{modo:'contingencias'};if(q==='nueva'&&!r)return{modo:'autorizar'};if(q==='digitalizar'&&!r)return{modo:'digitalizar'};if(uuid.test(q)&&!r)return{modo:'contingencia',id:q};if(uuid.test(q)&&r==='cerrar')return{modo:'cerrar',id:q};return null}
  if(!uuid.test(p)||r)return null
  if(!q)return{modo:'detalle',id:p};if(q==='editar')return{modo:'editar',id:p}
  return Object.hasOwn(accionesVenta,q)?{modo:'operacion',id:p,accion:q as AccionVenta}:null
}
export function puedeRutaVenta(r:RutaVenta,ps:readonly string[]) {
  const tiene=(p:string)=>ps.includes('VENTAS.'+p),ver=tiene('VENTAS.VER')
  if(r.modo==='politica')return tiene('POLITICAS.VER')
  if(['contingencias','contingencia'].includes(r.modo))return tiene('CONTINGENCIA.VER')
  if(r.modo==='autorizar')return tiene('CONTINGENCIA.AUTORIZAR')
  if(r.modo==='digitalizar')return tiene('CONTINGENCIA.DIGITALIZAR')&&tiene('CONTINGENCIA.VER')&&ver
  if(r.modo==='cerrar')return tiene('CONTINGENCIA.VER')&&tiene('CONTINGENCIA.CONCILIAR')
  if(r.modo==='nuevo')return tiene('VENTAS.CREAR')&&ver
  if(r.modo==='editar')return ver&&tiene('VENTAS.EDITAR')
  if(r.modo==='operacion'&&r.accion){return ver&&tiene(accionesVenta[r.accion].permiso)&&(!['confirmar','conciliar'].includes(r.accion)||ps.includes('CAJA.MOVIMIENTOS.COBRAR'))&&(r.accion!=='anular'||ps.includes('CAJA.MOVIMIENTOS.ANULAR_VENTA'))}
  return ver
}
export function puedeAccionVenta(accion:AccionVenta,e:DetalleVenta,s:SesionUsuario,ahora=Date.now()) {
  if(!puedeRutaVenta({modo:'operacion',id:e.id,accion},s.permisos)||(!s.permisos.includes('VENTAS.ACCESO.CORPORATIVO')&&e.sucursalId!==s.sucursal.id))return false
  const previa=['BORRADOR','PREPARADA'].includes(e.estado),vigente=!!e.expiraEn&&Date.parse(e.expiraEn)>ahora
  switch(accion){
    case'preparar':case'cancelar':return previa&&!e.contingenciaId
    case'receta':case'adjuntar':return previa&&!e.contingenciaId
    case'validar-receta':return previa&&e.recetas.some(r=>r.estado==='PENDIENTE')
    case'fracciones':return e.estado==='PREPARADA'&&vigente&&e.lineas.some(l=>l.fraccionada)
    case'verificar':return e.estado==='PREPARADA'&&vigente&&e.dispensacionEstado!=='VERIFICADA'
    case'confirmar':return !!e.creadoPorId&&e.creadoPorId!==s.usuarioId&&e.estado==='PREPARADA'&&vigente&&e.dispensacionEstado==='VERIFICADA'&&!e.contingenciaId
    case'entregar':return e.estado==='CONFIRMADA'&&e.dispensacionEstado==='VERIFICADA'
    case'anular':return e.estado==='CONFIRMADA'&&e.dispensacionEstado!=='ENTREGADA'&&!!e.confirmadoPorId&&e.confirmadoPorId!==s.usuarioId&&!e.fiscales.some(f=>f.estado==='PROCESANDO'||f.tipo==='EMISION'&&f.estado==='ERROR')
    case'fiscal':case'comprobante':return ['CONFIRMADA','ANULADA'].includes(e.estado)
    case'conciliar':return e.estado==='BORRADOR'&&!!e.contingenciaId&&!!e.creadoPorId&&e.creadoPorId!==s.usuarioId
  }
}
export const tituloRutaVenta=(r:RutaVenta)=>r.accion?accionesVenta[r.accion].titulo:({listado:'Ventas y dispensación',nuevo:'Nueva venta',detalle:'Detalle de venta',editar:'Editar borrador',politica:'Políticas de ventas',contingencias:'Contingencias manuales',contingencia:'Detalle de contingencia',autorizar:'Autorizar contingencia',digitalizar:'Digitalizar folio de venta',cerrar:'Cerrar contingencia'} as const)[r.modo as Exclude<RutaVenta['modo'],'operacion'>]??'Ventas'
