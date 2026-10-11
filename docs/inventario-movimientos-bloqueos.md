# Ajuste visual de Movimientos y Bloqueos

Esta etapa continúa el ajuste de [Kardex y Reservas](inventario-kardex-reservas.md) y adapta Movimientos y Bloqueos al diseño de Empleados.

La siguiente etapa está documentada en [Cuarentena, Conteos físicos y Disponibilidad](inventario-cuarentena-conteos-disponibilidad.md).

## Composición

Los listados y fichas reutilizan directamente `empleado-gestion.module.css`: cabecera con acento cian, acciones, consulta, filtros rápidos y por columna, contador, filas, paginación, resumen lateral, navegación y tarjetas numeradas. Los formularios reutilizan `empleado-crear-view.module.css`, con resumen lateral, campos y justificantes agrupados, navegación numerada y barra inferior de acciones.

El formulario de movimientos conserva el editor de líneas existente y adapta su presentación. El detalle reutiliza las columnas de cantidades, referencias, costes y condición; la tabla permite desplazamiento interno en escritorio para mantener legibles las referencias. Los modales de confirmación, anulación y levantamiento usan los campos de Empleados y los componentes compartidos.

La paleta y los tokens existentes se mantienen. Los otros recursos pendientes conservan su diseño y esperan la siguiente indicación del usuario. Los accesos independientes a Ajustes y Carga inicial conservan sus formularios actuales.

## Comportamiento

- Movimientos: consulta por presentación, sucursal, estado y fechas de registro; tipos permitidos según los permisos del usuario; editor de líneas, cantidades decimales, unidad, origen, destino, lote, condición y costes. Los movimientos se guardan pendientes y actualizan existencias al confirmarse. La anulación exige motivo y se permite para pendientes. Se conserva el tratamiento de movimientos asociados a conteos.
- Bloqueos: consulta por sucursal, estado y fechas de registro, incluyendo los bloqueos corporativos aplicables. Creación por producto, lote o ubicación, de clase operativa o sanitaria, con motivo y evidencia. El cambio de alcance reinicia el objetivo seleccionado. Las ubicaciones requieren sucursal; la opción corporativa se conserva para productos y lotes.
- El levantamiento operativo exige motivo, evidencia y versión. Los bloqueos sanitarios conservan su aviso y no presentan esta acción.
- Se mantienen validación, permisos, idempotencia de movimientos, protección de cambios pendientes, prevención de envíos duplicados, recarga ante conflicto de versión, referencias y auditoría.
- Los filtros, exportaciones y paginación continúan usando el servidor. Los accesos a carga inicial, ajustes y bloqueo parcial están disponibles también en los listados vacíos.

## Verificación

- Compilación y lint correctos. El build conserva la advertencia existente por el tamaño del bundle.
- Las 15 pruebas de Inventario y 30 de Catálogos pasaron.
- Aplicación real con HTTP simulado en memoria: listados, fichas y formularios revisados en escritorio y móvil, sin desbordamiento horizontal de página.
- Filtro de estado, ausencia de coincidencias, listado vacío y recuperación de error de consulta comprobados.
- Movimiento: validaciones, agregar y quitar líneas, cambios pendientes, cambio de tipo, creación de bloqueo parcial con cantidad decimal y acceso al detalle; confirmación y anulación con motivo comprobadas.
- Bloqueo: validaciones, cambio de alcance entre lote y ubicación, creación por ubicación, levantamiento con justificantes, restricción sanitaria y recuperación ante conflicto de versión comprobados.
- Acceso a bloqueo parcial desde un listado vacío y accesos complementarios verificados. Sin errores de consola en la comprobación final.
- Esta revisión usa datos de prueba aislados; no utiliza Oracle ni ejecuta migraciones o seeds.

## Capturas con datos simulados

- [Movimientos: listado](capturas/inventario-movimientos-corregido.png) · [Móvil](capturas/inventario-movimientos-corregido-movil.png)
- [Movimientos: formulario](capturas/inventario-movimiento-formulario-corregido.png) · [Móvil](capturas/inventario-movimiento-formulario-corregido-movil.png)
- [Movimientos: detalle](capturas/inventario-movimiento-detalle-corregido.png) · [Móvil](capturas/inventario-movimiento-detalle-corregido-movil.png)
- [Bloqueos: listado](capturas/inventario-bloqueos-corregido.png) · [Móvil](capturas/inventario-bloqueos-corregido-movil.png)
- [Bloqueos: formulario](capturas/inventario-bloqueo-formulario-corregido.png) · [Móvil](capturas/inventario-bloqueo-formulario-corregido-movil.png)
- [Bloqueos: detalle](capturas/inventario-bloqueo-detalle-corregido.png) · [Móvil](capturas/inventario-bloqueo-detalle-corregido-movil.png)
