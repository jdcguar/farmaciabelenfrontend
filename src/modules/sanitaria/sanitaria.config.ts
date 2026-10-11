import type { SesionUsuario } from '../autenticacion/autenticacion.types'
import { textoSanitario, type DocumentoSanitario } from './sanitaria.types'
const caso = ['ABIERTA', 'EVALUACION', 'PARCIAL', 'RESUELTA', 'SEGUIMIENTO', 'CERRADA'], decision = ['PROPUESTA', 'APROBADA', 'PARCIAL', 'CONFIRMADA', 'CANCELADA']
export const sanitariaConfig = {
  casos: { titulo: 'Casos sanitarios', grupo: 'CASOS', estados: caso, nuevo: 'crear-caso', descripcion: 'Cuarentena, evaluación técnica y resolución por cantidades.' },
  decisiones: { titulo: 'Decisiones sanitarias', grupo: 'DECISIONES', estados: decision, descripcion: 'Solicitudes, autorizaciones y destinos de las unidades segregadas.' },
  bajas: { titulo: 'Bajas autorizadas', grupo: 'BAJAS', estados: decision, descripcion: 'Unidades segregadas pendientes de destrucción documentada.' },
  destrucciones: { titulo: 'Destrucciones', grupo: 'DESTRUCCIONES', estados: [], descripcion: 'Actas, cantidades y salidas definitivas de inventario.' },
  retiros: { titulo: 'Retiros de producto', grupo: 'RETIROS', estados: ['ACTIVO', 'CERRADO', 'LEVANTADO'], nuevo: 'crear-retiro', descripcion: 'Alcance, bloqueo preventivo y seguimiento de unidades afectadas.' },
  alertas: { titulo: 'Alertas sanitarias', grupo: 'ALERTAS', estados: ['ABIERTA', 'ATENDIDA', 'CERRADA'], nuevo: 'sincronizar', descripcion: 'Vencimiento, identificación y registros sanitarios por lote y sucursal.' },
  exposicion: { titulo: 'Exposición sanitaria', grupo: 'ALERTAS', estados: ['VIGENTE', 'INFORMATIVO', 'PREVENTIVO', 'PRIORITARIO', 'CRITICO', 'VENCIDO', 'DESCONOCIDO'], descripcion: 'Prioriza por vencimiento o valor documentado; coste pendiente cuando falte.' },
  'cuarentenas-pendientes': { titulo: 'Cuarentenas pendientes de evaluación', grupo: 'CASOS', estados: [], descripcion: 'Abre un expediente desde una cuarentena existente sin duplicar inventario.' },
  'bloqueos-pendientes': { titulo: 'Bloqueos sanitarios vigentes', grupo: 'BLOQUEOS', estados: [], descripcion: 'Solicitudes técnicas para levantar una causa de bloqueo.' },
  'resoluciones-bloqueo': { titulo: 'Resoluciones de bloqueos', grupo: 'BLOQUEOS', estados: ['PROPUESTA', 'APROBADA', 'RECHAZADA'], descripcion: 'Evaluación y aprobación independiente del levantamiento.' },
  contingencias: { titulo: 'Contingencias sanitarias', grupo: 'CONTINGENCIA', estados: ['DIGITALIZADA', 'CONCILIADA'], nuevo: 'digitalizar', descripcion: 'Digitalización de inmovilizaciones manuales y conciliación independiente.' },
  registros: { titulo: 'Registros sanitarios', grupo: 'REGISTROS', estados: ['VIGENTE', 'VERIFICACION', 'SUSPENDIDO', 'CANCELADO'], nuevo: 'registro', global: true, descripcion: 'Referencia y vigencia documental con bloqueo efectivo.' },
  correcciones: { titulo: 'Correcciones de vencimiento', grupo: 'LOTES', estados: ['PROPUESTA', 'APROBADA', 'RECHAZADA'], nuevo: 'corregir', global: true, descripcion: 'Correcciones corporativas compartidas, con evidencia e historial.' },
  politicas: { titulo: 'Políticas sanitarias', grupo: 'POLITICAS', estados: [], nuevo: 'politica', global: true, descripcion: 'Umbrales de alerta y vida útil mínima por producto, categoría o tipo.' },
  categorias: { titulo: 'Categorías sanitarias', grupo: 'POLITICAS', estados: [], nuevo: 'categoria', global: true, descripcion: 'Agrupaciones técnicas para aplicar políticas sanitarias.' },
  clasificaciones: { titulo: 'Clasificación sanitaria', grupo: 'POLITICAS', estados: [], nuevo: 'clasificacion', global: true, descripcion: 'Asigna la categoría sanitaria de cada producto.' },
  evaluaciones: { titulo: 'Evaluaciones técnicas', grupo: 'CASOS', estados: [], descripcion: 'Dictámenes y evidencia del expediente.' },
  seguimientos: { titulo: 'Seguimientos de retiro', grupo: 'RETIROS', estados: [], descripcion: 'Hechos documentados de inventario, tránsito y clientes afectados.' },
} as const
export type VistaSanitaria = keyof typeof sanitariaConfig
export type RecursoSanitario = Exclude<VistaSanitaria, 'exposicion' | 'cuarentenas-pendientes' | 'bloqueos-pendientes'>
export const vistasSanitaria = Object.keys(sanitariaConfig) as VistaSanitaria[]
export const navegacionSanitaria = vistasSanitaria.filter(v => !['evaluaciones', 'seguimientos'].includes(v))
export const permisoSanitaria = (v: VistaSanitaria) => `SANITARIA.${sanitariaConfig[v].grupo}.VER`
export const esGlobalSanitaria = (v: VistaSanitaria) => 'global' in sanitariaConfig[v]
export const nuevosSanitaria = (v: VistaSanitaria) => 'nuevo' in sanitariaConfig[v] ? sanitariaConfig[v].nuevo as AccionSanitaria : undefined
export const etiquetasSanitarias: Record<string, string> = { ABIERTA: 'Abierta', EVALUACION: 'En evaluación', PARCIAL: 'Parcial', RESUELTA: 'Resuelta', SEGUIMIENTO: 'En seguimiento', CERRADA: 'Cerrada', PROPUESTA: 'Solicitada', APROBADA: 'Autorizada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada', ACTIVO: 'Activo', CERRADO: 'Cerrado con bloqueo', LEVANTADO: 'Levantado', ATENDIDA: 'Atendida', DIGITALIZADA: 'Digitalizada', CONCILIADA: 'Conciliada', VIGENTE: 'Vigente', VERIFICACION: 'En verificación', SUSPENDIDO: 'Suspendido', CANCELADO: 'Cancelado', RECHAZADA: 'Rechazada', APTO: 'Apto', NO_APTO: 'No apto', INVESTIGACION: 'En investigación', LIBERAR: 'Liberar', MANTENER: 'Mantener en cuarentena', DEVOLVER: 'Devolver al proveedor', BAJA: 'Baja', DESTRUIR: 'Destruir', ANALIZAR: 'Analizar', NOTIFICAR: 'Notificar', PENDIENTE: 'Coste pendiente', DOCUMENTADO: 'Documentado', INFORMATIVO: 'Informativo', PREVENTIVO: 'Preventivo', PRIORITARIO: 'Prioritario', CRITICO: 'Crítico', VENCIDO: 'Vencido', DESCONOCIDO: 'Fecha desconocida', APTA: 'Apta', CUARENTENA: 'Cuarentena', BLOQUEADA: 'Bloqueada' }
export const accionesSanitaria = {
  'crear-caso': { titulo: 'Abrir caso sanitario', permiso: 'CASOS.CREAR', recurso: 'casos', aviso: 'La segregación conserva el inventario físico y deja las unidades fuera de disponible.' },
  adoptar: { titulo: 'Abrir expediente de cuarentena', permiso: 'CASOS.CREAR', recurso: 'cuarentenas-pendientes', aviso: 'Se vinculará la cuarentena existente; no se moverá ni duplicará inventario.' },
  evaluar: { titulo: 'Registrar evaluación técnica', permiso: 'CASOS.EVALUAR', recurso: 'casos', aviso: 'Documenta el dictamen y la cantidad evaluada. Evaluar no libera las unidades.' },
  decidir: { titulo: 'Solicitar decisión sanitaria', permiso: 'DECISIONES.SOLICITAR', recurso: 'casos', aviso: 'Los destinos finales comprometen cantidades del caso. La liberación y la baja necesitan otra persona para autorizar.' },
  'cerrar-caso': { titulo: 'Cerrar evaluación del caso', permiso: 'CASOS.CERRAR', recurso: 'casos', aviso: 'Con saldo pendiente se conservará el expediente en seguimiento.' },
  'aprobar-decision': { titulo: 'Autorizar decisión', permiso: 'DECISIONES.APROBAR', recurso: 'decisiones', aviso: 'Liberar mueve unidades aptas al almacenamiento. Autorizar una baja conserva las unidades segregadas hasta confirmar destrucción.' },
  'cancelar-decision': { titulo: 'Cancelar saldo de decisión', permiso: 'DECISIONES.CANCELAR', recurso: 'decisiones', aviso: 'Se cancela únicamente el saldo pendiente; se conservan hechos y destrucciones confirmadas.' },
  destruir: { titulo: 'Confirmar destrucción', permiso: 'DESTRUCCIONES.CONFIRMAR', recurso: 'bajas', aviso: 'Registra únicamente una destrucción física realizada y autorizada. Se producirá la salida definitiva de la cantidad indicada.' },
  'crear-retiro': { titulo: 'Activar retiro de producto', permiso: 'RETIROS.CREAR', recurso: 'retiros', aviso: 'El retiro bloqueará preventivamente el producto o lote en el alcance indicado.' },
  seguir: { titulo: 'Registrar seguimiento', permiso: 'RETIROS.SEGUIR', recurso: 'retiros', aviso: 'Documenta un hecho ocurrido. El registro no envía comunicaciones a clientes.' },
  'cerrar-retiro': { titulo: 'Conciliar retiro', permiso: 'RETIROS.CERRAR', recurso: 'retiros', aviso: 'La conciliación conserva el bloqueo. Localizar unidades posteriormente permite otra conciliación con historial.' },
  resolver: { titulo: 'Solicitar levantamiento sanitario', permiso: 'BLOQUEOS.EVALUAR', recurso: 'bloqueos-pendientes', aviso: 'Se evalúa esta causa de bloqueo; otra persona deberá autorizar su levantamiento.' },
  'aprobar-bloqueo': { titulo: 'Autorizar levantamiento', permiso: 'BLOQUEOS.APROBAR', recurso: 'resoluciones-bloqueo', aviso: 'Retira solo la causa evaluada. Cuarentenas, vencimientos y otras restricciones conservan su efecto.' },
  'rechazar-bloqueo': { titulo: 'Rechazar levantamiento', permiso: 'BLOQUEOS.APROBAR', recurso: 'resoluciones-bloqueo', aviso: 'Se conservará el bloqueo y el historial de la solicitud.' },
  sincronizar: { titulo: 'Actualizar alertas sanitarias', permiso: 'ALERTAS.SINCRONIZAR', recurso: 'alertas', aviso: 'Detecta exposición en una sucursal. No mueve inventario ni cierra investigaciones automáticamente.' },
  atender: { titulo: 'Atender alerta', permiso: 'ALERTAS.ATENDER', recurso: 'alertas', aviso: 'Documenta la revisión y el expediente o retiro relacionados.' },
  'cerrar-alerta': { titulo: 'Cerrar alerta', permiso: 'ALERTAS.ATENDER', recurso: 'alertas', aviso: 'Una alerta prioritaria o crítica con exposición necesita un caso o retiro documentado.' },
  digitalizar: { titulo: 'Digitalizar inmovilización manual', permiso: 'CONTINGENCIA.DIGITALIZAR', recurso: 'contingencias', aviso: 'Registra el folio y segrega la cantidad real. La resolución exige conciliación independiente.' },
  conciliar: { titulo: 'Conciliar contingencia', permiso: 'CONTINGENCIA.CONCILIAR', recurso: 'contingencias', aviso: 'Localizada y no localizada deben conciliar el folio. La conciliación no libera automáticamente.' },
  registro: { titulo: 'Registrar información sanitaria', permiso: 'REGISTROS.CONFIGURAR', recurso: 'registros', corporativo: true, aviso: 'La verificación es manual. Un registro no vigente bloquea disponibilidad y liberación.' },
  corregir: { titulo: 'Solicitar corrección de vencimiento', permiso: 'LOTES.CORREGIR', recurso: 'correcciones', corporativo: true, aviso: 'La fecha pertenece a todas las sucursales. Conserva evidencia y fecha anterior; requiere aprobación independiente.' },
  'aprobar-correccion': { titulo: 'Autorizar corrección de lote', permiso: 'LOTES.APROBAR', recurso: 'correcciones', corporativo: true, aviso: 'Cambiará la fecha compartida del lote y conservará la anterior en el historial.' },
  'rechazar-correccion': { titulo: 'Rechazar corrección de lote', permiso: 'LOTES.APROBAR', recurso: 'correcciones', corporativo: true, aviso: 'Se conservará la fecha vigente y el historial de solicitud.' },
  politica: { titulo: 'Configurar política sanitaria', permiso: 'POLITICAS.CONFIGURAR', recurso: 'politicas', corporativo: true, aviso: 'Prioridad: producto, categoría, tipo y global. Los umbrales deben disminuir desde informativo hasta crítico.' },
  categoria: { titulo: 'Guardar categoría sanitaria', permiso: 'POLITICAS.CONFIGURAR', recurso: 'categorias', corporativo: true, aviso: 'Categorías técnicas para aplicar políticas; conserva el código de una categoría existente.' },
  clasificacion: { titulo: 'Clasificar producto', permiso: 'POLITICAS.CONFIGURAR', recurso: 'clasificaciones', corporativo: true, aviso: 'Asigna la categoría usada para resolver la política sanitaria del producto.' },
  adjuntar: { titulo: 'Adjuntar evidencia', permiso: 'EVIDENCIAS.ADJUNTAR', recurso: 'casos', aviso: 'PDF, PNG o JPEG de hasta 10 MB. Los archivos quedan privados y asociados al expediente.' },
} as const
export type AccionSanitaria = keyof typeof accionesSanitaria
export type RutaSanitaria = { vista: VistaSanitaria; modo: 'listado' | 'detalle' | 'operacion'; id?: string; accion?: AccionSanitaria }
export function reconocerRutaSanitaria(ruta: string): RutaSanitaria | null {
  const [base, v, id, a, extra] = ruta.replace(/^\//, '').split('/')
  if (base !== 'sanitaria' || extra !== undefined) return null
  const vista = (v || 'casos') as VistaSanitaria
  if (!vistasSanitaria.includes(vista)) return null
  if (!id) return { vista, modo: 'listado' }
  if (id === 'nuevo' && !a) { const accion = nuevosSanitaria(vista); return accion ? { vista, modo: 'operacion', accion } : null }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || vista === 'exposicion') return null
  if (!a) return ['cuarentenas-pendientes', 'bloqueos-pendientes'].includes(vista) ? null : { vista, modo: 'detalle', id }
  const accion = a as AccionSanitaria
  if (!Object.hasOwn(accionesSanitaria, accion)) return null
  const recurso = accionesSanitaria[accion].recurso
  if (accion === 'adjuntar' && !vista.endsWith('-pendientes') || (vista === 'bajas' && ['aprobar-decision', 'cancelar-decision'].includes(accion)) || recurso === vista) return { vista, modo: 'operacion', id, accion }
  return null
}
export function puedeRutaSanitaria(r: RutaSanitaria, permisos: readonly string[]) {
  if (!permisos.includes(permisoSanitaria(r.vista))) return false
  if (!r.accion) return true
  const a = accionesSanitaria[r.accion]
  return permisos.includes('SANITARIA.' + a.permiso) && (!('corporativo' in a) || permisos.includes('SANITARIA.ACCESO.CORPORATIVO'))
}
export function puedeAccionSanitaria(a: AccionSanitaria, v: VistaSanitaria, e: DocumentoSanitario, sesion: SesionUsuario) {
  if (!puedeRutaSanitaria({ vista: v, modo: 'operacion', accion: a, id: e.id }, sesion.permisos)) return false
  const s = textoSanitario(e, 'sucursalId'), estado = textoSanitario(e, 'estado'), independiente = textoSanitario(e, 'solicitadoPorId') || textoSanitario(e, 'creadoPorId')
  if (s && s !== sesion.sucursal.id && !sesion.permisos.includes('SANITARIA.ACCESO.CORPORATIVO')) return false
  if (['aprobar-decision', 'aprobar-bloqueo', 'rechazar-bloqueo', 'aprobar-correccion', 'rechazar-correccion', 'conciliar'].includes(a) && independiente === sesion.usuarioId) return false
  if (a === 'aprobar-decision') {
    const destino = textoSanitario(e, 'destino')
    return estado === 'PROPUESTA' && sesion.permisos.includes(destino === 'LIBERAR' ? 'SANITARIA.CASOS.LIBERAR' : ['BAJA', 'DESTRUIR'].includes(destino) ? 'SANITARIA.BAJAS.AUTORIZAR' : 'SANITARIA.DECISIONES.APROBAR')
  }
  if (a === 'destruir') return ['BAJA', 'DESTRUIR'].includes(textoSanitario(e, 'destino')) && ['APROBADA', 'PARCIAL'].includes(estado)
  if (a === 'cancelar-decision') return ['PROPUESTA', 'APROBADA', 'PARCIAL'].includes(estado)
  if (a === 'evaluar' || a === 'decidir') return !['RESUELTA', 'CERRADA'].includes(estado)
  if (a === 'cerrar-caso') return estado !== 'CERRADA'
  if (a === 'atender' || a === 'cerrar-alerta') return estado !== 'CERRADA'
  if (a === 'seguir' || a === 'cerrar-retiro') return estado !== 'LEVANTADO' && (s !== '' || sesion.permisos.includes('SANITARIA.ACCESO.CORPORATIVO') || a === 'seguir')
  if (a.includes('correccion') || a.includes('bloqueo') && a !== 'resolver') return estado === 'PROPUESTA'
  if (a === 'conciliar') return estado === 'DIGITALIZADA' || Number(textoSanitario(e, 'noLocalizadaBase')) > 0
  if (a === 'adjuntar') return !['CERRADA', 'CONFIRMADA', 'APROBADA', 'RECHAZADA', 'LEVANTADO', 'CERRADO'].includes(estado)
  return true
}
export function accionesDocumentoSanitaria(v: VistaSanitaria): AccionSanitaria[] {
  const comunes: AccionSanitaria[] = ['adjuntar']
  const propias: Partial<Record<VistaSanitaria, AccionSanitaria[]>> = { casos: ['evaluar', 'decidir', 'cerrar-caso'], decisiones: ['aprobar-decision', 'cancelar-decision'], bajas: ['aprobar-decision', 'cancelar-decision', 'destruir'], retiros: ['seguir', 'cerrar-retiro'], alertas: ['atender', 'cerrar-alerta'], contingencias: ['conciliar'], correcciones: ['aprobar-correccion', 'rechazar-correccion'], 'resoluciones-bloqueo': ['aprobar-bloqueo', 'rechazar-bloqueo'], registros: ['registro'], politicas: ['politica'], categorias: ['categoria'], clasificaciones: ['clasificacion'] }
  return [...(propias[v] ?? []), ...comunes]
}
export function nombreDocumentoSanitario(e: DocumentoSanitario) { return textoSanitario(e, 'numero') || textoSanitario(e, 'nombre') || textoSanitario(e, 'folio') || textoSanitario(e, 'referencia') || (textoSanitario(e, 'destino') ? `${etiquetasSanitarias[textoSanitario(e, 'destino')]} · ${textoSanitario(e, 'cantidadBase')} base` : textoSanitario(e, 'resultado')) || 'Registro sanitario' }
