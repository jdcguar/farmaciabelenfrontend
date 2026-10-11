// Entrada exclusiva de QA. Importa la aplicación real y simula HTTP en memoria.
// No está incluida en el build, no usa Oracle ni permite fetch al backend real.
import { vistas } from '../../src/modules/inventario/inventario.config.ts'
const qa = new URLSearchParams(location.search)
const rutaInicial = qa.get('ruta') || '/inventario/existencias'
const uuid = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const ids = { sucursal: uuid(1), presentacion: uuid(2), unidad: uuid(3), ubicacion: uuid(4), lote: uuid(5), existencia: uuid(6), movimiento: uuid(7), conteo: uuid(8), reserva: uuid(9), bloqueo: uuid(10), cuarentena: uuid(11), kardex: uuid(12), bodega: uuid(13), producto: uuid(14), proveedor: uuid(15) }
const base = { version: 1, creadoEn: '2026-10-05T15:00:00Z', actualizadoEn: null, creadoPorId: uuid(99) }
const metadatos = { sucursalId: ids.sucursal, presentacionId: ids.presentacion, ubicacionId: ids.ubicacion, loteId: ids.lote }
const registros = {
  lotes: [{ ...base, id: ids.lote, presentacionId: ids.presentacion, numero: 'LOT-2026-001', fechaIngreso: '2026-10-01', fechaFabricacion: '2025-06-01', fechaVencimiento: '2027-06-01', proveedorId: ids.proveedor, referenciaOrigen: 'Factura de apertura' }],
  existencias: [{ ...base, ...metadatos, id: ids.existencia, cantidadBase: '150.000000', condicion: 'APTA', secuencia: 1 }],
  movimientos: [{ ...base, id: ids.movimiento, sucursalId: ids.sucursal, tipo: 'CARGA_INICIAL', estado: 'PENDIENTE', referencia: 'INV-APERTURA-2026', fechaCorte: '2026-10-01', motivo: 'Registro del inventario de apertura', evidencia: 'Conteo aprobado por el responsable', conteoId: null, lineas: [{ id: uuid(20), presentacionId: ids.presentacion, loteId: ids.lote, origenExistenciaId: null, destinoUbicacionId: ids.ubicacion, condicionDestino: 'APTA', unidadId: ids.unidad, cantidadOriginal: '150.000000', cantidadBase: '150.000000', costeUnitarioBase: '0.750000', costeEstado: 'CONOCIDO' }] }],
  conteos: [{ ...base, id: ids.conteo, sucursalId: ids.sucursal, ubicacionId: ids.ubicacion, estado: 'ABIERTO', referencia: 'CONTEO-OCT-2026', motivo: 'Verificación del stock físico', evidencia: 'Acta del responsable de inventario', lineas: [{ id: uuid(21), existenciaId: ids.existencia, esperadaBase: '150.000000', contadaBase: null, diferenciaBase: null, evidencia: null }], ajustes: [] }],
  reservas: [{ ...base, id: ids.reserva, sucursalId: ids.sucursal, presentacionId: ids.presentacion, cantidadBase: '20.000000', estado: 'ACTIVA', estadoEfectivo: 'ACTIVA', expiraEn: '2099-10-06T18:00:00Z', referencia: 'PEDIDO-RESERVA-001', utilizable: false, cantidadAsignadaBase: '0.000000', incidencias: [], asignaciones: [] }],
  bloqueos: [{ ...base, id: ids.bloqueo, sucursalId: ids.sucursal, alcance: 'PRODUCTO', objetivoId: ids.producto, clase: 'OPERATIVO', estado: 'ACTIVO', motivo: 'Revisión de documentación', evidencia: 'Acta de inspección de mercancía' }],
  cuarentenas: [{ ...base, ...metadatos, id: ids.cuarentena, existenciaId: ids.existencia, detalleId: uuid(20), cantidadBase: '5.000000', resueltoBase: '0.000000', estado: 'ABIERTA', motivo: 'Revisión de aptitud sanitaria', evidencia: 'Informe del responsable técnico' }],
  kardex: [{ ...base, ...metadatos, id: ids.kardex, existenciaId: ids.existencia, movimientoId: ids.movimiento, detalleId: uuid(20), tipo: 'CARGA_INICIAL', direccion: 'ENTRADA', entradaBase: '150.000000', salidaBase: '0.000000', saldoBase: '150.000000', cantidadBase: '150.000000', secuencia: 1, ocurridoEn: base.creadoEn, referencia: 'INV-APERTURA-2026' }],
}
if (qa.get('clase') === 'SANITARIO') registros.bloqueos[0].clase = 'SANITARIO'
const catalogos = {
  presentaciones: [{ id: ids.presentacion, codigo: 'PRES-001', nombre: 'Paracetamol 500 mg · Tableta', productoId: ids.producto }],
  productos: [{ id: ids.producto, codigo: 'PROD-001', nombre: 'Paracetamol', unidadBaseId: ids.unidad }],
  unidades: [{ id: ids.unidad, codigo: 'UND', nombre: 'Unidad', simbolo: 'ud' }],
  ubicaciones: [{ id: ids.ubicacion, codigo: 'EST-A01', nombre: 'Estante A · Nivel 1', bodegaId: ids.bodega, tipo: 'ALMACENAMIENTO' }],
  bodegas: [{ id: ids.bodega, codigo: 'BOD-001', nombre: 'Bodega principal', sucursalId: ids.sucursal }],
  proveedores: [{ id: ids.proveedor, codigo: 'PROV-001', nombre: 'Distribuidora de prueba' }],
}
if (rutaInicial.startsWith('/inventario/cuarentenas')) {
  catalogos.ubicaciones.push({ id: uuid(17), codigo: 'CUAR-01', nombre: 'Zona de cuarentena', bodegaId: ids.bodega, tipo: 'CUARENTENA' })
  registros.existencias.push({ ...base, ...metadatos, id: uuid(18), ubicacionId: uuid(17), cantidadBase: '5.000000', condicion: 'CUARENTENA', secuencia: 1 })
  registros.cuarentenas[0].ubicacionId = uuid(17); registros.cuarentenas[0].existenciaId = uuid(18)
}
Object.values(catalogos).forEach(items => items.forEach(r => { r.activo = true; r.version = 1 }))
const sucursal = { id: ids.sucursal, codigo: 'SUC-001', nombre: 'Sucursal Central (prueba)' }
const empleado = { id: uuid(98), codigo: 'EMP-QA', primerNombre: 'María', segundoNombre: null, tercerNombre: null, primerApellido: 'Pérez', segundoApellido: null, apellidoCasada: null, dpi: '0000000000000', fechaNacimiento: '1995-01-01', correo: 'operador@example.test', telefono: '00000000', estado: 'ACTIVO', version: 1, fotoUrl: null, puesto: { id: uuid(90), codigo: 'AUX', nombre: 'Auxiliar de farmacia', departamentoOrganizacional: { id: uuid(91), nombre: 'Operaciones' } }, asignacionActual: { id: uuid(92), sucursalId: sucursal.id, sucursalCodigo: sucursal.codigo, sucursalNombre: sucursal.nombre, fechaInicio: '2026-01-01', fechaFin: null, esPrincipal: true, estado: 'ACTIVA' }, historialSucursales: [] }
let parametros = { id: uuid(16), version: 1, alertaDias: 90, preventivoDias: 60, criticoDias: 30, actualizadoEn: null }
const permisos = Object.values(vistas).flatMap(v => ['VER', 'CREAR', 'CONFIRMAR', 'ANULAR', 'PREPARAR', 'CANCELAR', 'REGISTRAR', 'CERRAR', 'CONCILIAR', 'LEVANTAR', 'EXPIRAR', 'CONFIGURAR', 'FEFO'].map(a => `INVENTARIO.${v.grupo}.${a}`)).concat('INVENTARIO.ACCESO.CORPORATIVO', 'INVENTARIO.ACCESO.VER_AUDITORIA', 'ORGANIZACION.SUCURSALES.VER', Object.keys(catalogos).map(c => `CATALOGOS.${c.toUpperCase()}.VER`))
const paginado = (items, q) => { const pagina = Number(q.get('pagina') || 1), tamanoPagina = Number(q.get('tamanoPagina') || 50); return { items: items.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina), pagina, tamanoPagina, total: items.length, totalPaginas: Math.ceil(items.length / tamanoPagina), actualizadoEn: new Date().toISOString() } }
permisos.push('ORGANIZACION.EMPLEADOS.VER', 'ORGANIZACION.EMPLEADOS.CREAR')
const responder = data => new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } })
const originalFetch = window.fetch.bind(window)
if (qa.get('soloConsulta')) permisos.splice(permisos.indexOf('INVENTARIO.ACCESO.CORPORATIVO'), 1)
let conflictoPendiente = qa.get('conflicto') === '1'
let fallosPendientes = qa.get('error') === '1' ? 2 : 0
window.fetch = async (input, opciones = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.origin)
  if (!url.pathname.startsWith('/api/')) return url.origin === location.origin ? originalFetch(input, opciones) : new Response(null, { status: 404 })
  const ruta = url.pathname.slice(4), partes = ruta.split('/').filter(Boolean), metodo = opciones.method || 'GET'
  const datos = opciones.body ? JSON.parse(String(opciones.body)) : {}
  if (ruta === '/autenticacion/mi-sesion') return responder({ usuarioId: uuid(99), nombreUsuario: 'operador.prueba', empleadoId: uuid(98), empleadoCodigo: 'EMP-QA', empleadoNombre: 'Operador de prueba', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-01-01T00:00:00Z', sucursal, roles: [{ id: uuid(97), codigo: 'QA', nombre: 'Revisión de interfaz' }], permisos })
  if (ruta === '/empleados/opciones-filtros') return responder({ puestos: [{ id: empleado.puesto.id, nombre: empleado.puesto.nombre }], sucursales: [sucursal], estados: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'RETIRADO'] })
  if (ruta === '/empleados') return responder(paginado([empleado], url.searchParams))
  if (ruta === `/empleados/${empleado.id}`) return responder(empleado)
  if (ruta.includes('/auditoria')) return responder(paginado([{ id: uuid(50), usuarioNombre: 'Operador de prueba', sucursal, tipoOperacion: 'CREAR', versionEntidad: 1, resumen: 'Registro inicial de inventario', ocurridoEn: base.creadoEn, detalles: [{ id: uuid(51), nombrePropiedad: 'estado', etiquetaPropiedad: 'Estado', tipoDato: 'string', valorAnterior: null, valorNuevo: 'PENDIENTE', orden: 1 }] }], url.searchParams))
  if (ruta === '/sucursales/mantenimiento') return responder(paginado([{ ...sucursal, activo: true }], url.searchParams))
  if (partes[0] === 'sucursales') return responder({ ...sucursal, activo: true })
  if (partes[0] === 'catalogos') { const items = catalogos[partes[1]] || []; return responder(partes[2] ? items.find(i => i.id === partes[2]) : paginado(items, url.searchParams)) }
  if (partes[0] !== 'inventario') return new Response(null, { status: 404 })
  if (fallosPendientes && ruta === rutaInicial.split('?')[0].replace(/\/resultados$/, '')) { fallosPendientes--; return new Response(JSON.stringify({ success: false, error: { code: 'QA_ERROR', message: 'Error simulado de conexión. Usa Reintentar.' } }), { status: 503, headers: { 'Content-Type': 'application/json' } }) }
  const recurso = partes[1]
  if (recurso === 'parametros') {
    if (metodo === 'PUT') {
      if (conflictoPendiente || datos.version !== parametros.version) { conflictoPendiente = false; parametros.version++; return new Response(JSON.stringify({ success: false, error: { code: 'VERSION', message: 'Versión desactualizada. Recarga la configuración.' } }), { status: 409 }) }
      parametros = { ...parametros, ...datos, version: parametros.version + 1, actualizadoEn: new Date().toISOString() }
    }
    return responder(parametros)
  }
  if (recurso === 'disponibilidad') return responder({ ...metadatos, productoId: ids.producto, unidadBaseId: ids.unidad, existenciaFisica: qa.get('sinPosiciones') ? '0.000000' : '150.000000', existenciaApta: qa.get('sinPosiciones') ? '0.000000' : '150.000000', reservada: qa.get('sinPosiciones') ? '0.000000' : '20.000000', reservaSobreStockApto: qa.get('sinPosiciones') ? '0.000000' : '20.000000', disponible: qa.get('sinPosiciones') ? '0.000000' : '130.000000', cuarentena: '0.000000', restringida: '0.000000', vencida: '0.000000', actualizadoEn: new Date().toISOString(), posiciones: qa.get('sinPosiciones') ? [] : registros.existencias.map(e => ({ ...e, apta: true, libreAsignableBase: qa.get('sinPosiciones') ? '0.000000' : '130.000000', restricciones: [] })) })
  if (recurso === 'fefo' && Number(url.searchParams.get('cantidad')) > 150) return new Response(JSON.stringify({ success: false, error: { code: 'STOCK_INSUFICIENTE', message: 'No hay stock apto suficiente para la selección solicitada.' } }), { status: 409 })
  if (recurso === 'fefo') return responder({ cantidadBase: url.searchParams.get('cantidad'), seleccion: [{ existenciaId: ids.existencia, cantidadBase: url.searchParams.get('cantidad') }], actualizadoEn: new Date().toISOString() })
  if (recurso === 'vencimientos') {
    const posiciones = registros.existencias.map(e => ({ ...e, numeroLote: 'LOT-2026-001', fechaVencimiento: '2027-06-01', diasRestantes: 237, estadoVencimiento: 'VIGENTE' }))
    const seleccion = posiciones.filter(r => {
      for (const c of ['sucursalId', 'presentacionId', 'ubicacionId', 'loteId']) if (url.searchParams.get(c) && url.searchParams.get(c) !== r[c]) return false
      if (url.searchParams.get('estado') && url.searchParams.get('estado') !== r.estadoVencimiento) return false
      const desde = url.searchParams.get('desde'), hasta = url.searchParams.get('hasta'), fecha = r.creadoEn.slice(0, 10)
      return (!desde || fecha >= desde) && (!hasta || fecha <= hasta)
    })
    return responder(paginado(qa.get('vacio') ? [] : seleccion, url.searchParams))
  }
  if (partes[2] === 'expirar') return responder({ expiradas: 0, limiteLote: 200 })
  const items = registros[recurso] || []
  if (metodo === 'POST' && partes.length === 2) { const r = { ...base, ...datos, id: crypto.randomUUID(), ...(recurso === 'lotes' ? {} : { estado: recurso === 'movimientos' ? 'PENDIENTE' : recurso === 'conteos' ? 'ABIERTO' : recurso === 'reservas' ? 'ACTIVA' : 'ACTIVO' }), ...(recurso === 'reservas' ? { cantidadBase: datos.cantidad, estadoEfectivo: 'ACTIVA', cantidadAsignadaBase: '0.000000', utilizable: false, asignaciones: [], incidencias: [] } : {}) }; if (recurso === 'conteos') { r.lineas = [{ id: crypto.randomUUID(), existenciaId: ids.existencia, esperadaBase: '150.000000', contadaBase: null, diferenciaBase: null, evidencia: null }]; r.ajustes = [] }
    if (recurso === 'movimientos') r.lineas = r.lineas.map((l,i) => ({ ...l, id: uuid(30+i), cantidadOriginal: l.cantidad, cantidadBase: l.cantidad }))
    items.push(r); return responder(r) }
  if (partes.length === 2) {
    const seleccion = items.filter(r => {
      if (recurso === 'movimientos' && url.searchParams.get('grupoMovimiento') === 'AJUSTES' && !['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'].includes(r.tipo)) return false
      if (recurso === 'movimientos' && url.searchParams.get('tipo') && r.tipo !== url.searchParams.get('tipo')) return false
      if (url.searchParams.get('estado') && r.estado !== url.searchParams.get('estado') && r.condicion !== url.searchParams.get('estado')) return false
      if (!['lotes', 'existencias', 'kardex', 'reservas', 'movimientos', 'bloqueos', 'cuarentenas', 'conteos'].includes(recurso)) return true
      for (const campo of ['presentacionId', 'ubicacionId', 'loteId', 'sucursalId', 'existenciaId']) {
        const valor = url.searchParams.get(campo)
        const actual = recurso === 'lotes' && campo === 'loteId' ? r.id : recurso === 'lotes' && campo === 'sucursalId' ? ids.sucursal : r[campo]
        if (valor && recurso === 'movimientos' && campo === 'presentacionId') { if (!r.lineas?.some(l => l.presentacionId === valor)) return false }
        else if (valor && valor !== actual && !(recurso === 'bloqueos' && campo === 'sucursalId' && actual === null)) return false
      }
      const desde = url.searchParams.get('desde'), hasta = url.searchParams.get('hasta'), fecha = r.creadoEn.slice(0, 10)
      return (!desde || fecha >= desde) && (!hasta || fecha <= hasta)
    })
    return responder(paginado(qa.get('vacio') ? [] : seleccion, url.searchParams))
  }
  const r = items.find(r => r.id === partes[2])
  if (!r) return new Response(null, { status: 404 })
  if (metodo !== 'GET') {
    if (conflictoPendiente) { conflictoPendiente = false; r.version++; return new Response(JSON.stringify({ success: false, error: { code: 'VERSION', message: 'Versión desactualizada. Recarga el registro.' } }), { status: 409 }) }
    if (datos.version !== r.version) return new Response(JSON.stringify({ success: false, error: { code: 'VERSION', message: 'Versión desactualizada. Recarga el registro.' } }), { status: 409 })
    r.version++
    if (partes[3] === 'resultados') { for (const l of datos.lineas) { const d = r.lineas.find(d => d.existenciaId === l.existenciaId); if (!d && !l.existenciaId) { const existenciaId = crypto.randomUUID(); registros.existencias.push({ ...base, id: existenciaId, sucursalId: r.sucursalId, ubicacionId: r.ubicacionId, presentacionId: l.presentacionId, loteId: l.loteId, condicion: l.condicion, cantidadBase: '0', secuencia: 0 }); r.lineas.push({ id: crypto.randomUUID(), existenciaId, esperadaBase: '0', contadaBase: l.cantidad, diferenciaBase: l.cantidad, evidencia: l.evidencia }) }; if (d) { d.contadaBase = l.cantidad; d.evidencia = l.evidencia; d.diferenciaBase = String(Number(l.cantidad) - Number(d.esperadaBase)) } } }
    else r.estado = ({ confirmar: 'CONFIRMADO', anular: 'ANULADO', preparar: 'PREPARADA', cancelar: recurso === 'reservas' ? 'CANCELADA' : 'CANCELADO', cerrar: 'CERRADO', conciliar: 'CONCILIADO', levantar: 'LEVANTADO' })[partes[3]]
    if (recurso === 'conteos') { r.actualizadoEn = new Date().toISOString(); if (partes[3] === 'cerrar') { r.cerradoEn = r.actualizadoEn; r.motivoCierre = datos.motivo }; if (partes[3] === 'conciliar') r.ajustes = [{ ...registros.movimientos[0], estado: 'CONFIRMADO', tipo: 'AJUSTE_NEGATIVO', conteoId: r.id }] }
    if (recurso === 'movimientos' && partes[3] === 'confirmar') r.confirmadoEn = new Date().toISOString()
    if (recurso === 'movimientos' && partes[3] === 'anular') r.motivoAnulacion = datos.motivo
    if (recurso === 'bloqueos' && partes[3] === 'levantar') { r.levantadoEn = new Date().toISOString(); r.motivoLevantamiento = datos.motivo }
    if (recurso === 'reservas') {
      r.estadoEfectivo = r.estado; r.actualizadoEn = new Date().toISOString(); r.actualizadoEnConsulta = r.actualizadoEn
      if (partes[3] === 'preparar') { r.cantidadAsignadaBase = r.cantidadBase; r.utilizable = true; r.asignaciones = [{ id: uuid(22), existenciaId: ids.existencia, cantidadBase: r.cantidadBase }] }
      if (partes[3] === 'cancelar') { r.utilizable = false; r.cerradoEn = r.actualizadoEn; r.motivoCierre = datos.motivo }
    }
  }
  return responder(r)
}
history.replaceState(null, '', rutaInicial)
await import('../../src/main.tsx')

