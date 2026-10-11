# Traslados: vistas operativas y gestión de incidencias

Implementadas las siete vistas de solicitud, despacho y recepción, registro/resolución de incidencias, justificación de faltantes, retorno y complementario, y los listados independientes de Despachos y Recepciones. Las catorce rutas conservan el diseño y la paleta de Productos.

| Ruta | Vista | Permiso |
| --- | --- | --- |
| `/traslados` | Listado | `TRASLADOS.OPERACIONES.VER` |
| `/traslados/despachos` | Listado de despachos | VER |
| `/traslados/recepciones` | Listado de recepciones | VER |
| `/traslados/nuevo` | Nueva solicitud | `TRASLADOS.OPERACIONES.CREAR` |
| `/traslados/{uuid}` | Detalle | `TRASLADOS.OPERACIONES.VER` |
| `/traslados/{uuid}/preparar` | Preparación de despacho | VER + PREPARAR |
| `/traslados/despachos/{uuid}` | Detalle del despacho | VER |
| `/traslados/despachos/{uuid}/recepciones/nueva` | Registrar recepción | VER + RECIBIR |
| `/traslados/recepciones/{uuid}` | Detalle de recepción | VER |
| `/traslados/{uuid}/incidencias/nueva` | Registrar incidencia | VER + INCIDENCIAS |
| `/traslados/{uuid}/incidencias/{incidenciaUuid}/resolver` | Resolver incidencia | VER + RESOLVER_INCIDENCIA |
| `/traslados/{uuid}/incidencias/{incidenciaUuid}/justificar` | Justificar faltante | VER + RESOLVER_INCIDENCIA + CORPORATIVO |
| `/traslados/{uuid}/retorno` | Solicitar retorno | VER + CREAR |
| `/traslados/{uuid}/complementario` | Nuevo traslado complementario | VER + CREAR |

Los permisos operativos abreviados pertenecen a `TRASLADOS.OPERACIONES`; CORPORATIVO es `TRASLADOS.ACCESO.CORPORATIVO`. El menú lateral y los accesos del dashboard respetan VER/CREAR. Desde el detalle del traslado se accede a preparación y a cada despacho; desde el despacho se accede al registro y detalle de sus recepciones. Las acciones verifican permiso, sucursal responsable y estado. El alcance corporativo no sustituye el permiso de la acción. No se necesitan dependencias nuevas ni cambios de configuración de la API.

## Comportamiento

### Comprobantes individuales en PDF (2026-10-10)

Cada fila de los listados Traslados, Despachos y Recepciones ofrece **Generar comprobante** junto a **Ver detalle**, con el icono PDF existente, estado de carga y bloqueo de clics duplicados. Si la descarga falla, se muestra el error junto al botón y permite reintentar. También aparece junto a los accesos de las listas de despachos dentro del traslado y de recepciones dentro del despacho.

- Traslado: solicitud, unidades originales, conversión, seguimiento en base por producto, decisiones, despachos e incidencias.
- Despacho: productos y lotes asignados, vencimiento, saldo recibido/justificado/pendiente, transporte, coste GTQ, evidencia e historial de custodia.
- Recepción: guía, lote enviado y observado, vencimientos, cantidades aceptadas/cuarentena/rechazadas, ubicaciones, evidencia, estado y confirmación. Un registro pendiente no acredita ingreso en inventario.

Las descargas individuales usan `GET /traslados/{id}/pdf`, `GET /traslados/despachos/{id}/pdf` y `GET /traslados/recepciones/{id}/pdf`, con cookies mediante `descargarArchivoApi`. El backend exige VER y alcance por sucursal, consulta el detalle actual y audita EXPORTAR. El archivo utiliza el generador y la paleta de Compras en **A4 vertical**, con encabezados y páginas numeradas; no suma productos de diferentes unidades. La exportación general del listado conserva su comportamiento previo.

Archivos: `src/modules/traslados/components/boton-comprobante-traslado.tsx`, los dos componentes de listado, `traslado-detalle-view.tsx`, `traslado-despacho-view.tsx`, `traslado-api.ts` y `traslado.module.css`. Pruebas de contrato/carga/reintento en `tests/traslados-documentos.test.cjs`. El simulador de `tests/traslados-preview.cjs` genera PDFs reales con los builders compilados, desde datos en memoria; incluye permisos actuales de navegación. `node tests/traslados-pdf-ui.cjs` inicia y detiene sus servidores de prueba y usa Chrome instalado con el Playwright del runtime de Codex para revisar descargas y tamaños 1440/768/390. Requiere backend compilado y puertos 3102/5182 libres. No usa Oracle ni modifica `.env`.

