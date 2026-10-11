import type { Icono } from './icono'

export type ModuloPanel = {
  id: string
  nombre: string
  titulo: string
  descripcion: string
  icono: Parameters<typeof Icono>[0]['nombre']
}

export type AreaPanel = {
  id: string
  etiqueta: string
  descripcion: string
  icono: Parameters<typeof Icono>[0]['nombre']
  accesos: ModuloPanel[]
}

export function normalizarBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function buscarModulos(areas: AreaPanel[], busqueda: string) {
  const consulta = normalizarBusqueda(busqueda)
  return areas.flatMap((area) => area.accesos.map((modulo) => ({
    ...modulo,
    areaId: area.id,
    areaNombre: area.etiqueta,
  }))).filter((modulo) => normalizarBusqueda(
    `${modulo.nombre} ${modulo.titulo} ${modulo.descripcion} ${modulo.areaNombre}`,
  ).includes(consulta))
}

export function paginarPanel<T>(elementos: T[], paginaSolicitada: number, tamanoPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(elementos.length / tamanoPagina))
  const pagina = Math.max(1, Math.min(paginaSolicitada, totalPaginas))
  const desplazamiento = (pagina - 1) * tamanoPagina
  return {
    elementos: elementos.slice(desplazamiento, desplazamiento + tamanoPagina),
    pagina,
    totalPaginas,
    total: elementos.length,
    inicio: elementos.length === 0 ? 0 : desplazamiento + 1,
    fin: Math.min(desplazamiento + tamanoPagina, elementos.length),
  }
}
