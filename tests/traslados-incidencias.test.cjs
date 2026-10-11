const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),cargar=require('./cargar-typescript.cjs')
const raiz=path.resolve(__dirname,'../src/modules/traslados'),f=cargar(raiz),r=f('traslado-incidencias-reglas.ts'),cfg=f('traslado.config.ts'),reglas=f('traslado-reglas.ts')
const schemas=cargar(path.resolve(__dirname,'../../../Backend/FarmaciaBelenBackend/src/modules/traslados'))('traslado.validator.ts')
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const t={id:id(1),numero:'TRA-PRUEBA',estado:'EN_TRANSITO',tipo:'ABASTECIMIENTO',prioridad:'URGENTE',version:40,origenSucursalId:id(2),destinoSucursalId:id(3),lineas:[{id:id(4),presentacionId:id(5),unidadId:id(6),vidaUtilMinimaDias:90}],despachos:[{id:id(7),despachadoEn:'2026-10-06T18:00:00Z'}]}
const a={id:id(8),lineaId:id(4),pendienteBase:'1.000001'},d={id:id(7),trasladoId:t.id,estado:'EN_TRANSITO',asignaciones:[a]}
const i={id:id(9),trasladoId:t.id,asignacionId:a.id,version:7,estado:'ABIERTA',tipo:'FALTANTE',cantidadBase:'1.000001'}
const c={traslado:t,incidencia:i,asignacion:a,despacho:d},s={usuarioId:id(10),sucursal:{id:id(3)},permisos:['VER','INCIDENCIAS','RESOLVER_INCIDENCIA','CREAR'].map(cfg.permisoTraslado)},corp={...s,permisos:[...s.permisos,'TRASLADOS.ACCESO.CORPORATIVO']}
const registro={version:t.version,tipo:'FALTANTE',asignacionId:a.id,cantidadBase:'1.000001',descripcion:'Falta observada en la entrega.',evidencia:'Acta documentada de la diferencia.'}
const resolucion={version:i.version,resolucion:'FALTANTE_JUSTIFICADO',motivo:'Investigación y justificación autorizada.',evidencia:'Acta de investigación con evidencia.',trasladoRelacionadoId:null,controlCompensatorio:null}
const rel={...t,id:id(20),estado:'CERRADO',lineas:[{id:id(21),presentacionId:id(5)},{id:id(22),presentacionId:id(50)}],pendientes:[{lineaId:id(21),recibidaBase:'1.000001'},{lineaId:id(22),recibidaBase:'900.000000'}]}

