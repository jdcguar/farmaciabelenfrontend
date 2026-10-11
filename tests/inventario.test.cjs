const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const cargar = require('./cargar-typescript.cjs')
const frontend = cargar(path.resolve(__dirname, '../src/modules/inventario'))
const backend = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/inventario'))
const reglas = frontend('inventario-reglas.ts')
const formularios = frontend('inventario-formulario.ts')
const config = frontend('inventario.config.ts')
const schemas = backend('shared/inventario.validator.ts')
const id = '10000000-0000-4000-8000-000000000001', id2 = '10000000-0000-4000-8000-000000000002'
const datos = { sucursalId: id, presentacionId: id, unidadId: id, numero: 'LOT-01', fechaIngreso: '2026-01-01', fechaCorte: '2026-01-01', fechaFabricacion: '2025-01-01', fechaVencimiento: '2028-01-01', referenciaOrigen: 'Documento origen', referencia: 'Documento operación', motivo: 'Justificante válido', evidencia: 'Documento de respaldo', cantidad: '0.000001', expiraEn: '2099-10-05T14:30', alcance: 'PRODUCTO', objetivoId: id2, clase: 'OPERATIVO', bodegaId: id, ubicacionId: id }
for (const [vista, schema] of [['lotes', schemas.loteSchema], ['reservas', schemas.reservaSchema], ['bloqueos', schemas.bloqueoSchema], ['conteos', schemas.conteoSchema]]) {
  test(`${vista}: formulario produce un contrato válido sin campos internos`, () => {
    assert.deepEqual(formularios.validarFormulario(vista, datos, [], false), {})
    const entrada = reglas.entradaFormulario(vista, { ...datos, version: '99', activo: 'true', usuarioId: id2 }, [], id2)
    const r = schema.safeParse(entrada)
    assert.equal(r.success, true, JSON.stringify(r.error?.issues))
    assert.ok(!('version' in entrada) && !('usuarioId' in entrada) && !('bodegaId' in entrada))
    if (vista === 'reservas') assert.equal(entrada.expiraEn, '2099-10-05T14:30:00-06:00')
  })
}
for (const tipo of config.tiposMovimiento) {
  test(`${tipo}: origen, destino y condición cumplen el contrato real`, () => {
    const l = { ...reglas.lineaInicial(tipo), presentacionId: id, loteId: id2, origenExistenciaId: id2, destinoUbicacionId: id, unidadId: id, cantidad: '999999999.000001', costeUnitarioBase: '0' }
    assert.deepEqual(formularios.validarFormulario('movimientos', { ...datos, tipo }, [l], false), {})
    const entrada = reglas.entradaFormulario('movimientos', { ...datos, tipo }, [l], id2)
    const r = schemas.movimientoSchema.safeParse(entrada)
    assert.equal(r.success, true, JSON.stringify(r.error?.issues))
    assert.equal(entrada.lineas[0].cantidad, '999999999.000001')
    assert.equal(entrada.lineas[0].costeUnitarioBase, '0')
    assert.equal(entrada.fechaCorte, tipo === 'CARGA_INICIAL' ? datos.fechaCorte : null)
    if (reglas.tipoEsEntrada(tipo)) assert.equal(entrada.lineas[0].origenExistenciaId, null)
    if (tipo === 'AJUSTE_NEGATIVO') assert.equal(entrada.lineas[0].destinoUbicacionId, null)
  })
}
test('cantidades conservan precisión y permiten cero solo en costes y conteos', () => {
  assert.equal(reglas.esDecimal('0'), false)
  assert.equal(reglas.esDecimal('0.000000', true), true)
  for (const v of ['1e6', '-1', '1,5', '1.0000001', '1000000000']) assert.equal(reglas.esDecimal(v, true), false)
  assert.equal(reglas.textoCantidad('999999999.000001'), '999999999.000001')
  assert.equal(reglas.textoCantidad('100.000000'), '100')
})
test('se validan fechas, alcance de bloqueo y líneas incompletas antes de enviar', () => {
  assert.equal(reglas.fechaValida('2026-02-30'), false)
  assert.ok(formularios.validarFormulario('lotes', { ...datos, fechaFabricacion: '2029-01-01' }, [], false).fechaVencimiento)
  assert.ok(formularios.validarFormulario('reservas', { ...datos, expiraEn: '2000-01-01T00:00' }, [], false).expiraEn)
  assert.ok(formularios.validarFormulario('bloqueos', { ...datos, alcance: 'UBICACION', sucursalId: '' }, [], true).sucursalId)
  assert.ok(Object.keys(reglas.erroresMovimiento('REUBICACION', [reglas.lineaInicial()])).length >= 5)
})
test('rutas requieren permisos propios; conteos exigen consulta para capturar', () => {
  for (const recurso of config.recursos) {
    const ruta = config.reconocerRutaInventario(`/inventario/${recurso}/${id}`)
    assert.equal(ruta.modo, 'detalle')
    assert.equal(config.puedeRuta(ruta, []), false)
    assert.equal(config.puedeRuta(ruta, [config.permisoVista(recurso)]), true)
  }
  assert.equal(config.puedeRuta(config.reconocerRutaInventario(`/inventario/conteos/${id}/resultados`), ['INVENTARIO.CONTEOS.REGISTRAR']), false)
  assert.equal(config.puedeRuta(config.reconocerRutaInventario('/inventario/movimientos/nuevo'), ['INVENTARIO.AJUSTES.CREAR']), true)
  assert.equal(config.permisoVista('fefo'), 'INVENTARIO.DISPONIBILIDAD.FEFO')
  for (const ruta of ['/inventario/destruccion', '/inventario/lotes/no-uuid', `/inventario/lotes/${id}/editar`, '/inventario/kardex/nuevo']) assert.equal(config.reconocerRutaInventario(ruta), null)
})
test('filtros muestran solo criterios admitidos por cada recurso', () => {
  assert.equal(config.camposFiltro('movimientos').ubicacion, false)
  assert.equal(config.camposFiltro('reservas').lote, false)
  assert.equal(config.camposFiltro('conteos').presentacion, false)
  assert.equal(config.camposFiltro('bloqueos').presentacion, false)
  assert.equal(config.camposFiltro('kardex').ubicacion, true)
})
test('API conserva métodos, versiones, cero en conteo y filtros de exportación', async () => {
  const solicitudes = [], descargas = []
  const api = cargar(path.resolve(__dirname, '../src/modules/inventario'), {
    '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones) => { solicitudes.push({ ruta, opciones }); return { success: true, data: { id, version: 3 } } } },
    '../../shared/api/descargar-archivo-api': { descargarArchivoApi: async (ruta, opciones) => descargas.push({ ruta, opciones }) },
    '../catalogos-farmacia/catalogo-api': { consultaUrl: p => new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() },
  })('inventario-api.ts')
  await api.ejecutarAccion('movimientos', id, 'confirmar', { version: 2 })
  assert.equal(solicitudes[0].ruta, `/inventario/movimientos/${id}/confirmar`)
  assert.equal(solicitudes[0].opciones.method, 'PATCH')
  assert.ok(schemas.confirmarSchema.safeParse(solicitudes[0].opciones.datos).success)
  await api.registrarConteo(id, 2, [{ existenciaId: id2, loteId: null, condicion: 'APTA', cantidad: '0', evidencia: 'Conteo verificado' }])
  assert.equal(solicitudes[1].opciones.method, 'PUT')
  assert.ok(schemas.registrarConteoSchema.safeParse(solicitudes[1].opciones.datos).success)
  await api.exportarInventario('existencias', { pagina: 4, tamanoPagina: 50, presentacionId: id, estado: 'APTA' }, 'xlsx')
  assert.deepEqual(descargas[0].opciones.datos, { presentacionId: id, estado: 'APTA', formato: 'xlsx' })
  assert.ok(schemas.exportarSchema.safeParse(descargas[0].opciones.datos).success)
  await api.guardarParametros({ version: 2, alertaDias: 90, preventivoDias: 60, criticoDias: 30, motivo: 'Configurar alertas' })
  assert.ok(schemas.parametrosSchema.safeParse(solicitudes[2].opciones.datos).success)
  await api.consultarFefo({ sucursalId: id, presentacionId: id2, unidadId: id, cantidad: ' 0.000001 ', vidaUtilMinimaDias: 30, dias: '30' })
  const consultaFefo = Object.fromEntries(new URL(solicitudes[3].ruta, 'http://prueba.local').searchParams)
  assert.ok(schemas.fefoSchema.safeParse(consultaFefo).success)
  assert.equal(consultaFefo.cantidad, '0.000001')
  assert.ok(!('dias' in consultaFefo))
  const consultaCarga = config.consultaMovimientos({ pagina: 2, tamanoPagina: 100, estado: 'CONFIRMADO', sucursalId: id }, true)
  await api.listarInventario('movimientos', consultaCarga)
  const enviada = Object.fromEntries(new URL(solicitudes[4].ruta, 'http://prueba.local').searchParams)
  assert.equal(enviada.tipo, 'CARGA_INICIAL')
  assert.equal(enviada.pagina, '2')
  assert.ok(schemas.consultaSchema.safeParse(enviada).success)
  await api.exportarInventario('movimientos', consultaCarga, 'pdf')
  assert.equal(descargas[1].ruta, '/inventario/movimientos/exportaciones')
  assert.deepEqual(descargas[1].opciones.datos, { tipo: 'CARGA_INICIAL', grupoMovimiento: undefined, estado: 'CONFIRMADO', sucursalId: id, formato: 'pdf' })
  const consultaAjustes = config.consultaMovimientos({ pagina: 2, tamanoPagina: 50, tipo: 'AJUSTE_NEGATIVO', estado: 'PENDIENTE' }, false, true)
  await api.listarInventario('movimientos', consultaAjustes)
  const ajustesEnviados = Object.fromEntries(new URL(solicitudes[5].ruta, 'http://prueba.local').searchParams)
  assert.equal(ajustesEnviados.grupoMovimiento, 'AJUSTES')
  assert.equal(ajustesEnviados.tipo, 'AJUSTE_NEGATIVO')
  assert.ok(schemas.consultaSchema.safeParse(ajustesEnviados).success)
  await api.exportarInventario('movimientos', consultaAjustes, 'xlsx')
  assert.deepEqual(descargas[2].opciones.datos, { grupoMovimiento: 'AJUSTES', tipo: 'AJUSTE_NEGATIVO', estado: 'PENDIENTE', formato: 'xlsx' })
})

