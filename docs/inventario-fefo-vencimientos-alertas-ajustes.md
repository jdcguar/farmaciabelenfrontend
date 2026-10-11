# Ajuste visual de Selección FEFO, Vencimientos, Alertas de vencimiento y Ajustes

Esta etapa continúa [Cuarentena, Conteos físicos y Disponibilidad](inventario-cuarentena-conteos-disponibilidad.md) y adapta las cuatro vistas autorizadas al diseño de Empleados.

## Composición

Se reutilizan directamente `empleado-gestion.module.css` y `empleado-crear-view.module.css`: cabeceras con acento cian, tarjetas y secciones numeradas, campos de dos columnas, resumen lateral, navegación de secciones, estados escritos y acciones azules. Los selectores, tablas, paginación y modales siguen siendo los componentes compartidos. Se conservan los estilos adaptables de Empleados y el desplazamiento interno de tablas anchas.

- **Selección FEFO:** formulario de sucursal, presentación, unidad, cantidad y vida útil mínima; resumen de la consulta y tabla de posiciones en el orden devuelto por el servidor. Las cantidades se mantienen como cadenas decimales. Consultar no reserva ni descuenta existencias. Incluye validación, carga, error con reintento y mensajes sin resultados. Cambiar los campos retira el resultado anterior.
- **Vencimientos:** listado por presentación con filtros rápidos y por columna para sus seis estados, filtros adicionales de sucursal, ubicación, lote y fechas de registro, resumen y paginación del servidor. Las fechas de registro filtran la creación de la existencia; no son fechas de vencimiento. Los estados y las fechas de vencimiento se presentan con el patrón de Empleados. El detalle de existencia requiere `INVENTARIO.EXISTENCIAS.VER`. La cabecera permite abrir la configuración de alertas. No se ofrece exportación porque el backend no tiene un endpoint de exportación de vencimientos.
- **Alertas de vencimiento:** resumen corporativo, navegación lateral, umbrales y motivo del cambio, versión y fecha de actualización, acciones inferiores y confirmación de éxito. La edición exige configuración de vencimientos y acceso corporativo; los demás usuarios autorizados consultan campos deshabilitados. Se valida alerta ≥ preventivo ≥ crítico, con valores de 0 a 36500, y motivo de 5 a 250 caracteres. Un error de carga oculta el editor; un conflicto de versión conserva el borrador y exige recargar antes de guardar.
- **Ajustes:** formulario de identificación, motivo y evidencia, y líneas con el diseño de los movimientos ya corregidos. Solo permite ajuste positivo o negativo. Guardar lo deja pendiente; la confirmación existente actualiza stock. Se conservan precisión decimal, selección dependiente de origen/destino, idempotencia, permisos y protección de cambios pendientes. Su ruta sigue abriendo el formulario actual.

No se modificó el backend ni se ejecutaron migraciones o seeds.

## Verificación

- `npm run build`: correcto, con la advertencia existente de tamaño de bundle.
- `npm run lint`: correcto.
- `npm run test:inventario`: 18 pruebas correctas.
- `npm run test:catalogos-farmacia`: 30 pruebas correctas.
- Las nuevas pruebas comparan FEFO y umbrales con los validadores reales del backend, verificando precisión, límites, cero e igualdad de umbrales, orden y motivo; además verifican los contratos de ambos ajustes y la navegación conservada de carga inicial.
- `node --check tests/visual-inventario/preview.mjs`: correcto. El entorno de vista previa en memoria incluye FEFO, filtros de vencimientos, guardado de parámetros, conflicto de versión y modo de consulta, sin ejecutar operaciones en Oracle.

La inspección automática de escritorio y móvil no se completó: Computer Use no recibió autorización para acceder a Google Chrome. No se generaron capturas ni se declara una revisión visual realizada. La estructura, los estilos, el tipado y los contratos se comprobaron en código; queda la revisión de las pantallas en el navegador del usuario.

## Carga inicial: propuesta, sin implementación

Puede integrarse dentro de Movimientos con una vista filtrada de cargas iniciales. El acceso mostraría primero el listado, con referencia, sucursal, fecha de corte, estado y detalle; un botón «Registrar carga inicial» abriría el formulario. También podría tener una entrada propia en el menú que muestre ese listado. En ambos casos se reutilizaría el tipo `CARGA_INICIAL` del backend y sus permisos, sin duplicar operaciones.

La navegación y los accesos actuales de carga inicial permanecen sin cambios, conforme a la petición de responder únicamente la pregunta.

La integración autorizada posteriormente se documenta en [Carga inicial en Inventario](inventario-carga-inicial.md).

## Acceso a alertas desde Vencimientos

Por indicación posterior, Alertas de vencimiento deja de aparecer como opción independiente en el menú de Inventario y como tarjeta del inicio. Su acceso queda en Vencimientos mediante el botón «Configurar alertas de vencimiento», que abre la configuración existente. La pantalla usa el mismo título para describir la modificación de umbrales corporativos. Mientras se consulta o modifica esa configuración, Vencimientos permanece marcado como opción activa del menú. Se conservan rutas, permisos y comportamiento de guardado.

## Acceso a ajustes desde Movimientos

Ajustes deja de aparecer como opción independiente en el menú de Inventario y como tarjeta del inicio. El botón existente «Registrar ajuste» en Movimientos abre su formulario según el permiso `INVENTARIO.AJUSTES.CREAR`. Mientras se registra un ajuste, Movimientos permanece marcado como opción activa del menú. Las rutas, los tipos positivo y negativo, y las reglas de guardado y confirmación permanecen vigentes.

Una indicación posterior reemplaza ese acceso por el [listado de Ajustes en el menú](inventario-ajustes-listado.md), con «Registrar ajuste» en la cabecera, y retira los accesos duplicados de Movimientos.
