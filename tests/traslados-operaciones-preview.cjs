// Extensión del simulador visual: documentos y cantidades únicamente en memoria.
const { randomUUID } = require('node:crypto')
module.exports = ({ documentos, documento, sesion, schemas, reglas, id, ahora, auditar, fallo, llamadas }) => {
  const despachos = new Map(), recepciones = new Map(), actores = new Map(), claves = new Map()
  const cantidad = m => `${m / 1000000n}.${String(m % 1000000n).padStart(6,'0')}`
  const unidades = [
    {id:id(20),codigo:'ALM-BELEN',nombre:'Almacenamiento Belén',activo:true,sucursalId:id(2),tipo:'ALMACENAMIENTO'},
    {id:id(21),codigo:'CUA-BELEN',nombre:'Cuarentena Belén',activo:true,sucursalId:id(2),tipo:'CUARENTENA'},
    {id:id(22),codigo:'ALM-NORTE',nombre:'Almacenamiento Norte',activo:true,sucursalId:id(3),tipo:'ALMACENAMIENTO'},
  ]
  function tocar(t, accion) {
    const activos = t.despachos.filter(d=>d.estado!=='CANCELADO')
    t.estado=activos.some(d=>d.estado==='EN_TRANSITO')?'EN_TRANSITO':activos.some(d=>d.estado==='PREPARADO')?'PREPARADO':activos.some(d=>d.estado==='RECIBIDO')?'RECIBIDO':'APROBADO'
    t.version++;t.actualizadoEn=new Date().toISOString();auditar(t,accion)
    t.pendientes=t.lineas.map(l=>{
      const aa=activos.flatMap(d=>d.asignaciones.map(a=>({...a,estado:d.estado}))).filter(a=>a.lineaId===l.id)
      const suma=(campo,seleccion=aa)=>seleccion.reduce((m,a)=>m+reglas.micro(a[campo]),0n)
      const comprometida=suma('cantidadBase'), despachada=suma('cantidadBase',aa.filter(a=>a.estado!=='PREPARADO')), recibida=suma('recibidaBase'),justificada=suma('justificadaBase')
      return {lineaId:l.id,porPrepararBase:cantidad(reglas.micro(l.aprobadaBase)-comprometida),preparadaBase:cantidad(comprometida-despachada),despachadaBase:cantidad(despachada),recibidaBase:cantidad(recibida),justificadaBase:cantidad(justificada),enTransitoBase:cantidad(despachada-recibida-justificada)}
    })
  }
  function nuevo(t, identificador, estado, cantidades=['2.000000','2.000000']) {
    const d={id:identificador,trasladoId:t.id,estado,version:1,creadoEn:ahora,reservaHasta:new Date(Date.now()+86400000).toISOString(),despachadoEn:estado==='EN_TRANSITO'?ahora:null,despachadoPorId:estado==='EN_TRANSITO'?id(8):null,custodio:estado==='EN_TRANSITO'?'Transportista simulado':null,transporte:null,condiciones:null,evidencia:null,costeTransporte:'0.00',moneda:'GTQ',movimientoId:null,motivoCancelacion:null,custodias:[],asignaciones:cantidades.map((q,i)=>({id:randomUUID(),despachoId:identificador,lineaId:t.lineas[0].id,existenciaId:randomUUID(),reservaId:randomUUID(),loteId:randomUUID(),numeroLote:`LOTE-${i+1}`,fechaVencimiento:`2028-0${i+1}-01`,cantidadBase:q,recibidaBase:'0.000000',justificadaBase:'0.000000',pendienteBase:q}))}
    despachos.set(d.id,d);actores.set(d.id,id(8));t.despachos.push(d);return d
  }
  const t300=documentos.get(id(300));t300.despachos=[];nuevo(t300,id(302),'EN_TRANSITO');t300.recepcionHabilitadaEn=ahora;tocar(t300,'despachar')
  t300.despachos[0].asignaciones.forEach((a,i)=>{a.id=id(304+i)})
  const t500=documento(500,'PREPARADO');t500.recepcionHabilitadaEn=ahora;nuevo(t500,id(502),'PREPARADO');tocar(t500,'preparar')
  const d300=despachos.get(id(302)), r={id:id(600),despachoId:d300.id,estado:'REGISTRADA',version:1,evidencia:'Acta de recepción simulada, inspección por lote.',creadoEn:ahora,confirmadaEn:null,confirmadaPorId:null,movimientoId:null,motivoCancelacion:null,controlCompensatorio:null,lineas:[{id:id(601),asignacionId:d300.asignaciones[0].id,numeroLoteObservado:'LOTE-1',vencimientoObservado:'2028-01-01',aceptadaBase:'1.000000',cuarentenaBase:'0.000000',rechazadaBase:'0.000000',destinoUbicacionId:id(20),cuarentenaUbicacionId:null,incidencia:null}]};recepciones.set(r.id,r)
  const incidencias=require('./traslados-incidencias-preview.cjs')({documentos,documento,despachos,nuevo,tocar,sesion,schemas,reglas,id,ahora,fallo,llamadas})
  async function manejar(req,p,q,json) {
    if(await incidencias(req,p,q,json))return true
    if(req.method==='GET' && ['/api/traslados/despachos','/api/traslados/recepciones'].includes(p)) {
      const recurso=p.endsWith('/despachos')?'despachos':'recepciones',c=(recurso==='despachos'?schemas.consultaDespachosSchema:schemas.consultaRecepcionesSchema).parse(q)
      let items=[...(recurso==='despachos'?despachos:recepciones).values()].map(o=>{
        const d=recurso==='despachos'?o:despachos.get(o.despachoId),t=documentos.get(d.trasladoId)
        const {asignaciones:_asignaciones,custodias:_custodias,lineas:_lineas,...datos}=o
        return {...datos,trasladoId:t.id,numeroTraslado:t.numero,origenSucursalId:t.origenSucursalId,destinoSucursalId:t.destinoSucursalId,prioridad:t.prioridad}
      })
      if(!sesion.permisos.includes('TRASLADOS.OPERACIONES.VER'))fallo('SIN_PERMISO','Acceso no autorizado.',403)
      if(!sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO'))items=items.filter(o=>[o.origenSucursalId,o.destinoSucursalId].includes(sesion.sucursal.id))
      for(const k of ['estado','prioridad','origenSucursalId','destinoSucursalId','trasladoId','despachoId'])if(c[k])items=items.filter(o=>o[k]===c[k])
      if(c.desde)items=items.filter(o=>o.creadoEn>=c.desde+'T00:00:00-06:00')
      if(c.hasta)items=items.filter(o=>o.creadoEn.slice(0,10)<=c.hasta)
      items.sort((a,b)=>b.creadoEn.localeCompare(a.creadoEn)||a.id.localeCompare(b.id));llamadas.push({metodo:req.method,ruta:req.url})
      return json({items:items.slice((c.pagina-1)*c.tamanoPagina,c.pagina*c.tamanoPagina),pagina:c.pagina,tamanoPagina:c.tamanoPagina,total:items.length,totalPaginas:Math.ceil(items.length/c.tamanoPagina)})||true
    }
    if(req.method==='POST' && /^\/api\/traslados\/(despachos|recepciones)\/exportaciones$/.test(p))fallo('EXPORTACION_NO_SIMULADA','La exportación real se verifica con el backend; este servidor solo contiene datos en memoria.',501)
    if(p==='/__prueba/conflicto-operacion') {const d=despachos.get(q.id)||recepciones.get(q.id);if(d)d.version++;return json({simulado:true})||true}
    if(p.startsWith('/api/catalogos/ubicaciones')) {
      const registro=p.split('/')[4],items=unidades.filter(u=>(!q.sucursalId||u.sucursalId===q.sucursalId)&&(!q.tipo||u.tipo===q.tipo))
      return json(registro?unidades.find(u=>u.id===registro):{items,pagina:1,tamanoPagina:50,total:items.length,totalPaginas:1})||true
    }
    const hijo=p.match(/^\/api\/traslados\/(despachos|recepciones)\/([^/]+)(?:\/(despachar|cancelar|custodia|recepciones|confirmar))?$/),prep=p.match(/^\/api\/traslados\/([^/]+)\/despachos$/)
    if(!hijo&&!prep)return false
    let body=null;if(req.method!=='GET'){const chunks=[];for await(const c of req)chunks.push(c);body=JSON.parse(Buffer.concat(chunks).toString())}
    llamadas.push({metodo:req.method,ruta:req.url,cuerpo:body})
    if(prep) {
      const t=documentos.get(prep[1]);if(!t)fallo('NO_ENCONTRADO','Traslado no encontrado.',404)
      const e=schemas.prepararSchema.parse(body),previo=claves.get(e.claveIdempotencia);if(previo)return json(despachos.get(previo))||true
      if(t.version!==e.version)fallo('TRASLADO_MODIFICADO','La versión del traslado cambió.')
      if(Date.parse(e.reservaHasta)<=Date.now())fallo('DATOS_INVALIDOS','La reserva debe tener vigencia futura.',400)
      const d=nuevo(t,randomUUID(),'PREPARADO',[]);d.reservaHasta=e.reservaHasta;actores.set(d.id,sesion.usuarioId)
      d.asignaciones=e.lineas.map(l=>{const linea=t.lineas.find(x=>x.id===l.lineaId);return {id:randomUUID(),despachoId:d.id,lineaId:linea.id,existenciaId:randomUUID(),reservaId:randomUUID(),loteId:randomUUID(),numeroLote:'LOTE-1',fechaVencimiento:'2028-01-01',cantidadBase:l.cantidadBase,recibidaBase:'0.000000',justificadaBase:'0.000000',pendienteBase:l.cantidadBase}})
      claves.set(e.claveIdempotencia,d.id);tocar(t,'preparar');return json(d,201)||true
    }
    const [,recurso,identificador,accion]=hijo,obj=recurso==='despachos'?despachos.get(identificador):recepciones.get(identificador)
    if(!obj)fallo('NO_ENCONTRADO','Documento simulado no encontrado.',404)
    const d=recurso==='despachos'?obj:despachos.get(obj.despachoId),t=documentos.get(d.trasladoId)
    if(req.method==='GET')return json(accion==='recepciones'?[...recepciones.values()].filter(r=>r.despachoId===d.id):obj)||true
    const version=()=>{if(body.version!==obj.version)fallo('TRASLADO_MODIFICADO','Otro usuario modificó el documento; actualice.')}
    if(accion==='recepciones') {
      const e=schemas.recepcionSchema.parse(body),previo=claves.get(e.claveIdempotencia);if(previo)return json(recepciones.get(previo))||true
      if(d.despachadoPorId===sesion.usuarioId&&!e.controlCompensatorio)fallo('TRASLADO_CONTROL_REQUERIDO','Documenta el control compensatorio.')
      const r={...e,id:randomUUID(),despachoId:d.id,estado:'REGISTRADA',version:1,creadoEn:new Date().toISOString(),confirmadaEn:null,confirmadaPorId:null,movimientoId:null,motivoCancelacion:null,lineas:e.lineas.map(l=>({...l,id:randomUUID()}))};recepciones.set(r.id,r);claves.set(e.claveIdempotencia,r.id);tocar(t,'registrar-recepcion');return json(r,201)||true
    }
    if(accion==='despachar') {
      const e=schemas.despacharSchema.parse(body);version()
      if(actores.get(d.id)===sesion.usuarioId&&!e.controlCompensatorio)fallo('TRASLADO_CONTROL_REQUERIDO','También preparaste este despacho. Registra el control compensatorio.')
      if(!t.recepcionHabilitadaEn)fallo('TRASLADO_DESTINO_NO_CONFIRMADO','El destino no habilitó su recepción.')
      Object.assign(d,e,{estado:'EN_TRANSITO',despachadoEn:new Date().toISOString(),despachadoPorId:sesion.usuarioId,movimientoId:randomUUID(),version:d.version+1});d.custodias.push({id:randomUUID(),despachoId:d.id,responsable:e.custodio,condiciones:e.condiciones,evidencia:e.evidencia,ocurridoEn:new Date().toISOString(),registradoPorId:sesion.usuarioId})
    }else if(accion==='custodia') {const e=schemas.custodiaSchema.parse(body);version();d.custodias.push({...e,id:randomUUID(),despachoId:d.id,ocurridoEn:new Date().toISOString(),registradoPorId:sesion.usuarioId});d.custodio=e.responsable;d.condiciones=e.condiciones;d.version++
    }else if(accion==='confirmar') {
      schemas.confirmarSchema.parse(body);version()
      for(const l of obj.lineas) {const a=d.asignaciones.find(a=>a.id===l.asignacionId);if(l.numeroLoteObservado!==a.numeroLote||l.vencimientoObservado!==a.fechaVencimiento)fallo('TRASLADO_LOTE_DIFERENTE','La identidad observada difiere de la guía.');const total=reglas.micro(l.aceptadaBase)+reglas.micro(l.cuarentenaBase)+reglas.micro(l.rechazadaBase);if(total>reglas.micro(a.pendienteBase))fallo('TRASLADO_SOBRANTE_NO_AUTORIZADO','La cantidad supera el pendiente.');a.recibidaBase=cantidad(reglas.micro(a.recibidaBase)+total);a.pendienteBase=cantidad(reglas.micro(a.pendienteBase)-total)}
      obj.estado='CONFIRMADA';obj.confirmadaEn=new Date().toISOString();obj.confirmadaPorId=sesion.usuarioId;obj.movimientoId=randomUUID();obj.version++;if(d.asignaciones.every(a=>reglas.micro(a.pendienteBase)===0n)){d.estado='RECIBIDO';d.version++}
    }else if(accion==='cancelar') {const e=schemas.accionSchema.parse(body);version();obj.estado=recurso==='despachos'?'CANCELADO':'CANCELADA';obj.motivoCancelacion=e.motivo;obj.version++}
    else fallo('RUTA_NO_SIMULADA','Acción no simulada.',404)
    tocar(t,accion);return json(obj)||true
  }
  manejar.datosPdf = (recurso, identificador) => {
    const recepcion=recurso==='recepciones'?recepciones.get(identificador):null
    const despacho=recurso==='despachos'?despachos.get(identificador):recepcion?despachos.get(recepcion.despachoId):null
    const traslado=documentos.get(recurso==='traslados'?identificador:despacho?.trasladoId)
    if(!traslado)fallo('NO_ENCONTRADO','Documento simulado no encontrado.',404)
    if(!sesion.permisos.includes('TRASLADOS.OPERACIONES.VER'))fallo('SIN_PERMISO','Acceso no autorizado.',403)
    if(!sesion.permisos.includes('TRASLADOS.ACCESO.CORPORATIVO')&&![traslado.origenSucursalId,traslado.destinoSucursalId].includes(sesion.sucursal.id))fallo('SIN_ALCANCE','Documento fuera de la sucursal autorizada.',403)
    return {recurso,traslado,despacho,recepcion,ubicaciones:Object.fromEntries(unidades.map(u=>[u.id,`${u.codigo} · ${u.nombre}`])),retornoNumero:documentos.get(traslado.retornoDeId)?.numero??null}
  }
  return manejar
}
