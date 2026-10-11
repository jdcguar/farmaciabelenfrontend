// Contratos y reglas frontend con dobles: no abren conexión a Oracle.
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const cargar = require('./cargar-typescript.cjs')
const f = cargar(path.resolve(__dirname, '../src/modules/compras'))
const b = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/compras'))
const formularios = f('compra-formulario.ts'), reglas = f('compra-reglas.ts'), cfg = f('compra.config.ts'), schemas = b('shared/compra.validator.ts')
const id = '10000000-0000-4000-8000-000000000001', otro = '10000000-0000-4000-8000-000000000002'
const futuro = '2099-10-06', pasado = '2026-01-01'
const datos = { motivo: 'Compra de prueba controlada', evidencia: 'Evidencia documental verificada', sucursalId: id, origenId: id, prioridad: 'ORDINARIA', fechaRequerida: futuro, presupuestoEstimado: '9999999999999.99', proveedorId: otro, documentoProveedor: 'DOC-001', vigenteHasta: futuro, fechaEntrega: futuro, condiciones: 'Entrega refrigerada y documentada', monedaOrigen: 'USD', tipoCambio: '7.650001', fechaCambio: pasado, ubicacionId: id, costesAdicionales: '0.00', fecha: pasado, vencimiento: futuro, resultado: 'CONFORME', fechaPrevista: futuro, transporte: 'Transporte autorizado' }
const l = { ...reglas.lineaInicial(), origenLineaId: id, presentacionId: id, unidadId: otro, cantidad: '999999999.000001', precio: '9999999999999.99', tasaImpuesto: '12.000001', vidaUtilMinimaDias: '36500', numeroLote: 'LOT-01', fechaFabricacion: '2025-01-01', fechaVencimiento: '2099-01-01', aceptada: '999999999.000001', cuarentena: '0', rechazada: '0', destinoUbicacionId: id, cuarentenaUbicacionId: '', incidencia: '' }
const origen = { id, cantidad: l.cantidad, numeroLote: l.numeroLote, fechaFabricacion: l.fechaFabricacion, fechaVencimiento: l.fechaVencimiento, presentacionId: id, cantidadDeclarada: l.cantidad }
const doc = { id, tipo: 'RECEPCION', estado: 'PEND_TECNICA', version: 7, fecha: pasado, ubicacionId: id, sucursalId: id, creadoPorId: otro, lineas: [origen] }
for (const [r, schema] of [['solicitudes', schemas.solicitudSchema], ['cotizaciones', schemas.cotizacionSchema], ['ordenes', schemas.ordenSchema], ['recepciones', schemas.recepcionSchema], ['facturas', schemas.facturaSchema], ['evaluaciones', schemas.evaluacionSchema]]) {
  test(`${r}: cuerpo de formulario coincide con Zod real y conserva decimales`, () => {
    const body = formularios.entradaCreacion(r, { ...datos, actor: 'no enviar', total: 'no enviar' }, [l], otro)
    const validacion = formularios.validarCreacion(r, datos, [l])
    assert.deepEqual(validacion, {})
    const resultado = schema.safeParse(body); assert.equal(resultado.success, true, JSON.stringify(resultado.error?.issues))
    assert.equal(body.claveIdempotencia, otro); assert.ok(!('actor' in body) && !('total' in body))
    if (body.lineas) assert.equal(body.lineas[0].cantidad, l.cantidad)
  })
}
test('revisión no filtra cotizacionId ni identidad del actor y usa versión anterior', () => {
  const body = formularios.entradaCreacion('ordenes', datos, [l], otro, 9)
  assert.equal(schemas.revisionSchema.safeParse(body).success, true); assert.equal(body.version, 9); assert.ok(!('cotizacionId' in body)); assert.equal(body.lineas[0].ordenLineaId, id)
})
for (const [a, schema] of [['documental', schemas.documentalSchema], ['fisica', schemas.fisicaSchema], ['tecnica', schemas.tecnicaSchema], ['confirmar', schemas.confirmarSchema], ['avisos', schemas.avisoSchema], ['autorizar-sobrante', schemas.excepcionSchema], ['aprobar', schemas.accionSchema]]) {
  test(`${a}: decisión produce exclusivamente campos admitidos por el backend`, () => {
    const body = formularios.entradaDecision(a, datos, [l], 7)
    const r = schema.safeParse(body); assert.equal(r.success, true, JSON.stringify(r.error?.issues)); assert.equal(body.version, 7)
    assert.deepEqual(formularios.validarDecision(a, datos, [l], doc), {})
    if (a === 'confirmar') assert.deepEqual(body, { version: 7 })
  })
}
test('cantidades no admiten redondeo, comas, exponentes ni más de seis decimales', () => {
  for (const v of ['1,5', '1e3', '-1', '1.0000001', '1000000000', '0']) assert.equal(reglas.esDecimal(v), false)
  assert.equal(reglas.esDecimal('0.000000', 6, true), true)
  assert.equal(reglas.micro('999999999.000001'), 999999999000001n)
  assert.equal(reglas.micro(' 1.000001 '), 1000001n)
  assert.equal(reglas.dinero('9999999999999.99'), 'Q 9,999,999,999,999.99')
})
test('técnica comprueba distribución exacta y evidencia de cuarentena/rechazo', () => {
  const parcial = { ...l, aceptada: '999999998.000001', cuarentena: '0.5', rechazada: '0.5', cuarentenaUbicacionId: otro, incidencia: 'Daño documentado y custodia en cuarentena' }
  assert.deepEqual(formularios.validarDecision('tecnica', datos, [parcial], doc), {})
  assert.ok(formularios.validarDecision('tecnica', datos, [{ ...parcial, rechazada: '0.500001' }], doc)['lineas.0.aceptada'])
  assert.ok(formularios.validarDecision('tecnica', datos, [{ ...parcial, incidencia: '' }], doc)['lineas.0.incidencia'])
  assert.ok(formularios.validarDecision('tecnica', datos, [{ ...l, destinoUbicacionId: otro }], doc)['lineas.0.destinoUbicacionId'])
  assert.ok(formularios.validarDecision('tecnica', datos, [l, l], doc).lineas)
})
test('física admite faltante cero, requiere incidencia y conserva observación distinta', () => {
  const cero = { ...l, cantidad: '0', incidencia: 'No llegó la línea anunciada', presentacionRecibidaId: otro }
  assert.deepEqual(formularios.validarDecision('fisica', datos, [cero], doc), {})
  assert.equal(schemas.fisicaSchema.safeParse(formularios.entradaDecision('fisica', datos, [cero], 7)).success, true)
  assert.ok(formularios.validarDecision('fisica', datos, [{ ...cero, incidencia: '' }], doc)['lineas.0.incidencia'])
  assert.ok(formularios.validarDecision('tecnica', datos, [l], { ...doc, lineas: [{ ...origen, presentacionObservadaId: otro }] })['lineas.0.aceptada'])
})
test('recepción permite lotes múltiples; cotización y factura no repiten origen', () => {
  assert.deepEqual(formularios.validarCreacion('recepciones', datos, [l, { ...l, clave: otro, numeroLote: 'LOT-02' }]), {})
  assert.ok(formularios.validarCreacion('cotizaciones', datos, [l, l])['lineas.1.origenLineaId'])
  assert.ok(formularios.validarCreacion('facturas', datos, [l, l])['lineas.1.origenLineaId'])
  assert.ok(formularios.validarCreacion('solicitudes', datos, [l, l])['lineas.1.presentacionId'])
})
test('fechas reales y relaciones de fecha/moneda se validan antes de enviar', () => {
  assert.equal(reglas.fechaValida('2026-02-30'), false)
  assert.ok(formularios.validarCreacion('solicitudes', { ...datos, fechaRequerida: pasado }, [l]).fechaRequerida)
  assert.ok(formularios.validarCreacion('recepciones', { ...datos, fecha: futuro }, [l]).fecha)
  assert.ok(formularios.validarCreacion('facturas', { ...datos, vencimiento: '2025-01-01' }, [l]).vencimiento)
  assert.ok(formularios.validarCreacion('cotizaciones', { ...datos, monedaOrigen: '' }, [l]).monedaOrigen)
  assert.ok(formularios.validarCreacion('cotizaciones', datos, [{ ...l, tasaImpuesto: '100.000001' }])['lineas.0.tasaImpuesto'])
})