- Listado: origen, destino, un estado, prioridad y rango de creación en horario de Guatemala; orden fijo del backend. Paginación 50/100/150/200, actualización, vacío, sin coincidencias y errores con reintento. Exportación PDF/XLSX del conjunto filtrado, excluyendo paginación.
- Solicitud: destino fijo en la sucursal de sesión para usuarios sin alcance corporativo; selección activa de origen, destino corporativo, presentaciones y unidades con búsqueda remota. De 1 a 100 presentaciones únicas, cantidades positivas exactas con hasta seis decimales y vida útil mínima explícita (0–36500 días). El servidor valida actividad, bodegas, compatibilidad de unidades y fraccionamiento. Guardar no reserva ni mueve stock.
- Se conserva la clave de idempotencia cuando se reintenta el mismo contenido. Los envíos pendientes se bloquean; los cambios sin guardar usan la protección existente de App.
- Detalle: solicitud, cantidades en unidad solicitada y base, conversión, pendientes por línea, despachos/incidencias y control del registro. No se suman cantidades de productos con unidades diferentes.
- Decisiones dentro del detalle: aprobar total/parcial, rechazar, cancelar antes del primer despacho, habilitar recepción y cerrar con motivo. Se combinan permiso, nodo responsable y estado; el servidor sigue validando las condiciones definitivas. Aprobar exige decidir todas las líneas y una cantidad positiva; aprobar la propia solicitud requiere control compensatorio. Los conflictos de versión obligan a actualizar antes de volver a decidir.
- Auditoría paginada y cambios de eventos solo con `TRASLADOS.ACCESO.VER_AUDITORIA`.

## Preparación, despacho y recepción

- **Preparación:** selecciona líneas aprobadas con saldo por preparar, captura cantidades exactas en unidad base y una vigencia futura en horario de Guatemala. De 1 a 100 líneas; no se autocompletan cantidades ni se simula stock disponible. El backend asigna lotes FEFO, valida existencias, fraccionamiento y vida útil, y crea las reservas. Se conserva la clave de idempotencia para el mismo contenido. Al guardar se ofrece abrir el despacho creado.
- **Detalle del despacho:** guía y lotes asignados, saldo recibido/justificado/pendiente por asignación, transporte, coste GTQ, historial de custodia, recepciones enlazadas, versiones y movimiento de salida. Permite confirmar salida, cancelar preparación y registrar cambios de custodia con formularios en modal, según permisos y nodo responsable. Confirmar salida exige reserva vigente y recepción habilitada; la acción deja de ofrecerse al vencer la reserva. El control compensatorio puede corregirse si el servidor lo exige al mismo preparador. Las asignaciones canceladas se muestran como historia.
- **Registrar recepción:** selecciona las asignaciones inspeccionadas y captura el lote y vencimiento realmente observados. Aceptación, cuarentena y rechazo se registran por separado, con hasta seis decimales. Aceptación exige ubicación activa de ALMACENAMIENTO del destino; cuarentena o rechazo exigen ubicación de CUARENTENA y motivo. Los selectores remotos filtran por sucursal y tipo. El mismo usuario que despachó debe documentar el control compensatorio. Evidencia obligatoria; hasta 100 asignaciones por registro. Guardar la inspección todavía no mueve existencias.
- **Detalle de recepción:** conserva identidad observada y guía, cantidades, ubicaciones, motivo, evidencia, control compensatorio, versiones y movimiento de ingreso. Permite confirmar o cancelar registros pendientes según permiso/estado/nodo. Las diferencias conocidas de identidad o cantidades bloquean el acceso a confirmación y se explican sin sustituir los datos observados. El backend vuelve a verificar saldo, identidad, vida útil, ubicaciones y bloqueos antes del ingreso. La confirmación parcial mantiene el resto en tránsito; cuarentena y rechazo permanecen segregados.
- Las operaciones usan la versión del documento correcto: preparación usa el traslado; salida, cancelación de despacho y custodia usan el despacho; confirmar/cancelar recepción usan la recepción. Registrar recepción no envía una versión inexistente en su contrato. Tras cada acción se actualizan también el traslado, despachos/recepciones asociados y auditoría.
- Los envíos duplicados se bloquean. Un conflicto 409 exige actualizar y revisar el documento; no se reintenta automáticamente. Los formularios preservan borradores ante errores y protegen su salida, incluidos los modales de operación. Se mantiene el foco en errores y se centra el campo para evitar que quede bajo la cabecera.

