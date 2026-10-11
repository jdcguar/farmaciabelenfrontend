// Servidor exclusivamente simulado para revisión visual. Memoria, sin Oracle ni archivos reales.
// Ejecutar desde F: node tests/compras-preview.cjs
// En otra terminal: $env:VITE_API_URL='http://localhost:3101/api'; npm run dev -- --host 127.0.0.1 --port 5180 --strictPort
const http = require('node:http'), path = require('node:path'), { randomUUID } = require('node:crypto')
const cargar = require('./cargar-typescript.cjs')
const { pathToFileURL } = require('node:url')
const f = cargar(path.resolve(__dirname, '../src/modules/compras')), reglas = f('compra-reglas.ts'), cfg = f('compra.config.ts')
const schemas = cargar(path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/compras'))('shared/compra.validator.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`, sucursal = id(1), actor = id(2), creador = id(3), proveedor = id(4), unidad = id(5), presentacion = id(6), bodega = id(7), destino = id(8), cuarentena = id(9)
const hoy = reglas.hoyGuatemala(), futuro = '2099-10-06', instante = new Date().toISOString()
const permisos = ['COMPRAS.ACCESO.CORPORATIVO', 'COMPRAS.ACCESO.VER_AUDITORIA', 'ORGANIZACION.SUCURSALES.VER', 'INVENTARIO.MOVIMIENTOS.VER', ...['PROVEEDORES', 'PRODUCTOS', 'PRESENTACIONES', 'UNIDADES', 'BODEGAS', 'UBICACIONES'].map(g => `CATALOGOS.${g}.VER`)]
permisos.push(...cfg.recursosCompra.map(r => `NAVEGACION.COMPRAS.${r.toUpperCase()}.ACCEDER`))
for (const r of cfg.recursosCompra) for (const a of ['VER', 'CREAR', 'ADJUNTAR', 'APROBAR', 'RECHAZAR', 'CANCELAR', 'CERRAR', 'ADJUDICAR', 'REVISAR', 'AUTORIZAR_SOBRANTE', 'AVISAR', 'DOCUMENTAL', 'FISICA', 'TECNICA', 'CONFIRMAR', 'VALIDAR', 'CONCILIAR', 'AUTORIZAR', 'RETENER', 'ANULAR']) permisos.push(cfg.permisoCompra(r, a))
const sesion = { usuarioId: actor, nombreUsuario: 'demo-compras', empleadoId: actor, empleadoCodigo: 'DEMO', empleadoNombre: 'Cuenta de prueba simulada', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-10-06T18:00:00Z', sucursal: { id: sucursal, codigo: 'DEMO', nombre: 'Sucursal de demostración' }, roles: [], permisos }
const tipo = { solicitudes: 'SOLICITUD', cotizaciones: 'COTIZACION', ordenes: 'ORDEN', recepciones: 'RECEPCION', facturas: 'FACTURA', evaluaciones: 'EVALUACION' }
const documentos = new Map(), obligaciones = new Map(), eventos = new Map(), claves = new Map(), llamadas = []
function linea(n, origenId = null) { return { id: id(n), origenLineaId: origenId, orden: 0, presentacionId: presentacion, descripcion: 'Producto de demostración / Caja', presentacionObservadaId: null, unidadId: unidad, cantidad: '10.000000', cantidadDeclarada: '10.000000', cantidadBase: '10.000000', factorNumerador: '1', factorDenominador: '1', precio: '25.50', tasaImpuesto: '12.000000', total: '285.60', vidaUtilMinimaDias: 90, loteId: null, numeroLote: 'LOTE-DEMO', fechaVencimiento: '2099-10-06', fechaFabricacion: '2025-01-01', aceptada: '8.000000', cuarentena: '1.000000', rechazada: '1.000000', cancelada: '0.000000', destinoUbicacionId: destino, cuarentenaUbicacionId: cuarentena, incidencia: 'Demostración: embalaje dañado y segregación documentada.' } }
function documento(r, n, estado, origenId, lineas) {
  const doc = { id: id(n), tipo: tipo[r], numero: `${tipo[r]}-${id(n).toUpperCase()}`, estado, sucursalId: sucursal, proveedorId: r === 'solicitudes' ? null : proveedor, proveedorNombre: r === 'solicitudes' ? null : 'Proveedor de demostración', origenId: origenId ?? null, revisionDeId: null, ubicacionId: ['ordenes', 'recepciones'].includes(r) ? destino : null, fecha: hoy, fechaRequerida: futuro, vigenteHasta: r === 'cotizaciones' ? futuro : null, prioridad: 'ORDINARIA', motivo: 'Documento simulado para revisión visual de Compras.', condiciones: r === 'evaluaciones' ? JSON.stringify({ entregaATiempo: true, lineasRecibidas: 1, lineasConIncidencia: 1, referenciaRecepcion: 'Recepción de demostración' }) : 'Transporte autorizado; conservar condiciones del producto.', moneda: 'GTQ', monedaOrigen: null, tipoCambio: null, fechaCambio: null, importe: r === 'solicitudes' ? '500.00' : '285.60', costesAdicionales: '0.00', documentoProveedor: r === 'solicitudes' ? null : `DEMO-${n}`, decididoPorId: null, decididoEn: null, evidencia: null, version: 1, creadoPorId: creador, creadoEn: instante, actualizadoEn: instante, lineas, inspecciones: [], adjuntos: [] }
  documentos.set(doc.id, doc); return doc
}
documento('solicitudes', 100, 'SOLICITADA', null, [linea(101)])
documento('solicitudes', 110, 'APROBADA', null, [linea(111)])
documento('cotizaciones', 200, 'REGISTRADA', id(110), [linea(201, id(111))])
documento('cotizaciones', 210, 'ADJUDICADA', id(110), [linea(211, id(111))])
documento('ordenes', 300, 'BORRADOR', id(210), [linea(301, id(211))])
documento('ordenes', 310, 'APROBADA', id(210), [linea(311, id(211))])
documento('ordenes', 320, 'PARCIAL', id(210), [linea(321, id(211))])
for (const [n, estado] of [[400, 'PEND_DOCUMENTAL'], [410, 'PEND_FISICA'], [420, 'PEND_TECNICA'], [430, 'INSPECCIONADA'], [440, 'CONFIRMADA']]) documento('recepciones', n, estado, id(n === 440 ? 320 : 310), [linea(n + 1, id(n === 440 ? 321 : 311))])
documento('facturas', 500, 'REGISTRADA', id(320), [{ ...linea(501, id(441)), cantidad: '1.000000' }])
documento('facturas', 510, 'DIFERENCIA', id(320), [{ ...linea(511, id(441)), cantidad: '1.000000', precio: '26.00' }])
documento('facturas', 520, 'VALIDADA', id(320), [{ ...linea(521, id(441)), cantidad: '1.000000' }])
obligaciones.set(id(600), { id: id(600), facturaId: id(520), importe: '285.60', vencimiento: futuro, estado: 'PENDIENTE', motivo: 'Factura conciliada en demostración', autorizadoPorId: null, autorizadoEn: null, version: 2 })
documento('evaluaciones', 700, 'CONFIRMADA', id(440), [])
const maestros = { proveedores: [{ id: proveedor, nombre: 'Proveedor de demostración', razonSocial: 'Proveedor de demostración', estadoHomologacion: 'APROBADO' }], unidades: [{ id: unidad, nombre: 'Unidad', dimension: 'CONTEO', admiteDecimales: true }], presentaciones: [{ id: presentacion, nombre: 'Caja de demostración', productoId: id(10), unidadVentaId: unidad, cantidadBase: '1.000000', fraccionable: true }], productos: [{ id: id(10), nombre: 'Producto de demostración', requiereLote: true, requiereVencimiento: true, permiteFraccionamiento: true }], bodegas: [{ id: bodega, nombre: 'Bodega de demostración', sucursalId: sucursal }], ubicaciones: [{ id: destino, nombre: 'Almacenamiento autorizado', bodegaId: bodega, tipo: 'ALMACENAMIENTO' }, { id: cuarentena, nombre: 'Cuarentena de demostración', bodegaId: bodega, tipo: 'CUARENTENA' }] }
function paginar(items, q) { const pagina = Number(q.pagina ?? 1), tamanoPagina = Number(q.tamanoPagina ?? 50); return { items: items.slice((pagina - 1) * tamanoPagina, pagina * tamanoPagina), pagina, tamanoPagina, total: items.length, totalPaginas: Math.ceil(items.length / tamanoPagina) } }
function detalle(d) { const r = { ...d }; if (d.tipo === 'ORDEN') { r.pendientes = d.lineas.map(l => ({ lineaId: l.id, autorizadaBase: l.cantidadBase, recibidaBase: '0.000000', canceladaBase: l.cancelada, pendienteBase: l.cantidadBase })); r.avisos = d.avisos ?? []; r.excepciones = d.excepciones ?? [] } if (d.tipo === 'RECEPCION') r.ingreso = d.estado === 'CONFIRMADA' ? { id: id(801), movimientoId: id(802) } : null; if (d.tipo === 'FACTURA') { const o = [...obligaciones.values()].find(o => o.facturaId === d.id); if (o) r.obligacion = o } return r }
function auditar(doc, accion) { doc.version++; eventos.set(doc.id, [...(eventos.get(doc.id) ?? []), { id: randomUUID(), usuarioNombre: 'Cuenta simulada', sucursal: sesion.sucursal, tipoOperacion: accion.toUpperCase(), versionEntidad: doc.version, resumen: `${accion} ${doc.numero ?? doc.facturaId}`, ocurridoEn: new Date().toISOString(), detalles: [{ id: randomUUID(), nombrePropiedad: 'estado', etiquetaPropiedad: 'Estado', tipoDato: 'texto', valorAnterior: null, valorNuevo: doc.estado, orden: 0 }] }]); }
const errores = (code, message, status = 409) => { throw Object.assign(new Error(message), { code, status }) }
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5180'); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  const url = new URL(req.url, 'http://localhost:3101'), p = url.pathname, q = Object.fromEntries(url.searchParams); let body = null
  const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true, data })) }
  try {
    if (p === '/__prueba/llamadas') return json(llamadas)
    if (p === '/__prueba/conflicto') { const d = documentos.get(q.id); if (d) d.version++; return json({ simulado: true }) }
    if (p === '/api/autenticacion/mi-sesion') return json(sesion)
    if (p === '/api/sucursales/mantenimiento') return json(paginar([{ ...sesion.sucursal, activo: true }], q))
    if (p === `/api/sucursales/${sucursal}`) return json({ ...sesion.sucursal, activo: true })
    const catalogo = p.match(/^\/api\/catalogos\/([^/]+)(?:\/([^/]+))?$/)
    if (catalogo) { let items = (maestros[catalogo[1]] ?? []).map((m, i) => ({ codigo: `DEMO-${i + 1}`, activo: true, version: 1, ...m })); if (catalogo[2]) return json(items.find(m => m.id === catalogo[2])); for (const k of ['tipo', 'estadoHomologacion', 'bodegaId', 'productoId']) if (q[k]) items = items.filter(m => m[k] === q[k]); return json(paginar(items, q)) }
    const m = p.match(/^\/api\/compras\/(solicitudes|cotizaciones|ordenes|recepciones|facturas|evaluaciones|obligaciones)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/)
    if (!m) return errores('PREVIEW_RUTA_NO_IMPLEMENTADA', `Ruta no simulada: ${p}`, 404)
    const [, recurso, docId, accion, subaccion] = m
    if (req.headers['content-type']?.includes('application/json')) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()) }
    llamadas.push({ metodo: req.method, ruta: req.url, cuerpo: body })
    if (req.method === 'GET' && !docId) { schemas.consultaSchema.parse(q); let items = recurso === 'obligaciones' ? [...obligaciones.values()].map(o => ({ ...o, facturaNumero: documentos.get(o.facturaId).numero, sucursalId: sucursal, proveedorId: proveedor })) : [...documentos.values()].filter(d => d.tipo === tipo[recurso]); for (const k of ['estado', 'origenId', 'proveedorId', 'sucursalId']) if (q[k]) items = items.filter(d => d[k] === q[k]); if (q.desde) items = items.filter(d => (d.fecha ?? d.vencimiento) >= q.desde); if (q.hasta) items = items.filter(d => (d.fecha ?? d.vencimiento) <= q.hasta); return json(paginar(items, q)) }
    const d = recurso === 'obligaciones' ? obligaciones.get(docId) : documentos.get(docId)
    if (req.method === 'GET' && recurso !== 'evaluaciones' && accion === 'pdf') {
      if (!d) return errores('RECURSO_NO_ENCONTRADO', 'Documento simulado no encontrado', 404)
      const dist = path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/dist')
      const { crearDocumentoSolicitudPdf } = await import(pathToFileURL(path.join(dist, 'modules/compras/solicitud-compra.pdf.js')).href)
      const { ExportadorDocumentos } = await import(pathToFileURL(path.join(dist, 'shared/exportacion/exportador-documentos.js')).href)
      const { crearDocumentoCompraPdf, crearDocumentoObligacionPdf } = await import(pathToFileURL(path.join(dist, 'modules/compras/documento-compra.pdf.js')).href)
      let documentoPdf
      if (recurso === 'solicitudes') documentoPdf = crearDocumentoSolicitudPdf({ solicitud: d, sucursal: sesion.sucursal.nombre, lineas: d.lineas.map((l, i) => ({ ...l, orden: i + 1, unidad: 'Unidad (ud)' })) }, sesion.nombreUsuario, new Date())
      else if (recurso === 'obligaciones') documentoPdf = crearDocumentoObligacionPdf({ obligacion: d, facturaNumero: documentos.get(d.facturaId).numero, proveedor: documentos.get(d.facturaId).proveedorNombre, sucursal: sesion.sucursal.nombre }, sesion.nombreUsuario, new Date())
      else documentoPdf = crearDocumentoCompraPdf({ recurso, documento: detalle(d), sucursal: sesion.sucursal.nombre, unidades: Object.fromEntries(maestros.unidades.map(u => [u.id, u.nombre])), ubicaciones: Object.fromEntries(maestros.ubicaciones.map(u => [u.id, u.nombre])), presentaciones: Object.fromEntries(maestros.presentaciones.map(p => [p.id, p.nombre])), origenNumero: documentos.get(d.origenId)?.numero ?? null, revisionNumero: documentos.get(d.revisionDeId)?.numero ?? null }, sesion.nombreUsuario, new Date())
      const archivo = await new ExportadorDocumentos().generarPdf(documentoPdf)
      res.writeHead(200, { 'Content-Type': archivo.tipoMime, 'Content-Disposition': `attachment; filename="${archivo.nombreArchivo}"`, 'Access-Control-Expose-Headers': 'Content-Disposition' })
      return res.end(archivo.contenido)
    }
    if (req.method === 'GET' && accion === 'auditoria') return json(paginar([...(eventos.get(docId) ?? [])].reverse(), q))
    if (req.method === 'GET' && accion === 'comparacion') return json({ solicitud: detalle(d), cotizaciones: [...documentos.values()].filter(x => x.tipo === 'COTIZACION' && x.origenId === d.id).map(detalle), evaluadoEn: new Date().toISOString() })
    if (req.method === 'GET' && !accion) return d ? json(recurso === 'obligaciones' ? d : detalle(d)) : errores('RECURSO_NO_ENCONTRADO', 'Documento simulado no encontrado', 404)
    if (req.method === 'POST' && docId === 'exportaciones') { schemas.exportarSchema.parse(body); return errores('PREVIEW_BINARIO_NO_SIMULADO', 'Exportación validada por Zod; la salida binaria se verifica con el backend real.', 501) }
    if (req.method === 'POST' && accion === 'adjuntos') { return errores('PREVIEW_ARCHIVO_NO_SIMULADO', 'Archivo requiere comprobación real de firma/almacenamiento; contrato multipart cubierto por pruebas.', 501) }
    if (req.method === 'POST' && (!docId || accion === 'revisiones')) {
      const schema = accion === 'revisiones' ? schemas.revisionSchema : schemas[{ solicitudes: 'solicitudSchema', cotizaciones: 'cotizacionSchema', ordenes: 'ordenSchema', recepciones: 'recepcionSchema', facturas: 'facturaSchema', evaluaciones: 'evaluacionSchema' }[recurso]]; body = schema.parse(body)
      const huella = JSON.stringify(body), previo = claves.get(body.claveIdempotencia); if (previo) { if (previo.huella !== huella) errores('COMPRA_IDEMPOTENCIA_INCOMPATIBLE', 'Contenido diferente'); return json(detalle(documentos.get(previo.id)), 201) }
      if (accion === 'revisiones' && body.version !== d.version) errores('INVENTARIO_MODIFICADO', 'Otro usuario cambió la versión.')
      const origenId = body.solicitudId ?? body.cotizacionId ?? body.ordenId ?? body.recepcionId ?? d?.origenId
      const origen = documentos.get(origenId), estado = { solicitudes: 'SOLICITADA', cotizaciones: 'REGISTRADA', ordenes: 'BORRADOR', recepciones: 'PEND_DOCUMENTAL', facturas: 'REGISTRADA', evaluaciones: 'CONFIRMADA' }[recurso]
      const nuevo = documento(recurso, 900 + documentos.size, estado, origenId, [])
      documentos.delete(nuevo.id); nuevo.id = randomUUID(); nuevo.numero = `${nuevo.tipo}-${nuevo.id.toUpperCase()}`; nuevo.creadoPorId = sesion.usuarioId
      Object.assign(nuevo, { motivo: body.motivo, fecha: body.fecha ?? hoy, fechaRequerida: body.fechaRequerida ?? body.fechaEntrega ?? body.vencimiento ?? null, vigenteHasta: body.vigenteHasta ?? null, documentoProveedor: body.documentoProveedor ?? null, ubicacionId: body.ubicacionId ?? origen?.ubicacionId ?? null, revisionDeId: accion === 'revisiones' ? d.id : null })
      nuevo.lineas = (body.lineas ?? []).map((x, i) => { const origenLineaId = x.solicitudLineaId ?? x.cotizacionLineaId ?? x.ordenLineaId ?? x.recepcionLineaId; const original = [...documentos.values()].flatMap(d => d.lineas).find(l => l.id === origenLineaId); return { ...linea(999), ...original, ...x, id: randomUUID(), orden: i, origenLineaId: origenLineaId ?? null, cantidadDeclarada: x.cantidad } })
      documentos.set(nuevo.id, nuevo); claves.set(body.claveIdempotencia, { id: nuevo.id, huella }); auditar(nuevo, 'crear'); return json(detalle(nuevo), 201)
    }
    if (!d) errores('RECURSO_NO_ENCONTRADO', 'Documento simulado no encontrado', 404)
    const a = accion === 'obligacion' ? subaccion : accion, o = accion === 'obligacion' ? [...obligaciones.values()].find(o => o.facturaId === d.id) : null
    const schema = schemas[{ documental: 'documentalSchema', fisica: 'fisicaSchema', tecnica: 'tecnicaSchema', confirmar: 'confirmarSchema', avisos: 'avisoSchema', 'autorizar-sobrante': 'excepcionSchema' }[a] ?? 'accionSchema']; body = schema.parse(body)
    if (body.version !== (o ?? d).version) errores('INVENTARIO_MODIFICADO', 'Otro usuario cambió el documento. Recarga y revisa.')
    if (o) { o.estado = { autorizar: 'AUTORIZADA', retener: 'RETENIDA', anular: 'ANULADA' }[a]; o.motivo = body.motivo; if (a === 'anular') d.estado = 'CANCELADA'; auditar(o, a); return json(o) }
    d.estado = { aprobar: 'APROBADA', rechazar: 'RECHAZADA', cancelar: 'CANCELADA', cerrar: 'CERRADA', adjudicar: 'ADJUDICADA', documental: body.resultado === 'CONFORME' ? 'PEND_FISICA' : 'RECHAZADA', fisica: 'PEND_TECNICA', tecnica: 'INSPECCIONADA', confirmar: 'CONFIRMADA', validar: 'VALIDADA', conciliar: 'VALIDADA' }[a] ?? d.estado
    if (a === 'fisica' || a === 'tecnica') for (const x of body.lineas) Object.assign(d.lineas.find(l => l.id === x.lineaId), x)
    if (['documental', 'fisica', 'tecnica'].includes(a)) d.inspecciones.push({ id: randomUUID(), etapa: a.toUpperCase(), resultado: body.resultado ?? 'RESUELTA', evidencia: body.evidencia, responsableId: actor, ocurridoEn: new Date().toISOString() })
    if (['validar', 'conciliar'].includes(a)) { const o = { id: randomUUID(), facturaId: d.id, importe: d.importe, vencimiento: d.fechaRequerida, estado: 'PENDIENTE', motivo: body.motivo, autorizadoPorId: null, autorizadoEn: null, version: 1 }; obligaciones.set(o.id, o) }
    if (a === 'avisos') d.avisos = [...(d.avisos ?? []), { id: randomUUID(), ...body, responsableId: actor }]
    if (a === 'autorizar-sobrante') d.excepciones = [...(d.excepciones ?? []), ...body.lineas.map(l => ({ id: randomUUID(), lineaId: l.ordenLineaId, adicionalBase: l.cantidad, motivo: body.motivo, evidencia: body.evidencia, responsableId: actor, creadoEn: new Date().toISOString() }))]
    d.evidencia = body.evidencia ?? d.evidencia; auditar(d, a); return json(detalle(d), a === 'avisos' ? 201 : 200)
  } catch (e) { res.writeHead(e.status ?? 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, error: { code: e.code ?? 'DATOS_INVALIDOS', message: e.issues ? 'Contrato no válido en simulador' : e.message, details: e.issues?.map(i => ({ campo: i.path.join('.'), mensaje: i.message })) } })) }
})
server.listen(3101, '127.0.0.1', () => console.log('SIMULADO: Compras preview http://localhost:3101/api; sin Oracle.'))
