const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),cargar=require('./cargar-typescript.cjs')
const raiz=path.resolve(__dirname,'../src/modules/inventario/costeo'),cfg=cargar(raiz)('costeo.config.ts'),llamadas=[]
const api=cargar(raiz,{'../../../shared/api/cliente-api':{solicitarApi:async(ruta,opciones)=>{llamadas.push({ruta,opciones});return{success:true,data:{items:[],total:0,pagina:1,tamanoPagina:50,totalPaginas:0}}}},'../../../shared/api/descargar-archivo-api':{descargarArchivoApi:async(ruta,opciones)=>llamadas.push({ruta,opciones})}})('costeo-api.ts')
test('las cinco vistas pertenecen a módulos existentes y reconocen filtros sin confundir detalles',()=>{
 for(const [recurso,c] of Object.entries(cfg.recursosCosteo)){assert.equal(cfg.reconocerRutaCosteo(c.ruta+'?pagina=2'),recurso);assert.ok(['inventario','compras','catalogos','ventas'].includes(c.grupo));assert.equal(cfg.reconocerRutaCosteo(c.ruta+'/otro'),null)}
 assert.equal(cfg.reconocerRutaCosteo('/ventas/123'),null)
})
test('permisos distinguen consulta, revisión de precios y reposición corporativa',()=>{
 for(const [r,c] of Object.entries(cfg.recursosCosteo)){assert.equal(cfg.puedeCosteo(r,[]),false);assert.equal(cfg.puedeCosteo(r,[c.permiso]),r!=='reposiciones')}
 assert.equal(cfg.puedeCosteo('reposiciones',['COMPRAS.REPOSICION.VER','COMPRAS.ACCESO.CORPORATIVO']),true)
})
test('costo desconocido permanece pendiente y cero documentado se distingue',()=>{assert.equal(cfg.mostrarCosto(null,true),'Pendiente');assert.equal(cfg.mostrarCosto('0.000000',true),'Q 0.000000');assert.equal(cfg.mostrarCosto('999999999.123456',true),'Q 999999999.123456')})
test('consulta preserva paginación, filtros y cancelación',async()=>{const signal=new AbortController().signal;await api.listarCosteo('ventas',{pagina:2,tamanoPagina:100,ventaId:'venta-demo',desde:'2026-10-01'},signal);const r=llamadas.at(-1);assert.match(r.ruta,/^\/ventas\/costos\?/);assert.match(r.ruta,/pagina=2/);assert.match(r.ruta,/ventaId=venta-demo/);assert.equal(r.opciones.signal,signal)})
test('aprobación envía versión y evidencia; no vuelve a calcular ni enviar precio',async()=>{const d={version:7,claveIdempotencia:'clave-demo',motivo:'Revisión',evidencia:'Acta'};await api.operarCosteo('sugerencias',d,'sugerencia-demo');const r=llamadas.at(-1);assert.equal(r.ruta,'/catalogos/precios-vigentes/sugerencias/sugerencia-demo/aprobar');assert.equal(r.opciones.method,'PATCH');assert.deepEqual(r.opciones.datos,d);assert.equal('precio' in r.opciones.datos,false)})
test('exportación conserva filtros y excluye límites de página',async()=>{await api.exportarCosteo('valoracion',{pagina:2,tamanoPagina:100,sucursalId:'sucursal-demo'},'xlsx');assert.deepEqual(llamadas.at(-1).opciones.datos,{sucursalId:'sucursal-demo',formato:'xlsx'})})
test('generación consulta reposiciones bajo su propio permiso de precios',async()=>{await api.reposicionesParaSugerir('presentacion-demo');assert.equal(llamadas.at(-1).ruta,'/catalogos/precios-vigentes/sugerencias/reposiciones?presentacionId=presentacion-demo')})