const consultas = frontend('inventario-consultas-reglas.ts')
test('FEFO valida cantidad y vida útil contra el contrato del backend', () => {
  const validos = { sucursalId: id, presentacionId: id2, unidadId: id, cantidad: '999999999.000001', dias: '36500' }
  assert.deepEqual(consultas.validarConsultaStock(validos, true), {})
  assert.equal(schemas.fefoSchema.safeParse({ sucursalId: id, presentacionId: id2, unidadId: id, cantidad: validos.cantidad, vidaUtilMinimaDias: Number(validos.dias) }).success, true)
  for (const cantidad of ['0', '-1', '1e3', '1,2', '1000000000', '0.0000001']) assert.ok(consultas.validarConsultaStock({ ...validos, cantidad }, true).cantidad)
  for (const dias of ['-1', '36501', '1.5', '']) assert.ok(consultas.validarConsultaStock({ ...validos, dias }, true).dias)
  assert.deepEqual(consultas.validarConsultaStock({ ...validos, cantidad: '', unidadId: '', dias: '' }, false), {})
})
test('umbrales aceptan igualdad y cero, exigen orden, rango y motivo', () => {
  for (const dias of ['0', '36500']) {
    const d = { alertaDias: dias, preventivoDias: dias, criticoDias: dias, motivo: 'Cambio revisado' }
    assert.deepEqual(consultas.validarUmbrales(d), {})
    assert.equal(schemas.parametrosSchema.safeParse({ version: 1, alertaDias: Number(dias), preventivoDias: Number(dias), criticoDias: Number(dias), motivo: d.motivo }).success, true)
  }
  const valido = { alertaDias: '90', preventivoDias: '60', criticoDias: '30', motivo: 'Cambio revisado' }
  assert.ok(consultas.validarUmbrales({ ...valido, alertaDias: '59' }).alertaDias)
  assert.ok(consultas.validarUmbrales({ ...valido, criticoDias: '61' }).preventivoDias)
  assert.ok(consultas.validarUmbrales({ ...valido, criticoDias: '-1' }).criticoDias)
  assert.ok(consultas.validarUmbrales({ ...valido, alertaDias: '36501' }).alertaDias)
  assert.ok(consultas.validarUmbrales({ ...valido, motivo: '    ' }).motivo)
  assert.ok(consultas.validarUmbrales({ ...valido, motivo: 'x'.repeat(251) }).motivo)
})
test('Ajustes y carga inicial abren listados con permisos de consulta separados de creación', () => {
  const listadoAjustes = config.reconocerRutaInventario('/inventario/ajustes')
  const nuevoAjuste = config.reconocerRutaInventario('/inventario/ajustes/nuevo')
  assert.deepEqual(listadoAjustes, { vista: 'ajustes', modo: 'listado' })
  assert.deepEqual(nuevoAjuste, { vista: 'ajustes', modo: 'crear' })
  assert.equal(config.permisoVista('ajustes'), 'INVENTARIO.MOVIMIENTOS.VER')
  assert.equal(config.puedeRuta(listadoAjustes, ['INVENTARIO.AJUSTES.CREAR']), false)
  assert.equal(config.puedeRuta(listadoAjustes, ['INVENTARIO.MOVIMIENTOS.VER']), true)
  assert.equal(config.puedeRuta(nuevoAjuste, ['INVENTARIO.MOVIMIENTOS.VER']), false)
  assert.equal(config.puedeRuta(nuevoAjuste, ['INVENTARIO.AJUSTES.CREAR']), true)
  const listado = config.reconocerRutaInventario('/inventario/carga-inicial')
  const nuevo = config.reconocerRutaInventario('/inventario/carga-inicial/nuevo')
  assert.deepEqual(listado, { vista: 'carga-inicial', modo: 'listado' })
  assert.deepEqual(nuevo, { vista: 'carga-inicial', modo: 'crear' })
  assert.equal(config.permisoVista('carga-inicial'), 'INVENTARIO.MOVIMIENTOS.VER')
  assert.equal(config.puedeRuta(listado, ['INVENTARIO.CARGA_INICIAL.CREAR']), false)
  assert.equal(config.puedeRuta(listado, ['INVENTARIO.MOVIMIENTOS.VER']), true)
  assert.equal(config.puedeRuta(nuevo, ['INVENTARIO.MOVIMIENTOS.VER']), false)
  assert.equal(config.puedeRuta(nuevo, ['INVENTARIO.CARGA_INICIAL.CREAR']), true)
  for (const tipo of ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO']) {
    const l = { ...reglas.lineaInicial(tipo), presentacionId: id, loteId: id2, origenExistenciaId: id2, destinoUbicacionId: id, unidadId: id, cantidad: '2.000001', costeUnitarioBase: null }
    assert.deepEqual(formularios.validarFormulario('ajustes', { ...datos, tipo }, [l], true), {})
    assert.equal(schemas.movimientoSchema.safeParse(reglas.entradaFormulario('ajustes', { ...datos, tipo }, [l], id2)).success, true)
  }
})

