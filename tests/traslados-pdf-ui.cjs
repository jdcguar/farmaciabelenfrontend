// QA inicia API simulada (3102) y Vite (5182); requiere backend compilado. Sin Oracle.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
const {spawn}=require('node:child_process'),{once}=require('node:events')
const {chromium}=require('C:/Users/johnychiroy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const frontend=path.resolve(__dirname,'..')
async function iniciar(archivo,args,env,senal) {
  const proceso=spawn(process.execPath,[archivo,...args],{cwd:frontend,env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']})
  await new Promise((resolve,reject)=>{
    const limite=setTimeout(()=>{proceso.kill();reject(new Error(`No inició ${archivo}`))},15000)
    const terminar=()=>{clearTimeout(limite);reject(new Error(`Terminó ${archivo} antes de iniciar`))}
    proceso.once('error',terminar);proceso.once('exit',terminar)
    proceso.stdout.on('data',datos=>{if(datos.toString().includes(senal)){clearTimeout(limite);proceso.off('exit',terminar);proceso.off('error',terminar);resolve()}})
  })
  return proceso
}
async function cerrar(proceso){if(proceso.exitCode===null){const fin=once(proceso,'exit');proceso.kill();await fin}}
async function main() {
  const api=await iniciar('tests/traslados-preview.cjs',[],{},'SIMULADO:')
  let vite,browser
  try {
  vite=await iniciar('node_modules/vite/bin/vite.js',['--host','127.0.0.1','--port','5182','--strictPort'],{VITE_API_URL:'http://127.0.0.1:3102/api'},'Local:')
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),salida=path.resolve(__dirname,'../tmp/traslados-pdf-ui')
  await fs.mkdir(salida,{recursive:true});const errores=[];page.on('pageerror',e=>errores.push(e.message))
  try {
    for(const recurso of ['traslados','despachos','recepciones']) {
      await page.goto('http://127.0.0.1:5182/traslados'+(recurso==='traslados'?'':'/'+recurso))
      const boton=page.getByRole('button',{name:/Generar comprobante de/}).first();await boton.waitFor()
      const fila=boton.locator('xpath=ancestor::td').first();assert.equal(await fila.getByTitle('Ver detalle').count(),1)
      await fila.getByTitle('Ver detalle').focus();await page.keyboard.press('Tab');assert.equal(await boton.evaluate(b=>b===document.activeElement),true)
      const espera=page.waitForEvent('download');await boton.click();const archivo=await espera
      assert.match(archivo.suggestedFilename(),/^comprobante-.*\.pdf$/)
      const destino=path.join(salida,recurso+'.pdf');await archivo.saveAs(destino)
      const pdf=await fs.readFile(destino);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.match(pdf.toString('latin1'),/\/MediaBox \[0 0 595\.28 841\.89\]/)
      await page.getByRole('heading',{level:1}).click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(salida,recurso+'-escritorio.png'),fullPage:true})
      for(const width of [768,390]) {
        await page.setViewportSize({width,height:1000});await boton.scrollIntoViewIfNeeded()
        const dimension=await page.evaluate(()=>({ancho:document.documentElement.clientWidth,contenido:document.documentElement.scrollWidth}))
        assert.ok(dimension.contenido<=dimension.ancho,`Desbordamiento ${recurso}: ${JSON.stringify(dimension)}`)
        const caja=await boton.boundingBox();assert.ok(caja.width>150&&caja.height>=44)
        await page.getByRole('heading',{level:1}).click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(salida,recurso+'-'+width+'.png'),fullPage:true})
      }
      await page.setViewportSize({width:1440,height:1000})
    }
    const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`
    for(const {ruta,ver} of [{ruta:`/traslados/${id(300)}`,ver:'Ver despacho 1'},{ruta:`/traslados/despachos/${id(302)}`,ver:'Ver recepción 1'}]) {
      await page.goto('http://127.0.0.1:5182'+ruta)
      const detalle=page.getByRole('button',{name:ver,exact:true});await detalle.waitFor()
      const comprobante=detalle.locator('..').getByRole('button',{name:/Generar comprobante de/});assert.equal(await comprobante.count(),1)
      const espera=page.waitForEvent('download');await comprobante.click();const archivo=await espera;assert.match(archivo.suggestedFilename(),/\.pdf$/)
    }
    // Un fallo de descarga permite reintentar sin navegar ni perder el listado.
    await page.goto('http://127.0.0.1:5182/traslados/recepciones')
    await page.route('**/traslados/recepciones/*/pdf',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({success:false,error:{code:'SIN_PERMISO',message:'Acceso no autorizado de prueba'}})}))
    const boton=page.getByRole('button',{name:/Generar comprobante de/}).first();await boton.click()
    await page.getByRole('alert').filter({hasText:'Acceso no autorizado de prueba'}).waitFor();assert.equal(await boton.isEnabled(),true)
    assert.deepEqual(errores,[]);console.log('3 PDF verticales y 2 descargas desde listas de detalle; teclado, escritorio/tableta/móvil y reintento: OK')
  } catch(e) {await page.screenshot({path:path.join(salida,'fallo.png'),fullPage:true});console.log((await page.locator('body').innerText()).slice(0,3000));console.log('Errores:',errores);throw e}
  } finally {if(browser)await browser.close();if(vite)await cerrar(vite);await cerrar(api)}
}
main().catch(e=>{console.error(e);process.exitCode=1})