Endpoints usados: `POST /traslados/{id}/despachos`; `GET /traslados/despachos/{id}`; `PATCH /traslados/despachos/{id}/despachar|cancelar`; `POST /traslados/despachos/{id}/custodia|recepciones`; `GET /traslados/despachos/{id}/recepciones` (array); `GET /traslados/recepciones/{id}`; `PATCH /traslados/recepciones/{id}/confirmar|cancelar`. Los GET de contextos propagan cancelación de la consulta.

Reutiliza las tarjetas, navegación de secciones y disposición lateral de Productos, los CSS Modules existentes y los tokens de `variables.css`. Tablas, paginación, selectores, exportación y modales son los componentes compartidos. La tarjeta lateral del detalle puede desplazarse en pantallas bajas para mantener accesibles todas las decisiones.

Para elegir referencias se necesitan `ORGANIZACION.SUCURSALES.VER`, `CATALOGOS.PRESENTACIONES.VER`, `CATALOGOS.UNIDADES.VER` y, para recepción, `CATALOGOS.UBICACIONES.VER`, según el campo; el destino fijo usa la sucursal de sesión. Los nombres inaccesibles en consultas se conservan como identificadores. El frontend no crea ni asigna permisos o roles.

## Incidencias, faltantes y documentos relacionados

Los accesos son contextuales dentro del **Detalle del traslado**:

- **Despachos e incidencias → Registrar incidencia** abre el formulario de diferencia observada, descripción y evidencia. Admite los nueve tipos del contrato. Cantidad no negativa con seis decimales; un faltante exige cantidad positiva, guía en tránsito y asignación con saldo suficiente. Seleccionar una guía consulta sus asignaciones; registrar no ingresa sobrantes ni sustituye identidades.
- Cada tarjeta de incidencia abierta ofrece **Resolver incidencia** y, para un faltante asignado con alcance corporativo, **Justificar faltante**. Se conserva la descripción/evidencia original y se captura motivo, evidencia de investigación y control compensatorio. La evidencia de resolución se conserva en la auditoría. Un control exigido por el servidor se marca y enfoca sin perder el borrador.
- Resolver ofrece **Aclarada**, **Faltante justificado** cuando corresponde, o **Traslado relacionado**. La confirmación explica el efecto antes de guardar. Aclarar cierra la investigación; justificar reduce el tránsito pendiente sin recepción física ni reposición de stock. Relacionar guarda el vínculo sin descontar ni recibir automáticamente el saldo original.
- El selector de documentos relacionados consulta traslados **cerrados**, en el mismo sentido o inverso, con carga de más resultados de 50 en 50 y reintento. Comprueba recepción efectiva suficiente del producto observado; aprobaciones o cantidades justificadas no sustituyen una recepción. El servidor verifica nuevamente la relación.
- **Solicitar retorno**, en las acciones del detalle, crea una solicitud independiente con puntos invertidos y `retornoDeId`. Está disponible después de algún despacho, con CREAR y responsabilidad sobre el nuevo destino (origen del documento original) o alcance corporativo. Solo se prepara stock apto y disponible; cuarentena continúa en Inventario.
- **Crear traslado complementario**, en Despachos e incidencias cuando hay incidencias abiertas, reutiliza Nueva solicitud con referencia al original y puntos compatibles. Las presentaciones/unidades sirven como referencia; las cantidades y motivo se capturan explícitamente. Al completar recepción y cierre del nuevo documento, se selecciona al resolver la incidencia original para guardar el vínculo. El backend no admite una relación anticipada de complementario en creación.

Se usan los endpoints existentes `POST /traslados/{id}/incidencias`, `PATCH /traslados/incidencias/{id}/resolver` y `POST /traslados`. Registro usa versión del traslado; resolución usa versión de la incidencia. El contexto recupera el despacho de la asignación mediante consultas cancelables en grupos de hasta cuatro, pues el DTO de incidencia no expone su despacho. No se inventan endpoints ni campos de persistencia.

Las vistas emplean los componentes, secciones y paleta de Productos, protección de cambios sin guardar, foco de error y confirmación accesible. Conflictos de versión requieren recarga explícita; no hay reintento automático.

## Listados independientes de Despachos y Recepciones

