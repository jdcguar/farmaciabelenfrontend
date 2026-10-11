const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path')
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server')
const cargar = require('./cargar-typescript.cjs')

// FlexRender trata los callbacks de las columnas como componentes React.
// Recrearlos no debe cambiar la identidad de una referencia dentro de la celda.
function FlexRender({ cell }) { return React.createElement(cell.column.columnDef.cell, { row: cell.row }) }
const { TablaDatos } = cargar(path.resolve(__dirname, '../src/shared/components/tabla-datos'), {
  react: { ...React, useMemo: fn => fn() },
  '@tanstack/react-table': {
    tableFeatures: () => ({}),
    useTable: ({ data, columns, getRowId }) => ({
      FlexRender, getHeaderGroups: () => [],
      getRowModel: () => ({ rows: data.map(original => {
        const row = { id: getRowId(original), original }
        row.getAllCells = () => columns.map(columnDef => ({ id: `${row.id}_${columnDef.id}`, row, column: { id: columnDef.id, columnDef } }))
        return row
      }) }),
    }),
  },
  './menu-filtro-columna': {}, './tabla-datos.module.css': { default: {} }, './tabla-tarjetas.module.css': { default: {} },
})('tabla-datos.tsx')
function buscar(elemento, tipo) {
  if (!React.isValidElement(elemento)) return []
  return [...(elemento.type === tipo ? [elemento] : []), ...React.Children.toArray(elemento.props.children).flatMap(hijo => buscar(hijo, tipo))]
}
const Referencia = ({ nombre }) => React.createElement('span', null, nombre)
const props = { descripcion: 'Ventas de prueba', datos: [{ id: 'venta-1', nombre: 'Vendedor de prueba' }], filtros: [], ordenamiento: [], obtenerIdFila: e => e.id, onFiltrosChange: () => {}, onOrdenamientoChange: () => {} }
function rutaReferencia(elemento) {
  const tipos = []
  while (React.isValidElement(elemento) && typeof elemento.type === 'function') {
    tipos.push(elemento.type)
    if (elemento.type === Referencia) return tipos
    elemento = elemento.type(elemento.props)
  }
  throw Error('La referencia no está en la celda')
}
test('la tabla conserva la identidad de referencias al recrear columnas y datos durante actualizaciones', () => {
  let rutaAnterior
  for (let revision = 0; revision < 30; revision++) {
    const columnas = [{ id: 'vendedor', titulo: 'Vendedor', obtenerValor: e => e.nombre, celda: e => React.createElement(Referencia, { nombre: e.nombre }) }]
    const tabla = TablaDatos({ ...props, datos: props.datos.map(e => ({ ...e })), columnas })
    const celda = buscar(tabla, 'td')[0], ruta = rutaReferencia(celda.props.children)
    assert.ok(celda.key.endsWith('venta-1_vendedor'))
    if (rutaAnterior) assert.deepEqual(ruta, rutaAnterior, 'Una actualización no debe desmontar la referencia y repetir su consulta')
    rutaAnterior = ruta
  }
})
test('la tabla conserva celdas de texto, elementos, fragmentos y filas expandidas', () => {
  const columnas = [
    { id: 'texto', titulo: 'Texto', obtenerValor: e => e.nombre, celda: e => e.nombre },
    { id: 'referencia', titulo: 'Referencia', obtenerValor: e => e.id, celda: e => React.createElement(Referencia, { nombre: e.nombre }) },
    { id: 'acciones', titulo: 'Acciones', obtenerValor: e => e.id, celda: () => React.createElement(React.Fragment, null, React.createElement('button', { type: 'button' }, 'Ver'), React.createElement('small', null, 'Pendiente')) },
  ]
  const tabla = TablaDatos({ ...props, columnas, renderizarFilaExpandida: e => React.createElement('p', null, `Detalle ${e.id}`) })
  const html = renderToStaticMarkup(tabla)
  assert.match(html, /data-columna="referencia" data-etiqueta="Referencia"/)
  assert.match(html, /<span>Vendedor de prueba<\/span>/)
  assert.match(html, /<button type="button">Ver<\/button><small>Pendiente<\/small>/)
  assert.match(html, /colSpan="3"><p>Detalle venta-1<\/p>/)
})
