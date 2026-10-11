const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const cargar = require('./cargar-typescript.cjs')
const id = '10000000-0000-4000-8000-000000000104'

test('preview es GET de solo lectura; emisión y movimiento usan contratos estrictos independientes', async () => {
  const llamadas = [], archivo = { contenido: new Blob(['%PDF']), nombreArchivo: 'venta.pdf' }
  const descargas = { obtenerArchivoApi: async (ruta, opciones) => { llamadas.push({ ruta, opciones }); return archivo }, descargarArchivoApi: async (ruta, opciones) => llamadas.push({ ruta, opciones }) }
  const api = cargar(path.resolve(__dirname, '../src/modules/ventas'), { '../../shared/api/cliente-api': {}, '../../shared/api/descargar-archivo-api': descargas })('venta-api.ts')
  const controlador = new AbortController()
  assert.equal(await api.vistaPreviaComprobanteVenta(id, controlador.signal), archivo)
  assert.equal(llamadas[0].ruta, `/ventas/${id}/comprobante`)
  assert.equal(llamadas[0].opciones.method ?? 'GET', 'GET'); assert.equal(llamadas[0].opciones.signal, controlador.signal)
  assert.equal(llamadas[0].opciones.datos, undefined)
  const datos = { claveIdempotencia: id, version: 3, motivo: 'Emitir comprobante', evidencia: 'Solicitud de caja' }
  assert.equal(await api.generarComprobanteVenta(id, datos), archivo)
  assert.equal(llamadas[1].opciones.method, 'POST'); assert.deepEqual(llamadas[1].opciones.datos, datos)
  const caja = cargar(path.resolve(__dirname, '../src/modules/caja'), { '../../shared/api/cliente-api': {}, '../../shared/api/descargar-archivo-api': descargas })('caja-api.ts')
  await caja.generarComprobanteMovimiento(id, id)
  assert.equal(llamadas[2].ruta, `/caja/movimientos/${id}/comprobante`)
  const schema = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/ventas'))('venta.validator.ts').comprobanteMovimientoSchema
  assert.equal(schema.safeParse(llamadas[2].opciones.datos).success, true)
  assert.equal('version' in llamadas[2].opciones.datos, false)
})

function modal(api, autorizado = true) {
  let indice = 0, pendientes = [], props = { id, version: 3, autorizado, onCerrar: () => {} }
  const hooks = [], descargas = []
  const react = {
    useState(inicial) { const i = indice++; hooks[i] ??= { valor: typeof inicial === 'function' ? inicial() : inicial }; return [hooks[i].valor, v => { hooks[i].valor = typeof v === 'function' ? v(hooks[i].valor) : v }] },
    useRef(valor) { const i = indice++; hooks[i] ??= { current: valor }; return hooks[i] },
    useEffect(fn, deps) { const i = indice++, previo = hooks[i]; if (!previo || deps.some((d, j) => !Object.is(d, previo.deps[j]))) { previo?.limpiar?.(); hooks[i] = { deps }; pendientes.push(() => { hooks[i].limpiar = fn() }) } },
  }
  const { VentaComprobanteModal } = cargar(path.resolve(__dirname, '../src/modules/ventas/components'), {
    react, '../venta-api': api, './venta-comprobante-resumen': {VentaComprobanteResumen:()=>null}, '../../../shared/api/descargar-archivo-api': { guardarArchivoApi: a => descargas.push(a) },
    '../../../shared/components/modal-estado': { ModalEstado: () => null }, '../venta.module.css': { default: {} }, '../../../shared/components/gestion-modulo/formulario-modulo.module.css': { default: {} },
  })('venta-comprobante-modal.tsx')
  function render() { indice = 0; const nodo = VentaComprobanteModal(props); const efectos = pendientes; pendientes = []; efectos.forEach(fn => fn()); return nodo }
  function buscar(nodo, criterio) { if (!nodo || typeof nodo !== 'object') return null; if (criterio(nodo)) return nodo; const hijos = [nodo.props?.mensaje, nodo.props?.children].flat(Infinity); for (const h of hijos) { const n = buscar(h, criterio); if (n) return n } return null }
  return { render, descargas, buscar, boton: (n, texto) => buscar(n, e => e.type === 'button' && e.props.children === texto), frame: n => buscar(n, e => e.type === 'iframe'), desmontar: () => hooks.forEach(h => h?.limpiar?.()), cambiar: nuevo => { props = { ...props, ...nuevo } } }
}
const turno = () => new Promise(resolve => setImmediate(resolve))
const pdf = () => ({ contenido: new Blob(['%PDF-1.7'], { type: 'application/pdf' }), nombreArchivo: 'venta.pdf' })

