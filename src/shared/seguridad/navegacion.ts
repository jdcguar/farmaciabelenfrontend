// Fuente de verdad. La copia frontend se genera con scripts/sincronizar-navegacion.mjs.
export type PantallaNavegacion = {
  id: string; area: string; modulo: string; nombre: string; permiso: string;
  rutas: readonly string[]; requisitos: readonly (readonly string[])[];
}

export const pantallasNavegacion: readonly PantallaNavegacion[] = [
  { id: "planillas-configuracion-salarial", area: "planillas", modulo: "Planillas", nombre: "Configuración salarial", permiso: "NAVEGACION.PLANILLAS.CONFIGURACION_SALARIAL.ACCEDER", rutas: ["/planillas/configuracion-salarial"], requisitos: [["PLANILLAS.CONFIGURACION_SALARIAL.VER"]] },
  { id: "planillas-periodos", area: "planillas", modulo: "Planillas", nombre: "Historial de planillas", permiso: "NAVEGACION.PLANILLAS.PERIODOS.ACCEDER", rutas: ["/planillas/periodos"], requisitos: [["PLANILLAS.PERIODOS.VER"]] },
  {"id":"caja-cobro-ventas","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cobro Ventas","permiso":"NAVEGACION.CAJA.COBRO_VENTAS.ACCEDER","rutas":["/caja/cobro-ventas"],"requisitos":[["VENTAS.VENTAS.VER","CAJA.MOVIMIENTOS.COBRAR"]]},
  {"id":"caja-chica","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Caja chica","permiso":"NAVEGACION.CAJA.CAJA_CHICA.ACCEDER","rutas":["/caja/chica"],"requisitos":[["ORGANIZACION.SUCURSALES.LIQUIDACIONES_VER"]]},
  {"id":"caja-liquidaciones","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Liquidaciones","permiso":"NAVEGACION.CAJA.LIQUIDACIONES.ACCEDER","rutas":["/caja/liquidaciones"],"requisitos":[["ORGANIZACION.SUCURSALES.LIQUIDACIONES_VER"]]},
  {"id":"caja-consolidado","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Flujo de efectivo","permiso":"NAVEGACION.CAJA.FLUJO_EFECTIVO.ACCEDER","rutas":["/caja/consolidado","/caja"],"requisitos":[["CAJA.CIERRES.VER"]]},
  {"id":"caja-politicas","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Configuración de caja","permiso":"NAVEGACION.CAJA.CONFIGURACION.ACCEDER","rutas":["/caja/politicas"],"requisitos":[["CAJA.POLITICAS.VER"],["CAJA.POLITICAS.CONFIGURAR"]]},
  {"id":"caja-cajas","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cajas","permiso":"NAVEGACION.CAJA.CAJAS.ACCEDER","rutas":["/caja/cajas"],"requisitos":[["CAJA.CAJAS.VER"],["CAJA.CAJAS.CREAR"]]},
  {"id":"caja-turnos","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Turnos de caja","permiso":"NAVEGACION.CAJA.TURNOS.ACCEDER","rutas":["/caja/turnos"],"requisitos":[["CAJA.TURNOS.VER"],["CAJA.TURNOS.ABRIR","CAJA.CAJAS.VER","CAJA.POLITICAS.VER"]]},
  {"id":"caja-movimientos","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Movimientos","permiso":"NAVEGACION.CAJA.MOVIMIENTOS.ACCEDER","rutas":["/caja/movimientos"],"requisitos":[["CAJA.MOVIMIENTOS.VER"],["CAJA.MOVIMIENTOS.CREAR"]]},
  {"id":"caja-arqueos","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Arqueos","permiso":"NAVEGACION.CAJA.ARQUEOS.ACCEDER","rutas":["/caja/arqueos"],"requisitos":[["CAJA.ARQUEOS.VER"],["CAJA.ARQUEOS.CREAR"]]},
  {"id":"caja-cierres","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cierres de turno","permiso":"NAVEGACION.CAJA.CIERRES_TURNO.ACCEDER","rutas":["/caja/cierres"],"requisitos":[["CAJA.CIERRES.VER"]]},
  {"id":"caja-remesas","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Remesas","permiso":"NAVEGACION.CAJA.REMESAS.ACCEDER","rutas":["/caja/remesas"],"requisitos":[["CAJA.CUSTODIA.VER"]]},
  {"id":"caja-custodias","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cadena de custodia","permiso":"NAVEGACION.CAJA.CADENA_CUSTODIA.ACCEDER","rutas":["/caja/custodias"],"requisitos":[["CAJA.CUSTODIA.VER"]]},
  {"id":"caja-depositos","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Depósitos","permiso":"NAVEGACION.CAJA.DEPOSITOS.ACCEDER","rutas":["/caja/depositos"],"requisitos":[["CAJA.DEPOSITOS.VER"],["CAJA.DEPOSITOS.PREPARAR"]]},
  {"id":"caja-cobros-repartidor","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cobros de repartidores","permiso":"NAVEGACION.CAJA.COBROS_REPARTIDOR.ACCEDER","rutas":["/caja/cobros-repartidor"],"requisitos":[["CAJA.RENDICIONES.VER"]]},
  {"id":"caja-rendiciones","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Rendiciones","permiso":"NAVEGACION.CAJA.RENDICIONES.ACCEDER","rutas":["/caja/rendiciones"],"requisitos":[["CAJA.RENDICIONES.VER"],["CAJA.RENDICIONES.REGISTRAR"]]},
  {"id":"caja-incidencias","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Incidencias de caja","permiso":"NAVEGACION.CAJA.INCIDENCIAS.ACCEDER","rutas":["/caja/incidencias"],"requisitos":[["CAJA.INCIDENCIAS.VER"]]},
  {"id":"caja-cierres-diarios","area":"caja","modulo":"Caja y flujo de efectivo","nombre":"Cierres diarios","permiso":"NAVEGACION.CAJA.CIERRES_DIARIOS.ACCEDER","rutas":["/caja/cierres-diarios"],"requisitos":[["CAJA.CIERRES.VER"],["CAJA.CIERRES.CONSOLIDAR"]]},
  {"id":"ventas-operaciones","area":"ventas","modulo":"Ventas y dispensación","nombre":"Ventas","permiso":"NAVEGACION.VENTAS.VENTAS.ACCEDER","rutas":["/ventas"],"requisitos":[["VENTAS.VENTAS.VER"]]},
  {"id":"ventas-politicas","area":"ventas","modulo":"Ventas y dispensación","nombre":"Políticas de ventas","permiso":"NAVEGACION.VENTAS.POLITICAS.ACCEDER","rutas":["/ventas/politicas"],"requisitos":[["VENTAS.POLITICAS.VER"]]},
  {"id":"ventas-contingencias","area":"ventas","modulo":"Ventas y dispensación","nombre":"Contingencias manuales","permiso":"NAVEGACION.VENTAS.CONTINGENCIAS.ACCEDER","rutas":["/ventas/contingencias"],"requisitos":[["VENTAS.CONTINGENCIA.VER"],["VENTAS.CONTINGENCIA.AUTORIZAR"]]},
  {"id":"sanitaria-casos","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Casos sanitarios","permiso":"NAVEGACION.SANITARIA.CASOS.ACCEDER","rutas":["/sanitaria/casos","/sanitaria","/sanitaria/evaluaciones"],"requisitos":[["SANITARIA.CASOS.VER"]]},
  {"id":"sanitaria-decisiones","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Decisiones sanitarias","permiso":"NAVEGACION.SANITARIA.DECISIONES.ACCEDER","rutas":["/sanitaria/decisiones"],"requisitos":[["SANITARIA.DECISIONES.VER"]]},
  {"id":"sanitaria-bajas","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Bajas autorizadas","permiso":"NAVEGACION.SANITARIA.BAJAS.ACCEDER","rutas":["/sanitaria/bajas"],"requisitos":[["SANITARIA.BAJAS.VER"]]},
  {"id":"sanitaria-destrucciones","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Destrucciones","permiso":"NAVEGACION.SANITARIA.DESTRUCCIONES.ACCEDER","rutas":["/sanitaria/destrucciones"],"requisitos":[["SANITARIA.DESTRUCCIONES.VER"]]},
  {"id":"sanitaria-retiros","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Retiros de producto","permiso":"NAVEGACION.SANITARIA.RETIROS.ACCEDER","rutas":["/sanitaria/retiros","/sanitaria/seguimientos"],"requisitos":[["SANITARIA.RETIROS.VER"]]},
  {"id":"sanitaria-alertas","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Alertas sanitarias","permiso":"NAVEGACION.SANITARIA.ALERTAS.ACCEDER","rutas":["/sanitaria/alertas"],"requisitos":[["SANITARIA.ALERTAS.VER"]]},
  {"id":"sanitaria-exposicion","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Exposición sanitaria","permiso":"NAVEGACION.SANITARIA.EXPOSICION.ACCEDER","rutas":["/sanitaria/exposicion"],"requisitos":[["SANITARIA.ALERTAS.VER"]]},
  {"id":"sanitaria-cuarentenas-pendientes","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Cuarentenas pendientes de evaluación","permiso":"NAVEGACION.SANITARIA.CUARENTENAS_PENDIENTES.ACCEDER","rutas":["/sanitaria/cuarentenas-pendientes"],"requisitos":[["SANITARIA.CASOS.VER"]]},
  {"id":"sanitaria-bloqueos-pendientes","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Bloqueos sanitarios vigentes","permiso":"NAVEGACION.SANITARIA.BLOQUEOS_PENDIENTES.ACCEDER","rutas":["/sanitaria/bloqueos-pendientes"],"requisitos":[["SANITARIA.BLOQUEOS.VER"]]},
  {"id":"sanitaria-resoluciones-bloqueo","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Resoluciones de bloqueos","permiso":"NAVEGACION.SANITARIA.RESOLUCIONES_BLOQUEO.ACCEDER","rutas":["/sanitaria/resoluciones-bloqueo"],"requisitos":[["SANITARIA.BLOQUEOS.VER"]]},
  {"id":"sanitaria-contingencias","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Contingencias sanitarias","permiso":"NAVEGACION.SANITARIA.CONTINGENCIAS.ACCEDER","rutas":["/sanitaria/contingencias"],"requisitos":[["SANITARIA.CONTINGENCIA.VER"]]},
  {"id":"sanitaria-registros","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Registros sanitarios","permiso":"NAVEGACION.SANITARIA.REGISTROS.ACCEDER","rutas":["/sanitaria/registros"],"requisitos":[["SANITARIA.REGISTROS.VER"]]},
  {"id":"sanitaria-correcciones","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Correcciones de vencimiento","permiso":"NAVEGACION.SANITARIA.CORRECCIONES.ACCEDER","rutas":["/sanitaria/correcciones"],"requisitos":[["SANITARIA.LOTES.VER"]]},
  {"id":"sanitaria-politicas","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Políticas sanitarias","permiso":"NAVEGACION.SANITARIA.POLITICAS.ACCEDER","rutas":["/sanitaria/politicas"],"requisitos":[["SANITARIA.POLITICAS.VER"]]},
  {"id":"sanitaria-categorias","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Categorías sanitarias","permiso":"NAVEGACION.SANITARIA.CATEGORIAS.ACCEDER","rutas":["/sanitaria/categorias"],"requisitos":[["SANITARIA.POLITICAS.VER"]]},
  {"id":"sanitaria-clasificaciones","area":"sanitaria","modulo":"Gestión sanitaria","nombre":"Clasificación sanitaria","permiso":"NAVEGACION.SANITARIA.CLASIFICACIONES.ACCEDER","rutas":["/sanitaria/clasificaciones"],"requisitos":[["SANITARIA.POLITICAS.VER"]]},
  {"id":"traslados-operaciones","area":"traslados","modulo":"Traslados","nombre":"Traslados","permiso":"NAVEGACION.TRASLADOS.TRASLADOS.ACCEDER","rutas":["/traslados"],"requisitos":[["TRASLADOS.OPERACIONES.VER"],["TRASLADOS.OPERACIONES.CREAR"]]},
  {"id":"traslados-despachos","area":"traslados","modulo":"Traslados","nombre":"Despachos","permiso":"NAVEGACION.TRASLADOS.DESPACHOS.ACCEDER","rutas":["/traslados/despachos"],"requisitos":[["TRASLADOS.OPERACIONES.VER"]]},
  {"id":"traslados-recepciones","area":"traslados","modulo":"Traslados","nombre":"Recepciones","permiso":"NAVEGACION.TRASLADOS.RECEPCIONES.ACCEDER","rutas":["/traslados/recepciones"],"requisitos":[["TRASLADOS.OPERACIONES.VER"]]},
  {"id":"inventario-lotes","area":"inventario","modulo":"Inventario","nombre":"Lotes","permiso":"NAVEGACION.INVENTARIO.LOTES.ACCEDER","rutas":["/inventario/lotes"],"requisitos":[["INVENTARIO.LOTES.VER"],["INVENTARIO.LOTES.CREAR"]]},
  {"id":"inventario-existencias","area":"inventario","modulo":"Inventario","nombre":"Existencias por ubicación","permiso":"NAVEGACION.INVENTARIO.EXISTENCIAS.ACCEDER","rutas":["/inventario/existencias"],"requisitos":[["INVENTARIO.EXISTENCIAS.VER"]]},
  {"id":"inventario-movimientos","area":"inventario","modulo":"Inventario","nombre":"Movimientos","permiso":"NAVEGACION.INVENTARIO.MOVIMIENTOS.ACCEDER","rutas":["/inventario/movimientos"],"requisitos":[["INVENTARIO.MOVIMIENTOS.VER"],["INVENTARIO.MOVIMIENTOS.CREAR"]]},
  {"id":"inventario-kardex","area":"inventario","modulo":"Inventario","nombre":"Kardex","permiso":"NAVEGACION.INVENTARIO.KARDEX.ACCEDER","rutas":["/inventario/kardex"],"requisitos":[["INVENTARIO.KARDEX.VER"]]},
  {"id":"inventario-reservas","area":"inventario","modulo":"Inventario","nombre":"Reservas de stock","permiso":"NAVEGACION.INVENTARIO.RESERVAS.ACCEDER","rutas":["/inventario/reservas"],"requisitos":[["INVENTARIO.RESERVAS.VER"],["INVENTARIO.RESERVAS.CREAR"]]},
  {"id":"inventario-bloqueos","area":"inventario","modulo":"Inventario","nombre":"Bloqueos","permiso":"NAVEGACION.INVENTARIO.BLOQUEOS.ACCEDER","rutas":["/inventario/bloqueos"],"requisitos":[["INVENTARIO.BLOQUEOS.VER"],["INVENTARIO.BLOQUEOS.CREAR"]]},
  {"id":"inventario-cuarentenas","area":"inventario","modulo":"Inventario","nombre":"Cuarentena","permiso":"NAVEGACION.INVENTARIO.CUARENTENAS.ACCEDER","rutas":["/inventario/cuarentenas"],"requisitos":[["INVENTARIO.CUARENTENA.VER"]]},
  {"id":"inventario-conteos","area":"inventario","modulo":"Inventario","nombre":"Conteos físicos","permiso":"NAVEGACION.INVENTARIO.CONTEOS.ACCEDER","rutas":["/inventario/conteos"],"requisitos":[["INVENTARIO.CONTEOS.VER"],["INVENTARIO.CONTEOS.CREAR"]]},
  {"id":"inventario-disponibilidad","area":"inventario","modulo":"Inventario","nombre":"Disponibilidad","permiso":"NAVEGACION.INVENTARIO.DISPONIBILIDAD.ACCEDER","rutas":["/inventario/disponibilidad"],"requisitos":[["INVENTARIO.DISPONIBILIDAD.VER"]]},
  {"id":"inventario-fefo","area":"inventario","modulo":"Inventario","nombre":"Selección FEFO","permiso":"NAVEGACION.INVENTARIO.FEFO.ACCEDER","rutas":["/inventario/fefo"],"requisitos":[["INVENTARIO.DISPONIBILIDAD.FEFO"]]},
  {"id":"inventario-vencimientos","area":"inventario","modulo":"Inventario","nombre":"Vencimientos","permiso":"NAVEGACION.INVENTARIO.VENCIMIENTOS.ACCEDER","rutas":["/inventario/vencimientos","/inventario/parametros"],"requisitos":[["INVENTARIO.VENCIMIENTOS.VER"]]},
  {"id":"inventario-ajustes","area":"inventario","modulo":"Inventario","nombre":"Ajustes","permiso":"NAVEGACION.INVENTARIO.AJUSTES.ACCEDER","rutas":["/inventario/ajustes"],"requisitos":[["INVENTARIO.MOVIMIENTOS.VER"],["INVENTARIO.AJUSTES.CREAR"]]},
  {"id":"inventario-carga-inicial","area":"inventario","modulo":"Inventario","nombre":"Carga inicial","permiso":"NAVEGACION.INVENTARIO.CARGA_INICIAL.ACCEDER","rutas":["/inventario/carga-inicial"],"requisitos":[["INVENTARIO.MOVIMIENTOS.VER"],["INVENTARIO.CARGA_INICIAL.CREAR"]]},
  {"id":"compras-solicitudes","area":"compras","modulo":"Compras y recepción","nombre":"Solicitudes","permiso":"NAVEGACION.COMPRAS.SOLICITUDES.ACCEDER","rutas":["/compras/solicitudes"],"requisitos":[["COMPRAS.SOLICITUDES.VER"],["COMPRAS.SOLICITUDES.CREAR"]]},
  {"id":"compras-cotizaciones","area":"compras","modulo":"Compras y recepción","nombre":"Cotizaciones","permiso":"NAVEGACION.COMPRAS.COTIZACIONES.ACCEDER","rutas":["/compras/cotizaciones"],"requisitos":[["COMPRAS.COTIZACIONES.VER"],["COMPRAS.COTIZACIONES.CREAR","COMPRAS.ACCESO.CORPORATIVO"]]},
  {"id":"compras-ordenes","area":"compras","modulo":"Compras y recepción","nombre":"Órdenes","permiso":"NAVEGACION.COMPRAS.ORDENES.ACCEDER","rutas":["/compras/ordenes"],"requisitos":[["COMPRAS.ORDENES.VER"],["COMPRAS.ORDENES.CREAR","COMPRAS.ACCESO.CORPORATIVO"]]},
  {"id":"compras-recepciones","area":"compras","modulo":"Compras y recepción","nombre":"Recepciones","permiso":"NAVEGACION.COMPRAS.RECEPCIONES.ACCEDER","rutas":["/compras/recepciones"],"requisitos":[["COMPRAS.RECEPCIONES.VER"],["COMPRAS.RECEPCIONES.CREAR"]]},
  {"id":"compras-facturas","area":"compras","modulo":"Compras y recepción","nombre":"Facturas","permiso":"NAVEGACION.COMPRAS.FACTURAS.ACCEDER","rutas":["/compras/facturas"],"requisitos":[["COMPRAS.FACTURAS.VER"],["COMPRAS.FACTURAS.CREAR","COMPRAS.ACCESO.CORPORATIVO"]]},
  {"id":"compras-obligaciones","area":"compras","modulo":"Compras y recepción","nombre":"Obligaciones","permiso":"NAVEGACION.COMPRAS.OBLIGACIONES.ACCEDER","rutas":["/compras/obligaciones"],"requisitos":[["COMPRAS.OBLIGACIONES.VER"]]},
  {"id":"compras-evaluaciones","area":"compras","modulo":"Compras y recepción","nombre":"Evaluaciones","permiso":"NAVEGACION.COMPRAS.EVALUACIONES.ACCEDER","rutas":["/compras/evaluaciones"],"requisitos":[["COMPRAS.EVALUACIONES.VER"],["COMPRAS.EVALUACIONES.CREAR","COMPRAS.ACCESO.CORPORATIVO"]]},
  {"id":"productos","area":"catalogos","modulo":"Catálogos","nombre":"Productos","permiso":"NAVEGACION.CATALOGOS.PRODUCTOS.ACCEDER","rutas":["/catalogos/productos"],"requisitos":[["CATALOGOS.PRODUCTOS.VER"],["CATALOGOS.PRODUCTOS.CREAR"]]},
  {"id":"presentaciones","area":"catalogos","modulo":"Catálogos","nombre":"Presentaciones","permiso":"NAVEGACION.CATALOGOS.PRESENTACIONES.ACCEDER","rutas":["/catalogos/presentaciones"],"requisitos":[["CATALOGOS.PRESENTACIONES.VER"],["CATALOGOS.PRESENTACIONES.CREAR"]]},
  {"id":"principios-activos","area":"catalogos","modulo":"Catálogos","nombre":"Principios activos","permiso":"NAVEGACION.CATALOGOS.PRINCIPIOS_ACTIVOS.ACCEDER","rutas":["/catalogos/principios-activos"],"requisitos":[["CATALOGOS.PRINCIPIOS_ACTIVOS.VER"],["CATALOGOS.PRINCIPIOS_ACTIVOS.CREAR"]]},
  {"id":"unidades","area":"catalogos","modulo":"Catálogos","nombre":"Unidades","permiso":"NAVEGACION.CATALOGOS.UNIDADES.ACCEDER","rutas":["/catalogos/unidades"],"requisitos":[["CATALOGOS.UNIDADES.VER"],["CATALOGOS.UNIDADES.CREAR"]]},
  {"id":"conversiones","area":"catalogos","modulo":"Catálogos","nombre":"Conversiones","permiso":"NAVEGACION.CATALOGOS.CONVERSIONES.ACCEDER","rutas":["/catalogos/conversiones"],"requisitos":[["CATALOGOS.CONVERSIONES.VER"],["CATALOGOS.CONVERSIONES.CREAR"]]},
  {"id":"proveedores","area":"catalogos","modulo":"Catálogos","nombre":"Proveedores","permiso":"NAVEGACION.CATALOGOS.PROVEEDORES.ACCEDER","rutas":["/catalogos/proveedores"],"requisitos":[["CATALOGOS.PROVEEDORES.VER"],["CATALOGOS.PROVEEDORES.CREAR"]]},
  {"id":"clientes","area":"catalogos","modulo":"Catálogos","nombre":"Clientes","permiso":"NAVEGACION.CATALOGOS.CLIENTES.ACCEDER","rutas":["/catalogos/clientes"],"requisitos":[["CATALOGOS.CLIENTES.VER"],["CATALOGOS.CLIENTES.CREAR"]]},
  {"id":"laboratorios","area":"catalogos","modulo":"Catálogos","nombre":"Laboratorios","permiso":"NAVEGACION.CATALOGOS.LABORATORIOS.ACCEDER","rutas":["/catalogos/laboratorios"],"requisitos":[["CATALOGOS.LABORATORIOS.VER"],["CATALOGOS.LABORATORIOS.CREAR"]]},
  {"id":"bodegas","area":"catalogos","modulo":"Catálogos","nombre":"Bodegas","permiso":"NAVEGACION.CATALOGOS.BODEGAS.ACCEDER","rutas":["/catalogos/bodegas"],"requisitos":[["CATALOGOS.BODEGAS.VER"],["CATALOGOS.BODEGAS.CREAR"]]},
  {"id":"ubicaciones","area":"catalogos","modulo":"Catálogos","nombre":"Ubicaciones","permiso":"NAVEGACION.CATALOGOS.UBICACIONES.ACCEDER","rutas":["/catalogos/ubicaciones"],"requisitos":[["CATALOGOS.UBICACIONES.VER"],["CATALOGOS.UBICACIONES.CREAR"]]},
  {"id":"precios-vigentes","area":"catalogos","modulo":"Catálogos","nombre":"Precios vigentes","permiso":"NAVEGACION.CATALOGOS.PRECIOS_VIGENTES.ACCEDER","rutas":["/catalogos/precios-vigentes"],"requisitos":[["CATALOGOS.PRECIOS_VIGENTES.VER"],["CATALOGOS.PRECIOS_VIGENTES.CREAR"]]},
  {"id":"estados","area":"catalogos","modulo":"Catálogos","nombre":"Estados","permiso":"NAVEGACION.CATALOGOS.ESTADOS.ACCEDER","rutas":["/catalogos/estados"],"requisitos":[["CATALOGOS.ESTADOS.VER"],["CATALOGOS.ESTADOS.CREAR"]]},
  {"id":"empleados","area":"organizacion","modulo":"Organización","nombre":"Empleados","permiso":"NAVEGACION.ORGANIZACION.EMPLEADOS.ACCEDER","rutas":["/empleados"],"requisitos":[["ORGANIZACION.EMPLEADOS.VER"],["ORGANIZACION.EMPLEADOS.CREAR"]]},
  {"id":"departamentos","area":"organizacion","modulo":"Organización","nombre":"Departamentos","permiso":"NAVEGACION.ORGANIZACION.DEPARTAMENTOS.ACCEDER","rutas":["/organizacion/departamentos"],"requisitos":[["ORGANIZACION.DEPARTAMENTOS.VER"],["ORGANIZACION.DEPARTAMENTOS.CREAR"]]},
  {"id":"puestos","area":"organizacion","modulo":"Organización","nombre":"Puestos","permiso":"NAVEGACION.ORGANIZACION.PUESTOS.ACCEDER","rutas":["/organizacion/puestos"],"requisitos":[["ORGANIZACION.PUESTOS.VER"],["ORGANIZACION.PUESTOS.CREAR"]]},
  {"id":"sucursales","area":"organizacion","modulo":"Organización","nombre":"Sucursales","permiso":"NAVEGACION.ORGANIZACION.SUCURSALES.ACCEDER","rutas":["/organizacion/sucursales"],"requisitos":[["ORGANIZACION.SUCURSALES.VER"],["ORGANIZACION.SUCURSALES.CREAR"]]},
  {"id":"roles","area":"seguridad","modulo":"Seguridad","nombre":"Roles y permisos","permiso":"NAVEGACION.SEGURIDAD.ROLES.ACCEDER","rutas":["/seguridad/roles"],"requisitos":[["SEGURIDAD.ROLES.VER"],["SEGURIDAD.ROLES.CREAR","SEGURIDAD.PERMISOS.VER","SEGURIDAD.PERMISOS.ASIGNAR"]]},
  {"id":"usuarios","area":"seguridad","modulo":"Seguridad","nombre":"Usuarios","permiso":"NAVEGACION.SEGURIDAD.USUARIOS.ACCEDER","rutas":["/seguridad/usuarios"],"requisitos":[["SEGURIDAD.USUARIOS.VER"],["SEGURIDAD.USUARIOS.CREAR"]]},
  {"id":"costeo-valoracion","area":"inventario","modulo":"Inventario","nombre":"Inventario valorado","permiso":"NAVEGACION.INVENTARIO.VALORACION.ACCEDER","rutas":["/inventario/valoracion"],"requisitos":[["INVENTARIO.VALORACION.VER"]]},
  {"id":"costeo-registros","area":"inventario","modulo":"Inventario","nombre":"Kardex monetario","permiso":"NAVEGACION.INVENTARIO.KARDEX_MONETARIO.ACCEDER","rutas":["/inventario/kardex-monetario"],"requisitos":[["INVENTARIO.VALORACION.VER"]]},
  {"id":"costeo-reposiciones","area":"compras","modulo":"Compras y recepción","nombre":"Costos de reposición","permiso":"NAVEGACION.COMPRAS.COSTOS_REPOSICION.ACCEDER","rutas":["/compras/costos-reposicion"],"requisitos":[["COMPRAS.REPOSICION.VER","COMPRAS.ACCESO.CORPORATIVO"]]},
  {"id":"costeo-sugerencias","area":"catalogos","modulo":"Catálogos","nombre":"Precios sugeridos","permiso":"NAVEGACION.CATALOGOS.PRECIOS_SUGERIDOS.ACCEDER","rutas":["/catalogos/precios-vigentes/sugerencias"],"requisitos":[["CATALOGOS.PRECIOS_VIGENTES.VER_SUGERENCIAS"]]},
  {"id":"costeo-ventas","area":"ventas","modulo":"Ventas y dispensación","nombre":"Costo de ventas","permiso":"NAVEGACION.VENTAS.COSTOS.ACCEDER","rutas":["/ventas/costos"],"requisitos":[["VENTAS.COSTOS.VER"]]},
  { id: 'activos-registro', area: 'activos', modulo: 'Activos administrativos', nombre: 'Activos', permiso: 'NAVEGACION.ACTIVOS.REGISTRO.ACCEDER', rutas: ['/activos'], requisitos: [['ACTIVOS.ACTIVOS.VER'], ['ACTIVOS.ACTIVOS.CREAR'], ['ACTIVOS.ACTIVOS.VER_AUDITORIA']] },
  { id: 'activos-tipos', area: 'activos', modulo: 'Activos administrativos', nombre: 'Tipos de activo', permiso: 'NAVEGACION.ACTIVOS.TIPOS.ACCEDER', rutas: ['/activos/tipos'], requisitos: [['ACTIVOS.TIPOS.VER'], ['ACTIVOS.TIPOS.CREAR'], ['ACTIVOS.TIPOS.VER_AUDITORIA']] },
  { id: 'activos-asignaciones', area: 'activos', modulo: 'Activos administrativos', nombre: 'Asignaciones', permiso: 'NAVEGACION.ACTIVOS.ASIGNACIONES.ACCEDER', rutas: ['/activos/asignaciones'], requisitos: [['ACTIVOS.ASIGNACIONES.VER'], ['ACTIVOS.ASIGNACIONES.CREAR'], ['ACTIVOS.ASIGNACIONES.VER_AUDITORIA']] },
  { id: 'activos-devoluciones', area: 'activos', modulo: 'Activos administrativos', nombre: 'Devoluciones', permiso: 'NAVEGACION.ACTIVOS.DEVOLUCIONES.ACCEDER', rutas: ['/activos/devoluciones'], requisitos: [['ACTIVOS.ASIGNACIONES.VER_DEVOLUCIONES'], ['ACTIVOS.ASIGNACIONES.VER_AUDITORIA']] },
  { id: 'activos-propios', area: 'activos', modulo: 'Activos administrativos', nombre: 'Custodia propia', permiso: 'NAVEGACION.ACTIVOS.CUSTODIA_PROPIA.ACCEDER', rutas: ['/activos/mis-activos', '/activos/mis-devoluciones'], requisitos: [['ACTIVOS.ASIGNACIONES.VER_PROPIAS']] },
];

