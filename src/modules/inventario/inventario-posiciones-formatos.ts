export function fechaPosicion(valor?: string | null) {
  if (!valor) return 'Sin fecha'
  const [anio, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}