test('vista del comprobante muestra datos históricos y dinero exacto sin datos clínicos ni fiscales del cliente', () => {
  const React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
  const {VentaComprobanteResumen}=cargar(path.resolve(__dirname,'../src/modules/ventas/components'),{'../venta.module.css':{default:{}},'../../../shared/cantidades/cantidad':{mostrarCantidad:x=>x.replace(/\.0+$/,'')},'../venta-reglas':{dineroVenta:x=>`Q ${x}`}})('venta-comprobante-resumen.tsx')
  const venta={numero:'VEN-104',confirmadoEn:'2026-10-10T14:00:00Z',clienteHistorico:{nombre:'Cliente histórico',nit:'NIT PRIVADO',paciente:'PACIENTE PRIVADO'},lineas:[{id,precio:'9999999999999.99',total:'9999999999999.99',cantidad:'1.000000',historico:{productoNombre:'Producto ficticio',presentacionNombre:'Caja'}}],subtotal:'9999999999999.99',impuesto:'0.00',total:'9999999999999.99',efectivoRecibido:'9999999999999.99',cambio:'0.00'}
  const html=renderToStaticMarkup(React.createElement(VentaComprobanteResumen,{venta,sucursal:'Sucursal ficticia'}))
  for(const texto of ['Cliente histórico','Sucursal ficticia','Producto ficticio','Caja','9999999999999.99','Efectivo recibido','Cambio'])assert.ok(html.includes(texto))
  assert.doesNotMatch(html,/NIT PRIVADO|PACIENTE PRIVADO/);assert.match(html,/no sustituye factura FEL/)
})

test('modal consulta sin emitir; Generar e Imprimir reutilizan un único PDF y esperan la carga antes de imprimir', async () => {
  let consultas = 0, emisiones = 0, impresiones = 0
  const m = modal({ vistaPreviaComprobanteVenta: async () => { consultas++; return pdf() }, generarComprobanteVenta: async () => { emisiones++; return pdf() } })
  assert.equal(m.boton(m.render(), 'Generar').props.disabled, true)
  await turno(); let n = m.render(); assert.equal(consultas, 1); assert.equal(emisiones, 0)
  m.boton(n, 'Generar').props.onClick(); m.boton(n, 'Generar').props.onClick()
  await turno(); n = m.render(); assert.equal(emisiones, 1); assert.equal(m.descargas.length, 1)
  m.frame(n).props.ref.current = { contentWindow: { focus() {}, print() { impresiones++ } } }
  m.boton(n, 'Imprimir').props.onClick(); await turno(); assert.equal(impresiones, 0)
  m.frame(n).props.onLoad(); assert.equal(impresiones, 1)
  m.boton(n, 'Generar').props.onClick(); await turno(); assert.equal(m.descargas.length, 2); assert.equal(emisiones, 1)
  m.boton(m.render(), 'Imprimir').props.onClick(); await turno(); assert.equal(impresiones, 2); assert.equal(emisiones, 1)
  m.desmontar()
})

test('impresión directa genera primero; reintento tras fallo conserva UUID y cuerpo aunque se cambie el botón', async () => {
  const intentos = []; let impresiones = 0
  const m = modal({ vistaPreviaComprobanteVenta: async () => pdf(), generarComprobanteVenta: async (ventaId, datos) => { intentos.push({ ventaId, datos }); if (intentos.length === 1) throw Error('Fallo transitorio'); return pdf() } })
  m.render(); await turno(); let n = m.render()
  m.boton(n, 'Generar').props.onClick(); await turno(); n = m.render()
  assert.ok(m.buscar(n, e => e.props?.children === 'Fallo transitorio'))
  m.boton(n, 'Imprimir').props.onClick(); await turno(); n = m.render()
  assert.equal(intentos.length, 2); assert.deepEqual(intentos[0], intentos[1]); assert.equal(m.descargas.length, 0)
  m.frame(n).props.ref.current = { contentWindow: { focus() {}, print() { impresiones++ } } }
  assert.equal(impresiones, 0); m.frame(n).props.onLoad(); assert.equal(impresiones, 1)
  m.desmontar()
})

test('sin permisos no consulta ni permite emitir; preview cancelado no actualiza el modal desmontado', async () => {
  let consultas = 0, signal, resolver
  const api = { vistaPreviaComprobanteVenta: (i, s) => { consultas++; signal = s; return new Promise(r => { resolver = r }) }, generarComprobanteVenta: async () => { throw Error('No emitir') } }
  const denegado = modal(api, false), n = denegado.render()
  assert.equal(consultas, 0); assert.equal(denegado.boton(n, 'Generar').props.disabled, true); assert.equal(denegado.boton(n, 'Imprimir').props.disabled, true)
  denegado.desmontar()
  const m = modal(api); m.render(); assert.equal(consultas, 1); m.desmontar(); assert.equal(signal.aborted, true)
  resolver(pdf()); await turno(); assert.equal(m.frame(m.render()), null)
})