test('factura limita aceptación restante y sobrantes exigen líneas de la orden distintas', () => {
  const disponible = { ...doc, lineas: [{ ...origen, cantidad: '0.000001' }] }
  assert.deepEqual(formularios.validarCreacion('facturas', datos, [{ ...l, cantidad: '0.000001' }], disponible), {})
  assert.ok(formularios.validarCreacion('facturas', datos, [{ ...l, cantidad: '0.000002' }], disponible)['lineas.0.cantidad'])
  assert.ok(formularios.validarDecision('autorizar-sobrante', datos, [l, l], doc).lineas)
  assert.ok(formularios.validarDecision('autorizar-sobrante', datos, [{ ...l, origenLineaId: otro }], doc).lineas)
})
test('idempotencia conserva clave al reintentar el mismo cuerpo y la cambia al editar', () => {
  const primera = reglas.claveParaContenido(null, { cantidad: '1.000001' })
  assert.equal(reglas.claveParaContenido(primera, { cantidad: '1.000001' }), primera)
  assert.notEqual(reglas.claveParaContenido(primera, { cantidad: '1.000002' }).clave, primera.clave)
})
test('guardas de rutas distinguen corporativo, recepción local y acciones propias', () => {
  const corp = 'COMPRAS.ACCESO.CORPORATIVO'
  assert.equal(cfg.puedeRutaCompra(cfg.reconocerRutaCompra('/compras/cotizaciones/nuevo'), ['COMPRAS.COTIZACIONES.CREAR']), false)
  assert.equal(cfg.puedeRutaCompra(cfg.reconocerRutaCompra('/compras/cotizaciones/nuevo'), ['COMPRAS.COTIZACIONES.CREAR', corp]), true)
  assert.equal(cfg.puedeRutaCompra(cfg.reconocerRutaCompra('/compras/recepciones/nuevo'), ['COMPRAS.RECEPCIONES.CREAR']), true)
  assert.equal(cfg.puedeRutaCompra(cfg.reconocerRutaCompra(`/compras/solicitudes/${id}/comparacion`), ['COMPRAS.COTIZACIONES.VER', corp]), true)
  for (const ruta of ['/compras/obligaciones/nuevo', `/compras/recepciones/${id}/editar`, '/compras/traslados', '/compras/ordenes/no-uuid']) assert.equal(cfg.reconocerRutaCompra(ruta), null)
})
test('acciones respetan creador, alcance, estados y permisos distintos de Inventario', () => {
  const s = { usuarioId: id, sucursal: { id }, permisos: ['COMPRAS.SOLICITUDES.APROBAR', 'COMPRAS.SOLICITUDES.CANCELAR', 'COMPRAS.ACCESO.CORPORATIVO'] }
  const solicitud = { ...doc, estado: 'SOLICITADA', creadoPorId: id }
  const aa = reglas.accionesCompra('solicitudes', solicitud, s)
  assert.ok(aa.find(a => a.accion === 'aprobar').razon); assert.equal(aa.find(a => a.accion === 'cancelar').razon, '')
  assert.deepEqual(reglas.accionesCompra('solicitudes', solicitud, { ...s, permisos: ['COMPRAS.SOLICITUDES.APROBAR', 'INVENTARIO.ACCESO.CORPORATIVO'] }), [])
  assert.ok(reglas.accionesCompra('recepciones', { ...doc, sucursalId: otro }, { ...s, permisos: ['COMPRAS.RECEPCIONES.TECNICA'] })[0].razon)
  assert.ok(reglas.accionesCompra('ordenes', { ...doc, estado: 'PARCIAL' }, { ...s, permisos: ['COMPRAS.ORDENES.CANCELAR', 'COMPRAS.ACCESO.CORPORATIVO'] })[0].razon)
  const ob = { estado: 'PENDIENTE', facturaId: id, version: 2 }
  assert.ok(reglas.accionesCompra('obligaciones', ob, { ...s, permisos: ['COMPRAS.OBLIGACIONES.AUTORIZAR', 'COMPRAS.ACCESO.CORPORATIVO'] })[0].razon)
})
test('API usa rutas reales, versión de obligación, POST aviso, multipart y filtros permitidos', async () => {
  const llamadas = [], descargas = []
  const api = cargar(path.resolve(__dirname, '../src/modules/compras'), {
    '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones) => { llamadas.push({ ruta, opciones }); return { success: true, data: { id, version: 8 } } } },
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async (ruta, opciones) => descargas.push({ ruta, opciones }) },
  })('compra-api.ts')
  await api.decidirObligacion(id, 'autorizar', { version: 2, motivo: datos.motivo, evidencia: datos.evidencia }); assert.equal(llamadas[0].ruta, `/compras/facturas/${id}/obligacion/autorizar`); assert.equal(llamadas[0].opciones.datos.version, 2)
  await api.decidirCompra('ordenes', id, 'avisos', formularios.entradaDecision('avisos', datos, [], 7)); assert.equal(llamadas[1].opciones.method, 'POST')
  await api.crearCompra('ordenes', formularios.entradaCreacion('ordenes', datos, [l], otro, 7), id); assert.equal(llamadas[2].ruta, `/compras/ordenes/${id}/revisiones`)
  await api.adjuntarCompra('solicitudes', id, 7, new File(['archivo'], 'evidencia.pdf', { type: 'application/pdf' })); assert.deepEqual([...llamadas[3].opciones.datos.keys()], ['archivo', 'version']); assert.equal(llamadas[3].opciones.datos.get('version'), '7')
  await api.exportarCompra('solicitudes', { pagina: 3, tamanoPagina: 100, estado: 'APROBADA', busqueda: 'no enviar', orden: 'no enviar' }, 'xlsx'); assert.deepEqual(descargas[0].opciones.datos, { estado: 'APROBADA', formato: 'xlsx' }); assert.equal(schemas.exportarSchema.safeParse(descargas[0].opciones.datos).success, true)
  await api.auditoriaCompra('obligaciones', otro, 1, 50); assert.equal(llamadas[4].ruta, `/compras/obligaciones/${otro}/auditoria?pagina=1&tamanoPagina=50`)
  await api.generarSolicitudPdf(id)
  assert.equal(descargas[1].ruta, `/compras/solicitudes/${id}/pdf`)
  assert.equal(descargas[1].opciones.method, 'GET')
  assert.equal(descargas[1].opciones.nombreArchivoAlternativo, `solicitud-${id}.pdf`)
  assert.equal(descargas[1].opciones.datos, undefined)
})
test('PDF individuales usan rutas reales y el id de obligación, y propagan errores de descarga', async () => {
  const descargas = []
  const api = cargar(path.resolve(__dirname, '../src/modules/compras'), {
    '../../shared/api/cliente-api': {},
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async (ruta, opciones) => { descargas.push({ ruta, opciones }) } },
  })('compra-api.ts')
  for (const recurso of ['cotizaciones', 'ordenes', 'recepciones', 'facturas', 'obligaciones']) {
    const documentoId = recurso === 'obligaciones' ? otro : id
    await api.generarCompraPdf(recurso, documentoId)
    const llamada = descargas.at(-1)
    assert.equal(llamada.ruta, `/compras/${recurso}/${documentoId}/pdf`)
    assert.equal(llamada.opciones.method, 'GET')
    assert.equal(llamada.opciones.datos, undefined)
    assert.ok(llamada.opciones.nombreArchivoAlternativo.endsWith('.pdf'))
  }
  const error = new Error('Acceso denegado')
  const falla = cargar(path.resolve(__dirname, '../src/modules/compras'), { '../../shared/api/cliente-api': {}, '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async () => { throw error } } })('compra-api.ts')
  await assert.rejects(falla.generarCompraPdf('obligaciones', otro), e => e === error)
})
test('saldo facturable consulta todas las páginas y excluye canceladas con precisión exacta', async () => {
  const llamadas = []
  const api = cargar(path.resolve(__dirname, '../src/modules/compras'), { '../../shared/api/cliente-api': { solicitarApi: async ruta => {
    llamadas.push(ruta); const url = new URL(ruta, 'http://prueba.local'), p = url.pathname
    let data
    if (p === '/compras/recepciones') data = { items: [{ id: 'r1' }], totalPaginas: 1 }
    else if (p === '/compras/facturas') data = url.searchParams.get('pagina') === '1' ? { items: [{ id: 'f1', estado: 'REGISTRADA' }, { id: 'f-cancelada', estado: 'CANCELADA' }], totalPaginas: 2 } : { items: [{ id: 'f2', estado: 'VALIDADA' }], totalPaginas: 2 }
    else if (p === '/compras/recepciones/r1') data = { documentoProveedor: 'REC-1', lineas: [{ ...origen, aceptada: '999999999.000003', cantidad: '999999999.000003' }] }
    else if (p === '/compras/facturas/f1') data = { lineas: [{ origenLineaId: id, cantidad: '999999998.000001' }] }
    else if (p === '/compras/facturas/f2') data = { lineas: [{ origenLineaId: id, cantidad: '1.000001' }] }
    else throw new Error(`Ruta inesperada ${ruta}`)
    return { success: true, data }
  } }, '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async () => {} } })('compra-api.ts')
  const lineas = await api.lineasFacturables(id); assert.equal(lineas[0].cantidad, '0.000001'); assert.ok(llamadas.some(r => r.includes('pagina=2'))); assert.ok(!llamadas.some(r => r.endsWith('/f-cancelada')))
})
