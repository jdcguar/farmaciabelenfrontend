// Contratos reales de Zod y reglas frontend. Sin conexión a Oracle.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path')
const cargar = require('./cargar-typescript.cjs')
const f = cargar(path.resolve(__dirname, '../src/modules/traslados')), reglas = f('traslado-reglas.ts'), cfg = f('traslado.config.ts')
const schemas = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/traslados'))('traslado.validator.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const datos = { origenSucursalId: id(1), destinoSucursalId: id(2), tipo: 'ABASTECIMIENTO', prioridad: 'URGENTE', fechaRequerida: '2026-10-06', motivo: 'Abastecimiento para la sucursal' }
const linea = { clave: id(5), presentacionId: id(3), unidadId: id(4), cantidad: '999999999.000001', vidaUtilMinimaDias: '36500' }
const doc = { ...datos, id: id(7), estado: 'SOLICITADO', version: 7, creadoPorId: id(9), recepcionHabilitadaEn: null, lineas: [{ id: id(5), solicitadaBase: '999999999.000001' }, { id: id(6), solicitadaBase: '2.000000' }], incidencias: [], despachos: [] }
const sesion = { usuarioId: id(8), sucursal: { id: id(1) }, permisos: ['VER', 'CREAR', 'APROBAR', 'RECHAZAR', 'CANCELAR', 'CERRAR', 'HABILITAR_RECEPCION'].map(cfg.permisoTraslado) }
test('solicitud produce el contrato real, preserva precisión y elimina campos de UI', () => {
  assert.deepEqual(reglas.validarSolicitud(datos, [linea]), {})
  const entrada = reglas.entradaSolicitud({ ...datos, estado: 'APROBADO', usuarioId: id(8) }, [linea], id(10)), r = schemas.crearSchema.safeParse(entrada)
  assert.equal(r.success, true, JSON.stringify(r.error?.issues)); assert.equal(entrada.lineas[0].cantidad, linea.cantidad)
  assert.equal(entrada.lineas[0].vidaUtilMinimaDias, 36500); assert.equal(entrada.retornoDeId, null)
  assert.ok(!('estado' in entrada) && !('usuarioId' in entrada) && !('clave' in entrada.lineas[0]))
})
test('rechaza nodos iguales, presentación duplicada, línea vacía y más de 100 líneas', () => {
  assert.ok(reglas.validarSolicitud({ ...datos, destinoSucursalId: datos.origenSucursalId }, [linea]).destinoSucursalId)
  assert.ok(reglas.validarSolicitud(datos, [linea, linea])['lineas.1.presentacionId'])
  assert.ok(reglas.validarSolicitud(datos, []).lineas)
  assert.ok(reglas.validarSolicitud(datos, Array(101).fill(linea)).lineas)
  assert.ok(reglas.validarSolicitud(datos, [reglas.lineaInicial()])['lineas.0.unidadId'])
})
test('no redondea cantidades ni admite notación exponencial, comas o precisión extra', () => {
  for (const v of ['1e3', '1,5', '-1', '0', '1.0000001', '1000000000']) assert.ok(reglas.validarSolicitud(datos, [{ ...linea, cantidad: v }])['lineas.0.cantidad'])
  assert.equal(reglas.micro(linea.cantidad), 999999999000001n)
  assert.equal(reglas.esCantidad('0.000000', true), true)
})
test('vida útil explícita y fechas reales se validan antes de enviar', () => {
  for (const v of ['', '-1', '1.5', '36501', '1e2']) assert.ok(reglas.validarSolicitud(datos, [{ ...linea, vidaUtilMinimaDias: v }])['lineas.0.vidaUtilMinimaDias'])
  assert.deepEqual(reglas.validarSolicitud(datos, [{ ...linea, vidaUtilMinimaDias: '0' }]), {})
  assert.equal(reglas.fechaValida('2026-02-30'), false); assert.equal(reglas.fechaValida('2028-02-29'), true)
  assert.equal(reglas.fechaValida('1899-12-31'), false); assert.equal(reglas.fechaValida('1900-01-01'), true)
})
test('idempotencia conserva clave al reintentar y cambia si cambia el contenido', () => {
  const a = reglas.claveParaContenido(null, datos), b = reglas.claveParaContenido(a, { ...datos }), c = reglas.claveParaContenido(b, { ...datos, motivo: 'Otra necesidad' })
  assert.equal(a.clave, b.clave); assert.notEqual(b.clave, c.clave)
})
test('aprobación decide todas las líneas en base y coincide con Zod', () => {
  const cantidades = { [id(5)]: '999999999.000000', [id(6)]: '0' }
  assert.deepEqual(reglas.validarDecision('aprobar', doc, datos.motivo, '', cantidades, id(8)), {})
  const entrada = reglas.entradaDecision('aprobar', doc, datos.motivo, '', cantidades)
  assert.equal(schemas.aprobarSchema.safeParse(entrada).success, true); assert.equal(entrada.version, 7)
  assert.equal(entrada.lineas.length, 2); assert.equal(entrada.lineas[1].cantidadAprobadaBase, '0')
})
test('aprobación impide exceso por una millonésima y exige alguna cantidad positiva', () => {
  assert.ok(reglas.validarDecision('aprobar', doc, datos.motivo, '', { [id(5)]: '999999999.000002', [id(6)]: '0' }, id(8))[id(5)])
  assert.ok(reglas.validarDecision('aprobar', doc, datos.motivo, '', { [id(5)]: '0', [id(6)]: '0' }, id(8)).lineas)
  assert.ok(reglas.validarDecision('aprobar', doc, datos.motivo, '', { [id(5)]: '1' }, id(8))[id(6)])
})
test('propia aprobación exige control compensatorio; no bloquea otro aprobador', () => {
  const cantidades = { [id(5)]: '1', [id(6)]: '0' }
  assert.ok(reglas.validarDecision('aprobar', doc, datos.motivo, '', cantidades, doc.creadoPorId).controlCompensatorio)
  assert.deepEqual(reglas.validarDecision('aprobar', doc, datos.motivo, 'Verificación documentada por responsable independiente', cantidades, doc.creadoPorId), {})
  assert.deepEqual(reglas.validarDecision('aprobar', doc, datos.motivo, '', cantidades, id(8)), {})
})
test('las decisiones simples solo envían versión, motivo y control admitido', () => {
  for (const accion of ['rechazar', 'cancelar', 'cerrar', 'habilitar-recepcion']) {
    const entrada = reglas.entradaDecision(accion, doc, datos.motivo, '', {})
    assert.equal(schemas.accionSchema.safeParse(entrada).success, true)
    assert.deepEqual(Object.keys(entrada).sort(), ['controlCompensatorio', 'motivo', 'version'])
  }
})
test('alcance de origen/destino y permiso independiente limitan acciones', () => {
  assert.deepEqual(reglas.accionesDisponibles(doc, sesion), ['aprobar', 'rechazar', 'cancelar'])
  assert.deepEqual(reglas.accionesDisponibles(doc, { ...sesion, sucursal: { id: id(2) } }), ['cancelar'])
  assert.deepEqual(reglas.accionesDisponibles(doc, { ...sesion, sucursal: { id: id(99) } }), [])
  assert.deepEqual(reglas.accionesDisponibles(doc, { ...sesion, permisos: ['TRASLADOS.ACCESO.CORPORATIVO'] }), [])
  assert.deepEqual(reglas.accionesDisponibles({ ...doc, estado: 'APROBADO' }, { ...sesion, sucursal: { id: id(2) } }), ['cancelar', 'habilitar-recepcion'])
})
test('cancelación y cierre se ocultan con despachos o incidencias pendientes', () => {
  const aprobado = { ...doc, estado: 'PREPARADO', despachos: [{ estado: 'EN_TRANSITO', despachadoEn: '2026-10-06T12:00:00Z' }] }
  assert.ok(!reglas.accionesDisponibles(aprobado, sesion).includes('cancelar'))
  assert.ok(!reglas.accionesDisponibles(aprobado, sesion).includes('cerrar'))
  assert.ok(!reglas.accionesDisponibles({ ...doc, estado: 'APROBADO', incidencias: [{ estado: 'ABIERTA' }] }, sesion).includes('cerrar'))
  for (const estado of ['RECHAZADO', 'CANCELADO', 'CERRADO']) assert.deepEqual(reglas.accionesDisponibles({ ...doc, estado }, sesion), [])
})
test('reconoce las siete vistas autorizadas y aplica permisos por operación', () => {
  assert.equal(cfg.reconocerRutaTraslado('/traslados').modo, 'listado'); assert.equal(cfg.reconocerRutaTraslado(`/traslados/${id(1)}`).modo, 'detalle')
  for (const r of ['/traslados/despachos/nuevo', `/traslados/${id(1)}/editar`, '/traslados/no-valido']) assert.equal(cfg.reconocerRutaTraslado(r), null)
  assert.equal(cfg.puedeRutaTraslado({ modo: 'crear' }, [cfg.permisoTraslado('CREAR')]), true)
  assert.equal(cfg.puedeRutaTraslado({ modo: 'detalle' }, [cfg.permisoTraslado('CREAR')]), false)
  for (const [ruta, modo] of [[`/traslados/${id(1)}/preparar`, 'preparar'], [`/traslados/despachos/${id(1)}`, 'despacho'], [`/traslados/despachos/${id(1)}/recepciones/nueva`, 'recibir'], [`/traslados/recepciones/${id(1)}`, 'recepcion']]) assert.equal(cfg.reconocerRutaTraslado(ruta).modo, modo)
  for (const [modo, permiso] of [['preparar', 'PREPARAR'], ['recibir', 'RECIBIR']]) {
    assert.equal(cfg.puedeRutaTraslado({ modo }, [cfg.permisoTraslado('VER')]), false)
    assert.equal(cfg.puedeRutaTraslado({ modo }, [cfg.permisoTraslado(permiso)]), false)
    assert.equal(cfg.puedeRutaTraslado({ modo }, [cfg.permisoTraslado('VER'), cfg.permisoTraslado(permiso)]), true)
  }
})
test('API conserva signal, versión y filtros; exporta el conjunto sin paginación', async () => {
  const llamadas = [], exportaciones = []
  const api = cargar(path.resolve(__dirname, '../src/modules/traslados'), {
    '../../shared/api/cliente-api': { solicitarApi: async (...args) => { llamadas.push(args); return { data: doc } } },
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async (...args) => exportaciones.push(args) },
  })('traslado-api.ts')
  const signal = new AbortController().signal, c = { pagina: 2, tamanoPagina: 50, estado: 'SOLICITADO', desde: '2026-10-01', destinoSucursalId: id(2), busqueda: 'no enviar', orden: 'no enviar' }
  await api.listarTraslados(c, signal); assert.equal(llamadas[0][1].signal, signal)
  const q = Object.fromEntries(new URLSearchParams(llamadas[0][0].split('?')[1])); assert.ok(!('busqueda' in q) && !('orden' in q)); assert.equal(schemas.consultaSchema.safeParse(q).success, true)
  await api.obtenerTraslado(id(7), signal); assert.equal(llamadas[1][0], `/traslados/${id(7)}`)
  await api.crearTraslado(reglas.entradaSolicitud(datos, [linea], id(10))); assert.equal(llamadas[2][1].method, 'POST')
  await api.decidirTraslado(doc.id, 'rechazar', reglas.entradaDecision('rechazar', doc, datos.motivo, '', {})); assert.equal(llamadas[3][1].datos.version, 7); assert.equal(llamadas[3][1].method, 'PATCH')
  await api.exportarTraslados(c, 'xlsx'); const exportado = exportaciones[0][1].datos
  assert.ok(!('pagina' in exportado) && !('tamanoPagina' in exportado) && !('busqueda' in exportado)); assert.equal(schemas.exportarSchema.safeParse(exportado).success, true)
})
