const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), cargar = require('./cargar-typescript.cjs')
const frontend = cargar(path.resolve(__dirname, '../src/modules/caja')), cfg = frontend('caja.config.ts'), op = frontend('caja-operaciones.ts'), r = frontend('caja-reglas.ts')
const v = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/caja'))('caja.validator.ts')
const chica = frontend('caja-chica.config.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const politica = { corte:'00:00', apertura:'00:00', cierre:'00:00', permiteTurnosSimultaneos:false, fondoMaximo:'500.00', saldoMaximo:'10000.00', reintegroMaximo:'300.00', extraordinarioUmbral:'100.00', diferenciaUmbral:'1.00', denominaciones:['0.01','1.00','100.00'] }
const permisos = [...cfg.recursosCaja.flatMap(x => [cfg.permisoCaja(x), ...(cfg.cajaConfig[x].crear ? [cfg.permisoCaja(x, cfg.cajaConfig[x].crear)] : []), ...Object.values(cfg.operacionesRutaCaja[x] ?? {})]), 'CAJA.ACCESO.CONTINGENCIA','CAJA.ACCESO.FUERA_HORARIO']
const sesion = {usuarioId:id(9), sucursal:{id:id(1)}, permisos}
test('Caja chica tiene ruta dentro de Caja y exige permiso financiero y alcance por sucursal', () => {
  assert.deepEqual(chica.reconocerRutaCajaChica('/caja/chica'), { modo: 'fondos' })
  assert.deepEqual(chica.reconocerRutaCajaChica(`/caja/chica/${id(1)}`), { modo: 'fondos', sucursalId: id(1) })
  assert.deepEqual(chica.reconocerRutaCajaChica('/caja/liquidaciones'), { modo: 'liquidaciones' })
  assert.deepEqual(chica.reconocerRutaCajaChica(`/caja/liquidaciones/${id(1)}`), { modo: 'liquidaciones', sucursalId: id(1) })
  assert.deepEqual(chica.reconocerRutaCajaChica(`/caja/liquidaciones/${id(1)}/${id(2)}`), { modo: 'detalle', sucursalId: id(1), id: id(2) })
  for (const ruta of ['/caja/liquidaciones/no-es-uuid', `/caja/liquidaciones/${id(1)}/gasto`, `/caja/liquidaciones/${id(1)}/${id(2)}/editar`]) assert.equal(chica.reconocerRutaCajaChica(ruta), null)
  for (const ruta of ['/caja/chica/nuevo', '/caja/chica/no-es-uuid', `/caja/chica/${id(1)}/editar`]) assert.equal(chica.reconocerRutaCajaChica(ruta), null)
  const permiso = chica.permisoVerCajaChica
  assert.equal(chica.puedeVerCajaChica([], id(1)), false)
  assert.equal(chica.puedeVerCajaChica([permiso], id(1), id(1)), true)
  assert.equal(chica.puedeVerCajaChica([permiso], id(1), id(2)), false)
  assert.equal(chica.puedeVerCajaChica([permiso, 'ORGANIZACION.SUCURSALES.FINANZAS_CORPORATIVO'], id(1), id(2)), true)
})
test('Crear caja general admite ventas y rechaza caja chica en el formulario', () => {
  const operacion = op.obtenerOperacionCaja(cfg.reconocerRutaCaja('/caja/cajas/nuevo'))
  const tipo = operacion.campos.find(c => c.nombre === 'tipo')
  assert.deepEqual(Object.keys(tipo.opciones), ['VENTAS'])
  assert.ok(op.validarCamposCaja([tipo], { tipo: 'CHICA' }).tipo)
  assert.deepEqual(op.validarCamposCaja([tipo], { tipo: 'VENTAS' }), {})
})
const contratos = [
  ['cajas','nuevo','cajaSchema'],['turnos','nuevo','abrirSchema'],['movimientos','nuevo','movimientoSchema'],['arqueos','nuevo','arqueoSchema'],['depositos','nuevo','depositoSchema'],['rendiciones','nuevo','rendicionSchema'],['cierres-diarios','nuevo','cierreDiarioSchema'],
  ['cajas','estado','estadoCajaSchema'],['turnos','cierre','cierreSchema'],['turnos','retiros','retiroSchema'],['turnos','cobros','cobroSchema'],['turnos','reintegros','reintegroSchema'],['turnos','anulaciones-venta','anulacionSchema'],
  ['movimientos','confirmar','confirmarMovimientoSchema'],['movimientos','cancelar','accionSchema'],['movimientos','correccion','compensarSchema'],['arqueos','contar','contarSchema'],['arqueos','aprobar','accionSchema'],['cierres','aprobar','aprobarCierreSchema'],['cierres','reabrir','accionSchema'],['remesas','aceptar','aceptarSchema'],['remesas','retorno','retornarRemesaSchema'],['remesas','custodia','custodiaSchema'],['custodias','aceptar','aceptarSchema'],['depositos','registrar','registrarDepositoSchema'],['depositos','confirmar','confirmarDepositoSchema'],['depositos','cancelar','accionSchema'],['rendiciones','confirmar','confirmarRendicionSchema'],['rendiciones','cancelar','accionSchema'],['incidencias','resolver','resolverSchema']
]
for(const [recurso, accion, schema] of contratos) test(`${recurso}/${accion}: formulario cumple el contrato estricto real del backend`, () => {
  const ruta = cfg.reconocerRutaCaja(`/caja/${recurso}/${accion === 'nuevo' ? 'nuevo' : `${id(4)}/${accion}`}`), o = op.obtenerOperacionCaja(ruta), campos = op.camposOperacionCaja(o,sesion)
  const d = Object.fromEntries(campos.map(c => [c.nombre, c.tipo === 'lista' ? [id(8)] : c.tipo === 'booleano' ? false : c.tipo === 'uuid' ? id(2) : c.tipo === 'monto' ? '100.01' : c.tipo === 'fecha' ? '2026-10-01' : c.tipo === 'instante' ? '2026-01-01T10:00' : c.opciones ? Object.keys(c.opciones)[0] : 'Referencia documentada']))
  if('destinoTurnoId' in d) d.destinoTurnoId = ''
  if('codigo' in d) d.codigo = 'caj-01'
  assert.deepEqual(op.validarCamposCaja(campos,d),{})
  const datos = op.entradaOperacionCaja(o,campos,d,ruta.id ?? '',7,id(5),o.conteo ? [{valor:'1.00',cantidad:100}] : undefined)
  const validado = v[schema].safeParse(datos); assert.equal(validado.success,true, JSON.stringify(validado.error?.issues))
  assert.equal(datos.version, o.control || ruta.id && o.conteo ? 7 : undefined)
  if(d.ocurridoEn) assert.equal(datos.ocurridoEn,'2026-01-01T10:00:00-06:00')
  assert.equal(cfg.puedeRutaCaja(ruta,permisos),true); assert.equal(cfg.puedeRutaCaja(ruta,[]),false)
})
test('política conserva escala, versión y denominaciones autorizadas sin valores comerciales implícitos', () => {
  assert.equal(r.configuracionVaciaCaja().saldoMaximo,'')
  const d={sucursalId:id(1),motivo:'Política autorizada',configuracion:politica};assert.deepEqual(r.validarPoliticaCaja(d),{})
  assert.equal(v.politicaSchema.safeParse(r.entradaPoliticaCaja(d,4,id(5))).success,true)
  assert.ok(r.validarPoliticaCaja({...d,configuracion:{...politica,denominaciones:['1','1.00']}}).denominaciones)
  assert.ok(r.validarPoliticaCaja({...d,configuracion:{...politica,fondoMaximo:'10000.01'}}).fondoMaximo)
})

test('editar configuración exige lectura, configuración y alcance de sucursal', () => {
  const ruta = cfg.reconocerRutaCaja(`/caja/politicas/${id(4)}/editar`)
  assert.deepEqual(ruta, { recurso: 'politicas', modo: 'editar', id: id(4) })
  assert.equal(cfg.puedeRutaCaja(ruta, ['CAJA.POLITICAS.VER']), false)
  assert.equal(r.puedeEditarPoliticaCaja(id(1), sesion), true)
  assert.equal(r.puedeEditarPoliticaCaja(id(2), sesion), false)
  assert.equal(r.puedeEditarPoliticaCaja(id(2), { ...sesion, permisos: [...permisos, 'CAJA.ACCESO.CORPORATIVO'] }), true)
  for (const permiso of ['CAJA.POLITICAS.VER', 'CAJA.POLITICAS.CONFIGURAR']) {
    assert.equal(r.puedeEditarPoliticaCaja(id(1), { ...sesion, permisos: permisos.filter(p => p !== permiso) }), false)
  }
})

test('corregir denominaciones exige justificación también en el contrato del backend', () => {
  const datos = { sucursalId: id(1), motivo: '  Corrección de denominaciones por error de captura  ', configuracion: { ...politica, denominaciones: ['0.50', '1.00', '100.00'] } }
  const entrada = r.entradaPoliticaCaja(datos, 4, id(5))
  assert.deepEqual(r.validarPoliticaCaja(datos), {})
  assert.equal(entrada.motivo, datos.motivo.trim())
  assert.equal(entrada.version, 4)
  assert.equal(v.politicaSchema.safeParse(entrada).success, true)
  for (const motivo of ['', '   ', 'ab', 'a'.repeat(251)]) {
    assert.ok(r.validarPoliticaCaja({ ...datos, motivo }).motivo)
    assert.equal(v.politicaSchema.safeParse({ ...entrada, motivo }).success, false)
  }
})
test('aritmética GTQ exacta rechaza exponentes, negativos y exceso de escala', () => {
  assert.equal(r.decimalCaja(r.centavosCaja('9999999999999.99')),'9999999999999.99')
  assert.equal(r.decimalCaja(r.totalConteoCaja([{valor:'0.01',cantidad:'3'},{valor:'0.10',cantidad:'7'}])),'0.73')
  for(const monto of ['1e2','-1','1.001','10000000000000','NaN']) assert.equal(r.esMontoCaja(monto),false)
  assert.equal(r.esMontoCaja('0',true),false)
})
test('contingencia rechaza fecha inexistente y exige folio; transferencia exige destino exclusivo', () => {
  const campos=[{nombre:'ocurridoEn',tipo:'instante',opcional:true},{nombre:'folioContingencia',opcional:true,max:100}]
  for(const ocurridoEn of ['2026-02-30T12:00','2026-01-01T24:00','2099-01-01T12:00']) assert.ok(op.validarCamposCaja(campos,{ocurridoEn,folioContingencia:'Folio válido'}).ocurridoEn)
  assert.ok(op.validarCamposCaja(campos,{ocurridoEn:'2026-01-01T12:00',folioContingencia:''}).folioContingencia)
  assert.ok(op.validarCamposCaja([],{tipo:'TRANSFERENCIA',destinoTurnoId:''}).destinoTurnoId)
  assert.ok(op.validarCamposCaja([],{tipo:'RETIRO',destinoTurnoId:id(2)}).destinoTurnoId)
})
test('selecciones múltiples requieren fuentes únicas y al menos un origen para rendición', () => {
  const campos=[{nombre:'cobroIds',tipo:'lista',opcional:true},{nombre:'remesaIds',tipo:'lista',opcional:true}]
  assert.ok(op.validarCamposCaja(campos,{cobroIds:[],remesaIds:[]}).cobroIds)
  assert.ok(op.validarCamposCaja(campos,{cobroIds:[id(1),id(1)],remesaIds:[]}).cobroIds)
  assert.deepEqual(op.validarCamposCaja(campos,{cobroIds:[],remesaIds:[id(1)]}),{})
})
test('rutas cubren trece recursos y rechazan acciones y documentos inventados', () => {
  for(const recurso of cfg.recursosCaja) { assert.equal(cfg.reconocerRutaCaja(`/caja/${recurso}`).modo,'listado');assert.equal(cfg.reconocerRutaCaja(`/caja/${recurso}/${id(2)}`).modo,'detalle') }
  for(const ruta of ['/caja/cierres/nuevo','/caja/inventado','/caja/cajas/invalido','/caja/cajas/'+id(2)+'/borrar']) assert.equal(cfg.reconocerRutaCaja(ruta),null)
  assert.equal(cfg.reconocerRutaCaja('/caja').modo,'consolidado')
  assert.equal(cfg.puedeRutaCaja({recurso:'turnos',modo:'crear'},['CAJA.TURNOS.ABRIR']),false)
})
const documento = {id:id(4),sucursalId:id(1),creadoPorId:id(9),estado:'REGISTRADO',direccion:'ENTRADA',importe:'100.00',tipo:'INGRESO_EXTRAORDINARIO'}
const ruta = (recurso,operacion) => ({recurso,operacion,modo:'operacion',id:id(4)})
test('confirmación propia respeta umbral y egresos requieren otro aprobador', () => {
  const rel={politica, sucursalId:id(1)}
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('movimientos','confirmar'),documento,sesion,rel),true)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('movimientos','confirmar'),{...documento,importe:'100.01'},sesion,rel),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('movimientos','confirmar'),{...documento,direccion:'SALIDA'},sesion,rel),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('movimientos','confirmar'),{...documento,creadoPorId:id(8)},sesion),true)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('movimientos','confirmar'),{...documento,sucursalId:id(3)},sesion),false)
})
test('arqueo ciego solo permite contar al responsable y diferencia exige otro aprobador', () => {
  const d={...documento,estado:'PENDIENTE',responsableId:id(9)}
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('arqueos','contar'),d,sesion),true)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('arqueos','contar'),{...d,responsableId:id(8)},sesion),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('arqueos','aprobar'),{...d,estado:'CONTADO',diferencia:'-0.01'},sesion),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('arqueos','aprobar'),{...d,estado:'CONTADO',diferencia:'0.00'},sesion),true)
})
test('transferencia permite receptor del destino sin acceso corporativo al origen', () => {
  const d={...documento,sucursalId:id(3),estado:'RETIRADO',receptorId:id(9),custodioId:id(8),destinoTurnoId:id(6)}
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('remesas','aceptar'),d,sesion,{sucursalId:id(1)}),true)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('remesas','aceptar'),d,sesion,{sucursalId:id(3)}),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('remesas','custodia'),d,sesion,{sucursalId:id(1)}),false)
})
test('cierre con diferencia impide autoaprobación del autor y del cajero', () => {
  const d={...documento,estado:'PENDIENTE',diferencia:'-1.00',creadoPorId:id(8)}
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('cierres','aprobar'),d,sesion,{cajeroId:id(9)}),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('cierres','aprobar'),d,sesion,{cajeroId:id(7)}),true)
})
test('depósito separa transportista, registrador y verificador', () => {
  const d={...documento,estado:'REGISTRADO',responsableId:id(8),registradoPorId:id(9)}
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('depositos','confirmar'),d,sesion),false)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('depositos','confirmar'),{...d,registradoPorId:id(7)},sesion),true)
  assert.equal(op.puedeOperacionDocumentoCaja(ruta('depositos','cancelar'),d,sesion),false)
})
test('idempotencia conserva clave al reintentar y la renueva si cambia el contenido', () => {
  const a=r.claveCaja(null,{importe:'1.00'});assert.equal(r.claveCaja(a,{importe:'1.00'}),a);assert.notEqual(r.claveCaja(a,{importe:'2.00'}).clave,a.clave)
})
test('API transmite filtros estrictos, descarga privada y contexto ciego sin consultar saldos', async () => {
  const llamadas=[]
  const api=cargar(path.resolve(__dirname,'../src/modules/caja'),{'../../shared/api/cliente-api':{solicitarApi:async(ruta,op)=>{llamadas.push([ruta,op]);return {data:{denominaciones:['1.00']}}}},'../../shared/api/descargar-archivo-api':{descargarArchivoApi:async(ruta,op)=>llamadas.push([ruta,op])}})('caja-api.ts')
  const signal=new AbortController().signal;await api.contextoConteoArqueoCaja(id(4),signal)
  assert.equal(llamadas[0][0],`/caja/arqueos/${id(4)}/contexto-conteo`);assert.equal(llamadas[0][1].signal,signal)
  await api.exportarCaja('movimientos',{pagina:5,tamanoPagina:50,turnoId:id(2),desde:'2026-10-01'},'xlsx')
  const datos=llamadas[1][1].datos;assert.equal(v.exportarSchema.safeParse(datos).success,true);assert.equal(datos.filtros.pagina,undefined);assert.equal(datos.filtros.turnoId,id(2))
  await api.operarCaja(`/depositos/${id(4)}/confirmar`,'PATCH',{version:3});assert.equal(llamadas[2][1].method,'PATCH');assert.equal(llamadas[2][1].datos.version,3)
})
