const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs'), ts = require('typescript')
const { createRequire } = require('node:module'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server')
const cargar = require('./cargar-typescript.cjs')
const { erroresDesdeDetallesRol, validarFormularioRol } = cargar(path.resolve(__dirname, '../src/modules/roles'))('validacion-rol.ts')

test('el rechazo de tamaño de permisos se conserva como error del selector', () => {
  assert.deepEqual(erroresDesdeDetallesRol([{ campo: 'permisosIds', mensaje: 'Un rol puede tener como máximo 1000 permisos.' }]), { permisosIds: 'Un rol puede tener como máximo 1000 permisos.' })
})

test('errores de permisos individuales se agrupan sin perder los errores de datos', () => {
  assert.deepEqual(erroresDesdeDetallesRol([
    { campo: 'permisosIds.0', mensaje: 'UUID inválido.' },
    { campo: 'permisosIds.1', mensaje: 'UUID inválido.' },
    { campo: 'nombre', mensaje: 'Nombre obligatorio.' },
    { campo: 'version', mensaje: 'Versión inválida.' },
  ]), { permisosIds: 'UUID inválido.', nombre: 'Nombre obligatorio.' })
  assert.deepEqual(validarFormularioRol({ codigo: 'ADMIN', nombre: 'Administrador', descripcion: '' }), {})
})

test('el formulario compartido de creación y edición muestra y asocia el error de permisos', () => {
  const archivo = path.resolve(__dirname, '../src/modules/roles/components/rol-formulario-campos.tsx')
  const compilado = ts.transpileModule(fs.readFileSync(archivo, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const original = createRequire(archivo), modulo = { exports: {} }
  const importar = ruta => ruta.endsWith('.module.css') ? { default: {} } : ruta === './selector-permisos' ? { SelectorPermisos: () => React.createElement('div', null, 'Selector') } : original(ruta)
  new Function('require', 'module', 'exports', compilado)(importar, modulo, modulo.exports)
  const props = { datos: { codigo: 'ADMIN', nombre: 'Administrador', descripcion: '' }, errores: { permisosIds: 'Un rol puede tener como máximo 1000 permisos.' }, catalogo: { modulos: [] }, permisosSeleccionados: [], onDatosChange: () => {}, onPermisosChange: () => {}, deshabilitado: false }
  const html = renderToStaticMarkup(React.createElement(modulo.exports.RolFormularioCampos, props))
  assert.match(html, /id="rol-seccion-2" aria-describedby="error-permisosIds"/)
  assert.match(html, /id="error-permisosIds" role="alert">Un rol puede tener como máximo 1000 permisos\./)
  const sinError = renderToStaticMarkup(React.createElement(modulo.exports.RolFormularioCampos, { ...props, errores: {} }))
  assert.doesNotMatch(sinError, /error-permisosIds/)
})
