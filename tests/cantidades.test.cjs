const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const cargar = require('./cargar-typescript.cjs')
const reglas = cargar(path.resolve(__dirname, '../src/shared/cantidades'))('cantidad.ts')
const backend = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/catalogos-farmacia'))
const { validarCantidadUnidad } = backend('shared/cantidad-unidad.ts')
const { crearUnidadSchema, actualizarUnidadSchema } = backend('unidades/unidad.validator.ts')

test('conteos y empaques exigen enteros incluso si un catálogo anterior habilitó decimales', () => {
  for (const dimension of ['CONTEO', 'EMPAQUE']) {
    const unidad = { dimension, admiteDecimales: true }
    assert.equal(reglas.admiteFracciones(unidad), false)
    assert.throws(() => validarCantidadUnidad('2.5', unidad), /enteras/)
    assert.doesNotThrow(() => validarCantidadUnidad('2.000000', unidad))
  }
})
test('masa y volumen conservan sus fracciones cuando la unidad las admite', () => {
  for (const dimension of ['MASA', 'VOLUMEN']) {
    const unidad = { dimension, admiteDecimales: true }
    assert.equal(reglas.admiteFracciones(unidad), true)
    assert.doesNotThrow(() => validarCantidadUnidad('0.000001', unidad))
    assert.throws(() => validarCantidadUnidad('0.25', { ...unidad, admiteDecimales: false }), /enteras/)
  }
})
test('validación de entradas rechaza fracciones indivisibles, signos, exponentes y valores incompletos', () => {
  assert.equal(reglas.cantidadValida('2.000000', false), true)
  assert.equal(reglas.cantidadValida('2.5', false), false)
  assert.equal(reglas.cantidadValida('0.000001', true), true)
  for (const v of ['-1', '1e2', '1,5', '1.', 'NaN', '2.1234567']) assert.equal(reglas.cantidadValida(v, true), false)
})
test('cantidades se muestran sin ceros de relleno y conservan precisión sin redondear', () => {
  assert.equal(reglas.mostrarCantidad('5.000000'), '5')
  assert.equal(reglas.mostrarCantidad('0.000001'), '0.000001')
  assert.equal(reglas.mostrarCantidad('12.340000'), '12.34')
  assert.equal(reglas.mostrarCantidad('-2.000000'), '-2')
  assert.equal(reglas.mostrarCantidad('999999999.123456'), '999999999.123456')
  assert.equal(reglas.mostrarCantidad('100'), '100')
})
test('alta y edición de unidades impiden habilitar fracciones de conteo o empaque', () => {
  const datos = { codigo: 'UD', nombre: 'Unidad de prueba', descripcion: null, simbolo: 'ud', admiteDecimales: true }
  for (const dimension of ['CONTEO', 'EMPAQUE']) {
    assert.equal(crearUnidadSchema.safeParse({ ...datos, dimension }).success, false)
    assert.equal(actualizarUnidadSchema.safeParse({ ...datos, dimension, version: 1 }).success, false)
  }
  for (const dimension of ['MASA', 'VOLUMEN']) assert.equal(crearUnidadSchema.safeParse({ ...datos, dimension }).success, true)
})
