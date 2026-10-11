// Navegador con API simulada. No conecta Oracle ni utiliza cuentas reales.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict')
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const cargar = require('./cargar-typescript.cjs'), v = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/sucursales/presupuestos'))('finanzas.validator.ts')
const root = path.resolve(__dirname, '../dist'), artifacts = path.resolve(__dirname, '../../../artifacts/presupuestos')
const id = n => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`, now = new Date().toISOString(), periodo = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit' }).format(new Date())
const base = n => ({ id: id(n), version: 1, creadoEn: now, creadoPorId: id(8) })
const suc = { ...base(1), codigo: 'SOLOLA', nombre: 'Sucursal Sololá', tipo: 'FARMACIA', activo: true, direccion: 'Zona central, Sololá', departamento: 'Sololá', municipio: 'Sololá', telefono: null, correo: null, actualizadoEn: null, inactivadoEn: null }
const suc2 = { ...suc, id: id(40), codigo: 'ZACAPA', nombre: 'Sucursal Zacapa' }
const acciones = ['PRESUPUESTOS_VER', 'PRESUPUESTOS_ASIGNAR', 'PRESUPUESTOS_APROBAR', 'PRESUPUESTOS_SUGERIR', 'LIQUIDACIONES_VER', 'LIQUIDACIONES_OPERAR', 'LIQUIDACIONES_ADMINISTRAR', 'FINANZAS_CORPORATIVO']
const sesion = { usuarioId: id(9), nombreUsuario: 'prueba-local', empleadoId: id(9), empleadoCodigo: 'DEMO', empleadoNombre: 'Cuenta simulada', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-01-01T00:00:00Z', sucursal: suc, roles: [], permisos: ['ORGANIZACION.SUCURSALES.VER', 'ORGANIZACION.SUCURSALES.ACTUALIZAR', ...acciones.map(a => 'ORGANIZACION.SUCURSALES.' + a), ...['CAJAS.CREAR', 'MOVIMIENTOS.CREAR', 'MOVIMIENTOS.CONFIRMAR', 'MOVIMIENTOS.CANCELAR', 'MOVIMIENTOS.CORREGIR', 'TURNOS.CERRAR'].map(a => 'CAJA.' + a)] }
const p = { ...base(10), periodo, estado: 'APROBADO', original: '45000.00', autorizado: '45000.00', comprometido: '0.00', consumido: '35000.00', disponible: '10000.00', motivo: 'Abastecimiento mensual', evidencia: 'Acta administrativa', aprobadoPorId: id(7), aprobadoEn: now, sugerencia: null, movimientos: [] }
const antigua = { ...base(20), periodo, secuencia: 1, nombre: `Liquidación 1 · ${periodo}`, estado: 'CERRADA', fondo: '500.00', saldoInicial: '0.00', repuesto: '500.00', gastos: '400.00', comprometido: '0.00', saldo: '100.00', disponible: '100.00', reposicionNecesaria: '0.00', anteriorId: null, motivo: 'Gastos operativos', aprobadoPorId: id(7), aprobadoEn: now, confirmadoPorId: id(7), confirmadoEn: now, cerradoPorId: id(8), cerradoEn: now, movimientos: [{ ...base(21), tipo: 'EGRESO', estado: 'APROBADO', importe: '400.00', fecha: periodo + '-08', motivo: 'Pago de agua y luz', evidencia: 'Factura 001', aprobadoPorId: id(7), aprobadoEn: now }], gastosMensuales: [{ periodo, gastos: '400.00' }], correcciones: [] }
let nueva = null, fondo2 = null, llamadas = [], errores = [], fallarGasto = true
const paginar = items => ({ items, total: items.length, totalPaginas: 1, pagina: 1, tamanoPagina: 50 })
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), resolved = path.resolve(root, '.' + pathname), file = resolved.startsWith(root + path.sep) && fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : path.join(root, 'index.html')
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
  res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream'); res.end(fs.readFileSync(file))
})
async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const browser = await chromium.launch({ headless: true, channel: 'chrome' }), page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  page.on('pageerror', e => errores.push(e.message)); await page.route('**/api/**', async route => {
    const req = route.request(), u = new URL(req.url()), ruta = u.pathname, multipart = req.headers()['content-type']?.startsWith('multipart/form-data'), contenido = multipart ? req.postDataBuffer().toString() : ''
    const body = multipart ? JSON.parse(/name="datos"\r\n\r\n([^]*?)\r\n--/.exec(contenido)[1]) : req.postDataJSON(); let data
    const validar = schema => { const parsed = schema.safeParse(body); assert.ok(parsed.success, JSON.stringify(parsed.error?.issues)); llamadas.push({ ruta, body }) }
    if (ruta === '/api/autenticacion/mi-sesion') data = sesion
    else if (ruta === '/api/sucursales') data = [suc]
    else if (ruta === '/api/sucursales/mantenimiento') data = paginar([suc, suc2])
    else if (ruta === '/api/sucursales/' + suc.id) data = suc
    else if (ruta === '/api/sucursales/' + suc2.id) data = suc2
    else if (ruta === '/api/caja-chica/fondos') data = paginar([{ ...base(2), sucursalId: suc.id, sucursal: suc, cajaId: id(3), codigo: 'CHICA-SOLOLA', nombre: 'Caja chica de sucursal', estado: 'DISPONIBLE', fondo: '500.00', saldo: nueva?.saldo ?? '100.00', disponible: nueva?.disponible ?? '100.00' }, ...(fondo2 ? [fondo2] : [])].filter(f => !u.searchParams.get('sucursalId') || u.searchParams.get('sucursalId') === f.sucursalId))
    else if (ruta.endsWith('/' + suc2.id + '/caja-chica/fondo') && req.method() === 'PATCH') { validar(v.modificarFondo); assert.equal(body.version, fondo2.version); Object.assign(fondo2, { fondo: body.importe, version: fondo2.version + 1 }); data = fondo2 }
    else if (ruta.endsWith('/' + suc2.id + '/caja-chica/fondo')) { validar(v.crearFondo); fondo2 = { ...base(42), sucursalId: suc2.id, sucursal: suc2, cajaId: id(43), codigo: 'CHICA-ZACAPA', nombre: 'Caja chica de sucursal', estado: 'DISPONIBLE', fondo: body.importe, saldo: '0.00', disponible: '0.00' }; data = fondo2 }
    else if (ruta === '/api/caja-chica/liquidaciones') { const q = v.consultaCajaChica.parse(Object.fromEntries(u.searchParams)); assert.equal(q.pagina, 1); data = paginar((nueva ? [nueva, antigua] : [antigua]).filter(l => (!q.estado || l.estado === q.estado) && (!q.periodo || l.periodo === q.periodo)).map(l => ({ ...l, sucursalId: suc.id, sucursal: suc }))) }
    else if (ruta.endsWith('/presupuestos') && req.method() === 'GET') data = paginar([p])
    else if (ruta.endsWith('/presupuestos/' + p.id)) data = p
    else if (ruta.endsWith('/presupuestos/' + p.id + '/ajustes')) { validar(v.ajustePresupuesto); const mov = { ...base(11), tipo: body.tipo, estado: 'SOLICITADO', importe: body.importe, motivo: body.motivo, evidencia: body.evidencia, aprobadoPorId: null, aprobadoEn: null }; p.movimientos.push(mov); p.version++; data = mov }
    else if (ruta.endsWith('/presupuestos/ajustes/' + id(11) + '/aprobar')) { validar(v.accionFinanzas); Object.assign(p, { autorizado: '53000.00', disponible: '18000.00', version: p.version + 1 }); Object.assign(p.movimientos[0], { estado: 'APROBADO', aprobadoPorId: id(9), aprobadoEn: now }); data = p }
    else if (ruta.endsWith('/caja-chica/liquidaciones') && req.method() === 'GET') data = { ...paginar(nueva ? [nueva, antigua] : [antigua]), fondo: { ...base(2), cajaId: id(3), fondo: '500.00', saldo: nueva?.saldo ?? '100.00' }, activa: nueva, gastosMensuales: [{ periodo, gastos: '400.00' }] }
    else if (ruta.endsWith('/caja-chica/liquidaciones') && req.method() === 'POST') { validar(v.nuevaLiquidacion); nueva = { ...antigua, ...base(22), secuencia: 2, nombre: `Liquidación 2 · ${periodo}`, estado: 'SOLICITADA', saldoInicial: '100.00', repuesto: '0.00', gastos: '0.00', saldo: '100.00', disponible: '100.00', reposicionNecesaria: '400.00', anteriorId: antigua.id, aprobadoPorId: null, aprobadoEn: null, confirmadoPorId: null, confirmadoEn: null, cerradoEn: null, cerradoPorId: null, movimientos: [], gastosMensuales: [] }; data = nueva }
    else if (nueva && ruta.endsWith('/caja-chica/liquidaciones/' + nueva.id + '/aprobar')) { validar(v.accionFinanzas); Object.assign(nueva, { estado: 'ABIERTA', aprobadoPorId: id(9), aprobadoEn: now, version: nueva.version + 1 }); data = nueva }
    else if (nueva && ruta.endsWith('/caja-chica/liquidaciones/' + nueva.id + '/reposicion')) { validar(v.accionFinanzas); Object.assign(nueva, { saldo: '500.00', disponible: '500.00', repuesto: '400.00', reposicionNecesaria: '0.00', confirmadoPorId: id(9), confirmadoEn: now, version: nueva.version + 1 }); data = nueva }
    else if (nueva && ruta.endsWith('/caja-chica/liquidaciones/' + nueva.id + '/gastos/con-comprobante')) {
      validar(v.gastoConComprobante); assert.ok(multipart); assert.ok(contenido.includes('%PDF-1.4')); assert.ok(contenido.includes('filename="factura.pdf"'))
      if (fallarGasto) { fallarGasto = false; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'PRUEBA_REINTENTO', message: 'Error temporal de prueba; vuelve a intentarlo.' } }) }); return }
      nueva.movimientos.push({ ...base(23), tipo: 'EGRESO', estado: 'SOLICITADO', importe: body.importe, fecha: body.fecha, motivo: body.motivo, evidencia: 'Comprobante PDF: factura.pdf', comprobante: { nombre: 'factura.pdf', bytes: 36 }, aprobadoPorId: null, aprobadoEn: null })
      Object.assign(nueva, { comprometido: '50.00', disponible: '450.00', version: nueva.version + 1 }); data = nueva
    }
    else if (nueva && ruta.endsWith('/caja-chica/movimientos/' + id(23) + '/confirmar')) {
      validar(v.accionFinanzas)
      Object.assign(nueva.movimientos[0], { estado: 'APROBADO', aprobadoPorId: id(9), aprobadoEn: now })
      Object.assign(nueva, { gastos: '50.00', egresosAcumulados: '50.00', ajustes: '0.00', comprometido: '0.00', disponible: '450.00', saldo: '450.00', gastosMensuales: [{ periodo, gastos: '50.00' }], version: nueva.version + 1 }); data = nueva
    }
    else if (ruta.endsWith('/caja-chica/liquidaciones/' + antigua.id)) data = antigua
    else if (nueva && ruta.endsWith('/caja-chica/liquidaciones/' + nueva.id)) data = nueva
    else if (ruta.endsWith('/movimientos/' + id(23) + '/comprobante')) { await route.fulfill({ status: 200, contentType: 'application/pdf', headers: { 'content-disposition': 'attachment; filename="factura.pdf"', 'cache-control': 'private, no-store', 'access-control-allow-origin': `http://127.0.0.1:${server.address().port}`, 'access-control-allow-credentials': 'true' }, body: '%PDF-1.4\nFactura de prueba\n%%EOF' }); return }
    else if (ruta.includes('/notificaciones')) data = ruta.includes('resumen') ? { sinLeer: 0, total: 0 } : paginar([])
    else data = []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }), headers: { 'access-control-allow-origin': `http://127.0.0.1:${server.address().port}`, 'access-control-allow-credentials': 'true' } })
  })
  async function completar(_panel, texto) {
    const modal = page.getByRole('dialog'); assert.equal(await modal.count(), 1)
    await modal.getByLabel('Motivo', { exact: true }).fill(texto); await modal.getByLabel('Evidencia o referencia del comprobante').fill('Acta de prueba')
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click()
    await modal.getByRole('button', { name: 'Confirmar', exact: true }).click(); await modal.waitFor({ state: 'hidden' })
  }
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/organizacion/sucursales/${suc.id}`)
    const presupuestos = page.locator('#sucursal-presupuestos'), chica = page.locator('#sucursal-caja-chica')
    await presupuestos.getByText('Historial mensual de presupuestos', { exact: true }).click();
    await presupuestos.getByRole('button', { name: 'Ver detalle', exact: true }).click();
    assert.equal(await presupuestos.getByRole('button', { name: 'Solicitar ampliación' }).count(), 0);
    assert.equal(await presupuestos.getByRole('button', { name: 'Asignar presupuesto' }).count(), 0);
    assert.equal(await chica.getByRole('button', { name: 'Nueva liquidación' }).count(), 0);
    await chica.getByText('Q100.00', { exact: true }).waitFor();
    fs.mkdirSync(artifacts, { recursive: true }); await presupuestos.getByRole('button', { name: 'Ocultar detalle', exact: true }).click(); await presupuestos.getByText('Historial mensual de presupuestos', { exact: true }).click(); await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) }); await page.screenshot({ path: path.join(artifacts, 'sucursal-consulta.png'), fullPage: true });
    await page.getByRole('button', { name: 'Editar información' }).click();
    await presupuestos.getByRole('button', { name: 'Asignar presupuesto', exact: true }).click()
    let modal = page.getByRole('dialog'); await modal.getByLabel('Mes y año').waitFor()
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click()
    assert.equal(await modal.locator('form').evaluate(f => f.checkValidity()), false); assert.equal(llamadas.length, 0)
    await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' })
    assert.equal(await presupuestos.getByRole('button', { name: 'Asignar presupuesto', exact: true }).evaluate(e => document.activeElement === e), true)
    await presupuestos.getByRole('button', { name: 'Calcular presupuesto sugerido', exact: true }).click()
    await modal.getByLabel('Inventario objetivo al cierre (GTQ)').waitFor(); await modal.getByRole('button', { name: 'Cancelar', exact: true }).click(); await modal.waitFor({ state: 'hidden' })
    await presupuestos.getByRole('button', { name: 'Ver detalle', exact: true }).click()
    const ampliar = presupuestos.getByRole('button', { name: 'Solicitar ampliación' }); await ampliar.scrollIntoViewIfNeeded()
    const scrollAntes = await page.evaluate(() => window.scrollY); await ampliar.click(); await modal.getByLabel('Importe (GTQ)').waitFor()
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - scrollAntes) <= 1, 'Abrir el formulario no desplaza la página')
    assert.equal(await presupuestos.getByLabel('Importe (GTQ)').count(), 0, 'El formulario debe estar en el portal del modal')
    assert.equal(await modal.getByLabel('Importe (GTQ)').evaluate(e => document.activeElement === e), true)
    await modal.getByRole('button', { name: 'Cerrar mensaje' }).focus(); await page.keyboard.press('Shift+Tab')
    assert.equal(await modal.getByRole('button', { name: 'Continuar', exact: true }).evaluate(e => document.activeElement === e), true)
    await page.keyboard.press('Tab'); assert.equal(await modal.getByRole('button', { name: 'Cerrar mensaje' }).evaluate(e => document.activeElement === e), true)
    await modal.getByLabel('Importe (GTQ)').fill('8000.00'); await modal.getByLabel('Motivo', { exact: true }).fill('Incremento de demanda'); await modal.getByLabel('Evidencia o referencia del comprobante').fill('Acta de prueba')
    await modal.screenshot({ path: path.join(artifacts, 'modal-ampliacion-escritorio.png') })
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click(); assert.equal(await page.getByRole('dialog').count(), 1)
    await modal.getByRole('button', { name: 'Volver', exact: true }).click(); assert.equal(await modal.getByLabel('Importe (GTQ)').inputValue(), '8000.00'); assert.equal(await modal.getByLabel('Motivo', { exact: true }).inputValue(), 'Incremento de demanda')
    await completar(presupuestos, 'Incremento de demanda')
    await presupuestos.getByRole('button', { name: 'Aprobar', exact: true }).click(); await completar(presupuestos, 'Ampliación revisada'); await presupuestos.getByText('Q53,000.00', { exact: true }).first().waitFor()
    assert.equal(await page.locator('form form').count(), 0, 'Los formularios financieros no deben estar anidados');
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) }); await page.screenshot({ path: path.join(artifacts, 'sucursal-edicion.png'), fullPage: true });
    const permisosOriginales = sesion.permisos; sesion.permisos = permisosOriginales.filter(p => p !== 'ORGANIZACION.SUCURSALES.LIQUIDACIONES_OPERAR')
    await page.goto(`http://127.0.0.1:${server.address().port}/caja/chica/${suc.id}`);
    await page.getByRole('button', { name: 'Crear Caja Chica', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Nueva liquidación', exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Crear Caja Chica', exact: true }).click(); await modal.getByLabel('Fondo autorizado por liquidación (GTQ)').waitFor()
    await modal.getByRole('combobox', { name: 'Sucursal', exact: true }).click(); await page.getByRole('option', { name: 'ZACAPA · Sucursal Zacapa', exact: true }).click()
    await modal.getByLabel('Fondo autorizado por liquidación (GTQ)').fill('250.00'); await completar(chica, 'Asignación administrativa para Zacapa'); assert.equal(fondo2.fondo, '250.00')
    await page.getByRole('combobox', { name: 'Sucursal', exact: true }).click(); await page.getByRole('option', { name: 'Todas las sucursales', exact: true }).click(); await page.getByText('ZACAPA · Sucursal Zacapa', { exact: true }).last().waitFor()
    await page.getByRole('button', { name: 'Modificar fondo de Sucursal Zacapa', exact: true }).click()
    await modal.getByLabel('Nuevo fondo autorizado (GTQ)').waitFor(); assert.equal(await modal.getByLabel('Nuevo fondo autorizado (GTQ)').inputValue(), '250.00')
    await modal.getByText(/ZACAPA · Sucursal Zacapa/).waitFor(); assert.equal(await modal.getByRole('combobox').count(), 0)
    await modal.getByLabel('Nuevo fondo autorizado (GTQ)').fill('350.00'); await modal.getByLabel('Motivo', { exact: true }).fill('Aumento del fondo para siguientes liquidaciones'); await modal.getByLabel('Evidencia o referencia del comprobante').fill('Acta administrativa de prueba')
    await modal.screenshot({ path: path.join(artifacts, 'modal-modificar-fondo.png') })
    await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await modal.evaluate(e => e.scrollWidth <= e.clientWidth + 1)); await modal.screenshot({ path: path.join(artifacts, 'modal-modificar-fondo-movil.png') }); await page.setViewportSize({ width: 1440, height: 1000 })
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click(); await modal.getByRole('button', { name: 'Volver', exact: true }).click(); assert.equal(await modal.getByLabel('Nuevo fondo autorizado (GTQ)').inputValue(), '350.00')
    await completar(chica, 'Aumento del fondo para siguientes liquidaciones'); await page.getByText('Q350.00', { exact: true }).waitFor(); assert.equal(fondo2.saldo, '0.00')
    await page.screenshot({ path: path.join(artifacts, 'cajas-chicas-listado.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#navegacion-principal[aria-hidden="true"]').waitFor({ state: 'attached' }); await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    await page.screenshot({ path: path.join(artifacts, 'cajas-chicas-listado-movil.png'), fullPage: true }); await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Ver liquidaciones de Sucursal Sololá', exact: true }).click(); await page.waitForURL('**/caja/liquidaciones/' + suc.id); assert.equal(await page.getByRole('button', { name: 'Nueva liquidación', exact: true }).count(), 0)
    sesion.permisos = permisosOriginales.filter(p => !['ORGANIZACION.SUCURSALES.LIQUIDACIONES_ADMINISTRAR', 'CAJA.CAJAS.CREAR'].includes(p))
    await page.goto(`http://127.0.0.1:${server.address().port}/caja/chica`); await page.getByRole('heading', { name: 'Cajas chicas creadas', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Crear Caja Chica', exact: true }).count(), 0)
    await page.getByText('Q350.00', { exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: /Modificar fondo de/ }).count(), 0)
    await page.getByRole('button', { name: 'Ver liquidaciones de Sucursal Sololá', exact: true }).click()
    await page.getByRole('button', { name: 'Nueva liquidación', exact: true }).click(); await completar(chica, 'Segunda liquidación del mes'); await page.waitForURL('**/caja/liquidaciones/' + suc.id + '/' + nueva.id)
    assert.equal(await chica.getByRole('button', { name: 'Autorizar reposición', exact: true }).count(), 0); sesion.permisos = permisosOriginales
    await page.goto(`http://127.0.0.1:${server.address().port}/caja/liquidaciones/${suc.id}/${nueva.id}`)
    await chica.getByRole('button', { name: 'Autorizar reposición' }).click(); await completar(chica, 'Reposición autorizada por faltante'); assert.equal(nueva.saldo, '100.00')
    await chica.getByRole('button', { name: 'Confirmar recepción de reposición' }).click(); await completar(chica, 'Entrega de Q400 verificada'); assert.equal(nueva.saldo, '500.00')
    await page.getByRole('button', { name: 'Volver al listado', exact: true }).click(); await page.getByText(/Ya existe una liquidación activa/).waitFor(); await page.getByRole('button', { name: 'Nueva liquidación', exact: true }).isDisabled().then(v => assert.equal(v, true))
    const estados = page.getByRole('group', { name: 'Filtrar por estado', exact: true })
    await estados.getByRole('button', { name: 'Abierta', exact: true }).click(); await page.getByRole('button', { name: `Ver detalle de ${nueva.nombre}`, exact: true }).waitFor(); assert.equal(await estados.getByRole('button', { name: 'Abierta', exact: true }).getAttribute('aria-pressed'), 'true'); assert.equal(await page.getByRole('button', { name: `Ver detalle de ${antigua.nombre}`, exact: true }).count(), 0)
    await estados.getByRole('button', { name: 'Cerrada', exact: true }).click(); await page.getByRole('button', { name: `Ver detalle de ${antigua.nombre}`, exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: `Ver detalle de ${nueva.nombre}`, exact: true }).count(), 0); assert.equal(await page.getByRole('button', { name: 'Nueva liquidación', exact: true }).isDisabled(), true, 'Filtrar cerradas no permite duplicar la activa')
    await estados.getByRole('button', { name: 'Solicitada', exact: true }).click(); await page.getByRole('heading', { name: 'Sin coincidencias', exact: true }).waitFor()
    await page.getByLabel('Mes', { exact: true }).fill(periodo); await estados.getByRole('button', { name: 'Todos', exact: true }).click(); await page.getByRole('button', { name: `Ver detalle de ${nueva.nombre}`, exact: true }).waitFor(); await page.getByRole('button', { name: `Ver detalle de ${antigua.nombre}`, exact: true }).waitFor(); assert.equal(await page.getByLabel('Mes', { exact: true }).inputValue(), periodo)
    await page.screenshot({ path: path.join(artifacts, 'liquidaciones-listado.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#navegacion-principal[aria-hidden="true"]').waitFor({ state: 'attached' }); await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    await page.screenshot({ path: path.join(artifacts, 'liquidaciones-listado-movil.png'), fullPage: true }); await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: `Ver detalle de ${nueva.nombre}`, exact: true }).click(); await chica.getByRole('button', { name: 'Registrar gasto', exact: true }).waitFor()
    const orden = await chica.locator('article > h2').allTextContents(); assert.ok(orden[0].includes('Resumen de la liquidación')); assert.ok(orden[1].includes('Movimientos')); assert.ok(orden[2].includes('Auditoría'))
    fs.mkdirSync(artifacts, { recursive: true }); await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({ path: path.join(artifacts, 'sucursal-escritorio.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#navegacion-principal[aria-hidden="true"]').waitFor({state:'attached'}); await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1); await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({ path: path.join(artifacts, 'sucursal-movil.png'), fullPage: true })
    await chica.screenshot({path:path.join(artifacts,'caja-chica-movil.png')})
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'La página se desborda horizontalmente')
    await chica.getByRole('button', { name: 'Registrar gasto', exact: true }).click(); modal = page.getByRole('dialog')
    await modal.getByLabel('Importe del gasto (GTQ)').fill('50.00'); await modal.getByLabel('Motivo', { exact: true }).fill('Pago de agua')
    assert.equal(await modal.getByLabel('Evidencia o referencia del comprobante').count(), 0)
    await modal.getByLabel('Comprobante PDF').setInputFiles({ name: 'falso.txt', mimeType: 'text/plain', buffer: Buffer.from('No es un PDF') }); await modal.getByRole('alert').waitFor()
    await modal.getByLabel('Comprobante PDF').setInputFiles({ name: 'factura.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nFactura de prueba\n%%EOF') })
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click(); await modal.getByRole('button', { name: 'Volver', exact: true }).click(); await modal.getByText(/Seleccionado: factura.pdf/).waitFor()
    assert.equal(await modal.getByLabel('Comprobante PDF').evaluate(e => e.files[0]?.name), 'factura.pdf', 'Volver restaura también el selector nativo del archivo')
    assert.ok(await modal.evaluate(e => e.scrollWidth <= e.clientWidth + 1), 'El formulario modal se desborda en móvil')
    await modal.screenshot({ path: path.join(artifacts, 'modal-gasto-movil.png') })
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click(); await modal.getByRole('button', { name: 'Confirmar', exact: true }).click()
    await modal.getByRole('alert').waitFor(); assert.equal(await modal.getByLabel('Importe del gasto (GTQ)').inputValue(), '50.00'); assert.equal(await modal.getByLabel('Motivo', { exact: true }).inputValue(), 'Pago de agua')
    await modal.getByRole('button', { name: 'Continuar', exact: true }).click(); await modal.getByRole('button', { name: 'Confirmar', exact: true }).click(); await modal.waitFor({ state: 'hidden' })
    const intentos = llamadas.filter(l => l.ruta.endsWith('/gastos/con-comprobante')); assert.equal(intentos.length, 2); assert.equal(intentos[0].body.claveIdempotencia, intentos[1].body.claveIdempotencia, 'Reintentar conserva la clave y el contenido')
    const descargado = page.waitForEvent('download'); await chica.getByRole('button', { name: 'Descargar factura.pdf', exact: true }).click(); assert.equal((await descargado).suggestedFilename(), 'factura.pdf')
    await chica.getByRole('button', { name: 'Confirmar gasto', exact: true }).click(); await modal.getByLabel('Motivo', { exact: true }).waitFor()
    await modal.screenshot({ path: path.join(artifacts, 'modal-aprobar-gasto-movil.png') }); await completar(chica, 'Comprobante y efectivo verificados'); assert.equal(nueva.saldo, '450.00')
    await page.goto(`http://127.0.0.1:${server.address().port}/caja/cajas/nuevo`);
    await page.getByRole('heading', { name: 'Crear caja', exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'Tipo', exact: true }).click();
    assert.equal(await page.getByRole('option', { name: 'Caja chica', exact: true }).count(), 0);
    await page.getByRole('option', { name: 'Caja de ventas', exact: true }).waitFor();
    assert.deepEqual(errores, []); assert.equal(llamadas.length, 10); console.log('Interfaz verificada: presupuestos, creación y modificación administrativa de fondo en otra sucursal sin incrementar efectivo, permisos separados de creación/operación, listados de fondos/liquidaciones, detalle resumen/movimientos/auditoría, única activa, reposición, registro PDF multipart, archivo inválido, Volver/reintento conservan PDF, descarga y aprobación; escritorio y móvil. 10 solicitudes cumplen contratos reales (una falla simulada y nueve operaciones exitosas).')
  } finally { await browser.close(); server.close() }
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1 })
