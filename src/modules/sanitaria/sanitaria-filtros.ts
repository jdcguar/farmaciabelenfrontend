import { esUuidSanitaria, fechaRealSanitaria } from './sanitaria-reglas'
import { esGlobalSanitaria, sanitariaConfig, type VistaSanitaria } from './sanitaria.config'
import type { ConsultaSanitaria } from './sanitaria.types'
export function filtrosAplicablesSanitaria(v: VistaSanitaria): (keyof ConsultaSanitaria)[] {
  const ks: (keyof ConsultaSanitaria)[] = ['desde', 'hasta']
  if (!esGlobalSanitaria(v)) ks.push('sucursalId')
  if (!['correcciones', 'categorias', 'seguimientos', 'resoluciones-bloqueo'].includes(v)) ks.push('productoId')
  if (!['registros', 'politicas', 'categorias', 'clasificaciones', 'seguimientos', 'resoluciones-bloqueo'].includes(v)) ks.push('loteId')
  if (['casos', 'evaluaciones', 'decisiones', 'bajas', 'destrucciones', 'contingencias'].includes(v)) ks.push('casoId')
  if (['retiros', 'alertas', 'seguimientos'].includes(v)) ks.push('retiroId')
  if (['exposicion', 'politicas', 'categorias', 'clasificaciones'].includes(v)) ks.push('categoriaId')
  if (sanitariaConfig[v].estados.length) ks.push('estado')
  if (v === 'exposicion') ks.push('orden')
  return ks
}
export function filtrosDesdeUrlSanitaria(v: VistaSanitaria, q: string): ConsultaSanitaria {
  const p = new URLSearchParams(q), c: Record<string, string> = {}
  for (const k of filtrosAplicablesSanitaria(v)) { const x = p.get(k); if (!x) continue; if (k.endsWith('Id') ? esUuidSanitaria(x) : ['desde', 'hasta'].includes(k) ? fechaRealSanitaria(x) : k === 'orden' ? ['valor', 'vencimiento'].includes(x) : (sanitariaConfig[v].estados as readonly string[]).includes(x)) c[k] = x }
  if (c.desde && c.hasta && c.desde > c.hasta) { delete c.desde; delete c.hasta }
  return c as ConsultaSanitaria
}