test('Ajustes mantiene ambos tipos en el servidor y permite filtrar uno sin perder el grupo', () => {
  for (const datosConsulta of [{ pagina: 1, tamanoPagina: 50 }, { pagina: 3, tamanoPagina: 200, estado: 'CONFIRMADO', sucursalId: id }, { tipo: 'CARGA_INICIAL' }, { tipo: 'AJUSTE_POSITIVO' }, { tipo: 'AJUSTE_NEGATIVO' }]) {
    const consulta = config.consultaMovimientos(datosConsulta, false, true)
    assert.equal(consulta.grupoMovimiento, 'AJUSTES')
    assert.equal(consulta.tipo, datosConsulta.tipo?.startsWith('AJUSTE_') ? datosConsulta.tipo : undefined)
    assert.ok(schemas.consultaSchema.safeParse(consulta).success)
    const { pagina: _pagina, tamanoPagina: _tamanoPagina, ...filtros } = consulta
    assert.ok(schemas.exportarSchema.safeParse({ ...filtros, formato: 'pdf' }).success)
    const carga = config.consultaMovimientos(consulta, true)
    assert.equal(carga.tipo, 'CARGA_INICIAL')
    assert.equal(carga.grupoMovimiento, undefined)
  }
})

test('cargas iniciales conservan el tipo al limpiar, paginar y exportar', () => {
  for (const consulta of [{ pagina: 1, tamanoPagina: 50 }, { pagina: 3, tamanoPagina: 100, estado: 'CONFIRMADO', sucursalId: id, presentacionId: id2 }, { tipo: 'AJUSTE_NEGATIVO', desde: '2026-01-01', hasta: '2026-10-07' }]) {
    const filtrada = config.consultaMovimientos(consulta, true)
    assert.equal(filtrada.tipo, 'CARGA_INICIAL')
    assert.ok(schemas.consultaSchema.safeParse(filtrada).success)
    const { pagina: _pagina, tamanoPagina: _tamanoPagina, ...filtros } = filtrada
    assert.ok(schemas.exportarSchema.safeParse({ ...filtros, formato: 'xlsx' }).success)
    assert.deepEqual(config.consultaMovimientos(consulta, false), consulta)
  }
  const l = { ...reglas.lineaInicial('CARGA_INICIAL'), presentacionId: id, loteId: id2, destinoUbicacionId: id, unidadId: id, cantidad: '2.000001', costeUnitarioBase: '0' }
  assert.deepEqual(formularios.validarFormulario('carga-inicial', { ...datos, tipo: 'CARGA_INICIAL' }, [l], true), {})
  assert.ok(schemas.movimientoSchema.safeParse(reglas.entradaFormulario('carga-inicial', { ...datos, tipo: 'CARGA_INICIAL' }, [l], id2)).success)
  assert.ok(formularios.validarFormulario('carga-inicial', { ...datos, tipo: 'CARGA_INICIAL', fechaCorte: '2099-01-01' }, [l], true).fechaCorte)
})
