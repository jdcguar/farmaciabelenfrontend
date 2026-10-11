// Servidor local de pruebas: rutas, validadores y servicios reales con repositorio en memoria.
// No conecta Oracle ni ejecuta migraciones o seeds.
import { createRequire } from 'node:module'
import { escenarioActivo } from '../../../Backend/FarmaciaBelenBackend/tests/activos/escenario.ts'
import { crearActivoRouter } from '../../../Backend/FarmaciaBelenBackend/src/modules/activos/activo.routes.ts'
import { pantallasNavegacion, pantallaPorRuta } from '../../../Backend/FarmaciaBelenBackend/src/shared/seguridad/navegacion.ts'
const require = createRequire(new URL('../../../Backend/FarmaciaBelenBackend/package.json', import.meta.url))
const express = require('express')
const e = escenarioActivo(), inicial = await e.preparar(3)
const tipo = inicial.tipo
for (let i = 3; i < 7; i++) await e.activos.crear({ sucursalId: e.ids.sucursal, tipoId: tipo.id, condicion: 'BUENO', marca: 'Dell', modelo: 'Latitude', numeroSerie: `SN-${i}`, descripcion: `Equipo administrativo ${i}` }, e.admin)
const perfiles = { admin: e.corporativo, empleado: e.empleado, otro: e.otro, receptor: e.actor(['ACTIVOS.ASIGNACIONES.VER_DEVOLUCIONES', 'ACTIVOS.ASIGNACIONES.RECIBIR_DEVOLUCION']), aprobador: e.actor(['ACTIVOS.ASIGNACIONES.VER_DEVOLUCIONES', 'ACTIVOS.ASIGNACIONES.APROBAR_DEVOLUCION']) }
let perfil = 'admin', falloPdf = false, conflicto = false
const llamadas = []
const historial = async (_m, c) => { const eventos = e.eventos.filter(ev => ev.entidadId === c.entidadId).reverse().map((ev, indice) => ({ ...ev, id: `evento-${indice}`, sucursal: ev.sucursalId ? { id: ev.sucursalId, codigo: 'SUC01', nombre: 'Sucursal Belén' } : null, ocurridoEn: '2026-10-11T03:15:00Z', detalles: (ev.detalles ?? []).map((d, i) => ({ ...d, id: `detalle-${i}`, orden: i, valorAnterior: d.valorAnterior == null ? null : String(d.valorAnterior), valorNuevo: d.valorNuevo == null ? null : String(d.valorNuevo) })) })); return { items: eventos.slice((c.pagina - 1) * c.tamanoPagina, c.pagina * c.tamanoPagina), total: eventos.length, totalPaginas: Math.ceil(eventos.length / c.tamanoPagina), pagina: c.pagina, tamanoPagina: c.tamanoPagina } }
e.lecturas.auditoria.listarPorEntidad = historial
e.repo.historial = async (_recurso, id, c, m) => historial(m, { ...c, entidadId: id })
const app = express()
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5185'); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS'); res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); if (req.method === 'OPTIONS') return res.sendStatus(204); next() })
app.use(express.json())
const permisos = () => [...perfiles[perfil].permisos, ...pantallasNavegacion.filter(p => p.area === 'activos' && p.requisitos.some(g => g.every(c => perfiles[perfil].permisos.has(c)))).map(p => p.permiso)]
app.get('/__prueba', (_req, res) => res.json({ ids: e.ids, actaId: inicial.acta.id, tipoId: tipo.id, activoId: inicial.bienes[0].id, llamadas, perfil }))
app.post('/__prueba/perfil', (req, res) => { if (perfiles[req.body.perfil]) perfil = req.body.perfil; falloPdf = Boolean(req.body.falloPdf); conflicto = Boolean(req.body.conflicto); res.json({ perfil }) })
app.get('/api/autenticacion/mi-sesion', (_req, res) => res.json({ success: true, data: { usuarioId: perfiles[perfil].contexto.usuarioId, nombreUsuario: perfil, empleadoId: perfiles[perfil].empleadoId, empleadoCodigo: 'EMP01', empleadoNombre: 'Ana López', estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-10-11T06:00:00Z', sucursal: { id: e.ids.sucursal, codigo: 'SUC01', nombre: 'Sucursal Belén' }, roles: [], permisos: permisos() } }))
app.use('/api', (req, res, next) => { llamadas.push({ metodo: req.method, ruta: req.path, consulta: req.query, cuerpo: req.body }); if (conflicto && ['PATCH', 'POST', 'PUT'].includes(req.method)) { conflicto = false; return res.status(409).json({ success: false, error: { code: 'ACTIVOS_VERSION', message: 'El registro cambió. Actualiza los datos antes de continuar.', details: [] } }) } if (falloPdf && req.path.endsWith('/pdf')) return res.status(503).json({ success: false, error: { code: 'ACTIVOS_PDF_GENERACION', message: 'PDF temporalmente no disponible.', details: [] } }); next() })
const autenticar = (req, _res, next) => { const a = perfiles[perfil]; req.contextoOperacion = a.contexto; req.seguridadSesion = { usuarioId: a.contexto.usuarioId, empleadoId: a.empleadoId, sucursalId: a.contexto.sucursalId, permisos: new Set(permisos()), roles: [], debeCambiarContrasena: false, expiraEn: new Date('2099-01-01') }; next() }
const autorizarAlguno = (...codigos) => (req, res, next) => { const nav = pantallaPorRuta(req.path), p = req.seguridadSesion.permisos; if (!codigos.some(c => p.has(c)) || nav && !p.has(nav.permiso)) return res.status(403).json({ success: false, error: { code: 'ACCESO_DENEGADO', message: 'No tienes permiso para esta operación.', details: [] } }); next() }
app.use('/api', crearActivoRouter(autenticar, c => autorizarAlguno(c), autorizarAlguno, { activos: e.activos, asignaciones: e.asignaciones, devoluciones: e.devoluciones, consulta: e.lecturas }))
app.use((error, _req, res, _next) => res.status(error.estadoHttp ?? 500).json({ success: false, error: { code: error.codigo ?? 'ERROR_INTERNO', message: error.message, details: error.detalles ?? [] } }))
app.listen(3105, '127.0.0.1', () => console.log('Activos: vista previa en memoria http://127.0.0.1:3105'))
