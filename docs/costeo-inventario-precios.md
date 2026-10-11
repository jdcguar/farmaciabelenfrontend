# Inventario valorado, reposición, precios sugeridos y costo de ventas

Las nuevas vistas se incorporan a la navegación existente. No se añade un módulo principal.

| Módulo | Vista |
| --- | --- |
| Inventario | Inventario valorado y Kardex monetario |
| Compras y recepción | Costos de reposición |
| Catálogos → Precios vigentes | Precios sugeridos; botón Revisar sugerencias desde el listado de precios |
| Ventas y dispensación | Costo de ventas; botón Costo histórico desde una venta |

1. Revisar Inventario valorado. Para stock pendiente, **Valorar** solicita costo por unidad base, motivo y evidencia. Confirma cantidad y versión actuales; no modifica cantidades físicas ni reconstruye ventas anteriores.
2. En Compras registrar el costo neto de reposición de una **presentación completa**, proveedor aprobado, vigencia y documento. Es una cotización documentada y debe ser comparable con el costo de adquisición registrado.
3. En Precios sugeridos elegir presentación, reposición vigente, margen objetivo, tasa de impuesto y vigencia del nuevo precio. El servidor calcula el máximo entre promedio y reposición, dividido entre `1 - margen/100`.
4. Revisar el detalle: costos, base, margen, precio neto, impuestos, precio anterior y vigencia. **Aplicar precio** solicita motivo y evidencia de aprobación. Generar una sugerencia no cambia el catálogo. La venta usa el importe publicado desde su vigencia.
5. Consultar Costo de ventas por período, presentación o sucursal. Las anulaciones se muestran como reversiones y se descuentan del total del filtro. El costo histórico no se recalcula con compras posteriores.

`Pendiente` significa que falta costo documentado. No equivale a cero. Los totales no completan cifras con ceros cuando faltan valores. El resumen corresponde a todos los registros del filtro, no solo a la página visible. Inventario físico y tránsito se muestran por separado.

Listados usan tablas, selectores remotos, ModalEstado y paginación compartidos de 50/100/150/200. Exportación PDF/XLSX del filtro completo con límites del backend. Formularios preservan borradores, asocian errores y foco, bloquean envíos simultáneos y reutilizan claves por contenido. Un conflicto exige actualizar antes de reenviar. Acciones y navegación respetan permisos de consulta, aprobación y alcance del backend.

La migración y el seed de permisos del backend están preparados **sin ejecutar**. Antes de usarse con datos reales se requiere su instalación, permisos y valoración documental del stock pendiente. Ver la guía del backend `Backend/FarmaciaBelenBackend/docs/costeo-inventario-precios.md` para reglas, API y límites.

Verificación: build/lint, `npm run test:costeo` (7 contratos), regresiones de los módulos afectados y prueba en navegador del frontend real contra `tests/costeo-preview.cjs`. El simulador usa exclusivamente memoria y documentos ficticios, en `3106`; Vite debe usar `VITE_API_URL=http://127.0.0.1:3106/api`, puerto `5186`. La generación simulada valida los cuerpos con Zod del backend; los resultados comerciales son fixtures y la lógica económica real se prueba en backend.

Evidencia visual de una aprobación ficticia: `tests/evidencia-costeo/precio-aprobado-demo.png`. No se aprobó un precio ni se ejecutó una venta en Oracle.

## Diseño de Inventario valorado y Kardex monetario (2026-10-09)

Las rutas `/inventario/valoracion` y `/inventario/kardex-monetario` utilizan ahora la composición de los listados de Inventario y los estilos de Empleados: título con acento cian, exportación en cabecera, selector remoto de presentación con búsqueda, filtros y contador, panel de resultados con limpieza y actualización, tabla de filas con identidad, estados legibles y acciones mediante iconos, y paginación compartida. La selección de presentación consulta el servidor y reinicia la página; filtros y exportación conservan su alcance.

Inventario valorado muestra tarjetas para inventario físico, tránsito y registros con costos pendientes. Los totales siguen procediendo del servidor y corresponden al filtro completo; durante carga o error se ocultan cifras anteriores. Se conservan los decimales originales, la moneda GTQ y la distinción entre cero y costo pendiente. El detalle y la captura de valoración agrupan los datos con etiquetas visibles y mantienen permisos, evidencia, control de versión y protección de cambios pendientes.

La composición se adapta a pantallas estrechas y las tablas anchas tienen desplazamiento interno. No se modificaron API, cálculos, migraciones ni seeds. Compilación, lint y las 27 pruebas de Costeo e Inventario correctas; la compilación informa advertencias de tamaño de bundle y de PostCSS. La revisión visual automática de esta actualización quedó pendiente: Computer Use se detuvo al no poder determinar con suficiente certeza la URL de Chrome. No se iniciaron simuladores ni se realizaron operaciones contra Oracle para esta revisión.

## Diseño del listado de sugerencias (2026-10-09)

Precios sugeridos sigue el patrón de los catálogos: cabecera con acento cian y acciones agrupadas, `HerramientasListado` con selector remoto de presentación y contador, filtros de fechas, panel con resumen/actualización/limpieza, `TablaDatos` y paginación compartidas. Las filas muestran presentación, tratamiento de impuestos, base comercial con su precisión original, margen con porcentaje, precio destacado, vigencia en día/mes/año y estado Pendiente/Aprobada. Los iconos de detalle y aplicación conservan títulos accesibles y los permisos existentes.

La búsqueda por presentación utiliza el filtro del servidor; no filtra solo la página visible. Carga/error no muestran el total de una consulta anterior. El vacío ofrece generación cuando hay permiso o limpieza si existen filtros. Se conserva el flujo de generación, revisión, aprobación y exportación; sin cambios de backend ni reglas económicas.

Verificación: build, lint y pruebas existentes de Costeo, Catálogos y Ventas. Revisión visual con API exclusivamente en memoria en escritorio 1440, tableta 768 y móvil 390; sin desbordamiento de página. Comprobados selección de presentación, ausencia de coincidencias, limpieza, entrada de fecha con teclado y apertura de detalle/aprobación, sin publicar precios. Capturas: `docs/precios-sugeridos-listado.png` y `docs/precios-sugeridos-movil.png`. La revisión utilizó puertos 3106/5187 y no conectó a Oracle.
