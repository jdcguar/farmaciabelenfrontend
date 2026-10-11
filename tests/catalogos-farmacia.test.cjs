const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const cargador = require('./cargar-typescript.cjs')
const frontend = cargador(path.resolve(__dirname, '../src/modules/catalogos-farmacia'))
const backend = cargador(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/catalogos-farmacia'))
const { catalogos, camposDe } = frontend('catalogos.config.ts')
const reglas = frontend('catalogo-reglas.ts')
const { reconocerRutaCatalogo } = frontend('catalogo-rutas.ts')
const { validarImagenProducto, maximoImagenProductoBytes } = frontend('imagen-producto.ts')
const id = 'd75cfe2a-10d6-4ed6-8527-6308aa20b1b4'

// Conserva las dependencias de los hooks entre renders para comprobar el proveedor real.
function proveedorReferencias(obtenerReferencia) {
  let indice=0;const hooks=[];
  const memo=(fn,deps)=>{const i=indice++,previo=hooks[i];if(!previo||deps.some((d,j)=>!Object.is(d,previo.deps[j])))hooks[i]={deps,valor:fn()};return hooks[i].valor;};
  class ErrorApi extends Error {constructor(estadoHttp){super('Error de referencia');this.estadoHttp=estadoHttp;}}
  const {ReferenciasCatalogo}=cargador(path.resolve(__dirname,'../src/modules/catalogos-farmacia/components'),{
    react:{useMemo:memo,useCallback:(fn,deps)=>memo(()=>fn,deps),useRef:valor=>memo(()=>({current:valor}),[])},
    '../../../shared/seguridad/navegacion':{},'../../../shared/api/cliente-api':{ErrorApi},
    '../../../shared/components/selector/selector':{},'../catalogos.config':{},
    '../catalogo-api':{obtenerReferencia},'../catalogos.module.css':{default:{}},
    '../catalogo-contexto':{ContextoReferencias:{Provider:()=>null}},
  })('referencia-catalogo.tsx');
  return{ErrorApi,render(sesion){indice=0;return ReferenciasCatalogo({sesion,onNavegar:()=>{},children:null}).props.value.resolver;}};
}
test('referencias no repiten 403 al actualizar sesión o navegar; el cambio de permisos permite volver a consultar',async()=>{
  let llamadas=0;const p=proveedorReferencias(async()=>{llamadas++;throw new p.ErrorApi(403);});
  const sesion={usuarioId:'cajero',sucursal:{id:'sucursal',codigo:'SUC',nombre:'Sucursal'},permisos:['CATALOGOS.CLIENTES.VER','CAJA.MOVIMIENTOS.COBRAR']};
  const resolver=p.render(sesion),fallo=resolver('clientes',id);assert.equal(resolver('clientes',id),fallo);await assert.rejects(fallo);
  for(let i=0;i<30;i++){const siguiente=p.render({...sesion,sucursal:{...sesion.sucursal},permisos:[...sesion.permisos].reverse(),expiraEn:String(i)});assert.equal(siguiente,resolver);await assert.rejects(siguiente('clientes',id));}
  assert.equal(llamadas,1);
  const actualizado=p.render({...sesion,permisos:[...sesion.permisos,'NAVEGACION.CATALOGOS.CLIENTES.ACCEDER']});assert.notEqual(actualizado,resolver);await assert.rejects(actualizado('clientes',id));assert.equal(llamadas,2);
  const otro=p.render({...sesion,usuarioId:'otro-cajero'});await assert.rejects(otro('clientes',id));assert.equal(llamadas,3);
  const otraSucursal=p.render({...sesion,sucursal:{...sesion.sucursal,id:'otra'}});await assert.rejects(otraSucursal('clientes',id));assert.equal(llamadas,4);
});
test('referencias reintentan fallos transitorios y deduplican respuestas correctas',async()=>{
  let llamadas=0;const p=proveedorReferencias(async()=>{llamadas++;if(llamadas===1)throw new p.ErrorApi(500);return{id,codigo:'CLI',nombre:'Cliente',activo:true};});
  const sesion={usuarioId:'cajero',sucursal:{id:'sucursal',codigo:'SUC',nombre:'Sucursal'},permisos:[]},resolver=p.render(sesion);
  await assert.rejects(resolver('clientes',id));assert.equal((await resolver('clientes',id)).nombre,'Cliente');
  await p.render({...sesion})('clientes',id);assert.equal(llamadas,2);
  assert.equal((await resolver('sucursales','sucursal')).nombre,'Sucursal');assert.equal(llamadas,2);
});
test('Imagen de producto admite JPG, PNG y WebP hasta 5 MB y rechaza vacío, exceso y SVG', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validarImagenProducto({ type, size: maximoImagenProductoBytes }), null)
  assert.match(validarImagenProducto({ type: 'image/png', size: maximoImagenProductoBytes + 1 }), /5 MB/)
  assert.match(validarImagenProducto({ type: 'image/png', size: 0 }), /vacía/)
  assert.match(validarImagenProducto({ type: 'image/svg+xml', size: 100 }), /formato/)
})
test('Carga de imagen usa multipart y eliminación conserva la versión esperada', async () => {
  const solicitudes = []
  const api = cargador(path.resolve(__dirname, '../src/modules/catalogos-farmacia'), {
    '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones) => { solicitudes.push({ ruta, opciones }); return { data: { id, version: 8 } } } },
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async () => {} },
  })('catalogo-api.ts')
  const archivo = new File(['png'], 'referencia.png', { type: 'image/png' })
  await api.actualizarImagenProducto({ id, version: 7 }, archivo)
  const solicitud = solicitudes[0]
  assert.equal(solicitud.ruta, `/catalogos/productos/${id}/imagen`); assert.equal(solicitud.opciones.method, 'PUT')
  assert.ok(solicitud.opciones.datos instanceof FormData)
  assert.equal(solicitud.opciones.datos.get('version'), '7'); assert.equal(solicitud.opciones.datos.get('imagen').name, 'referencia.png')
  await api.eliminarImagenProducto({ id, version: 8 })
  assert.equal(solicitudes[1].opciones.method, 'DELETE'); assert.deepEqual(solicitudes[1].opciones.datos, { version: 8 })
  const datos = reglas.datosIniciales(catalogos.productos, { codigo: 'PR', nombre: 'Producto', imagenUrl: '/api/privada', imagenTipoMime: 'image/png' })
  assert.ok(!('imagenUrl' in reglas.entradaDe(catalogos.productos, datos)))
})
const identidad = { codigo: 'PRUEBA_01', nombre: 'Registro de prueba' }
const ejemplos = {
  productos: { tipo: 'MEDICAMENTO', unidadBaseId: id, formaFarmaceutica: 'Tableta', concentracion: '500 mg', condicionesConservacion: 'Lugar seco', principiosActivos: [{ principioActivoId: id, concentracion: '500 mg' }] },
  presentaciones: { productoId: id, unidadVentaId: id, cantidadBase: '10.000001' },
  'principios-activos': { codigoCas: '103-90-2' },
  unidades: { simbolo: 'mg', dimension: 'MASA', admiteDecimales: true },
  conversiones: { presentacionId: id, unidadOrigenId: id, unidadDestinoId: '752f33cc-57ae-4f91-a2a0-860148c92ea8', factor: '0.000001' },
  proveedores: { nit: '12345-6', razonSocial: 'Proveedor de prueba' },
  clientes: { tipo: 'IDENTIFICADO', nit: '12345-6', dpi: '1234567890123' },
  laboratorios: { pais: 'Guatemala', correo: 'Contacto@Ejemplo.com' },
  bodegas: { sucursalId: id, tipo: 'SUCURSAL' },
  ubicaciones: { bodegaId: id, tipo: 'CUARENTENA', condicionesConservacion: 'Separación de mercadería' },
  'precios-vigentes': { presentacionId: id, precio: '9999999999999.99', incluyeImpuestos: false },
}
const archivos = { productos: 'producto', presentaciones: 'presentacion', 'principios-activos': 'principio-activo', unidades: 'unidad', conversiones: 'conversion', proveedores: 'proveedor', clientes: 'cliente', laboratorios: 'laboratorio', bodegas: 'bodega', ubicaciones: 'ubicacion', 'precios-vigentes': 'precio-vigente' }
const esquemas = { productos: 'Producto', presentaciones: 'Presentacion', 'principios-activos': 'PrincipioActivo', unidades: 'Unidad', conversiones: 'Conversion', proveedores: 'Proveedor', clientes: 'Cliente', laboratorios: 'Laboratorio', bodegas: 'Bodega', ubicaciones: 'Ubicacion', 'precios-vigentes': 'PrecioVigente' }
for (const [clave, catalogo] of Object.entries(catalogos)) {
  test(`${clave}: el formulario y sus filtros cumplen los validadores reales del backend`, () => {
    const datos = { ...reglas.datosIniciales(catalogo), ...identidad, ...ejemplos[clave], activo: true, version: 'inyectada', estadoHomologacion: 'APROBADO' }
    assert.deepEqual(reglas.validarFormulario(catalogo, datos), {})
    const entrada = reglas.entradaDe(catalogo, datos)
    assert.equal(Object.hasOwn(entrada, 'activo'), false)
    assert.equal(Object.hasOwn(entrada, 'version'), false)
    assert.equal(Object.hasOwn(entrada, 'estadoHomologacion'), false)
    const validadores = backend(`${clave}/${archivos[clave]}.validator.ts`)
    const resultado = validadores[`crear${esquemas[clave]}Schema`].safeParse(entrada)
    assert.equal(resultado.success, true, JSON.stringify(resultado.error?.issues))
    const actualizacion = validadores[`actualizar${esquemas[clave]}Schema`].safeParse({ ...entrada, version: 2 })
    assert.equal(actualizacion.success, true, JSON.stringify(actualizacion.error?.issues))
    for (const filtro of catalogo.filtros) for (const opcion of filtro.opciones ?? []) {
      const resultadoFiltro = validadores[`consulta${esquemas[clave]}Schemas`].listar.safeParse({ [filtro.clave]: opcion.valor })
      assert.equal(resultadoFiltro.success, true, `${filtro.clave}=${opcion.valor}`)
    }
    assert.equal(new Set(camposDe(catalogo).map((campo) => campo.clave)).size, camposDe(catalogo).length)
  })
  test(`${clave}: rutas de listado, creación, detalle y edición exigen el permiso correspondiente`, () => {
    for (const [sufijo, vista, accion] of [['', 'listado', 'VER'], ['/nuevo', 'crear', 'CREAR'], [`/${id}`, 'detalle', 'VER'], [`/${id}/editar`, 'editar', 'ACTUALIZAR']]) {
      assert.deepEqual(reconocerRutaCatalogo(`/catalogos/${clave}${sufijo}`), { clave, vista, id: vista === 'detalle' || vista === 'editar' ? id : undefined, permiso: `CATALOGOS.${catalogo.permiso}.${accion}` })
    }
  })
}
test('Los decimales conservan exactamente sus cifras y rechazan cero, comas o exceso de escala', () => {
  const catalogo = catalogos['precios-vigentes']
  const datos = { ...reglas.datosIniciales(catalogo), ...identidad, ...ejemplos['precios-vigentes'] }
  assert.equal(reglas.entradaDe(catalogo, datos).precio, '9999999999999.99')
  for (const precio of ['0', '0.00', '12,25', '1.001', '1e3', '-1', '10000000000000']) assert.ok(reglas.validarFormulario(catalogo, { ...datos, precio }).precio, precio)
})
test('Medicamentos, productos controlados y composición repetida requieren correcciones', () => {
  const catalogo = catalogos.productos
  const datos = { ...reglas.datosIniciales(catalogo), ...identidad, ...ejemplos.productos, esControlado: true, requiereLote: false }
  assert.ok(reglas.validarFormulario(catalogo, datos).requiereReceta)
  assert.ok(reglas.validarFormulario(catalogo, datos).requiereLote)
  assert.ok(reglas.validarFormulario(catalogo, { ...datos, principiosActivos: [...datos.principiosActivos, ...datos.principiosActivos] })['principiosActivos.1.principioActivoId'])
})
test('Cliente genérico, proveedor CF y dirección sin municipio respetan sus reglas', () => {
  assert.ok(reglas.validarFormulario(catalogos.clientes, { ...reglas.datosIniciales(catalogos.clientes), ...identidad, tipo: 'GENERICO', nit: 'CF', telefono: '123' }).nit)
  assert.ok(reglas.validarFormulario(catalogos.proveedores, { ...reglas.datosIniciales(catalogos.proveedores), ...identidad, nit: 'CF', razonSocial: 'Proveedor' }).nit)
  assert.ok(reglas.validarFormulario(catalogos.clientes, { ...reglas.datosIniciales(catalogos.clientes), ...identidad, direccion: 'Zona 1' }).municipioId)
  assert.equal(reglas.puedeInactivarRegistro('clientes', { activo: true, tipo: 'GENERICO' }), false)
})
test('Los precios y conversiones iniciados no se editan y no se crean periodos retroactivos', () => {
  for (const clave of ['conversiones', 'precios-vigentes']) {
    assert.equal(reglas.puedeEditarRegistro(clave, { activo: true, vigenteDesde: reglas.fechaNegocio() }), false)
    const datos = { ...reglas.datosIniciales(catalogos[clave]), ...identidad, ...ejemplos[clave], vigenteDesde: '2020-01-01', vigenteHasta: '2019-01-01' }
    const errores = reglas.validarFormulario(catalogos[clave], datos)
    assert.ok(errores.vigenteDesde); assert.ok(errores.vigenteHasta)
  }
})
test('Rutas ajenas o malformadas no abren un catálogo farmacéutico', () => {
  for (const ruta of ['/catalogos/estados', '/catalogos/__proto__', '/catalogos/productos/nuevo/editar', '/catalogos/productos/id/otra', '/catalogos/productos/id/editar/otra']) assert.equal(reconocerRutaCatalogo(ruta), null)
})
test('Mutaciones envían la versión, filtros booleanos correctos y geografía sin depender de activo en el DTO', async () => {
  const solicitudes = []
  const api = cargador(path.resolve(__dirname, '../src/modules/catalogos-farmacia'), {
    '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones = {}) => {
      solicitudes.push({ ruta, opciones })
      if (ruta === '/ubicaciones/departamentos') return { data: [{ id, codigo: '01', nombre: 'Guatemala' }] }
      if (ruta.includes('/municipios')) return { data: [{ id, codigo: '0101', nombre: 'Guatemala' }] }
      return { data: { id } }
    } },
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async (ruta, opciones) => { solicitudes.push({ ruta, opciones }) } },
  })('catalogo-api.ts')
  await api.guardarRegistro('unidades', { codigo: 'UN', nombre: 'Unidad' }, { id, version: 7 })
  assert.equal(solicitudes[0].opciones.method, 'PUT'); assert.equal(solicitudes[0].opciones.datos.version, 7)
  await api.inactivarRegistro('unidades', { id, version: 7 }, 'Corrección')
  assert.deepEqual(solicitudes[1].opciones.datos, { version: 7, motivo: 'Corrección' })
  await api.exportarCatalogo('productos', { pagina: 9, tamanoPagina: 50, activo: false, busqueda: 'AB' }, 'xlsx')
  assert.deepEqual(solicitudes[2].opciones.datos, { activo: false, busqueda: 'AB', formato: 'xlsx' })
  assert.equal(api.consultaUrl({ activo: false, busqueda: undefined }), 'activo=false')
  const municipios = await api.cargarMunicipios()
  assert.equal(municipios.length, 1); assert.equal(municipios[0].activo, true); assert.match(municipios[0].nombre, /Guatemala/)
})