Accesibles en **Traslados → Despachos** y **Traslados → Recepciones**. El menú marca únicamente el submódulo correspondiente, también al abrir detalles. Se requiere VER; CREAR o CORPORATIVO por sí solos no autorizan estos listados. Preparación y registro de recepción continúan desde el documento apropiado.

Se reutilizan cabecera, tabla en apariencia tarjetas, barra compacta de estados y botón Filtros entre estados/contador. Despachos: Preparado, En tránsito, Recibido y Cancelado. Recepciones: Registrada, Confirmada y Cancelada. Origen/destino, prioridad, rango de creación y traslado por UUID quedan en modal; Recepciones agrega despacho por UUID. Aplicar conserva el estado visible y reinicia página; Limpiar vacía el borrador, cerrar lo descarta. Las fechas corresponden a la creación del documento hijo en horario de Guatemala.

Cada fila muestra identificador, traslado enlazado, nodos, prioridad, creación, salida/confirmación y estado, con acceso al detalle. Recepciones también enlaza su despacho. Paginación 50/100/150/200, actualización, error/reintento, sin registros/sin coincidencias y corrección de página al disminuir resultados. El contenedor de tabla permite desplazamiento interno en escritorio; en móvil/tableta mantiene las tarjetas del componente compartido, sin desbordamiento de página.

Consultas nuevas: `GET /traslados/despachos` y `GET /traslados/recepciones`, con filtros/alcance/paginación en servidor y joins al traslado, sin recorrer todos los detalles desde el navegador. Exportación PDF/XLSX mediante `POST /traslados/despachos/exportaciones` y `POST /traslados/recepciones/exportaciones`, aplicada al conjunto filtrado con límite y auditoría existentes. Conservan DTO de detalle y array de recepciones por despacho; no requieren migración, seed ni permiso nuevo.

## Verificación

`npm run test:traslados`: 40 pruebas de contratos contra Zod real del backend, límites/precisión, permisos, catorce rutas, decisiones, observaciones y segregación, incidencias/recepción efectiva, documentos relacionados, listados/estados/filtros, idempotencia y llamadas API. Incluye `tests/traslados-operaciones.test.cjs`, `tests/traslados-incidencias.test.cjs` y `tests/traslados-documentos.test.cjs`. Con regresiones de Catálogos, Compras e Inventario: **110 pruebas frontend aprobadas**. Build y lint aprobados; Vite mantiene el aviso de tamaño del bundle. Backend typecheck/build y **36 pruebas de Traslados** aprobados; HTTP local verificado fuera del sandbox, sin Oracle.

La revisión en navegador utilizó exclusivamente un servidor en memoria: validación y foco, creación con `0.000001`, detalle, control compensatorio, aprobación, versión concurrente con recarga, sin coincidencias y salida de borrador. Verificadas las tres vistas en escritorio (1280×720) y en marcos reales de móvil (390×844) y tableta (768×1024), sin desbordamiento horizontal de página. El código conserva los breakpoints de Productos y aplica el filtro en una columna en pantallas estrechas.

La revisión de las cuatro vistas nuevas utilizó igualmente datos en memoria: preparación con `0.000001`, habilitación en destino, salida con control compensatorio exigido por la API, cambio de custodia, recepción parcial con aceptación/cuarentena/rechazo, confirmación y saldo actualizado, registro de lote diferente sin entrada silenciosa, cancelación con evidencia conservada, conflicto de versión de despacho y recarga explícita, borrador de modal y foco de error por teclado. Se verificaron escritorio de 1280 px y marcos móvil/tableta de 390/768 px, sin desbordamiento de página; las tablas conservan su desplazamiento interno.

La revisión de incidencias utilizó datos en memoria: registro/justificación de `0.000001`, exigencia de control compensatorio y corrección, selección rechazada por recepción insuficiente, relación válida, resolución aclarada concurrente con 409 y recarga, retorno con puntos invertidos y referencia conservada, creación de complementario sin relación anticipada y salida de borrador. Las cinco vistas se revisaron en escritorio y marcos de móvil/tableta de 390/768 px; ancho de página 375/753 px, sin desbordamiento horizontal.

Los dos listados se revisaron con el simulador: navegación de menú/detalles, estado combinado con traslado/despacho por UUID, error y foco por identificador inválido, vacío sin coincidencias, limpieza, modales, tamaños de página por teclado y disposición en escritorio/móvil/tableta 390/768 px. La exportación XLSX real del servicio se probó con repositorio simulado; el servidor visual devuelve 501 para exportaciones y no pretende generar archivos reales.