export function pantallaPorId(id: string): PantallaNavegacion | undefined {
  return pantallasNavegacion.find(p => p.id === id);
}

/** Consulta/acción es independiente del acceso; los grupos de requisitos son alternativas. */
export function tieneRequisitosPantalla(pantalla: PantallaNavegacion, permisos: readonly string[]): boolean {
  return pantalla.requisitos.some(grupo => grupo.every(codigo => permisos.includes(codigo)));
}

export function puedeAccederPantalla(id: string, permisos: readonly string[]): boolean {
  const pantalla = pantallaPorId(id);
  return !!pantalla && permisos.includes(pantalla.permiso) && tieneRequisitosPantalla(pantalla, permisos);
}

/** Coincidencia por segmentos, con prioridad para la ruta más específica. */
export function pantallaPorRuta(ruta: string): PantallaNavegacion | undefined {
  const camino = ruta.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (camino === '/inventario/movimientos/nuevo') {
    const tipo = new URLSearchParams(ruta.split('?')[1] ?? '').get('tipo');
    if (tipo === 'CARGA_INICIAL') return pantallaPorId('inventario-carga-inicial');
    if (tipo?.startsWith('AJUSTE_')) return pantallaPorId('inventario-ajustes');
    if (tipo === 'CUARENTENA') return pantallaPorId('inventario-cuarentenas');
  }
  return pantallasNavegacion.flatMap(p => p.rutas.map(base => ({ p, base })))
    .filter(({ base }) => camino === base || camino.startsWith(base + '/'))
    .sort((a, b) => b.base.length - a.base.length)[0]?.p;
}

export function puedeAccederRuta(ruta: string, permisos: readonly string[]): boolean {
  const pantalla = pantallaPorRuta(ruta);
  return pantalla ? puedeAccederPantalla(pantalla.id, permisos) : ruta === '/';
}
