# Ajuste visual de Cuarentena, Conteos físicos y Disponibilidad

Esta etapa continúa [Movimientos y Bloqueos](inventario-movimientos-bloqueos.md) y adapta únicamente las tres vistas autorizadas al diseño de Empleados.

## Composición y alcance

Los listados, las fichas y el resultado de disponibilidad reutilizan directamente `empleado-gestion.module.css`. Se mantienen el título con acento cian, acciones de cabecera, consulta, filtros, filas, paginación, resumen lateral, navegación y tarjetas numeradas. Los formularios y la captura de conteos reutilizan `empleado-crear-view.module.css`, con panel de resumen, campos agrupados, navegación numerada y barra inferior de acciones. Las tablas, selectores, exportación, auditoría y modales siguen siendo los componentes compartidos.

Los ajustes locales permiten desplazamiento interno en tablas anchas y muestran los campos de captura a todo el ancho en móvil. Se conservan los tokens efectivos y los estilos originales de Empleados.

- **Cuarentena:** listado, filtros por presentación, ubicación, lote, sucursal, estado y fechas de registro; ficha de cantidades segregadas y resueltas, referencias, justificantes y auditoría. «Segregar stock» abre el formulario existente de movimientos con tipo `CUARENTENA`, según el permiso `INVENTARIO.CUARENTENA.CREAR`. Los casos se generan al confirmar esos movimientos. La liberación, bajas y destrucción conservan el aviso de desarrollo por etapa.
- **Conteos físicos:** listado por ubicación, sucursal, estado y fechas; creación con sucursal, bodega, ubicación, referencia y justificantes; ficha con resultados, ajustes de conciliación y auditoría. Las acciones de captura, cierre, conciliación y cancelación dependen del estado y los permisos. La conciliación requiere también `INVENTARIO.AJUSTES.CONFIRMAR`.
- **Captura:** cantidades esperadas y contadas, evidencia, posiciones encontradas, validación de cero y límite de 200 posiciones por guardado. Se conserva la protección de cambios pendientes y la versión del registro. Un error de carga oculta el editor; un conflicto HTTP 409 conserva la captura y bloquea nuevos envíos hasta descartar y recargar el registro. La paginación de esta pantalla divide las líneas del detalle completo obtenido del servidor.
- **Disponibilidad:** consulta por sucursal y presentación, con validación y reintento; tarjetas de existencia física, apta, reservas, reserva sobre stock apto, disponible, cuarentena, restricciones y vencimientos; unidad base, fecha de consulta y tabla de posiciones. Las cantidades proceden del servidor, sin sumas de categorías que pueden coincidir. Cambiar la selección retira el resultado anterior hasta consultar otra vez.

Guardar resultados de un conteo no modifica existencias. Cerrar impide editar y mantiene la congelación; conciliar genera los ajustes y retira la congelación; cancelar retira la congelación sin ajustar stock. Estas reglas y los contratos del backend se conservan.

La presentación de Selección FEFO y las siguientes vistas pendientes quedan para una nueva indicación. No se modificó el backend ni se ejecutaron migraciones o seeds.

La siguiente etapa se documenta en [Selección FEFO, Vencimientos, Alertas de vencimiento y Ajustes](inventario-fefo-vencimientos-alertas-ajustes.md).

## Verificación

- `npm run build` y `npm run lint`: correctos. Continúa la advertencia existente por tamaño del bundle.
- `npm run test:inventario`: 15 pruebas correctas; `npm run test:catalogos-farmacia`: 30 pruebas correctas.
- Aplicación real en navegador con HTTP simulado en memoria, aislado de Oracle, en escritorio y móvil de 390 × 844.
- Cuarentena: filtro de estado sin coincidencias, limpieza, diálogo de filtros y entrada a movimiento con tipo preseleccionado.
- Conteos: validaciones de creación, selección dependiente de bodega y ubicación, creación, captura de cero, posición encontrada, cierre, conciliación y cancelación con motivo.
- Captura: error de carga con reintento y conflicto de versión; guardado deshabilitado durante el conflicto y recuperación con la versión recargada.
- Disponibilidad: campos obligatorios, cantidades del servidor, error HTTP con reintento y resultado sin posiciones ni stock.
- Listados, fichas, formulario y captura revisados en móvil; tablas con desplazamiento interno y sin desbordamiento horizontal de página. Selección FEFO conserva su presentación anterior.

Las pruebas de interfaz verifican contratos, estados y presentación con datos simulados; no constituyen una nueva ejecución de los movimientos contra Oracle.

## Capturas con datos simulados

- [Cuarentena: listado](capturas/inventario-cuarentena-corregido.png) · [Móvil](capturas/inventario-cuarentena-corregido-movil.png)
- [Cuarentena: detalle](capturas/inventario-cuarentena-detalle-corregido.png) · [Móvil](capturas/inventario-cuarentena-detalle-corregido-movil.png)
- [Conteos: listado](capturas/inventario-conteos-corregido.png) · [Móvil](capturas/inventario-conteos-corregido-movil.png)
- [Conteos: formulario](capturas/inventario-conteo-formulario-corregido.png) · [Móvil](capturas/inventario-conteo-formulario-corregido-movil.png)
- [Conteos: detalle](capturas/inventario-conteo-detalle-corregido.png) · [Móvil](capturas/inventario-conteo-detalle-corregido-movil.png)
- [Conteos: captura](capturas/inventario-conteo-resultados-corregido.png) · [Móvil](capturas/inventario-conteo-resultados-corregido-movil.png)
- [Disponibilidad: resultado](capturas/inventario-disponibilidad-corregido.png) · [Móvil](capturas/inventario-disponibilidad-corregido-movil.png)

## Reorganización de Disponibilidad — 7 de octubre de 2026

El resultado se presenta ahora en una tarjeta numerada con la presentación, sucursal y fecha de consulta. El stock disponible y la unidad base quedan destacados junto a esos datos. Debajo aparecen las tarjetas de existencias y reservas y de restricciones, con cantidades más legibles, seguidas de las posiciones. Se retiró la barra de enlaces intermedia y la explicación sobre categorías coincidentes se integró en la tarjeta de restricciones.

La composición conserva las tarjetas y la paleta de Empleados y se apila en pantallas estrechas. Las cantidades, consultas y reglas de disponibilidad permanecen iguales.

Verificación de esta actualización: compilación y lint correctos; 20 pruebas de inventario correctas. Continúa la advertencia existente de tamaño del bundle. La revisión visual automática de esta actualización está pendiente por falta de acceso aprobado a Chrome; las capturas anteriores corresponden al diseño previo.
