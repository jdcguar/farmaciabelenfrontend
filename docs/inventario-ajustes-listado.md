# Listado de Ajustes y accesos desde el menú

**Inventario → Ajustes** abre el listado de ajustes positivos y negativos. El botón **Registrar ajuste**, situado en la cabecera, abre el formulario existente. **Inventario → Carga inicial** conserva su listado. Los botones Cargas iniciales y Registrar ajuste se retiraron de Movimientos, incluyendo su estado vacío.

## Listado y navegación

Se reutiliza el diseño de Empleados: cabecera, acciones, búsqueda por presentación, filtros de estado, resumen, tabla y paginación. El listado muestra referencia, tipo de ajuste, estado, fecha de registro y sucursal para el acceso corporativo. Los filtros adicionales permiten escoger tipo positivo o negativo, sucursal, presentación y fechas de registro. Carga, error con reintento, ausencia de ajustes y ausencia de coincidencias conservan mensajes propios.

Cancelar el formulario o cerrar el mensaje de creación vuelve al listado de Ajustes. «Ver detalle» abre el movimiento registrado. Su ficha permite confirmar o anular según el estado y los permisos existentes, y volver a Ajustes. Registrar deja la operación pendiente; confirmar modifica stock.

## Consulta del servidor y permisos

Se añade el filtro opcional `grupoMovimiento=AJUSTES` a la consulta y exportación de Movimientos. El repositorio reúne `AJUSTE_POSITIVO` y `AJUSTE_NEGATIVO` mediante parámetros SQL enlazados. El filtro se conserva al limpiar, cambiar de página y exportar; puede combinarse con `tipo` para consultar uno de los dos. Los recursos ajenos a Movimientos rechazan el grupo. La consulta sin grupo y el filtro existente de Carga inicial conservan su comportamiento.

Consultar listado, detalle y exportación requiere `INVENTARIO.MOVIMIENTOS.VER`; registrar requiere `INVENTARIO.AJUSTES.CREAR`. Se mantienen permisos de confirmación y anulación y alcance por sucursal. El menú abre siempre el listado para usuarios autorizados a consultar. El permiso exclusivo de creación sigue permitiendo la ruta explícita `/inventario/ajustes/nuevo`, sin abrir el formulario mediante el menú.

## Archivos y comprobaciones

- Frontend: configuración y tipos de inventario, `inventario-view.tsx`, `inventario-posiciones-listado-view.tsx`, `inventario-listado-view.tsx`, `inventario-formulario-view.tsx`, `inventario-operacion-detalle.tsx` y `dashboard-view.tsx`.
- Backend: `inventario.validator.ts`, `inventario.repository.ts` e `inventario.service.ts`.
- Pruebas: `tests/inventario.test.cjs`, `tests/inventario/contratos.test.ts` y soporte del grupo en la vista previa HTTP en memoria.
- Frontend: lint y compilación correctos; 20 pruebas de Inventario correctas. Continúa la advertencia existente de tamaño del bundle.
- Backend: typecheck y compilación correctos; 34 pruebas de Inventario correctas. Se comprueban SQL preparado con ambos tipos, alcance por sucursal y estado, combinación con tipo individual y coherencia con exportación, sin ejecutar SQL en Oracle.
- La revisión visual automática en Chrome sigue pendiente por falta de autorización de Computer Use; no se generaron nuevas capturas.

No requiere migraciones ni seeds. Reiniciar el backend y recargar el frontend para usar el nuevo filtro y la navegación actual.
