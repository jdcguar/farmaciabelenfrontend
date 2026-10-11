# Ajuste visual de Lotes y Existencias por ubicación

Esta etapa adapta únicamente estos dos recursos al diseño de Empleados.

## Composición

- Los listados reutilizan directamente `empleado-gestion.module.css`: título con acento cian, acciones de cabecera, barra de consulta, filtros rápidos, contador, resumen, filas y acciones circulares.
- El formulario de Lotes reutiliza `empleado-crear-view.module.css`: resumen lateral, navegación numerada, secciones de identificación, fechas y origen, campos y barra inferior de acciones.
- Los detalles reutilizan la ficha lateral, la navegación, la grilla y las tarjetas numeradas de Empleados. La auditoría conserva su consulta y componentes existentes, con la cabecera adaptada a este diseño.
- Se conservan los tokens de la paleta y los componentes compartidos de tabla, paginación, selección, exportación y mensajes.

## Comportamiento

La consulta principal permite buscar y seleccionar una presentación mediante el catálogo remoto. El botón Filtros reúne sucursal, presentación, lote, fechas de registro y, en Existencias, ubicación. La condición se sincroniza entre los filtros rápidos y la columna de la tabla. Los filtros se aplican en el servidor y reinician la página; la exportación conserva esos criterios.

El formulario mantiene el contrato, las validaciones, los permisos, la protección de cambios pendientes y la prevención de envíos duplicados. Las existencias se consultan y su detalle permite abrir el kardex cuando el usuario tiene permiso.

## Verificación

Compilación, lint y las 45 pruebas existentes de Inventario y Catálogos. Revisión visual con la aplicación real y HTTP simulado en memoria, comparando con Empleados. Listados, formulario y detalles revisados en escritorio y móvil; selección por presentación, aplicación y limpieza de filtros, estados sin coincidencias, tamaños de página, validación y registro de lote comprobados. La revisión no utiliza Oracle ni ejecuta migraciones o seeds.

El build conserva la advertencia existente sobre el tamaño del bundle de JavaScript.

## Capturas con datos simulados

- [Referencia: Empleados](capturas/inventario-referencia-empleados.png)
- [Lotes: listado](capturas/inventario-lotes-corregido.png) · [Móvil](capturas/inventario-lotes-corregido-movil.png)
- [Lotes: formulario](capturas/inventario-lote-formulario-corregido.png) · [Móvil](capturas/inventario-lote-formulario-corregido-movil.png)
- [Lotes: detalle](capturas/inventario-lote-detalle-corregido.png) · [Móvil](capturas/inventario-lote-detalle-corregido-movil.png)
- [Existencias: listado](capturas/inventario-existencias-corregido.png) · [Móvil](capturas/inventario-existencias-corregido-movil.png)
- [Existencias: detalle](capturas/inventario-existencia-detalle-corregido.png) · [Móvil](capturas/inventario-existencia-detalle-movil.png)

Este documento corresponde a la primera etapa. El siguiente par se documenta en [Kardex y Reservas de stock](inventario-kardex-reservas.md); los demás recursos quedan pendientes de la indicación del usuario.