test('cinco rutas nuevas exigen VER y el permiso operativo; justificar exige corporativo',()=>{
  for(const [sufijo,modo,accion] of [['incidencias/nueva','incidencia','INCIDENCIAS'],[`incidencias/${i.id}/resolver`,'resolver','RESOLVER_INCIDENCIA'],[`incidencias/${i.id}/justificar`,'justificar','RESOLVER_INCIDENCIA'],['retorno','retorno','CREAR'],['complementario','complementario','CREAR']]){
    const ruta=cfg.reconocerRutaTraslado(`/traslados/${t.id}/${sufijo}`);assert.equal(ruta.modo,modo)
    assert.equal(cfg.puedeRutaTraslado(ruta,corp.permisos),true)
    assert.equal(cfg.puedeRutaTraslado(ruta,corp.permisos.filter(p=>p!==cfg.permisoTraslado(accion))),false)
    assert.equal(cfg.puedeRutaTraslado(ruta,corp.permisos.filter(p=>p!==cfg.permisoTraslado('VER'))),false)
    if(modo==='justificar')assert.equal(cfg.puedeRutaTraslado(ruta,s.permisos),false)
  }
  assert.equal(cfg.reconocerRutaTraslado(`/traslados/${t.id}/incidencias/no-uuid/resolver`),null)
})
test('incidencias y resolución respetan nodo, estado abierto y permisos independientes de corporativo',()=>{
  assert.equal(r.puedeIncidencia(t,s),true);assert.equal(r.puedeResolver(t,i,s),true)
  assert.equal(r.puedeIncidencia(t,{...s,sucursal:{id:id(99)}}),false)
  assert.equal(r.puedeIncidencia({...t,estado:'CERRADO'},corp),false)
  assert.equal(r.puedeResolver(t,{...i,estado:'RESUELTA'},corp),false)
  assert.equal(r.puedeResolver(t,i,{...corp,permisos:['TRASLADOS.ACCESO.CORPORATIVO']}),false)
})
test('registrar conserva tipo, asignación y evidencia con el contrato real y versión del traslado',()=>{
  assert.deepEqual(r.validarIncidencia(t,registro,d),{});assert.equal(schemas.incidenciaSchema.safeParse(registro).success,true)
  assert.deepEqual(r.validarIncidencia(t,{...registro,tipo:'CONSERVACION',asignacionId:null,cantidadBase:'0'},null),{})
  assert.ok(r.validarIncidencia(t,{...registro,descripcion:'x',evidencia:''},d).evidencia)
  assert.ok(r.validarIncidencia(t,registro,{...d,trasladoId:id(90)}).asignacionId)
})
test('faltante exige asignación en tránsito, cantidad positiva y pendiente exacto, sin redondear',()=>{
  assert.ok(r.validarIncidencia(t,{...registro,asignacionId:null},null).asignacionId)
  assert.ok(r.validarIncidencia(t,registro,{...d,estado:'PREPARADO'}).asignacionId)
  for(const cantidadBase of ['0','1.000002','-1','1e0','1,2','1.0000001'])assert.ok(r.validarIncidencia(t,{...registro,cantidadBase},d).cantidadBase)
  assert.deepEqual(r.validarIncidencia(t,{...registro,cantidadBase:'0.000001'},d),{})
})
test('justificar faltante exige corporativo y rechaza cantidad que dejó de estar pendiente',()=>{
  assert.deepEqual(r.validarResolucion(c,resolucion,corp,null),{});assert.equal(schemas.resolverSchema.safeParse(resolucion).success,true)
  assert.ok(r.validarResolucion(c,resolucion,s,null).resolucion)
  assert.ok(r.validarResolucion({...c,incidencia:{...i,tipo:'DANO'}},resolucion,corp,null).resolucion)
  assert.ok(r.validarResolucion({...c,asignacion:{...a,pendienteBase:'1'}},resolucion,corp,null).resolucion)
  assert.ok(r.validarResolucion({...c,despacho:{...d,estado:'RECIBIDO'}},resolucion,corp,null).resolucion)
})
test('resolución conserva evidencia y control, requiere motivo y no inventa recepción o cantidades',()=>{
  const e={...resolucion,resolucion:'ACLARADA',controlCompensatorio:'Control independiente documentado.'}
  assert.deepEqual(r.validarResolucion(c,e,s,null),{});assert.equal(schemas.resolverSchema.safeParse(e).success,true)
  assert.ok(r.validarResolucion(c,{...e,controlCompensatorio:'x'},s,null).controlCompensatorio)
  assert.ok(r.validarResolucion(c,{...e,motivo:'x',evidencia:''},s,null).motivo)
  assert.ok(r.validarResolucion(c,{...e,trasladoRelacionadoId:rel.id},s,rel).trasladoRelacionadoId)
  assert.ok(!('cantidadBase' in e)&&!('recibidaBase' in e))
})
test('relacionar exige otro documento cerrado y los mismos puntos en ambos sentidos',()=>{
  assert.equal(r.errorRelacionado(c,rel),null)
  assert.equal(r.errorRelacionado(c,{...rel,origenSucursalId:t.destinoSucursalId,destinoSucursalId:t.origenSucursalId}),null)
  for(const cambio of [{id:t.id},{estado:'RECIBIDO'},{destinoSucursalId:id(90)}])assert.ok(r.errorRelacionado(c,{...rel,...cambio}))
  const e={...resolucion,resolucion:'TRASLADO_RELACIONADO',trasladoRelacionadoId:rel.id}
  assert.deepEqual(r.validarResolucion(c,e,s,rel),{});assert.equal(schemas.resolverSchema.safeParse(e).success,true)
  assert.ok(r.validarResolucion(c,e,s,null).trasladoRelacionadoId)
})
test('no usa aprobación, justificación ni otro producto como recepción efectiva del complementario',()=>{
  for(const recibidaBase of ['0','1.000000'])assert.ok(r.errorRelacionado(c,{...rel,pendientes:[{lineaId:id(21),recibidaBase},{lineaId:id(22),recibidaBase:'900.000000'}]}))
  assert.ok(r.errorRelacionado({...c,asignacion:null},rel))
  assert.ok(r.errorRelacionado({...c,incidencia:{...i,asignacionId:null,cantidadBase:'0'}},{...rel,pendientes:[{lineaId:id(21),recibidaBase:'0'}]}))
})
test('retorno mantiene referencia e invierte nodos; no permite crear para un destino fuera del alcance',()=>{
  assert.equal(r.puedeRetorno(t,s),false);assert.equal(r.puedeRetorno(t,corp),true)
  assert.equal(r.puedeRetorno(t,{...s,sucursal:{id:t.origenSucursalId}}),true)
  assert.equal(r.puedeRetorno({...t,despachos:[{despachadoEn:null}]},corp),false)
  const datos={...r.datosRelacionados(t,corp,'retorno'),fechaRequerida:'2026-10-06',motivo:'Retorno apto para bodega central.'}
  assert.equal(datos.tipo,'DEVOLUCION_INTERNA');assert.equal(datos.destinoSucursalId,t.origenSucursalId);assert.deepEqual(r.validarRelacionada(t,datos,'retorno'),{})
  const body={...reglas.entradaSolicitud(datos,[{presentacionId:id(5),unidadId:id(6),cantidad:'0.000001',vidaUtilMinimaDias:'90'}],id(60)),retornoDeId:t.id}
  assert.equal(schemas.crearSchema.safeParse(body).success,true);assert.equal(body.retornoDeId,t.id)
  assert.ok(r.validarRelacionada(t,{...datos,origenSucursalId:id(90)},'retorno').origenSucursalId)
})
test('complementario conserva puntos, admite sentido inverso local y usa solicitud normal sin retorno falso',()=>{
  const localOrigen={...s,sucursal:{id:t.origenSucursalId}},datos=r.datosRelacionados(t,localOrigen,'complementario')
  assert.equal(datos.destinoSucursalId,localOrigen.sucursal.id);assert.equal(datos.motivo,'')
  assert.deepEqual(r.validarRelacionada(t,datos,'complementario'),{})
  assert.ok(r.validarRelacionada(t,{...datos,destinoSucursalId:id(90)},'complementario').origenSucursalId)
  assert.equal(reglas.entradaSolicitud(datos,[],id(60)).retornoDeId,null)
})
function apiSimulada(obtener){return cargar(raiz,{'../../shared/api/cliente-api':{solicitarApi:obtener},'../../shared/api/descargar-archivo-api':{descargarArchivoApi:async()=>{}}})('traslado-api.ts')}
test('API usa POST del traslado y PATCH de incidencia con su propia versión, devolviendo encabezado actualizado',async()=>{
  const llamadas=[],api=apiSimulada(async(ruta,op)=>{llamadas.push([ruta,op]);return {data:{...t,version:41}}})
  assert.equal((await api.registrarIncidencia(t.id,registro)).version,41);await api.resolverIncidencia(i.id,resolucion)
  assert.deepEqual(llamadas.map(([p,o])=>[p,o.method,o.datos.version]),[[`/traslados/${t.id}/incidencias`,'POST',40],[`/traslados/incidencias/${i.id}/resolver`,'PATCH',7]])
})
test('contexto encuentra asignación sin crear endpoints ficticios y propaga AbortSignal',async()=>{
  const llamadas=[],signal=new AbortController().signal,api=apiSimulada(async(p,o)=>{llamadas.push([p,o]);return {data:p===`/traslados/${t.id}`?{...t,incidencias:[i]}:d}})
  const c=await api.obtenerContextoIncidencia(t.id,i.id,signal);assert.equal(c.asignacion.id,a.id);assert.equal(llamadas.length,2);assert.ok(llamadas.every(([,o])=>o.signal===signal))
  await assert.rejects(api.obtenerContextoIncidencia(t.id,id(99)),/no pertenece/)
})
test('consulta de guías se limita a cuatro por grupo, se detiene al encontrar y respeta cancelación',async()=>{
  const llamadas=[],documento={...t,despachos:Array.from({length:9},(_,n)=>({id:id(100+n)})),incidencias:[i]},controller=new AbortController()
  const api=apiSimulada(async(p)=>{llamadas.push(p);return {data:p===`/traslados/${t.id}`?documento:{...d,asignaciones:p.endsWith(id(100))?[a]:[]}}})
  await api.obtenerContextoIncidencia(t.id,i.id,controller.signal);assert.equal(llamadas.length,5)
  controller.abort();llamadas.length=0;await assert.rejects(api.obtenerContextoIncidencia(t.id,i.id,controller.signal),{name:'AbortError'});assert.equal(llamadas.length,1)
})
