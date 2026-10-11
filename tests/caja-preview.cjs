// API exclusivamente simulada en memoria para revisión visual. No inicia ni conecta Oracle.
// node tests/caja-preview.cjs
// VITE_API_URL=http://127.0.0.1:3103/api npm run dev -- --host 127.0.0.1 --port 5183 --strictPort
const http=require('node:http'),path=require('node:path'),{randomUUID}=require('node:crypto'),cargar=require('./cargar-typescript.cjs')
const f=cargar(path.resolve(__dirname,'../src/modules/caja')),cfg=f('caja.config.ts'),reglas=f('caja-reglas.ts')
const backend=cargar(path.resolve(__dirname,'../../../Backend/FarmaciaBelenBackend/src/modules/caja')),schemas=backend('caja.validator.ts')
const semilla=cargar(path.resolve(__dirname,'../../../Backend/FarmaciaBelenBackend/src/database/seeds/seguridad'))('caja.seed-data.ts')
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`,ahora=new Date().toISOString(),hoy='2026-10-06'
const nodos=[{id:id(1),nombre:'Farmacia Belén · prueba',codigo:'BELEN',activo:true},{id:id(2),nombre:'Sucursal Norte · prueba',codigo:'NORTE',activo:true}]
const permisos=[...semilla.moduloCajaSemilla.submodulos.flatMap(s=>s.permisos.map(p=>p.codigo)),'ORGANIZACION.SUCURSALES.VER','SEGURIDAD.USUARIOS.VER']
const sesion={usuarioId:id(9),nombreUsuario:'demo-caja',empleadoId:id(9),empleadoCodigo:'PRUEBA',empleadoNombre:'Cuenta simulada de Caja',estado:'ACTIVO',debeCambiarContrasena:false,expiraEn:'2099-01-01T00:00:00Z',sucursal:nodos[0],roles:[],permisos}
const politica={corte:'00:00',apertura:'00:00',cierre:'00:00',permiteTurnosSimultaneos:false,fondoMaximo:'500.00',saldoMaximo:'10000.00',reintegroMaximo:'300.00',extraordinarioUmbral:'100.00',diferenciaUmbral:'1.00',denominaciones:['0.01','1.00','10.00','100.00']}
const documentos={},claves=new Map(),llamadas=[]
cfg.recursosCaja.forEach((r,i)=>documentos[r]=[{id:id(100+i),sucursalId:id(1),moneda:'GTQ',version:1,creadoEn:ahora,creadoPorId:id(8)}])
const doc=r=>documentos[r][0],turnoId=doc('turnos').id
Object.assign(doc('politicas'),{configuracion:politica})
Object.assign(doc('cajas'),{codigo:'CAJA-01',nombre:'Caja principal de demostración',tipo:'VENTAS',estado:'DISPONIBLE'})
Object.assign(doc('turnos'),{cajaId:doc('cajas').id,cajeroId:id(9),estado:'ABIERTO',fechaNegocio:hoy,abiertoEn:ahora,fondo:'100.00',saldoTeorico:'150.00',politica,denominaciones:[{valor:'100.00',cantidad:1}]})
Object.assign(doc('movimientos'),{turnoId,numero:'CAJ-000000000001',tipo:'INGRESO_EXTRAORDINARIO',direccion:'ENTRADA',estado:'REGISTRADO',importe:'50.00',motivo:'Aporte simulado documentado',referencia:'ACTA-001',evidencia:'Comprobante de demostración',fechaNegocio:hoy,ocurridoEn:ahora})
Object.assign(doc('arqueos'),{turnoId:id(999),tipo:'CIEGO',estado:'PENDIENTE',responsableId:id(9),fechaNegocio:hoy})
Object.assign(doc('cierres'),{turnoId,estado:'PENDIENTE',revision:'1',esperado:'150.00',declarado:'150.00',diferencia:'0.00',denominaciones:[{valor:'10.00',cantidad:15}],custodioId:id(8),resumen:{fondo:'100.00',movimientos:[{tipo:'INGRESO_EXTRAORDINARIO',direccion:'ENTRADA',importe:'50.00',cantidad:1}]},evidencia:'Acta simulada',fechaNegocio:hoy})
Object.assign(doc('remesas'),{turnoId,tipo:'RETIRO',estado:'RETIRADO',importe:'100.00',custodioId:id(8),receptorId:id(9),bolsa:'BOLSA-01',sello:'SELLO-01',evidencia:'Guía simulada'})
documentos.remesas.push({...doc('remesas'),id:id(120),estado:'CAJA_FUERTE',custodioId:id(9)},{...doc('remesas'),id:id(121),estado:'CAJA_FUERTE',custodioId:id(9),tipo:'FONDO_CAMBIO'})
Object.assign(doc('custodias'),{remesaId:doc('remesas').id,entregadoPorId:id(8),receptorId:id(9),estado:'PENDIENTE',ubicacion:'EN_TRANSITO',transporte:'Transporte simulado',evidencia:'Acta simulada'})
Object.assign(doc('depositos'),{estado:'PREPARADO',importe:'100.00',depositado:null,banco:'Banco de demostración',cuenta:'DEMO-001',responsableId:id(9),remesas:[documentos.remesas[1]]})
Object.assign(doc('cobros-repartidor'),{repartidorId:id(9),estado:'CUSTODIA',importe:'50.00',recibido:'100.00',cambio:'50.00',ventaId:id(601),entregaId:id(602),fechaNegocio:hoy,ocurridoEn:ahora})
Object.assign(doc('rendiciones'),{turnoId,repartidorId:id(8),estado:'REGISTRADA',cobros:'50.00',fondo:'100.00',declarado:'150.00',diferencia:'0.00',denominaciones:[{valor:'10.00',cantidad:15}],cobroIds:[doc('cobros-repartidor').id],remesaIds:[id(121)],evidencia:'Declaración simulada'})
Object.assign(doc('incidencias'),{recurso:'ARQUEO',recursoId:doc('arqueos').id,estado:'ABIERTA',diferencia:'-1.00',descripcion:'Faltante de demostración en investigación',evidencia:'Acta simulada'})
Object.assign(doc('cierres-diarios'),{fechaNegocio:hoy,estado:'CERRADO',resumen:{moneda:'GTQ',desde:hoy,hasta:hoy,flujoNetoOperativo:'50.00',efectivoEnCaja:[{sucursalId:id(1),importe:'150.00'}]},evidencia:'Consolidación de demostración'})
const paginar=(items,q)=>{const pagina=Number(q.pagina??1),tamanoPagina=Number(q.tamanoPagina??50);return {items:items.slice((pagina-1)*tamanoPagina,pagina*tamanoPagina),pagina,tamanoPagina,total:items.length,totalPaginas:Math.ceil(items.length/tamanoPagina)}}
const contrato=(recurso,accion)=>({ 'cajas:nuevo':'cajaSchema','turnos:nuevo':'abrirSchema','movimientos:nuevo':'movimientoSchema','arqueos:nuevo':'arqueoSchema','depositos:nuevo':'depositoSchema','rendiciones:nuevo':'rendicionSchema','cierres-diarios:nuevo':'cierreDiarioSchema','politicas:nuevo':'politicaSchema','cajas:estado':'estadoCajaSchema','turnos:cierre':'cierreSchema','turnos:retiros':'retiroSchema','movimientos:confirmar':'confirmarMovimientoSchema','movimientos:correccion':'compensarSchema','arqueos:contar':'contarSchema','cierres:aprobar':'aprobarCierreSchema','remesas:aceptar':'aceptarSchema','custodias:aceptar':'aceptarSchema','remesas:retorno':'retornarRemesaSchema','remesas:custodia':'custodiaSchema','depositos:registrar':'registrarDepositoSchema','depositos:confirmar':'confirmarDepositoSchema','rendiciones:confirmar':'confirmarRendicionSchema','incidencias:resolver':'resolverSchema'}[`${recurso}:${accion}`]??'accionSchema')
const servidor=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin',req.headers.origin === 'http://127.0.0.1:5183' ? 'http://127.0.0.1:5183' : 'http://localhost:5183');res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,OPTIONS')
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
  const url=new URL(req.url,'http://localhost:3103'),p=url.pathname,q=Object.fromEntries(url.searchParams),json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({success:true,data}))}
  const fallo=(message,status=409,code='CAJA_PRUEBA')=>{throw Object.assign(new Error(message),{status,code})}
  try{
    if(p==='/__prueba/documentos')return json(documentos)
    if(p==='/__prueba/llamadas')return json(llamadas)
    if(p==='/__prueba/perfil'){sesion.permisos=q.perfil==='sin-permisos'?[]:q.perfil==='local'?permisos.filter(p=>p!=='CAJA.ACCESO.CORPORATIVO'):permisos;return json({simulado:true})}
    if(p==='/__prueba/conflicto'){const d=Object.values(documentos).flat().find(d=>d.id===q.id);if(d)d.version++;return json({simulado:true})}
    if(p==='/api/autenticacion/mi-sesion')return json(sesion)
    if(p==='/api/sucursales/mantenimiento')return json(paginar(nodos,q))
    if(p.startsWith('/api/sucursales/'))return json(nodos.find(n=>n.id===p.split('/').at(-1)))
    if(p==='/api/seguridad/usuarios'||p==='/api/seguridad/usuarios/mantenimiento')return json(paginar([9,8].map(n=>({id:id(n),nombreUsuario:n===9?'demo-caja':'supervisor-demo',empleadoNombre:n===9?'Cuenta simulada':'Supervisor simulado',estado:'ACTIVO'})),q))
    if(p.startsWith('/api/seguridad/usuarios/'))return json({id:p.split('/').at(-1),nombreUsuario:'demo-caja',empleadoNombre:'Cuenta simulada'})
    if(p==='/api/caja/consolidado'){schemas.consolidadoSchema.parse(q);return json({moneda:'GTQ',desde:q.desde,hasta:q.hasta,generadoEn:ahora,naturaleza:'Flujo informativo de efectivo; no es estado contable',flujoNetoOperativo:'50.00',efectivoEnCaja:[{sucursalId:id(1),importe:'150.00'}],custodiaActual:[{sucursalId:id(1),estado:'CAJA_FUERTE',importe:'200.00'}],cobrosEnRepartidor:[{sucursalId:id(1),repartidorId:id(9),importe:'50.00'}],movimientos:[{sucursalId:id(1),tipo:'INGRESO_EXTRAORDINARIO',direccion:'ENTRADA',importe:'50.00',cantidad:1}],ventasContraEntrega:[],depositadoEnPeriodo:[],diferenciasAbiertas:[{sucursalId:id(1),cantidad:1,faltantes:'1.00',sobrantes:'0.00'}]})}
    const m=p.match(/^\/api\/caja\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);if(!m)fallo('Ruta no simulada',404)
    const [,recurso,docId,accion]=m;if(['cobros','reintegros','anulaciones-venta'].includes(recurso))fallo('Integración de origen todavía no disponible.',503,'CAJA_ORIGEN_NO_DISPONIBLE');if(!documentos[recurso])fallo('Recurso no simulado',404)
    let body=null;if(req.method!=='GET'){const chunks=[];for await(const c of req)chunks.push(c);body=JSON.parse(Buffer.concat(chunks).toString())}llamadas.push({metodo:req.method,ruta:req.url,cuerpo:body})
    if(req.method==='GET'&&!docId){schemas.consultaSchema.parse(q);return json(paginar(documentos[recurso].filter(d=>['sucursalId','cajaId','turnoId','estado'].every(k=>!q[k]||d[k]===q[k])&&(!q.desde||d.creadoEn.slice(0,10)>=q.desde)&&(!q.hasta||d.creadoEn.slice(0,10)<=q.hasta)),q))}
    if(docId==='exportaciones'){schemas.exportarSchema.parse(body);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="caja-${recurso}.${body.formato}"`,'Cache-Control':'private, no-store'});return res.end('Documento de demostración; para verificar binarios reales usa tests backend.')}
    const d=docId?documentos[recurso].find(d=>d.id===docId):null
    if(req.method==='GET'){if(!d)fallo('Documento de prueba no encontrado',404);if(accion==='contexto-conteo')return json({arqueoId:d.id,version:d.version,sucursalId:d.sucursalId,turnoId:d.turnoId,denominaciones:politica.denominaciones});if(accion==='auditoria')return json(paginar([{id:id(701),usuarioNombre:'Supervisor simulado',sucursal:nodos[0],tipoOperacion:'CREAR',versionEntidad:d.version,resumen:'Documento de demostración',ocurridoEn:ahora,detalles:[{id:id(702),nombrePropiedad:'version',etiquetaPropiedad:'Versión',tipoDato:'numero',valorAnterior:null,valorNuevo:'1',orden:0}]}],q));return json(d)}
    schemas[contrato(recurso,accion??'nuevo')].parse(body)
    const anterior=claves.get(body.claveIdempotencia);if(anterior){if(anterior.huella!==JSON.stringify(body))fallo('Clave reutilizada con otro contenido',409,'CAJA_IDEMPOTENCIA_INCOMPATIBLE');return json(anterior.resultado)}
    if(d&&body.version!==d.version)fallo('Otro usuario modificó el registro. Revisa la versión.',409,'CAJA_MODIFICADA')
    const estadoPrevio=d?.estado
    let resultado=d??{id:randomUUID(),sucursalId:body.sucursalId??id(1),moneda:'GTQ',version:1,creadoEn:ahora,creadoPorId:id(9)}
    Object.assign(resultado,body);delete resultado.claveIdempotencia
    if(!d){if(recurso==='politicas')Object.assign(doc('politicas'),resultado);else documentos[recurso].push(resultado)}
    if(accion){resultado.version++;resultado.estado={confirmar:recurso==='rendiciones'?'CONFIRMADA':'CONFIRMADO',cancelar:recurso==='rendiciones'?'CANCELADA':'CANCELADO',contar:'CONTADO',aprobar:'APROBADO',resolver:'RESUELTA',registrar:'REGISTRADO',aceptar:recurso==='custodias'?'ACEPTADA':'CAJA_FUERTE'}[accion]??resultado.estado;if(accion==='estado')resultado.estado=body.estado}
    if(body.denominaciones){const total=reglas.decimalCaja(body.denominaciones.reduce((s,l)=>s+reglas.centavosCaja(l.valor)*BigInt(l.cantidad),0n));resultado.declarado=total;if(recurso==='arqueos'){resultado.esperado='100.00';resultado.diferencia=reglas.decimalCaja(reglas.centavosCaja(total)-10000n)}}
    if(accion==='aceptar'&&recurso==='remesas'){const aceptada=resultado.declarado===resultado.importe;if(!aceptada)resultado.estado=estadoPrevio;resultado={aceptada,remesa:resultado}}
    if(accion==='cierre'||accion==='retiros'||accion==='custodia'){const r=accion==='cierre'?'cierres':accion==='retiros'?'remesas':'custodias';resultado={...resultado,id:randomUUID(),version:1};documentos[r].push(resultado)}
    claves.set(body.claveIdempotencia,{huella:JSON.stringify(body),resultado:structuredClone(resultado)});return json(resultado)
  }catch(e){res.writeHead(e.status??(e.issues?400:500),{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,error:{code:e.code??'VALIDACION',message:e.message,details:(e.issues??[]).map(i=>({campo:i.path.join('.'),mensaje:i.message}))}}))}
})
servidor.listen(3103,'127.0.0.1',()=>console.log('Caja SIMULADA: http://localhost:3103/api · memoria sin Oracle'))
