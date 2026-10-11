import { estadosDespacho, estadosRecepcion, prioridadesTraslado } from './traslado.config'
import { esUuid, fechaValida } from './traslado-reglas'
import type { ConsultaDocumentoTraslado, RecursoDocumentoTraslado } from './traslado.types'

export function criteriosDocumentoTraslado(recurso: RecursoDocumentoTraslado, consulta: string): ConsultaDocumentoTraslado {
  const q = new URLSearchParams(consulta), c: ConsultaDocumentoTraslado = {}
  const campos = ['origenSucursalId', 'destinoSucursalId', 'trasladoId', ...(recurso === 'recepciones' ? ['despachoId' as const] : [])] as const
  for (const campo of campos) if (esUuid(q.get(campo) ?? '')) c[campo] = q.get(campo)!
  if (Object.hasOwn(recurso === 'despachos' ? estadosDespacho : estadosRecepcion, q.get('estado') ?? '')) c.estado = q.get('estado') as ConsultaDocumentoTraslado['estado']
  if (Object.hasOwn(prioridadesTraslado, q.get('prioridad') ?? '')) c.prioridad = q.get('prioridad') as ConsultaDocumentoTraslado['prioridad']
  for (const campo of ['desde', 'hasta'] as const) if (fechaValida(q.get(campo) ?? '')) c[campo] = q.get(campo)!
  if (c.desde && c.hasta && c.desde > c.hasta) { delete c.desde; delete c.hasta }
  return c
}
