// Demo visual exclusivamente en memoria. No importa entidades ni abre Oracle.
const http = require('node:http'), path = require('node:path'), cargar = require('./cargar-typescript.cjs')
const backend = path.resolve(__dirname, '../../../Backend/FarmaciaBelenBackend/src')
const nav = cargar(path.join(backend, 'shared/seguridad'))('navegacion.ts')
const matrices = cargar(path.join(backend, 'database/seeds/operacion'))('operacion.seed-data.ts').rolesOperativos
const semillas = cargar(path.join(backend, 'database/seeds/seguridad'))('seguridad.seed-data.ts').modulosSistemaSemilla
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const catalogo = { modulos: semillas.map(m => ({ ...m, permisosDirectos: [], submodulos: m.submodulos.map(s => ({ ...s, permisos: s.permisos })) })) }
const todos = catalogo.modulos.flatMap(m => m.submodulos.flatMap(s => s.permisos))
let perfil = process.argv[2] || 'SUPERADMIN', quitados = []
if (perfil !== 'SUPERADMIN' && !matrices.some(r => r.codigo === perfil)) throw new Error('Perfil de demostración desconocido')
const operacionesAdmin = [...new Set(todos.filter(p => !p.codigo.startsWith('NAVEGACION.')).map(p => p.codigo))]
const permisos = () => (perfil === 'SUPERADMIN' ? [...operacionesAdmin, ...nav.pantallasNavegacion.map(p => p.permiso)] : matrices.find(r => r.codigo === perfil).permisos).filter(p => !quitados.includes(p))
const sesion = () => ({ usuarioId: id(1), empleadoId: id(2), empleadoCodigo: 'DEMO', nombreUsuario: 'demo-navegacion', empleadoNombre: `Demostración ${perfil}`, estado: 'ACTIVO', debeCambiarContrasena: false, expiraEn: '2099-01-01T00:00:00Z', sucursal: { id: id(3), codigo: 'DEMO', nombre: 'Sucursal simulada' }, roles: [{ id: id(4), codigo: perfil, nombre: perfil }], permisos: permisos() })
const rol = () => ({ id: id(10), codigo: 'CAJERO', nombre: 'Cajero', descripcion: matrices.find(r => r.codigo === 'CAJERO').descripcion, activo: true, version: 1, creadoEn: new Date().toISOString(), permisos: todos.filter(p => matrices.find(r => r.codigo === 'CAJERO').permisos.includes(p.codigo)), creadoPorId: null, actualizadoEn: null })
const paginado = { items: [], pagina: 1, tamanoPagina: 50, total: 0, totalPaginas: 0 }
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5199'); res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  const url = new URL(req.url, 'http://127.0.0.1:3199'), ruta = url.pathname
  const enviar = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: true, data })) }
  if (ruta === '/__demo/perfil') { perfil = url.searchParams.get('codigo') || 'CAJERO'; quitados = []; enviar({ perfil }); return }
  if (ruta === '/__demo/retirar') { quitados.push(url.searchParams.get('permiso')); enviar({ quitados }); return }
  if (ruta === '/api/autenticacion/mi-sesion') { enviar(sesion()); return }
  if (ruta === '/api/autenticacion/mi-foto') { res.writeHead(404); res.end(); return }
  if (ruta === '/api/seguridad/permisos/catalogo') { enviar(catalogo); return }
  if (ruta === '/api/seguridad/roles/' + id(10)) { enviar(rol()); return }
  if (ruta === '/api/seguridad/roles') { enviar({ ...paginado, items: [rol()], total: 1, totalPaginas: 1 }); return }
  if (ruta === '/api/ventas/cobros') { enviar({ ...paginado, estadoTurno: 'SIN_TURNO' }); return }
  enviar(paginado)
}).listen(3199, '127.0.0.1', () => console.log('Demo de navegación en http://127.0.0.1:3199. Datos en memoria; sin Oracle ni seeds.'))
