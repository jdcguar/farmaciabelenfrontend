const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const cargar = require('./cargar-typescript.cjs')
const archivo = path.resolve(__dirname, '../src/modules/empleados/components/empleado-editar-view.tsx')
const compilado = ts.transpileModule(fs.readFileSync(archivo, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
const asignacion = { sucursalId: 'central', sucursalCodigo: 'CEN', sucursalNombre: 'Central', fechaInicio: '2024-01-15' }
const fixture = { id: 'empleado', codigo: 'EMP01', primerNombre: 'Prueba', primerApellido: 'Empleado', dpi: '0000000000000', fechaNacimiento: '1990-01-01', fechaContratacion: '2024-01-15', puestoId: 'puesto', municipioId: 'municipio', municipio: { departamentoGeografico: { id: 'departamento' } }, direccion: 'Dirección ficticia', estado: 'ACTIVO', version: 3, asignacionActual: asignacion }
class ErrorApi extends Error {
  constructor(mensaje) { super(mensaje); this.detalles = [] }
}

// Ejecuta el componente y sus handlers con hooks controlados, sin navegador ni API real.
async function preparar({ permiso = true, estado = 'ACTIVO', fallo = false } = {}) {
  let indice = 0, raiz, pendientes, empleado = { ...fixture, estado }
  const valores = [], dependencias = [], efectos = [], llamadas = []
  const react = { ...React,
    useState(inicial) { const i = indice++; if (!(i in valores)) valores[i] = typeof inicial === 'function' ? inicial() : inicial; return [valores[i], (nuevo) => { valores[i] = typeof nuevo === 'function' ? nuevo(valores[i]) : nuevo }] },
    useRef(inicial) { return { current: inicial } },
    useEffect(efecto, deps) { const i = indice++; if (!dependencias[i] || deps.some((valor, j) => valor !== dependencias[i][j])) { dependencias[i] = deps; efectos.push(efecto) } },
  }
  const api = {
    obtenerEmpleado: async () => empleado,
    obtenerCatalogosEmpleado: async () => ({ puestos: [], departamentos: [], sucursales: [{ id: 'central', codigo: 'CEN', nombre: 'Central' }, { id: 'norte', codigo: 'NOR', nombre: 'Norte' }] }),
    obtenerMunicipiosPorDepartamento: async () => [],
    actualizarEmpleado: async (id, datos) => { llamadas.push({ tipo: 'datos', id, datos }); assert.equal(datos.version, empleado.version); const cambia = Object.entries(datos).some(([campo, valor]) => campo !== 'version' && (empleado[campo] ?? null) !== valor); empleado = { ...empleado, ...datos, version: empleado.version + (cambia ? 1 : 0) }; return empleado },
    cambiarSucursalEmpleado: async (id, datos) => { llamadas.push({ tipo: 'sucursal', id, datos }); assert.equal(datos.version, empleado.version); if (fallo) { fallo = false; throw new ErrorApi('Fallo simulado') } empleado = { ...empleado, version: empleado.version + 1, asignacionActual: { ...asignacion, sucursalId: datos.sucursalId } }; return empleado },
  }
  const modulo = { exports: {} }
  const importar = (ruta) => {
    if (ruta === 'react') return react
    if (ruta === 'react/jsx-runtime') return require(ruta)
    if (ruta.endsWith('.module.css')) return { default: {} }
    if (ruta === '../empleado-api') return api
    if (ruta === '../validacion-empleado') return cargar(path.resolve(__dirname, '../src/modules/empleados'))('validacion-empleado.ts')
    if (ruta.endsWith('cliente-api')) return { ErrorApi }
    if (ruta.endsWith('selector/selector')) return { Selector: ({ onValueChange, ...props }) => React.createElement('select', { ...props, onChange: event => onValueChange(event.target.value) }) }
    if (ruta.endsWith('modal-estado')) return { ModalEstado: ({ abierto, titulo }) => abierto ? React.createElement('p', null, titulo) : null }
    if (ruta.endsWith('icono-accion')) return { IconoAccion: () => null }
    if (ruta.endsWith('empleado-formulario-nav')) return { EmpleadoFormularioNav: () => null }
    if (ruta.endsWith('eventos-aplicacion')) return {}
    throw new Error(`Import no previsto: ${ruta}`)
  }
  new Function('require', 'module', 'exports', compilado)(importar, modulo, modulo.exports)
  const props = { empleadoId: 'empleado', permisos: permiso ? ['ORGANIZACION.EMPLEADOS.CAMBIAR_SUCURSAL'] : [], onNavegar() {}, onCambiosPendientes(valor) { pendientes = valor } }
  const render = () => { indice = 0; raiz = modulo.exports.EmpleadoEditarView(props); for (const efecto of efectos.splice(0)) efecto(); return raiz }
  const flush = async () => { await new Promise(resolve => setImmediate(resolve)); render() }
  const recorrer = (predicado, nodo) => { if (!nodo) return; if (Array.isArray(nodo)) { for (const item of nodo) { const encontrado = recorrer(predicado, item); if (encontrado) return encontrado } } else if (React.isValidElement(nodo)) { if (predicado(nodo)) return nodo; return recorrer(predicado, nodo.props.children) } }
  const buscar = predicado => recorrer(predicado, raiz)
  render(); await flush()
  return { render, llamadas, buscar, get pendientes() { return pendientes }, html: () => renderToStaticMarkup(raiz),
    cambiar(id, valor) { const campo = buscar(nodo => nodo.props.id === id); if (campo.props.onValueChange) campo.props.onValueChange(valor); else campo.props.onChange({ target: { value: valor } }); render() },
    async guardar() { buscar(nodo => nodo.type === 'form').props.onSubmit({ preventDefault() {} }); await flush() },
  }
}
global.document = { getElementById: () => ({ focus() {} }) }

test('muestra la sucursal actual y detecta el cambio o su reversión', async () => {
  const vista = await preparar()
  assert.equal(vista.buscar(n => n.props.id === 'sucursalId').props.value, 'central')
  assert.equal(vista.pendientes, false)
  vista.cambiar('sucursalId', 'norte')
  assert.equal(vista.pendientes, true)
  assert.ok(vista.buscar(n => n.props.id === 'fechaInicio'))
  assert.ok(vista.buscar(n => n.props.id === 'motivoCambio'))
  vista.cambiar('sucursalId', 'central')
  assert.equal(vista.pendientes, false)
  assert.equal(vista.buscar(n => n.props.id === 'motivoCambio'), undefined)
})
test('sin permiso o con empleado suspendido la sucursal queda visible y deshabilitada', async () => {
  for (const opciones of [{ permiso: false }, { estado: 'SUSPENDIDO' }]) {
    const vista = await preparar(opciones)
    assert.equal(vista.buscar(n => n.props.id === 'sucursalId').props.disabled, true)
    assert.match(vista.html(), /Central/)
  }
})
test('el cambio valida motivo y fecha antes de realizar escrituras', async () => {
  const vista = await preparar()
  vista.cambiar('sucursalId', 'norte')
  vista.cambiar('fechaInicio', '2023-01-01')
  await vista.guardar()
  assert.equal(vista.llamadas.length, 0)
  assert.ok(vista.buscar(n => n.props.id === 'error-motivoCambio'))
  assert.ok(vista.buscar(n => n.props.id === 'error-fechaInicio'))
})
test('guarda la nueva asignación usando la versión devuelta por la actualización', async () => {
  const vista = await preparar()
  vista.cambiar('primerNombre', 'Nombre actualizado')
  vista.cambiar('sucursalId', 'norte')
  vista.cambiar('fechaInicio', '2026-10-08')
  vista.cambiar('motivoCambio', '  Traslado operativo  ')
  await vista.guardar()
  assert.deepEqual(vista.llamadas.map(c => [c.tipo, c.datos.version]), [['datos', 3], ['sucursal', 4]])
  assert.deepEqual(vista.llamadas[1].datos, { version: 4, sucursalId: 'norte', fechaInicio: '2026-10-08', motivoCambio: 'Traslado operativo' })
  assert.equal(vista.pendientes, false)
  assert.match(vista.html(), /Empleado actualizado/)
})
test('un fallo conserva el destino y motivo pendientes y permite reintentar con la versión correcta', async () => {
  const vista = await preparar({ fallo: true })
  vista.cambiar('sucursalId', 'norte'); vista.cambiar('fechaInicio', '2026-10-08'); vista.cambiar('motivoCambio', 'Traslado operativo')
  await vista.guardar()
  assert.match(vista.html(), /la sucursal no pudo cambiarse/)
  assert.equal(vista.pendientes, true)
  assert.equal(vista.buscar(n => n.props.id === 'motivoCambio').props.value, 'Traslado operativo')
  await vista.guardar()
  assert.deepEqual(vista.llamadas.map(c => [c.tipo, c.datos.version]), [['datos', 3], ['sucursal', 3], ['datos', 3], ['sucursal', 3]])
  assert.equal(vista.pendientes, false)
  assert.match(vista.html(), /Empleado actualizado/)
})
test('editar otros datos no envía una operación de cambio de sucursal', async () => {
  const vista = await preparar()
  vista.cambiar('primerNombre', 'Otro nombre')
  await vista.guardar()
  assert.deepEqual(vista.llamadas.map(c => c.tipo), ['datos'])
})
test('el cliente usa la ruta y el método existentes de cambio de sucursal', async () => {
  let solicitud
  const api = cargar(path.resolve(__dirname, '../src/modules/empleados'), {
    '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones) => { solicitud = { ruta, ...opciones }; return { data: fixture } } },
    '../../shared/api/descargar-archivo-api': {},
  })('empleado-api.ts')
  const datos = { version: 3, sucursalId: 'norte', fechaInicio: '2026-10-08', motivoCambio: 'Traslado operativo' }
  assert.equal(await api.cambiarSucursalEmpleado('empleado', datos), fixture)
  assert.deepEqual(solicitud, { ruta: '/empleados/empleado/sucursal', method: 'PUT', datos })
})
