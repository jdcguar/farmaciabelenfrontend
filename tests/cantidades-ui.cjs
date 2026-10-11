// Pruebas de navegador con API simulada: no usa Oracle ni cuentas reales.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict')
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const root = path.resolve(__dirname, '../dist'), artifacts = path.resolve(__dirname, '../../../artifacts/cantidades')
const id = n => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const unidades = [
  { id: id(2), codigo: 'UD', nombre: 'Unidad', dimension: 'CONTEO', admiteDecimales: true, activo: true },
  { id: id(3), codigo: 'ML', nombre: 'Mililitro', dimension: 'VOLUMEN', admiteDecimales: true, activo: true },
  { id: id(4), codigo: 'G', nombre: 'Gramo', dimension: 'MASA', admiteDecimales: true, activo: true },
  { id: id(5), codigo: 'CAJA', nombre: 'Caja', dimension: 'EMPAQUE', admiteDecimales: false, activo: true }
]
const productos = unidades.slice(0, 3).map((u, i) => ({ id: id(10+i), codigo: 'PRO'+i, nombre: ['Tabletas de prueba', 'Líquido de prueba', 'Polvo de prueba'][i], unidadBaseId: u.id, permiteFraccionamiento: true, activo: true }))
const sucursal = { id: id(1), codigo: 'DEMO', nombre: 'Sucursal de prueba', activo: true }
const permisos = ['ORGANIZACION.SUCURSALES.VER', ...['PRODUCTOS','UNIDADES','PRESENTACIONES','PRECIOS_VIGENTES'].flatMap(p => [`NAVEGACION.CATALOGOS.${p}.ACCEDER`, ...['VER','CREAR','ACTUALIZAR'].map(a => `CATALOGOS.${p}.${a}`)]), 'NAVEGACION.COMPRAS.SOLICITUDES.ACCEDER','COMPRAS.SOLICITUDES.VER','COMPRAS.SOLICITUDES.CREAR']
const sesion = { usuarioId: id(90), nombreUsuario: 'prueba-local', empleadoId: id(90), empleadoCodigo: 'DEMO', empleadoNombre: 'Cuenta simulada', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-01-01T00:00:00Z', sucursal, roles: [], permisos }
const paginar = items => ({ items, total: items.length, totalPaginas: 1, pagina: 1, tamanoPagina: 50 })
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), resolved = path.resolve(root, '.' + pathname), file = resolved.startsWith(root + path.sep) && fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : path.join(root, 'index.html')
  res.setHeader('Content-Type', {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)] ?? 'application/octet-stream'); res.end(fs.readFileSync(file))
})
async function main() {
  fs.mkdirSync(artifacts, { recursive: true })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }), errores = [], escrituras = []
    page.on('pageerror', e => errores.push(e.message))
    await page.route('**/api/**', async route => {
      const req = route.request(), u = new URL(req.url()), ruta = u.pathname
      if (!['GET','OPTIONS'].includes(req.method())) escrituras.push(ruta)
      let data = paginar([])
      if (ruta === '/api/autenticacion/mi-sesion') data = sesion
      else if (ruta === '/api/sucursales') data = [sucursal]
      else if (ruta === '/api/sucursales/mantenimiento') data = paginar([sucursal])
      else if (ruta === '/api/sucursales/'+sucursal.id) data = sucursal
      else if (ruta === '/api/catalogos/productos') data = paginar(productos)
      else if (ruta === '/api/catalogos/unidades') data = paginar(unidades)
      else if (ruta.startsWith('/api/catalogos/productos/')) data = productos.find(x => ruta.endsWith(x.id))
      else if (ruta.startsWith('/api/catalogos/unidades/')) data = unidades.find(x => ruta.endsWith(x.id))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }), headers: {'access-control-allow-origin': `http://127.0.0.1:${server.address().port}`, 'access-control-allow-credentials':'true'} })
    })
    const abrir = ruta => page.goto(`http://127.0.0.1:${server.address().port}${ruta}`)
    const elegir = async (campo, texto) => { await page.locator('#'+campo).click(); await page.getByRole('option', { name: new RegExp(texto) }).click() }
    await abrir('/catalogos/presentaciones/nuevo')
    await page.waitForTimeout(1500)
    if (!await page.locator('#productoId').count()) { console.log('Página:', page.url(), (await page.locator('body').innerText()).slice(0, 1500), errores); await page.screenshot({ path: path.join(artifacts, 'diagnostico.png'), fullPage: true }) }
    await elegir('productoId', 'Tabletas de prueba')
    const cantidad = page.locator('#cantidadBase')
    await cantidad.waitFor(); await page.waitForFunction(() => document.getElementById('cantidadBase')?.readOnly === false)
    assert.equal(await cantidad.getAttribute('inputmode'), 'numeric')
    await cantidad.fill('5'); await cantidad.fill('5.5'); assert.equal(await cantidad.inputValue(), '5')
    assert.equal(await page.getByText('Esta unidad solo acepta enteros, sin decimales.').count(), 1)
    await cantidad.fill('10'); await cantidad.press('Tab'); assert.equal(await cantidad.inputValue(), '10')
    await page.screenshot({ path: path.join(artifacts, 'conteo-enteros.png'), fullPage: true })
    await elegir('productoId', 'Líquido de prueba')
    await page.waitForFunction(() => document.getElementById('cantidadBase')?.getAttribute('inputmode') === 'decimal')
    await cantidad.fill('1'); await cantidad.press('End'); await cantidad.pressSequentially('.05'); assert.equal(await cantidad.inputValue(), '1.05')
    await cantidad.fill('0.000001'); await cantidad.press('Tab'); assert.equal(await cantidad.inputValue(), '0.000001')
    await cantidad.fill('12.340000'); await cantidad.press('Tab'); assert.equal(await cantidad.inputValue(), '12.34')
    await page.screenshot({ path: path.join(artifacts, 'volumen-decimales.png'), fullPage: true })
    await elegir('productoId', 'Tabletas de prueba')
    await page.waitForFunction(() => document.getElementById('cantidadBase')?.getAttribute('inputmode') === 'numeric')
    assert.equal(await cantidad.inputValue(), '12.34')
    await page.getByRole('button', { name: /^Guardar/ }).click()
    assert.equal(escrituras.length, 0); assert.match(await cantidad.getAttribute('data-error-cantidad'), /entera/)
    await cantidad.fill('12'); await cantidad.press('Tab'); assert.equal(await cantidad.getAttribute('data-error-cantidad'), '')
    await elegir('productoId', 'Polvo de prueba'); await page.waitForFunction(() => document.getElementById('cantidadBase')?.getAttribute('inputmode') === 'decimal')
    await cantidad.fill('2.125'); await cantidad.press('Tab'); assert.equal(await cantidad.inputValue(), '2.125')
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(artifacts, 'masa-movil.png'), fullPage: true })
    assert.deepEqual(errores, [])
    console.log('UI OK: enteros, rechazo de pegado decimal, volumen, masa, precisión exacta, cambio de unidad y bloqueo de envío; escritorio y móvil.')
  } finally { await browser.close(); await new Promise(r => server.close(r)) }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1 })
