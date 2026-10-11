// Servidor opcional para QA visual. Solo escucha en localhost y conserva datos ficticios en memoria.
// No importa entidades, conexiones, migraciones ni seeds del backend.
const http = require('node:http')
const path = require('node:path')
const cargador = require('./cargar-typescript.cjs')
const frontend = cargador(path.resolve(__dirname, '../src/modules/catalogos-farmacia'))
const { catalogos } = frontend('catalogos.config.ts')
const { datosIniciales, entradaDe, fechaNegocio } = frontend('catalogo-reglas.ts')
const id = (numero) => `00000000-0000-4000-8000-${String(numero).padStart(12, '0')}`
const sucursal = { id: id(90), codigo: 'QA_CENTRAL', nombre: 'Sucursal de demostración' }
const fecha = new Date(); fecha.setUTCDate(fecha.getUTCDate() + 3)
const futuro = fecha.toISOString().slice(0, 10)
const valores = {
  productos: { nombre: 'Paracetamol 500 mg', formaFarmaceutica: 'Tableta', concentracion: '500 mg', laboratorioId: id(8), unidadBaseId: id(4), condicionesConservacion: 'Conservar en lugar seco, a temperatura ambiente.', principiosActivos: [{ principioActivoId: id(3), concentracion: '500 mg' }], permiteFraccionamiento: true },
  presentaciones: { nombre: 'Paracetamol · caja de 10 tabletas', productoId: id(1), unidadVentaId: id(40), cantidadBase: '10.000000', codigoBarras: 'QA-123456', fraccionable: true },
  'principios-activos': { nombre: 'Paracetamol', codigoCas: '103-90-2' },
  unidades: { nombre: 'Tableta', simbolo: 'tab', dimension: 'CONTEO', admiteDecimales: false },
  conversiones: { nombre: 'Caja a tableta', presentacionId: id(2), unidadOrigenId: id(40), unidadDestinoId: id(4), factor: '10.000000', vigenteDesde: futuro },
  proveedores: { nombre: 'Proveedor de demostración', nit: '1234567', razonSocial: 'Distribuidora de demostración', contacto: 'Contacto de prueba', telefono: '5555-0000', correo: 'ejemplo@example.com', estadoHomologacion: 'EN_EVALUACION' },
  clientes: { nombre: 'Cliente de demostración', tipo: 'IDENTIFICADO', nit: 'CF', municipioId: id(92), direccion: 'Dirección ficticia' },
  laboratorios: { nombre: 'Laboratorio de demostración', pais: 'Guatemala', correo: 'laboratorio@example.com' },
  bodegas: { nombre: 'Bodega central', sucursalId: sucursal.id, tipo: 'CENTRAL' },
  ubicaciones: { nombre: 'Estante A1', bodegaId: id(9), tipo: 'ALMACENAMIENTO', condicionesConservacion: 'Ambiente seco y ventilado.' },
  'precios-vigentes': { nombre: 'Precio de caja de paracetamol', presentacionId: id(2), precio: '18.50', vigenteDesde: fechaNegocio(), incluyeImpuestos: true },
}
const registros = {}
for (const [indice, [clave, catalogo]] of Object.entries(catalogos).entries()) {
  const entrada = entradaDe(catalogo, { ...datosIniciales(catalogo), ...valores[clave], codigo: `QA_${indice + 1}` })
  registros[clave] = [{ ...entrada, ...(clave === 'proveedores' ? { estadoHomologacion: 'EN_EVALUACION' } : {}), id: id(indice + 1), activo: true, version: 1, creadoEn: new Date().toISOString(), actualizadoEn: null, inactivadoEn: null, motivoInactivacion: null }]
}
registros.unidades.push({ ...registros.unidades[0], id: id(40), codigo: 'QA_CAJA', nombre: 'Caja', simbolo: 'cja', dimension: 'EMPAQUE' })
for (let numero = 1; numero <= 60; numero++) registros.productos.push({ ...registros.productos[0], id: id(100 + numero), codigo: `QA_P${numero}`, nombre: `Producto de demostración ${String(numero).padStart(2, '0')}` })
let consecutivo = 500
const permisos = Object.values(catalogos).flatMap((item) => ['VER', 'CREAR', 'ACTUALIZAR', 'INACTIVAR', 'VER_AUDITORIA', 'CORPORATIVO', 'HOMOLOGAR'].map((accion) => `CATALOGOS.${item.permiso}.${accion}`))
const auditorias = new Map()
const imagenes = new Map()
let fallarImagenUnaVez = process.env.QA_FALLAR_PRIMERA_IMAGEN === '1'
const servidor = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5181')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  const devolver = (data, estado = 200) => { res.statusCode = estado; res.end(JSON.stringify({ success: true, data })) }
  const fallar = (message, estado = 404) => { res.statusCode = estado; res.end(JSON.stringify({ success: false, error: { code: 'QA_ERROR', message } })) }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  const url = new URL(req.url, 'http://127.0.0.1:4319')
  if (url.pathname === '/api/autenticacion/mi-sesion') return devolver({ usuarioId: id(99), nombreUsuario: 'demo.vistas', empleadoId: id(98), empleadoCodigo: 'QA', empleadoNombre: 'Usuario de demostración', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-12-31T23:59:59Z', sucursal, roles: [{ id: id(97), codigo: 'QA', nombre: 'Demostración' }], permisos: [...permisos, 'ORGANIZACION.SUCURSALES.VER'] })
  if (url.pathname === '/api/sucursales/mantenimiento') return devolver({ items: [{ ...sucursal, activo: true }], pagina: 1, tamanoPagina: 50, total: 1, totalPaginas: 1 })
  if (url.pathname === `/api/sucursales/${sucursal.id}`) return devolver({ ...sucursal, activo: true })
  if (url.pathname === '/api/ubicaciones/departamentos') return devolver([{ id: id(91), codigo: '01', nombre: 'Guatemala' }])
  if (url.pathname === `/api/ubicaciones/departamentos/${id(91)}/municipios`) return devolver([{ id: id(92), codigo: '0101', nombre: 'Guatemala' }])
  const coincidencia = url.pathname.match(/^\/api\/catalogos\/([^/]+)(?:\/(.*))?$/)
  if (!coincidencia || !registros[coincidencia[1]]) return fallar('Ruta no incluida en la demostración.')
  const clave = coincidencia[1]; const resto = coincidencia[2]
  if (!resto && req.method === 'GET') {
    const filtros = Object.fromEntries(url.searchParams)
    const pagina = Number(filtros.pagina || 1); const tamanoPagina = Number(filtros.tamanoPagina || 50)
    const consulta = (filtros.busqueda || '').toLowerCase()
    let items = registros[clave].filter((item) => (!consulta || `${item.nombre} ${item.codigo}`.toLowerCase().includes(consulta)) && (filtros.activo === undefined || item.activo === (filtros.activo === 'true')) && Object.entries(filtros).filter(([campo]) => ['productoId', 'presentacionId', 'laboratorioId', 'unidadBaseId', 'bodegaId', 'sucursalId', 'tipo', 'estadoHomologacion', 'unidadOrigenId', 'unidadDestinoId'].includes(campo)).every(([campo, valor]) => item[campo] === valor))
    const orden = filtros.orden || 'nombre'
    items.sort((a, b) => String(a[orden === 'estado' ? 'activo' : orden]).localeCompare(String(b[orden === 'estado' ? 'activo' : orden]), 'es') * (filtros.direccion === 'desc' ? -1 : 1))
    const total = items.length; items = items.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina)
    return devolver({ items: items.map((item) => { if (clave === 'clientes') return { id: item.id, codigo: item.codigo, nombre: item.nombre, activo: item.activo, tipo: item.tipo, version: item.version, descripcion: null }; if (clave === 'productos') { const { principiosActivos: _composicion, ...resumen } = item; return resumen } return item }), pagina, tamanoPagina, total, totalPaginas: Math.ceil(total / tamanoPagina) })
  }
  if (resto?.startsWith('actual/')) {
    const item = registros[clave].find((p) => p.presentacionId === resto.slice(7) && p.activo && p.vigenteDesde <= url.searchParams.get('fecha') && (!p.vigenteHasta || p.vigenteHasta >= url.searchParams.get('fecha')))
    return item ? devolver(item) : fallar('No existe un precio vigente en esa fecha.')
  }
  const item = registros[clave].find((registro) => registro.id === resto?.split('/')[0])
  if (clave === 'productos' && resto?.endsWith('/imagen')) {
    if (!item) return fallar('No existe el producto.')
    if (req.method === 'GET') {
      const imagen = imagenes.get(item.id)
      if (!imagen) return fallar('No existe una imagen.')
      res.setHeader('Content-Type', imagen.tipo); res.setHeader('Cache-Control', 'private, no-store'); res.end(imagen.contenido); return
    }
    const trozos = []; for await (const trozo of req) trozos.push(trozo)
    let datos
    try {
      datos = req.method === 'PUT'
        ? await new Request('http://127.0.0.1:4319', { method: 'POST', headers: { 'Content-Type': req.headers['content-type'] }, body: Buffer.concat(trozos) }).formData()
        : JSON.parse(Buffer.concat(trozos).toString())
    } catch { return fallar('Archivo inválido.', 400) }
    const version = Number(req.method === 'PUT' ? datos.get('version') : datos.version)
    if (version !== item.version) return fallar('Otro usuario modificó el producto.', 409)
    if (req.method === 'PUT') {
      if (fallarImagenUnaVez) { fallarImagenUnaVez = false; return fallar('Fallo de imagen simulado para verificar el reintento.', 503) }
      const archivo = datos.get('imagen')
      if (!archivo || typeof archivo.arrayBuffer !== 'function') return fallar('Seleccione una imagen.', 400)
      imagenes.set(item.id, { tipo: archivo.type, contenido: Buffer.from(await archivo.arrayBuffer()) })
      Object.assign(item, { imagenUrl: `/api/catalogos/productos/${item.id}/imagen`, imagenTipoMime: archivo.type, imagenTamanoBytes: archivo.size })
    } else if (req.method === 'DELETE') {
      imagenes.delete(item.id); Object.assign(item, { imagenUrl: null, imagenTipoMime: null, imagenTamanoBytes: null })
    } else return fallar('Método inválido.', 405)
    item.version++; item.actualizadoEn = new Date().toISOString(); return devolver(item)
  }
  if (req.method === 'GET') {
    if (!item) return fallar('No existe el registro.')
    if (resto.endsWith('/auditoria')) {
      const items = auditorias.get(item.id) || [{ id: id(700), usuarioNombre: 'demo.vistas', sucursal, tipoOperacion: 'CREAR', versionEntidad: 1, resumen: 'Creación de demostración', ocurridoEn: item.creadoEn, detalles: [{ id: id(701), nombrePropiedad: 'nombre', etiquetaPropiedad: 'Nombre', tipoDato: 'texto', valorAnterior: null, valorNuevo: item.nombre, orden: 1 }] }]
      return devolver({ items, pagina: 1, tamanoPagina: 50, total: items.length, totalPaginas: 1 })
    }
    return devolver(item)
  }
  let datos
  try { const trozos = []; for await (const trozo of req) trozos.push(trozo); datos = JSON.parse(Buffer.concat(trozos).toString()) } catch { return fallar('JSON inválido.', 400) }
  if (resto === 'exportaciones') return fallar('La generación del archivo pertenece al backend real. Los contratos de exportación se verifican en las pruebas.', 501)
  if (!resto && req.method === 'POST') {
    const creado = { ...datos, ...(clave === 'proveedores' ? { estadoHomologacion: 'EN_EVALUACION' } : {}), id: id(++consecutivo), activo: true, version: 1, creadoEn: new Date().toISOString(), actualizadoEn: null, inactivadoEn: null, motivoInactivacion: null }
    registros[clave].push(creado); return devolver(creado, 201)
  }
  if (!item) return fallar('No existe el registro.')
  if (datos.version !== item.version) return fallar('Otro usuario modificó el registro. Actualice los datos.', 409)
  if (req.method === 'PUT') Object.assign(item, datos)
  else if (resto.endsWith('/inactivar')) { item.activo = false; item.motivoInactivacion = datos.motivo; item.inactivadoEn = new Date().toISOString() }
  else if (resto.endsWith('/homologacion')) item.estadoHomologacion = datos.estado
  else if (resto.endsWith('/cerrar-vigencia')) item.vigenteHasta = datos.vigenteHasta
  else return fallar('Acción no incluida.')
  item.version++; item.actualizadoEn = new Date().toISOString()
  if (resto.endsWith('/inactivar')) { res.statusCode = 204; res.end(); return }
  devolver(item)
})
servidor.listen(4319, '127.0.0.1', () => console.log('QA visual: http://127.0.0.1:4319 (solo datos ficticios en memoria)'))
