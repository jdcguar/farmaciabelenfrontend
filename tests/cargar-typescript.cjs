// Ejecuta módulos de contratos sin arrancar Vite, Oracle ni la API.
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
module.exports = function cargador(raiz, sustituciones = {}) {
  const cache = new Map()
  function cargar(archivo) {
    const absoluto = path.resolve(raiz, archivo)
    if (cache.has(absoluto)) return cache.get(absoluto).exports
    const modulo = { exports: {} }
    cache.set(absoluto, modulo)
    const compilado = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const original = Module.createRequire(absoluto)
    const importar = (ruta) => {
      if (sustituciones[ruta]) return sustituciones[ruta]
      if (!ruta.startsWith('.')) return original(ruta)
      let destino = path.resolve(path.dirname(absoluto), ruta)
      if (destino.endsWith('.js')) destino = destino.slice(0, -3) + '.ts'
      else if (!fs.existsSync(destino) && fs.existsSync(`${destino}.ts`)) destino += '.ts'
      else if (!fs.existsSync(destino) && fs.existsSync(`${destino}.tsx`)) destino += '.tsx'
      return cargar(destino)
    }
    new Function('require', 'module', 'exports', compilado)(importar, modulo, modulo.exports)
    return modulo.exports
  }
  return cargar
}
