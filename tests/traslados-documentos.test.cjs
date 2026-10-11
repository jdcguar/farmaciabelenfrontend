const test=require('node:test'), assert=require('node:assert/strict'), path=require('node:path'), cargar=require('./cargar-typescript.cjs')
const raiz=path.resolve(__dirname,'../src/modules/traslados'), f=cargar(raiz), cfg=f('traslado.config.ts'), reglas=f('traslado-documentos-reglas.ts')
const schemas=cargar(path.resolve(__dirname,'../../../Backend/FarmaciaBelenBackend/src/modules/traslados'))('traslado.validator.ts')
const id='10000000-0000-4000-8000-000000000300'

test('comprobantes individuales descargan PDF del registro correcto sin filtros ni cuerpos de exportación',async()=>{
  const descargas=[], api=cargar(raiz,{
    '../../shared/api/descargar-archivo-api':{descargarArchivoApi:async(url,opciones)=>descargas.push({url,opciones})},
    '../../shared/api/cliente-api':{},
  })('traslado-api.ts')
  for(const recurso of ['traslados','despachos','recepciones']) {
    await api.generarComprobanteTrasladoPdf(recurso,id)
    const d=descargas.at(-1)
    assert.equal(d.url,recurso==='traslados'?`/traslados/${id}/pdf`:`/traslados/${recurso}/${id}/pdf`)
    assert.deepEqual(d.opciones,{method:'GET',nombreArchivoAlternativo:`comprobante-${recurso}-${id}.pdf`})
  }
})

test('botón comunica carga, impide clics duplicados y permite reintentar tras un error',async()=>{
  const React=require('react'), estados=[], refs=[];let indice=0, indiceRef=0, solicitudes=0, resolver
  const ErrorTraslado=()=>null
  const componente=cargar(raiz,{
    react:{...React,useState:inicial=>{const i=indice++;if(!(i in estados))estados[i]=inicial;return [estados[i],v=>{estados[i]=v}]},useRef:inicial=>{const i=indiceRef++;return refs[i]??(refs[i]={current:inicial})}},
    '../../../assets/acciones/pdf.png':{default:'pdf.png'},'../traslado.module.css':{default:{}},
    './traslado-campo':{ErrorTraslado},'../traslado-api':{generarComprobanteTrasladoPdf:()=>{solicitudes++;return new Promise((_resolve,reject)=>{resolver=reject})}},
  })('components/boton-comprobante-traslado.tsx').BotonComprobanteTraslado
  const render=()=>{indice=0;indiceRef=0;return componente({recurso:'traslados',id,referencia:'traslado TRA-01'})}
  const elemento=render(), boton=elemento.props.children[0], primera=boton.props.onClick()
  await boton.props.onClick();assert.equal(solicitudes,1)
  const pendiente=render().props.children[0];assert.equal(pendiente.props.disabled,true);assert.equal(pendiente.props['aria-busy'],true)
  assert.match(pendiente.props['aria-label'],/TRA-01/)
  const fallo=new Error('Acceso no autorizado');resolver(fallo);await primera
  const final=render();assert.equal(final.props.children[0].props.disabled,false);assert.equal(final.props.children[1].props.error,fallo)
  const segunda=final.props.children[0].props.onClick();assert.equal(solicitudes,2);resolver(fallo);await segunda
})
test('listados independientes y detalles conservan rutas y exigen VER, sin concederlo por CREAR',()=>{
  for(const recurso of ['despachos','recepciones']) {
    const ruta=cfg.reconocerRutaTraslado('/traslados/'+recurso);assert.equal(ruta.modo,recurso)
    assert.equal(cfg.puedeRutaTraslado(ruta,['TRASLADOS.OPERACIONES.VER']),true)
    assert.equal(cfg.puedeRutaTraslado(ruta,['TRASLADOS.OPERACIONES.CREAR','TRASLADOS.ACCESO.CORPORATIVO']),false)
    assert.equal(cfg.reconocerRutaTraslado('/traslados/'+recurso+'/'+id).modo,recurso==='despachos'?'despacho':'recepcion')
  }
})
test('URL usa estados del documento, UUID válidos y rangos coherentes sin filtros ajenos',()=>{
  const c=reglas.criteriosDocumentoTraslado('recepciones',`?estado=CONFIRMADA&trasladoId=${id}&despachoId=${id}&prioridad=URGENTE&desde=2026-10-01&hasta=2026-10-06&pagina=9&autoridad=admin`)
  assert.equal(schemas.consultaRecepcionesSchema.safeParse(c).success,true);assert.equal(c.estado,'CONFIRMADA');assert.equal(c.despachoId,id);assert.equal(c.pagina,undefined)
  assert.deepEqual(reglas.criteriosDocumentoTraslado('despachos','?estado=CONFIRMADA&trasladoId=invalido&despachoId='+id+'&desde=2026-10-06&hasta=2026-10-01'),{})
  assert.deepEqual(reglas.criteriosDocumentoTraslado('recepciones','?estado=RECIBIDO&desde=2026-02-30&hasta=ayer'),{})
})
test('contratos limitan páginas y mantienen estados distintos de traslado/despacho/recepción',()=>{
  for(const schema of [schemas.consultaDespachosSchema,schemas.consultaRecepcionesSchema]) {
    for(const tamanoPagina of [50,100,150,200])assert.equal(schema.safeParse({tamanoPagina}).success,true)
    for(const c of [{pagina:0},{tamanoPagina:201},{trasladoId:'x'},{estado:'SOLICITADO'},{desde:'2026-10-07',hasta:'2026-10-01'},{usuarioId:id}])assert.equal(schema.safeParse(c).success,false)
  }
  assert.equal(schemas.consultaDespachosSchema.safeParse({estado:'EN_TRANSITO',despachoId:id}).success,false)
  assert.equal(schemas.consultaRecepcionesSchema.safeParse({estado:'REGISTRADA',despachoId:id}).success,true)
})
test('consultas API paginan el conjunto y propagan AbortSignal; exportación excluye página y tamaño',async()=>{
  const llamadas=[], descargas=[], api=cargar(raiz,{
    '../../shared/api/cliente-api':{solicitarApi:async(url,opciones)=>{llamadas.push({url,opciones});return {success:true,data:{items:[],pagina:2,total:63}}}},
    '../../shared/api/descargar-archivo-api':{descargarArchivoApi:async(url,opciones)=>{descargas.push({url,opciones})}}
  })('traslado-api.ts'), c={estado:'REGISTRADA',trasladoId:id,despachoId:id,pagina:2,tamanoPagina:50}, controlador=new AbortController()
  assert.equal((await api.listarDocumentosTraslado('recepciones',c,controlador.signal)).total,63)
  assert.equal(llamadas[0].opciones.signal,controlador.signal);assert.ok(llamadas[0].url.startsWith('/traslados/recepciones?'))
  assert.equal(new URLSearchParams(llamadas[0].url.split('?')[1]).get('pagina'),'2')
  await api.exportarDocumentosTraslado('recepciones',c,'xlsx')
  assert.equal(descargas[0].url,'/traslados/recepciones/exportaciones');assert.equal(descargas[0].opciones.method,'POST')
  assert.deepEqual(descargas[0].opciones.datos,{estado:'REGISTRADA',trasladoId:id,despachoId:id,formato:'xlsx'})
  assert.equal(schemas.exportarRecepcionesSchema.safeParse(descargas[0].opciones.datos).success,true)
})
