const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const ts = require('typescript'), { createRequire } = require('node:module'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server')
const root = path.resolve(__dirname, '..'), backend = path.resolve(root, '../../Backend/FarmaciaBelenBackend')
const cargar = require('./cargar-typescript.cjs')
const nav = cargar(path.join(root, 'src/shared/seguridad'))('navegacion.ts')
const roles = cargar(path.join(backend, 'src/database/seeds/operacion'))('operacion.seed-data.ts').rolesOperativos

function cargarComponente(archivo, sustituciones = {}) {
  const cache = new Map()
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports
    const mod = { exports: {} }; cache.set(file, mod)
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const original = createRequire(file)
    const importar = name => {
      if (sustituciones[name]) return sustituciones[name]
      if (name.endsWith('.css')) return { default: {} }
      if (/\.(png|svg)$/.test(name)) return { default: name }
      if (name.endsWith('cliente-api')) return { construirUrlApi: r => r }
      if (!name.startsWith('.')) return original(name)
      let target = path.resolve(path.dirname(file), name)
      if (target.endsWith('.js')) target = target.slice(0, -3)
      if (!fs.existsSync(target)) target += fs.existsSync(target + '.tsx') ? '.tsx' : '.ts'
      return load(target)
    }
    new Function('require', 'module', 'exports', source)(importar, mod, mod.exports)
    return mod.exports
  }
  return load(path.join(root, archivo))
}

test('frontend utiliza el catálogo canónico y todos los submenús quedan cubiertos', () => {
  assert.equal(fs.readFileSync(path.join(root, 'src/shared/seguridad/navegacion.ts'), 'utf8'), fs.readFileSync(path.join(backend, 'src/shared/seguridad/navegacion.ts'), 'utf8'))
  for (const p of nav.pantallasNavegacion) for (const ruta of p.rutas) assert.equal(nav.pantallaPorRuta(ruta).id, p.id, ruta)
})

test('el menú y el panel de inicio del cajero muestran solo pantallas asignadas', () => {
  global.window = { matchMedia: () => ({ matches: false }) }
  const { DashboardView } = cargarComponente('src/modules/dashboard/components/dashboard-view.tsx', {
    './panel-principal': { PanelPrincipal: props => React.createElement('div', { 'data-panel': true }, props.areas.flatMap(a => a.accesos.map(p => React.createElement('span', { key: p.id, 'data-acceso': p.id }, p.nombre)))) },
  })
  const render = permisos => renderToStaticMarkup(React.createElement(DashboardView, {
    sesion: { usuarioId: 'u', empleadoId: 'e', nombreUsuario: 'cajero', empleadoNombre: 'Cajero de prueba', permisos, roles: [], sucursal: { id: 's', nombre: 'Sucursal' }, expiraEn: '2026-10-09T22:00:00Z' },
    rutaActual: '/caja/turnos', onNavegar: () => {}, onCerrarSesion: () => {}, cerrandoSesion: false, errorCierre: null,
  }))
  const html = render(roles.find(r => r.codigo === 'CAJERO').permisos)
  assert.match(html, /Cobro Ventas/); assert.match(html, /Turnos de caja/); assert.match(html, /Cierres de turno/)
  for (const titulo of ['Flujo de efectivo', 'Configuración de caja', 'Cierres diarios', 'Depósitos']) assert.ok(!html.includes(titulo), titulo)
  assert.match(html, /data-acceso="caja-turnos"/)
  for (const p of nav.pantallasNavegacion.filter(p => nav.puedeAccederPantalla(p.id, roles.find(r => r.codigo === 'CAJERO').permisos))) {
    assert.ok(html.includes(`data-acceso="${p.id}"`), `Inicio del cajero: ${p.id}`)
  }
  assert.ok(!html.includes('data-acceso="caja-consolidado"'))
  const todos = [...new Set(nav.pantallasNavegacion.flatMap(p => [p.permiso, ...p.requisitos.flat()]))]
  const completo = render(todos)
  for (const p of nav.pantallasNavegacion) assert.ok(completo.includes(`data-acceso="${p.id}"`), `Inicio: ${p.id}`)
  const sinAcceso = render(['CAJA.TURNOS.VER', 'CAJA.CAJAS.VER'])
  assert.ok(!sinAcceso.includes('Caja y flujo de efectivo'))
  delete global.window
})

test('editor separa acceso/operación y explica requisitos faltantes sin conceder acciones', () => {
  const { SelectorPermisos } = cargarComponente('src/modules/roles/components/selector-permisos.tsx')
  const p = nav.pantallaPorId('caja-turnos')
  const catalogo = { modulos: [{ id: 'nav', codigo: 'NAVEGACION', nombre: 'Acceso a pantallas', permisosDirectos: [], submodulos: [{ id: 'caja', codigo: 'CAJA', nombre: 'Caja', permisos: [{ id: 'acceso', codigo: p.permiso, nombre: 'Acceder a Turnos de caja', accion: 'ACCEDER', descripcion: 'Permite acceder al submenú' }] }] }] }
  const html = renderToStaticMarkup(React.createElement(SelectorPermisos, { catalogo, seleccionados: ['acceso'], onChange: () => {} }))
  assert.match(html, /Acceso a pantallas/); assert.match(html, /Permisos de operación/)
  assert.match(html, /Hay pantallas que requieren permisos de operación adicionales/)
  assert.match(html, /CAJA.TURNOS.VER/)
  assert.match(html, /Acceder a Turnos de caja/)
})
