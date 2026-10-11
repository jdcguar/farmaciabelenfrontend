const assert = require('node:assert/strict')
const test = require('node:test')
const path = require('node:path')
const cargar = require('./cargar-typescript.cjs')(path.resolve(__dirname, '..'))
const { buscarModulos, paginarPanel } = cargar('src/modules/dashboard/components/panel-principal.modelo.ts')

const areas = [{
  id: 'catalogos', etiqueta: 'Catálogos', descripcion: 'Configuración', icono: 'catalogos',
  accesos: Array.from({ length: 21 }, (_, indice) => ({
    id: `catalogo-${indice}`, nombre: indice === 20 ? 'Presentaciones farmacéuticas' : `Catálogo ${indice}`,
    titulo: `Configurar ${indice}`, descripcion: indice === 20 ? 'Unidades de dispensación' : 'Datos maestros', icono: 'catalogos',
  })),
}]

test('todos los módulos siguen accesibles aunque el catálogo crezca a varias páginas', () => {
  const modulos = buscarModulos(areas, '')
  const vistos = []
  for (let pagina = 1; pagina <= 4; pagina++) vistos.push(...paginarPanel(modulos, pagina, 6).elementos.map(modulo => modulo.id))
  assert.equal(vistos.length, 21)
  assert.equal(new Set(vistos).size, 21)
  assert.equal(vistos.at(-1), 'catalogo-20')
})

test('la búsqueda consulta el catálogo completo, ignora tildes y permite encontrar un módulo fuera de la primera página', () => {
  const resultados = buscarModulos(areas, '  PRESENTACIONES FARMACEUTICAS  ')
  assert.deepEqual(resultados.map(modulo => modulo.id), ['catalogo-20'])
  assert.equal(resultados[0].areaNombre, 'Catálogos')
  assert.equal(buscarModulos(areas, 'dispensacion')[0].id, 'catalogo-20')
  assert.equal(buscarModulos(areas, 'catalogos').length, 21)
})

test('una reducción de resultados corrige la página y mantiene el rango coherente', () => {
  const pagina = paginarPanel(buscarModulos(areas, 'presentaciones'), 4, 6)
  assert.equal(pagina.pagina, 1)
  assert.equal(pagina.totalPaginas, 1)
  assert.equal(pagina.inicio, 1)
  assert.equal(pagina.fin, 1)
})

test('las sesiones sin áreas y las búsquedas vacías de resultados no producen rangos ficticios', () => {
  assert.deepEqual(buscarModulos([], ''), [])
  const pagina = paginarPanel(buscarModulos(areas, 'inexistente'), 2, 6)
  assert.equal(pagina.total, 0)
  assert.equal(pagina.inicio, 0)
  assert.equal(pagina.fin, 0)
  assert.equal(pagina.pagina, 1)
})
