const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path')
const cargar = require('./cargar-typescript.cjs'), raiz = path.resolve(__dirname, '../src/modules/activos'), backend = path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src/modules/activos')
const r = cargar(raiz)('activo-reglas.ts'), c = cargar(raiz)('activo.config.ts'), v = cargar(backend)('activo.validator.ts')
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const activo = { id: id(1), sucursalId: id(2), tipoId: id(3), version: 2, situacion: 'DISPONIBLE' }
const datos = { sucursalId: id(2), tipoId: id(3), condicion: 'BUENO', marca: ' Dell ', modelo: ' Modelo ', numeroSerie: ' SN- / 123 ', descripcion: ' Equipo ' }
test('alta exige seleccionar sucursal; actualización preserva sucursal/código y separadores de serie', () => {
  assert.equal(r.validarCampos({ ...datos, sucursalId: '' }).sucursalId, 'Este campo es obligatorio.')
  const alta = r.entradaActivo(datos), edicion = r.entradaActivo(datos, 4)
  assert.equal(alta.numeroSerie, 'SN- / 123'); assert.equal(alta.sucursalId, id(2)); assert.ok(!('sucursalId' in edicion)); assert.ok(!('codigo' in edicion)); assert.ok(!('situacion' in edicion))
  assert.ok(v.crearActivoSchema.safeParse(alta).success); assert.ok(v.actualizarActivoSchema.safeParse(edicion).success)
})
test('tipo y prefijo se actualizan sin enviar códigos históricos', () => {
  const datos = r.entradaTipo({ prefijo: ' eq-1 ', nombre: ' Equipos ', descripcion: '' }, 3)
  assert.deepEqual(datos, { prefijo: 'EQ-1', nombre: 'Equipos', descripcion: null, version: 3 }); assert.ok(v.actualizarTipoActivoSchema.safeParse(datos).success)
})
test('asignación exige disponibilidad, sucursal, condición y ausencia de duplicados', () => {
  const entrega = { activo, condicionEntrega: 'BUENO', notasEntrega: ' Correcto ' }
  assert.deepEqual(r.validarEntrega(id(2), id(4), [entrega]), {})
  for (const detalles of [[], [entrega, entrega], [{ ...entrega, condicionEntrega: '' }], [{ ...entrega, activo: { ...activo, situacion: 'ASIGNADO' } }], [{ ...entrega, activo: { ...activo, sucursalId: id(99) } }]]) assert.ok(Object.keys(r.validarEntrega(id(2), id(4), detalles)).length)
  assert.ok(v.crearAsignacionSchema.safeParse(r.entradaEntrega(id(2), id(4), [entrega])).success)
})
test('solicitud exige motivo por activo y limita la selección a custodia vigente', () => {
  assert.deepEqual(r.validarSolicitud([{ asignacionDetalleId: id(1), motivo: 'Devolución' }], [id(1)]), {})
  for (const detalles of [[], [{ asignacionDetalleId: id(99), motivo: 'Ajeno' }], [{ asignacionDetalleId: id(1), motivo: ' ' }], [{ asignacionDetalleId: id(1), motivo: 'Uno' }, { asignacionDetalleId: id(1), motivo: 'Dos' }]]) assert.ok(Object.keys(r.validarSolicitud(detalles, [id(1)])).length)
})
test('consulta y exportación comparten exactamente los criterios y estados del proceso', () => {
  const casos = [['activos', v.consultaActivoSchema, v.exportarActivoSchema, { situacion: 'MANTENIMIENTO', condicion: 'MALO', tipoId: id(1) }], ['asignaciones', v.consultaAsignacionSchema, v.exportarAsignacionSchema, { estado: 'PARCIAL' }], ['devoluciones', v.consultaDevolucionSchema, v.exportarDevolucionSchema, { estado: 'RECIBIDA' }]]
  for (const [_recurso, listado, exportacion, filtros] of casos) { const consulta = { pagina: 2, tamanoPagina: 150, busqueda: 'Equipo', orden: 'creadoEn', direccion: 'desc', sucursalId: id(2), ...filtros }; assert.ok(listado.safeParse(Object.fromEntries(new URLSearchParams(r.parametrosActivos(consulta)))).success); const entrada = r.criteriosExportacion(consulta, 'xlsx'); assert.ok(exportacion.safeParse(entrada).success); assert.ok(!('pagina' in entrada)); assert.ok(!('tamanoPagina' in entrada)); for (const [clave, valor] of Object.entries(filtros)) assert.equal(entrada[clave], valor) }
  assert.ok(!v.consultaActivoSchema.safeParse({ situacion: 'ACTIVO' }).success)
})
test('todas las páginas del flujo tienen ruta y permisos funcionales granulares', () => {
  const casos = [['/activos', 'ACTIVOS.ACTIVOS.VER'], ['/activos/nuevo', 'ACTIVOS.ACTIVOS.CREAR'], [`/activos/${id(1)}/editar`, 'ACTIVOS.ACTIVOS.ACTUALIZAR'], ['/activos/tipos/nuevo', 'ACTIVOS.TIPOS.CREAR'], ['/activos/asignaciones/nuevo', 'ACTIVOS.ASIGNACIONES.CREAR'], [`/activos/mis-activos/${id(1)}/revision`, 'ACTIVOS.ASIGNACIONES.CONFIRMAR_RECEPCION'], [`/activos/mis-activos/${id(1)}/solicitar`, 'ACTIVOS.ASIGNACIONES.SOLICITAR_DEVOLUCION'], [`/activos/devoluciones/${id(1)}/recibir`, 'ACTIVOS.ASIGNACIONES.RECIBIR_DEVOLUCION'], [`/activos/devoluciones/${id(1)}/resolver`, 'ACTIVOS.ASIGNACIONES.APROBAR_DEVOLUCION']]
  for (const [camino, permiso] of casos) { const ruta = c.reconocerRutaActivo(camino); assert.ok(ruta, camino); assert.equal(c.puedeRutaActivo(ruta, []), false); const ver = c.permisoActivo(ruta.recurso); assert.equal(c.puedeRutaActivo(ruta, [ver, permiso]), true); if (ruta.vista !== 'listado' && ruta.vista !== 'detalle') assert.equal(c.puedeRutaActivo(ruta, [ver]), permiso === ver) }
  for (const camino of ['/activos/no-existe', '/activos/devoluciones/nuevo', `/activos/asignaciones/${id(1)}/editar`, `/activos/mis-activos/${id(1)}/recibir`]) assert.equal(c.reconocerRutaActivo(camino), null)
})
test('Mis activos/Mis devoluciones no admiten identificar libremente a otro empleado', () => {
  assert.ok(!v.consultaPropiaAsignacionSchema.safeParse({ empleadoId: id(1) }).success); assert.ok(!v.consultaPropiaDevolucionSchema.safeParse({ empleadoId: id(1) }).success)
  assert.equal(c.permisoActivo('mis-devoluciones'), 'ACTIVOS.ASIGNACIONES.VER_PROPIAS')
})
test('API envía revisión, recepción y resolución contra los DTO estrictos del backend', async () => {
  const llamadas = [], api = cargar(raiz, { '../../shared/api/cliente-api': { solicitarApi: async (ruta, opciones) => { llamadas.push({ ruta, ...opciones }); return { success: true, data: {} } } }, '../../shared/api/descargar-archivo-api': {} })('activo-api.ts')
  await api.revisarAsignacion(id(1), { version: 3, decision: 'SIN_DEVOLUCION' }); assert.ok(v.revisionAsignacionSchema.safeParse(llamadas.at(-1).datos).success); assert.ok(!('empleadoId' in llamadas.at(-1).datos)); assert.ok(!('detalles' in llamadas.at(-1).datos))
  await api.solicitarDevolucion(id(1), 3, [{ asignacionDetalleId: id(2), motivo: 'Ya no se utiliza' }]); assert.ok(v.solicitarDevolucionSchema.safeParse(llamadas.at(-1).datos).success)
  await api.recibirDevolucion(id(1), { version: 1, observaciones: '', detalles: [{ detalleId: id(2), condicionRecibida: 'MALO', notasRecepcion: '' }] }); assert.ok(v.recibirDevolucionSchema.safeParse(llamadas.at(-1).datos).success)
  await api.resolverDevolucion(id(1), 2, 'APROBADA', ' Recepción conforme '); assert.ok(v.resolverDevolucionSchema.safeParse(llamadas.at(-1).datos).success); assert.equal(llamadas.at(-1).datos.motivo, 'Recepción conforme')
})
