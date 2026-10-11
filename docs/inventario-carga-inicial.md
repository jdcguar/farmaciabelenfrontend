# Integración de Carga inicial en Inventario

El menú **Inventario → Carga inicial** abre primero el listado de cargas. Desde allí, **Registrar carga inicial** abre explícitamente el formulario. El acceso duplicado desde Movimientos se retiró por indicación posterior, junto con la incorporación del [listado de Ajustes](inventario-ajustes-listado.md).

## Flujo y diseño

- Listado de referencia, fecha de corte, estado, fecha de registro y sucursal para usuarios corporativos. Reutiliza el listado y los estilos de Empleados, sus filtros, paginación, exportación y estados de carga, error y ausencia de registros.
- El filtro fijo `CARGA_INICIAL` se aplica al servidor incluso al limpiar filtros, cambiar de página y exportar. El total y las páginas corresponden a las cargas iniciales, sin filtrar únicamente los movimientos de una página.
- El formulario reutiliza la composición de Empleados y permite solo carga inicial: sucursal, referencia, fecha de corte, motivo, evidencia y líneas de ingreso. Conserva la validación de fechas, cantidades decimales, costes, trazabilidad, idempotencia y cambios pendientes.
- Cancelar o cerrar el mensaje de creación vuelve al listado de cargas. «Ver detalle» abre el movimiento registrado; desde su ficha se puede confirmar o anular según los permisos existentes y volver a las cargas iniciales.
- Guardar crea una carga pendiente. Las existencias se incorporan al confirmarla.

## Contratos y permisos

Se amplían los filtros opcionales de `GET /api/inventario/movimientos` y `POST /api/inventario/movimientos/exportaciones` con `tipo`, validado contra los seis tipos existentes y enlazado como parámetro SQL. Los recursos ajenos a Movimientos rechazan ese filtro. Las consultas sin `tipo` conservan su comportamiento.

Consultar listado, detalle y exportación exige `INVENTARIO.MOVIMIENTOS.VER`. Crear exige `INVENTARIO.CARGA_INICIAL.CREAR`; confirmar y anular conservan sus permisos propios. El menú de carga inicial solo aparece con permiso de consulta, de modo que el clic no abre automáticamente el formulario para usuarios con permiso exclusivo de creación. Estos últimos conservan el acceso autorizado a la ruta explícita `/inventario/carga-inicial/nuevo`.

La exportación filtrada identifica las cargas iniciales e incluye su fecha de corte. Se mantienen el alcance por sucursal, el máximo de exportación y la auditoría existentes.

## Archivos principales

- Frontend: `src/modules/inventario/inventario.config.ts`, `inventario.types.ts`, `components/inventario-view.tsx`, `inventario-posiciones-listado-view.tsx`, `inventario-formulario-view.tsx`, `inventario-operacion-formulario.tsx`, `inventario-operacion-detalle.tsx`, `inventario-listado-view.tsx` y `src/modules/dashboard/components/dashboard-view.tsx`.
- Backend: `src/modules/inventario/shared/inventario.validator.ts`, `inventario.repository.ts` e `inventario.service.ts`.
- Pruebas: `tests/inventario.test.cjs` del frontend y `tests/inventario/contratos.test.ts` del backend. La vista previa HTTP en memoria también contempla el filtro por tipo.

## Verificación y puesta en uso

- Frontend: compilación y lint correctos; 19 pruebas de Inventario correctas.
- Backend: typecheck y compilación correctos; 34 pruebas de Inventario correctas. La prueba HTTP requirió ejecución fuera del sandbox para aceptar conexiones locales.
- Las comprobaciones verifican navegación, permisos separados, contratos, filtro fijo y SQL preparado con tipo, estado y sucursal, sin conexión a Oracle. La exportación utiliza la misma consulta del repositorio.
- La revisión visual automática en Chrome sigue pendiente por falta de autorización de Computer Use; no se generaron nuevas capturas.

No se necesitan migraciones ni seeds: el tipo de movimiento y las columnas ya existen. Reiniciar el backend con la compilación actual y recargar el frontend para disponer del filtro nuevo.
