export const clavesCatalogo = ['productos', 'presentaciones', 'principios-activos', 'unidades', 'conversiones', 'proveedores', 'clientes', 'laboratorios', 'bodegas', 'ubicaciones', 'precios-vigentes'] as const
export type ClaveCatalogo = typeof clavesCatalogo[number]
export type PrincipioProducto = { principioActivoId: string; concentracion: string }
export type ValorFormulario = string | boolean | PrincipioProducto[]
export type DatosFormulario = Record<string, ValorFormulario>
export type EntradaCatalogo = Record<string, string | boolean | null | PrincipioProducto[]>
export type RegistroCatalogo = {
  id: string; codigo: string; nombre: string; descripcion: string | null; activo: boolean; version: number
  creadoEn: string; actualizadoEn: string | null; inactivadoEn: string | null; motivoInactivacion: string | null
  [campo: string]: string | boolean | number | null | PrincipioProducto[]
}
export type Paginado<T> = { items: T[]; pagina: number; tamanoPagina: number; total: number; totalPaginas: number }
export type ConsultaCatalogo = {
  pagina: number; tamanoPagina: number; busqueda?: string; activo?: boolean
  orden?: 'nombre' | 'codigo' | 'estado'; direccion?: 'asc' | 'desc'
  productoId?: string; presentacionId?: string; laboratorioId?: string; unidadBaseId?: string
  sucursalId?: string; bodegaId?: string; tipo?: string; estadoHomologacion?: string
  vigenteEn?: string; unidadOrigenId?: string; unidadDestinoId?: string
}
export type Referencia = ClaveCatalogo | 'sucursales' | 'municipios'
export type OpcionReferencia = { id: string; codigo: string; nombre: string; activo: boolean; dimension?: string; admiteDecimales?: boolean; productoId?: string; unidadBaseId?: string; sucursalId?: string }
export type CampoCatalogo = {
  clave: string; etiqueta: string; tipo?: 'texto' | 'area' | 'correo' | 'fecha' | 'decimal' | 'booleano' | 'opciones' | 'referencia'
  requerido?: boolean; maximo?: number; minimo?: number; escala?: number; ayuda?: string
  opciones?: readonly { valor: string; etiqueta: string }[]; referencia?: Referencia; inicial?: string | boolean; inmutable?: boolean
}
export type SeccionCatalogo = { titulo: string; campos: readonly CampoCatalogo[]; composicion?: boolean; ayuda?: string }
export type DefinicionCatalogo = {
  clave: ClaveCatalogo; titulo: string; singular: string; permiso: string; descripcion: string
  secciones: readonly SeccionCatalogo[]; columnas: readonly string[]; filtros: readonly CampoCatalogo[]
}
export type DetalleAuditoria = { id: string; nombrePropiedad: string; etiquetaPropiedad: string | null; tipoDato: string | null; valorAnterior: string | null; valorNuevo: string | null; orden: number }
export type EventoAuditoria = { id: string; usuarioNombre: string | null; sucursal: { id: string; codigo: string; nombre: string } | null; tipoOperacion: string; versionEntidad: number | null; resumen: string | null; ocurridoEn: string; detalles: DetalleAuditoria[] }
export type ConsultaAuditoria = { pagina: number; tamanoPagina: number; fecha?: string; operaciones?: string; usuario?: string; sucursal?: string; resumen?: string; orden?: string; direccion?: string }
