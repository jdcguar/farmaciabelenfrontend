const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), cargar = require('./cargar-typescript.cjs')
const f = cargar(path.resolve(__dirname, '../src/modules/traslados')), r = f('traslado-operaciones-reglas.ts'), cfg = f('traslado.config.ts')
const v = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/traslados'))('traslado.validator.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const t = { id:id(1), estado:'APROBADO', version:9, origenSucursalId:id(2), destinoSucursalId:id(3), pendientes:[{lineaId:id(4),porPrepararBase:'1.000001'}] }
const s = {usuarioId:id(9),sucursal:{id:id(2)},permisos:['VER','PREPARAR','RECIBIR','CONFIRMAR_RECEPCION','CUSTODIA'].map(cfg.permisoTraslado)}
const a = {id:id(5),lineaId:id(4),numeroLote:'LOTE-A',fechaVencimiento:'2028-01-01',pendienteBase:'1.000001'}
const c = {traslado:{...t,estado:'EN_TRANSITO'},despacho:{id:id(6),estado:'EN_TRANSITO',despachadoPorId:id(8),asignaciones:[a]},recepciones:[]}
const linea = {asignacionId:a.id,incluir:true,numeroLoteObservado:' lote-a ',vencimientoObservado:a.fechaVencimiento,aceptadaBase:'1.000001',cuarentenaBase:'0',rechazadaBase:'0',destinoUbicacionId:id(7),cuarentenaUbicacionId:'',incidencia:''}
const ahora = Date.parse('2026-10-06T18:00:00Z')
test('preparación usa versión del traslado, Guatemala y cantidad exacta; elimina filas excluidas',()=>{
  const ls=[{lineaId:id(4),incluir:true,cantidadBase:'1.000001'},{lineaId:id(77),incluir:false,cantidadBase:''}]
  assert.deepEqual(r.validarPreparacion(t,'2026-10-06T13:00',ls,ahora),{})
  const e=r.entradaPreparacion(t,'2026-10-06T13:00',ls,id(11));assert.equal(v.prepararSchema.safeParse(e).success,true)
  assert.equal(e.version,9);assert.equal(e.reservaHasta,'2026-10-06T13:00:00-06:00');assert.equal(e.lineas.length,1);assert.equal(e.lineas[0].cantidadBase,'1.000001')
})
test('preparación rechaza una millonésima de exceso, duplicados, cero y vigencia inválida',()=>{
  for(const cantidadBase of ['1.000002','0','-1','1e0','1.0000001']) assert.ok(r.validarPreparacion(t,'2026-10-06T13:00',[{lineaId:id(4),incluir:true,cantidadBase}],ahora)['lineas.0.cantidadBase'])
  const l={lineaId:id(4),incluir:true,cantidadBase:'1'}
  assert.ok(r.validarPreparacion(t,'2026-10-06T13:00',[l,l],ahora)['lineas.1.cantidadBase'])
  for(const hora of ['','2026-02-30T13:00','2026-10-06T12:00','2026-10-06T24:00','2026-10-06T13:60']) assert.ok(r.validarPreparacion(t,hora,[l],ahora).reservaHasta)
  assert.ok(r.validarPreparacion(t,'2026-10-06T13:00',[],ahora).lineas)
  assert.ok(r.validarPreparacion(t,'2026-10-06T13:00',Array(101).fill(l),ahora).lineas)
})
test('separa permisos y nodos; corporativo no sustituye permiso; destino recibe y origen prepara',()=>{
  assert.equal(r.puedePreparar(t,s),true);assert.equal(r.puedePreparar(t,{...s,sucursal:{id:id(3)}}),false)
  assert.equal(r.puedePreparar(t,{...s,permisos:['TRASLADOS.ACCESO.CORPORATIVO']}),false)
  assert.equal(r.puedePreparar({...t,estado:'CERRADO'},s),false)
  assert.equal(r.puedePreparar({...t,pendientes:[{...t.pendientes[0],porPrepararBase:'0'}]},s),false)
  assert.equal(r.puedeRegistrarRecepcion(c,s),false);assert.equal(r.puedeRegistrarRecepcion(c,{...s,sucursal:{id:id(3)}}),true)
  assert.equal(r.permiteNodo(t,s,'CUSTODIA','participante'),true)
})
test('salida y custodia cumplen contratos reales y límites del coste GTQ',()=>{
  const salida={version:8,custodio:'Responsable de entrega',transporte:'Unidad refrigerada',condiciones:'Conservación revisada',evidencia:'Guía firmada de traslado',costeTransporte:'9999999999999.99',controlCompensatorio:null}
  assert.deepEqual(r.validarSalida(salida),{});assert.equal(v.despacharSchema.safeParse(salida).success,true)
  for(const costeTransporte of ['-1','1.001','10000000000000','1e2']) assert.ok(r.validarSalida({...salida,costeTransporte}).costeTransporte)
  const custodia={version:8,responsable:'Nuevo responsable',condiciones:'Cadena de frío revisada',evidencia:'Entrega documentada'}
  assert.deepEqual(r.validarCustodia(custodia),{});assert.equal(v.custodiaSchema.safeParse(custodia).success,true)
  assert.ok(r.validarMotivo('x').motivo);assert.equal(r.reservaVigente('2026-10-06T18:00:00Z',ahora),false)
})
test('recepción conserva observaciones y cantidades exactas; no envía campos de interfaz ni versión',()=>{
  assert.deepEqual(r.validarRegistroRecepcion(c,[linea],'Acta de inspección','',id(9)),{})
  const e=r.entradaRecepcion([linea,{...linea,incluir:false}],' Acta de inspección ','',id(11))
  assert.equal(v.recepcionSchema.safeParse(e).success,true);assert.equal(e.lineas.length,1);assert.equal(e.lineas[0].numeroLoteObservado,'LOTE-A');assert.equal(e.lineas[0].aceptadaBase,'1.000001')
  assert.ok(!('version' in e));assert.ok(!('incluir' in e.lineas[0]));assert.equal(e.lineas[0].cuarentenaUbicacionId,null)
  assert.deepEqual(r.diferenciasRecepcion(c,e.lineas),[])
})
test('cuarentena y rechazo exigen ubicación restringida y motivo, sin borrar datos observados',()=>{
  const l={...linea,aceptadaBase:'0',cuarentenaBase:'0.000001',rechazadaBase:'1',destinoUbicacionId:'',incidencia:''}
  const errores=r.validarRegistroRecepcion(c,[l],'Acta de inspección','',id(9));assert.ok(errores['lineas.0.cuarentenaUbicacionId']);assert.ok(errores['lineas.0.incidencia'])
  const correcta={...l,cuarentenaUbicacionId:id(12),incidencia:'Embalaje dañado, productos segregados'}
  assert.deepEqual(r.validarRegistroRecepcion(c,[correcta],'Acta de inspección','',id(9)),{})
  assert.equal(v.recepcionSchema.safeParse(r.entradaRecepcion([correcta],'Acta de inspección','',id(11))).success,true)
})
test('registro permite documentar discrepancias; detecta lote y exceso para impedir ingreso silencioso',()=>{
  const diferente={...linea,numeroLoteObservado:'OTRO',aceptadaBase:'1.000002'}
  assert.deepEqual(r.validarRegistroRecepcion(c,[diferente],'Acta de inspección','',id(9)),{})
  const e=r.entradaRecepcion([diferente],'Acta de inspección','',id(11));assert.equal(v.recepcionSchema.safeParse(e).success,true)
  assert.match(r.diferenciasRecepcion(c,e.lineas)[0],/lote.*cantidad superior/)
})
test('no acepta falta total ficticia, líneas duplicadas ni decimales inválidos en inspección',()=>{
  assert.ok(r.validarRegistroRecepcion(c,[{...linea,aceptadaBase:'0'}],'Acta de inspección','',id(9))['lineas.0.aceptadaBase'])
  assert.ok(r.validarRegistroRecepcion(c,[linea,linea],'Acta de inspección','',id(9))['lineas.1.asignacionId'])
  for(const aceptadaBase of ['1e2','-1','1.0000001']) assert.ok(r.validarRegistroRecepcion(c,[{...linea,aceptadaBase}],'Acta de inspección','',id(9))['lineas.0.aceptadaBase'])
})
test('actor que despachó necesita control documentado tanto al registrar como al confirmar',()=>{
  assert.ok(r.validarRegistroRecepcion(c,[linea],'Acta de inspección','',id(8)).controlCompensatorio)
  const recepcion={estado:'REGISTRADA',controlCompensatorio:null}, sesion={...s,usuarioId:id(8),sucursal:{id:id(3)}}
  assert.equal(r.puedeConfirmarRecepcion({...c,recepcion},sesion),false)
  assert.equal(r.puedeConfirmarRecepcion({...c,recepcion:{...recepcion,controlCompensatorio:'Revisión independiente documentada'}},sesion),true)
  assert.equal(r.puedeConfirmarRecepcion({...c,recepcion:{...recepcion,estado:'CONFIRMADA'}},sesion),false)
})
test('API operativa usa rutas, métodos y versiones de hijo y recarga contexto completo',async()=>{
  const llamadas=[], despacho={...c.despacho,trasladoId:t.id}, recepcion={id:id(13),despachoId:despacho.id}
  const api=cargar(path.resolve(__dirname,'../src/modules/traslados'),{'../../shared/api/cliente-api':{solicitarApi:async(ruta,op)=>{llamadas.push([ruta,op]);return {data:ruta===`/traslados/recepciones/${recepcion.id}`?recepcion:ruta.endsWith('/recepciones')?[]:ruta.startsWith('/traslados/despachos/')?despacho:t}}},'../../shared/api/descargar-archivo-api':{descargarArchivoApi:async()=>{}}})('traslado-api.ts')
  const signal=new AbortController().signal;const contexto=await api.obtenerContextoRecepcion(recepcion.id,signal)
  assert.equal(contexto.traslado.id,t.id);assert.equal(llamadas.length,4);assert.ok(llamadas.every(([,o])=>o.signal===signal))
  await api.prepararDespacho(t.id,{version:9});await api.despacharTraslado(despacho.id,{version:7});await api.registrarCustodia(despacho.id,{version:8});await api.registrarRecepcion(despacho.id,{});await api.confirmarRecepcion(recepcion.id,5);await api.cancelarRecepcion(recepcion.id,{version:6,motivo:'Cancelar'});await api.cancelarDespacho(despacho.id,{version:10,motivo:'Cancelar'})
  assert.deepEqual(llamadas.slice(4).map(([ruta,o])=>[ruta.split('/').at(-1),o.method,o.datos.version]),[['despachos','POST',9],['despachar','PATCH',7],['custodia','POST',8],['recepciones','POST',undefined],['confirmar','PATCH',5],['cancelar','PATCH',6],['cancelar','PATCH',10]])
  assert.equal(v.confirmarSchema.safeParse(llamadas[8][1].datos).success,true)
})
