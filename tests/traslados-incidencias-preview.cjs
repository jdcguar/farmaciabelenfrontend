// Incidencias y documentos relacionados de revisión. Memoria únicamente, sin Oracle.
const {randomUUID}=require('node:crypto')
module.exports=({documentos,documento,despachos,nuevo,tocar,sesion,schemas,reglas,id,ahora,fallo,llamadas})=>{
  const actores=new Map(),t=documentos.get(id(300)),cantidad=m=>`${m/1000000n}.${String(m%1000000n).padStart(6,'0')}`
  for(const i of t.incidencias){Object.assign(i,{trasladoId:t.id,asignacionId:null,version:1,resueltaPorId:null});actores.set(i.id,id(8))}
  for(const [n,tipo,asignacionId,cantidadBase] of [[700,'FALTANTE',id(304),'1.000000'],[710,'LOTE',id(305),'1.000000'],[720,'CONSERVACION',null,'0.000000']]){
    t.incidencias.push({id:id(n),trasladoId:t.id,asignacionId,version:1,tipo,estado:'ABIERTA',cantidadBase,descripcion:'Diferencia observada documentada para revisión simulada.',evidencia:'Acta original simulada QA.',resolucion:null,motivoResolucion:null,resueltaEn:null,resueltaPorId:null,trasladoRelacionadoId:null});actores.set(id(n),id(8))
  }
  const relacionado=documento(800,'CERRADO'),guia=nuevo(relacionado,id(802),'RECIBIDO',['3.000000']);guia.despachadoEn=ahora;guia.despachadoPorId=id(8);guia.asignaciones.forEach(a=>{a.recibidaBase=a.cantidadBase;a.pendienteBase='0.000000'});tocar(relacionado,'cerrar');relacionado.estado='CERRADO';relacionado.cerradoEn=ahora
  return async(req,p,q,json)=>{
    const registro=p.match(/^\/api\/traslados\/([^/]+)\/incidencias$/),resolucion=p.match(/^\/api\/traslados\/incidencias\/([^/]+)\/resolver$/)
    if(!registro&&!resolucion)return false
    const traslado=registro?documentos.get(registro[1]):[...documentos.values()].find(t=>t.incidencias.some(i=>i.id===resolucion[1]))
    if(!traslado)fallo('NO_ENCONTRADO','Incidencia o traslado no encontrado.',404)
    if(req.method==='GET')return json(traslado.incidencias)||true
    const partes=[];for await(const c of req)partes.push(c);const body=JSON.parse(Buffer.concat(partes).toString());llamadas.push({metodo:req.method,ruta:req.url,cuerpo:body})
    if(registro){
      const e=schemas.incidenciaSchema.parse(body);if(e.version!==traslado.version)fallo('TRASLADO_MODIFICADO','Otro usuario modificó el traslado; actualiza.')
      const asignacion=[...despachos.values()].filter(d=>d.trasladoId===traslado.id).flatMap(d=>d.asignaciones).find(a=>a.id===e.asignacionId)
      if(e.tipo==='FALTANTE'&&(!asignacion||reglas.micro(e.cantidadBase)<=0n||reglas.micro(e.cantidadBase)>reglas.micro(asignacion.pendienteBase)))fallo('DATOS_INVALIDOS','El faltante debe seguir pendiente en tránsito.',400)
      const incidencia={...e,id:randomUUID(),trasladoId:traslado.id,version:1,estado:'ABIERTA',resolucion:null,motivoResolucion:null,resueltaEn:null,resueltaPorId:null,trasladoRelacionadoId:null};actores.set(incidencia.id,sesion.usuarioId);traslado.incidencias.push(incidencia);tocar(traslado,'incidencia');return json(traslado,201)||true
    }
    const e=schemas.resolverSchema.parse(body),incidencia=traslado.incidencias.find(i=>i.id===resolucion[1]);if(e.version!==incidencia.version)fallo('TRASLADO_MODIFICADO','Otro usuario modificó la incidencia; actualiza.');if(incidencia.estado!=='ABIERTA')fallo('TRASLADO_ESTADO_INVALIDO','La incidencia ya se resolvió.')
    if(actores.get(incidencia.id)===sesion.usuarioId&&!e.controlCompensatorio)fallo('TRASLADO_CONTROL_REQUERIDO','Registraste esta incidencia; documenta el control compensatorio.')
    const asignacion=[...despachos.values()].filter(d=>d.trasladoId===traslado.id).flatMap(d=>d.asignaciones).find(a=>a.id===incidencia.asignacionId)
    if(e.resolucion==='FALTANTE_JUSTIFICADO'){
      if(!sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO'))fallo('NO_AUTORIZADO','Se requiere alcance corporativo.',403)
      if(incidencia.tipo!=='FALTANTE'||!asignacion||reglas.micro(incidencia.cantidadBase)>reglas.micro(asignacion.pendienteBase))fallo('TRASLADO_FALTANTE_CAMBIO','El faltante ya no está pendiente.')
      asignacion.justificadaBase=cantidad(reglas.micro(asignacion.justificadaBase)+reglas.micro(incidencia.cantidadBase));asignacion.pendienteBase=cantidad(reglas.micro(asignacion.pendienteBase)-reglas.micro(incidencia.cantidadBase))
      const guia=despachos.get(asignacion.despachoId);if(guia.asignaciones.every(a=>reglas.micro(a.pendienteBase)===0n))guia.estado='RECIBIDO'
    }
    if(e.resolucion==='TRASLADO_RELACIONADO'){
      const rel=documentos.get(e.trasladoRelacionadoId),presentacion=asignacion?traslado.lineas.find(l=>l.id===asignacion.lineaId).presentacionId:null
      const recibida=rel?.pendientes.filter(p=>!presentacion||rel.lineas.find(l=>l.id===p.lineaId)?.presentacionId===presentacion).reduce((s,p)=>s+reglas.micro(p.recibidaBase),0n)??0n
      if(!rel||rel.estado!=='CERRADO'||recibida<=0n||recibida<reglas.micro(incidencia.cantidadBase))fallo('TRASLADO_RELACIONADO_INSUFICIENTE','El documento relacionado no tiene recepción suficiente.')
    }
    Object.assign(incidencia,{estado:'RESUELTA',version:incidencia.version+1,resolucion:e.resolucion,motivoResolucion:e.motivo,trasladoRelacionadoId:e.trasladoRelacionadoId,resueltaEn:new Date().toISOString(),resueltaPorId:sesion.usuarioId});tocar(traslado,'resolver-incidencia');return json(traslado)||true
  }
}
