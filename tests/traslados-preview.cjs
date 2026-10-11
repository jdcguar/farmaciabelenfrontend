// Revisión visual local SIMULADA. Memoria únicamente: no conecta a Oracle.
// node tests/traslados-preview.cjs
// $env:VITE_API_URL='http://localhost:3102/api'; npm run dev -- --host 127.0.0.1 --port 5182 --strictPort
const http = require('node:http'), path = require('node:path'), { randomUUID } = require('node:crypto')
const { pathToFileURL } = require('node:url')
const cargar = require('./cargar-typescript.cjs'), schemas = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/traslados'))('traslado.validator.ts')
const reglas = cargar(path.resolve(__dirname, '../src/modules/traslados'))('traslado-reglas.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`, ahora = new Date().toISOString(), hoy = reglas.hoyGuatemala()
const nodos = [{ id: id(1), codigo: 'CENTRAL', nombre: 'Bodega central', activo: true }, { id: id(2), codigo: 'BELEN', nombre: 'Farmacia Belén', activo: true }, { id: id(3), codigo: 'NORTE', nombre: 'Sucursal Norte', activo: true }]
const permisos = ['NAVEGACION.TRASLADOS.TRASLADOS.ACCEDER', 'NAVEGACION.TRASLADOS.DESPACHOS.ACCEDER', 'NAVEGACION.TRASLADOS.RECEPCIONES.ACCEDER', 'TRASLADOS.ACCESO.CORPORATIVO', 'TRASLADOS.ACCESO.VER_AUDITORIA', 'ORGANIZACION.SUCURSALES.VER', ...['VER', 'CREAR', 'APROBAR', 'RECHAZAR', 'CANCELAR', 'CERRAR', 'HABILITAR_RECEPCION', 'PREPARAR', 'DESPACHAR', 'CUSTODIA', 'RECIBIR', 'CONFIRMAR_RECEPCION', 'CANCELAR_RECEPCION', 'INCIDENCIAS', 'RESOLVER_INCIDENCIA'].map(a => `TRASLADOS.OPERACIONES.${a}`), ...['PRODUCTOS', 'PRESENTACIONES', 'UNIDADES', 'UBICACIONES'].map(g => `CATALOGOS.${g}.VER`)]
const sesion = { usuarioId: id(9), nombreUsuario: 'demo-traslados', empleadoId: id(9), empleadoCodigo: 'DEMO', empleadoNombre: 'Cuenta de prueba simulada', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-10-06T18:00:00Z', sucursal: nodos[1], roles: [], permisos }
const unidades = [{ id: id(4), codigo: 'UND', nombre: 'Unidad', dimension: 'CONTEO', activo: true }, { id: id(5), codigo: 'CAJA', nombre: 'Caja de 10 unidades', dimension: 'EMPAQUE', activo: true }]
const presentaciones = [{ id: id(6), codigo: 'PAR-500', nombre: 'Paracetamol 500 mg / Blíster', activo: true }, { id: id(7), codigo: 'SOL-100', nombre: 'Solución oral / Frasco de 100 ml', activo: true }]
const documentos = new Map(), eventos = new Map(), claves = new Map(), llamadas = []
const paginar = (items, q) => { const pagina = Number(q.pagina ?? 1), tamanoPagina = Number(q.tamanoPagina ?? 50); return { items: items.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina), pagina, tamanoPagina, total: items.length, totalPaginas: Math.ceil(items.length / tamanoPagina) } }
function pendientes(d) { return d.lineas.map(l => ({ lineaId: l.id, porPrepararBase: d.estado === 'CERRADO' ? '0.000000' : l.aprobadaBase, preparadaBase: '0.000000', despachadaBase: '0.000000', recibidaBase: '0.000000', justificadaBase: '0.000000', enTransitoBase: '0.000000' })) }
function documento(n, estado, propio = false) {
  const lineas = [{ id: id(n + 1), orden: 0, presentacionId: id(6), unidadId: id(4), descripcion: 'Paracetamol 500 mg / Blíster', cantidad: '10.000000', solicitadaBase: '10.000000', aprobadaBase: estado === 'SOLICITADO' ? '0.000000' : '10.000000', noDespachadaBase: '0.000000', factorNumerador: '1', factorDenominador: '1', vidaUtilMinimaDias: 90 }]
  const d = { id: id(n), numero: `TRA-${id(n).toUpperCase()}`, tipo: 'ABASTECIMIENTO', prioridad: n === 200 ? 'URGENTE' : 'ORDINARIA', estado, origenSucursalId: id(1), destinoSucursalId: id(2), fechaRequerida: hoy, motivo: 'Abastecimiento solicitado para mantener disponibilidad en farmacia.', version: 1, creadoEn: ahora, creadoPorId: propio ? id(9) : id(8), actualizadoEn: ahora, decididoPorId: null, decididoEn: null, recepcionHabilitadaEn: null, recepcionHabilitadaPorId: null, cerradoEn: null, motivoDecision: null, controlCompensatorio: null, retornoDeId: null, lineas, despachos: [], incidencias: [] }
  d.pendientes = pendientes(d); documentos.set(d.id, d); return d
}
documento(100, 'SOLICITADO'); documento(110, 'SOLICITADO', true); documento(200, 'APROBADO')
const transito = documento(300, 'EN_TRANSITO')
transito.despachos.push({ id: id(302), estado: 'EN_TRANSITO', creadoEn: ahora, reservaHasta: ahora, despachadoEn: ahora, custodio: 'Transportista de demostración', transporte: 'Unidad de transporte autorizada', condiciones: 'Conservar condiciones del producto.', evidencia: 'Guía de transporte simulada', costeTransporte: '25.00', motivoCancelacion: null })
transito.pendientes = [{ lineaId: id(301), porPrepararBase: '6.000000', preparadaBase: '0.000000', despachadaBase: '4.000000', recibidaBase: '0.000000', justificadaBase: '0.000000', enTransitoBase: '4.000000' }]
transito.incidencias.push({ id: id(303), tipo: 'EMBALAJE', estado: 'ABIERTA', cantidadBase: '1.000000', descripcion: 'Daño del embalaje observado y documentado en demostración.', evidencia: 'Acta de revisión simulada', resolucion: null, motivoResolucion: null, resueltaEn: null, trasladoRelacionadoId: null })
const cerrado = documento(400, 'CERRADO'); cerrado.cerradoEn = ahora
function auditar(d, accion) { eventos.set(d.id, [...(eventos.get(d.id) ?? []), { id: randomUUID(), usuarioNombre: 'Cuenta simulada', sucursal: nodos[1], tipoOperacion: accion.toUpperCase(), versionEntidad: d.version, resumen: `${accion} ${d.numero}`, ocurridoEn: new Date().toISOString(), detalles: [{ id: randomUUID(), nombrePropiedad: 'estado', etiquetaPropiedad: 'Estado', tipoDato: 'texto', valorAnterior: null, valorNuevo: d.estado, orden: 0 }] }]) }
for (const d of documentos.values()) auditar(d, 'solicitar')
const fallo = (code, message, status = 409) => { throw Object.assign(new Error(message), { code, status }) }
const operaciones = require('./traslados-operaciones-preview.cjs')({ documentos, documento, sesion, schemas, reglas, id, ahora, auditar, fallo, llamadas })
const servidor = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin === 'http://127.0.0.1:5182' ? req.headers.origin : 'http://localhost:5182'); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  const url = new URL(req.url, 'http://localhost:3102'), p = url.pathname, q = Object.fromEntries(url.searchParams)
  const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true, data })) }
  try {
    if (p === '/__prueba/llamadas') return json(llamadas)
    if (p === '/__prueba/conflicto') { const d = documentos.get(q.id); if (d) d.version++; return json({ simulado: true }) }
    if (p === '/__prueba/sesion') { sesion.permisos = q.perfil === 'local' ? permisos.filter(p => p !== 'TRASLADOS.ACCESO.CORPORATIVO') : q.perfil === 'sin-permisos' ? [] : q.perfil === 'solo-crear' ? permisos.filter(p => p !== 'TRASLADOS.OPERACIONES.VER') : permisos; return json({ simulado: true, perfil: q.perfil }) }
    if (p === '/api/autenticacion/mi-sesion') return json(sesion)
    const pdf=p.match(/^\/api\/traslados\/(?:(despachos|recepciones)\/)?([^/]+)\/pdf$/)
    if(req.method==='GET'&&pdf) {
      const datos=operaciones.datosPdf(pdf[1]??'traslados',pdf[2]),dist=path.resolve(__dirname,'../../../Backend/FarmaciaBelenBackend/dist')
      const {crearComprobanteTrasladoPdf}=await import(pathToFileURL(path.join(dist,'modules/traslados/comprobante-traslado.pdf.js')).href)
      const {ExportadorDocumentos}=await import(pathToFileURL(path.join(dist,'shared/exportacion/exportador-documentos.js')).href)
      const documento=crearComprobanteTrasladoPdf({...datos,origen:nodos.find(n=>n.id===datos.traslado.origenSucursalId).nombre,destino:nodos.find(n=>n.id===datos.traslado.destinoSucursalId).nombre,unidades:Object.fromEntries(unidades.map(u=>[u.id,u.nombre]))},'Cuenta de prueba simulada',new Date())
      const archivo=await new ExportadorDocumentos().generarPdf(documento)
      res.writeHead(200,{'Content-Type':archivo.tipoMime,'Content-Disposition':`attachment; filename="${archivo.nombreArchivo}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})
      llamadas.push({metodo:req.method,ruta:req.url});return res.end(archivo.contenido)
    }
    if (await operaciones(req, p, q, json)) return
    if (p === '/api/sucursales/mantenimiento') return json(paginar(nodos.filter(n => !q.busqueda || n.nombre.toLowerCase().includes(q.busqueda.toLowerCase())), q))
    if (p.startsWith('/api/sucursales/')) return json(nodos.find(n => n.id === p.split('/').at(-1)))
    const catalogo = p.match(/^\/api\/catalogos\/(presentaciones|unidades)(?:\/([^/]+))?$/)
    if (catalogo) { const items = (catalogo[1] === 'unidades' ? unidades : presentaciones); return json(catalogo[2] ? items.find(x => x.id === catalogo[2]) : paginar(items.filter(n => !q.busqueda || n.nombre.toLowerCase().includes(q.busqueda.toLowerCase())), q)) }
    const m = p.match(/^\/api\/traslados(?:\/([^/]+))?(?:\/([^/]+))?$/)
    if (!m) return fallo('RUTA_NO_SIMULADA', `Ruta no simulada: ${p}`, 404)
    const [, docId, accion] = m; let body = null
    if (req.headers['content-type']?.includes('application/json')) { const chunks = []; for await (const c of req) chunks.push(c); body = JSON.parse(Buffer.concat(chunks).toString()) }
    llamadas.push({ metodo: req.method, ruta: req.url, cuerpo: body })
    if (req.method === 'GET' && !docId) {
      schemas.consultaSchema.parse(q); let items = [...documentos.values()]
      for (const k of ['estado', 'prioridad', 'origenSucursalId', 'destinoSucursalId']) if (q[k]) items = items.filter(d => d[k] === q[k])
      if (q.desde) items = items.filter(d => d.creadoEn.slice(0, 10) >= q.desde)
      if (q.hasta) items = items.filter(d => d.creadoEn.slice(0, 10) <= q.hasta)
      return json(paginar(items, q))
    }
    if (req.method === 'POST' && !docId) {
      body = schemas.crearSchema.parse(body)
      const huella = JSON.stringify(body), previo = claves.get(body.claveIdempotencia)
      if (previo) { if (previo.huella !== huella) fallo('TRASLADO_IDEMPOTENCIA_INCOMPATIBLE', 'La clave ya se utilizó con otro contenido.'); return json(documentos.get(previo.id), 201) }
      const d = documento(900 + documentos.size * 10, 'SOLICITADO', true); documentos.delete(d.id); Object.assign(d, body, { id: randomUUID(), lineas: body.lineas.map((l, i) => ({ ...l, id: randomUUID(), orden: i, descripcion: presentaciones.find(p => p.id === l.presentacionId)?.nombre ?? 'Presentación simulada', solicitadaBase: l.cantidad, aprobadaBase: '0.000000', noDespachadaBase: '0.000000', factorNumerador: '1', factorDenominador: '1' })) }); d.numero = `TRA-${d.id.toUpperCase()}`; d.pendientes = pendientes(d); documentos.set(d.id, d); claves.set(body.claveIdempotencia, { huella, id: d.id }); auditar(d, 'solicitar'); return json(d, 201)
    }
    const d = documentos.get(docId); if (!d) return fallo('TRASLADO_NO_ENCONTRADO', 'Traslado simulado no encontrado.', 404)
    if (req.method === 'GET') return json(accion === 'auditoria' ? paginar([...(eventos.get(d.id) ?? [])].reverse(), q) : d)
    body = (accion === 'aprobar' ? schemas.aprobarSchema : schemas.accionSchema).parse(body)
    if (body.version !== d.version) fallo('TRASLADO_MODIFICADO', 'Otro usuario modificó el traslado; actualice su versión.')
    if (accion === 'aprobar') { if (d.creadoPorId === sesion.usuarioId && !body.controlCompensatorio) fallo('TRASLADO_CONTROL_REQUERIDO', 'Documenta el control compensatorio.'); for (const l of body.lineas) { const existente = d.lineas.find(x => x.id === l.lineaId); if (!existente || reglas.micro(l.cantidadAprobadaBase) > reglas.micro(existente.solicitadaBase)) fallo('TRASLADO_SOBREAPROBADO', 'La aprobación supera lo solicitado.'); existente.aprobadaBase = l.cantidadAprobadaBase } }
    if (accion === 'habilitar-recepcion') { d.recepcionHabilitadaEn = new Date().toISOString(); d.recepcionHabilitadaPorId = sesion.usuarioId }
    else d.estado = { aprobar: 'APROBADO', rechazar: 'RECHAZADO', cancelar: 'CANCELADO', cerrar: 'CERRADO' }[accion]
    d.motivoDecision = body.motivo; d.controlCompensatorio = body.controlCompensatorio; d.version++; d.actualizadoEn = new Date().toISOString(); d.pendientes = pendientes(d); if (['aprobar', 'rechazar'].includes(accion)) { d.decididoEn = d.actualizadoEn; d.decididoPorId = sesion.usuarioId }; if (['cerrar', 'cancelar'].includes(accion)) d.cerradoEn = d.actualizadoEn; auditar(d, accion); return json(d)
  } catch (e) { res.writeHead(e.status ?? 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, error: { code: e.code ?? 'DATOS_INVALIDOS', message: e.issues ? 'Contrato inválido en simulador.' : e.message, details: e.issues?.map(i => ({ campo: i.path.join('.'), mensaje: i.message })) } })) }
})
servidor.listen(3102, '127.0.0.1', () => console.log('SIMULADO: Traslados http://localhost:3102/api. Sin Oracle.'))
