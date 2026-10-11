# Ajuste visual de Kardex y Reservas de stock

Esta etapa adapta estos dos recursos al diseño de Empleados. Continúa el ajuste de [Lotes y Existencias por ubicación](inventario-lotes-existencias.md).

## Composición

- Los listados y detalles reutilizan directamente `empleado-gestion.module.css`: títulos con acento cian, acciones, buscador por presentación, filtros, contador, filas, paginación, ficha lateral, navegación y tarjetas numeradas.
- El formulario de reservas reutiliza `empleado-crear-view.module.css`: resumen lateral, navegación numerada, secciones de identificación, presentación y cantidad, vigencia, validación y barra inferior de acciones.
- La preparación por FEFO, la cancelación y el cierre de reservas expiradas conservan los modales compartidos y adoptan los campos del formulario de Empleados.
- Los estados usan las etiquetas y los colores semánticos de Empleados. La barra de reservas distribuye sus seis filtros de estado en otra fila cuando el espacio lo requiere.
- Se conservan la paleta y los componentes compartidos de selección, tabla, paginación, exportación y auditoría.

## Comportamiento

Kardex permite filtrar por presentación, sucursal, ubicación, lote, existencia y fechas de registro. Conserva el acceso desde una existencia con `existenciaId` y muestra entradas, salidas y saldos en unidades base. Su detalle conserva secuencia, fecha del movimiento y referencias de trazabilidad. Las fechas del filtro corresponden a `creadoEn`, según el contrato actual del backend.

Reservas permite filtrar por presentación, sucursal, estado registrado y fechas de registro. El filtro de estado se sincroniza entre la barra y la columna de la tabla. El detalle muestra también el estado efectivo, aptitud de la preparación, incidencias, cantidades y posiciones asignadas. Las acciones respetan los permisos y el estado efectivo recibido del servidor.

El formulario conserva los contratos, cantidades decimales, conversión a unidades base en el servidor, hora de Guatemala, validaciones, idempotencia, prevención de envíos duplicados y protección de cambios pendientes. La preparación y cancelación conservan el control de versión y la recuperación ante conflictos. El cierre de reservas expiradas permite elegir sucursal y comunica el límite de 200 por operación, sin cambiar los filtros del listado.

Los filtros, la paginación y la exportación continúan usando el servidor. La siguiente etapa se documenta en [Movimientos y Bloqueos](inventario-movimientos-bloqueos.md); los demás recursos quedan pendientes de la indicación del usuario.

## Verificación

- `npm run build`: correcto; conserva la advertencia existente por el tamaño del bundle.
- `npm run lint`: correcto.
- `npm run test:inventario`: 15 pruebas correctas.
- `npm run test:catalogos-farmacia`: 30 pruebas correctas.
- Revisión de la aplicación real con HTTP simulado en memoria: listados, detalles y formulario en escritorio y móvil; filtros por existencia y estado, limpieza, tamaños de página, recuperación de error de consulta y estados sin registros.
- Reserva de prueba: campos obligatorios, cambios pendientes, creación con cantidad decimal, acceso al detalle, preparación FEFO, posiciones asignadas, cancelación con motivo y cierre por sucursal.
- Enlace desde Existencias al Kardex verificado con su filtro inicial.
- Sin desbordamiento horizontal de página en móvil. Las tablas mantienen el desplazamiento interno de Empleados.
- Sin errores de consola en la revisión final. La revisión no utiliza Oracle ni ejecuta migraciones o seeds.

## Capturas con datos simulados

- [Kardex: listado](capturas/inventario-kardex-corregido.png) · [Móvil](capturas/inventario-kardex-corregido-movil.png)
- [Kardex: detalle](capturas/inventario-kardex-detalle-corregido.png) · [Móvil](capturas/inventario-kardex-detalle-corregido-movil.png)
- [Reservas: listado](capturas/inventario-reservas-corregido.png) · [Móvil](capturas/inventario-reservas-corregido-movil.png)
- [Reservas: formulario](capturas/inventario-reserva-formulario-corregido.png) · [Móvil](capturas/inventario-reserva-formulario-corregido-movil.png)
- [Reservas: detalle](capturas/inventario-reserva-detalle-corregido.png) · [Móvil](capturas/inventario-reserva-detalle-corregido-movil.png)