La integración con Oracle no se ejecutó. No se modificaron `.env`, migraciones ni seeds. Los cambios backend de esta ampliación corresponden a las consultas/exportaciones de los listados. Para verificar movimientos reales se requiere un backend iniciado y un esquema Oracle de prueba identificado con escrituras autorizadas y actores/permisos/maestros controlados, conforme a `Backend/FarmaciaBelenBackend/AGENTS.md`.

### Ajuste de filtros (2026-10-06)

El listado muestra el botón **Filtros**, con contador de criterios adicionales aplicados. Origen, destino, prioridad y fechas de creación se agrupan en **Filtrar traslados**, reutilizando el modal y los estilos de herramientas de Productos. Los estados permanecen visibles y se conservan al aplicar o limpiar los criterios del modal. **Limpiar** vacía el borrador y **Aplicar filtros** confirma los cambios; cerrar descarta el borrador. Los rangos de fechas inválidos mantienen el modal abierto, anuncian el error y enfocan el campo correspondiente. La aplicación reinicia la paginación y la exportación sigue utilizando los criterios confirmados.

El botón queda entre los estados y el contador de traslados, con ancho según su contenido. `HerramientasListado` admite la disposición optativa `estados` y el espacio `accionesEstado`: la barra se adapta al ancho de su contenedor y distribuye los controles en varias filas cuando hace falta. Se verificó el orden, el acceso al modal y la ausencia de desbordamiento en escritorio, móvil (390 px) y tableta (768 px). Los módulos que utilizan las disposiciones anteriores conservan su composición.

Nueva solicitud y Detalle no contienen filtros de consulta adicionales: sus campos de captura, datos y decisiones se mantienen en sus secciones. El componente de campo de Traslados, igual que el de Productos, solo reserva espacio para ayudas cuando tienen contenido y asocia su descripción cuando existe.

Verificados prioridad, combinación con estado, contador, limpieza, descarte al cerrar, retorno del foco y validación de fechas en navegador con datos simulados. Revisadas las tres vistas en móvil/tableta y el modal en escritorio, sin desbordamiento horizontal. Build y lint aprobados; las 13 pruebas existentes de Traslados pasaron. Sin cambios de contratos backend ni ejecución de migraciones o seeds.

Para repetir la revisión simulada, en dos terminales PowerShell desde el frontend:

```powershell
node tests/traslados-preview.cjs
```

```powershell
$env:VITE_API_URL='http://localhost:3102/api'
npm run dev -- --host 127.0.0.1 --port 5182 --strictPort
```

Abrir `http://localhost:5182/traslados`. Los datos y decisiones desaparecen al detener la API simulada. `tests/traslados-operaciones-preview.cjs` amplía el simulador con despachos, custodia, inspección, confirmación y ubicaciones; `tests/traslados-incidencias-preview.cjs` agrega registro/resolución, control compensatorio, justificación y documentos relacionados. No reproduce las transacciones FEFO/inventario ni los archivos de exportación reales.

`http://localhost:5182/tests/traslados-visual.html` permite cambiar entre las catorce vistas dentro de marcos de 390 y 768 píxeles. Es un harness local de desarrollo, fuera de las rutas y del build de la aplicación. Resolvió la revisión adaptable cuando el navegador integrado conservó su viewport de escritorio al pedir emulación móvil. El simulador incluye traslado aprobado 200 para preparar, despacho preparado 502, despacho en tránsito 302, recepción registrada 600, incidencias 303/700/710/720 y traslado cerrado 800 con recepción efectiva; todos usan el prefijo UUID `10000000-0000-4000-8000-000000000`.

Validación de comprobantes: backend 41/41 y frontend 42/42, compilaciones y lint aprobados. Chrome verificó tres descargas A4 verticales, dos descargas desde listas dentro del detalle, navegación por teclado, error/reintento y adaptación a 1440/768/390 sin desbordamiento de página. PDFs ficticios revisados en PNG y una muestra extensa de cinco páginas comprobada con extracción de texto. Capturas: [Listado](traslados-comprobantes-listado.png), [Móvil](traslados-comprobantes-movil.png) y [Comprobante de recepción](../../../Backend/FarmaciaBelenBackend/docs/traslados-comprobante-recepcion.png). Servidores y temporales de QA retirados. Sin conexión a Oracle, ejecución de migraciones/seeds ni cambios de configuración; la integración real sigue fuera de esta verificación. Compilación frontend mantiene las advertencias conocidas de PostCSS y tamaño de bundle.
