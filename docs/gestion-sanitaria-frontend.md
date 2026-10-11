# Frontend de Gestión sanitaria

Entrega del 2026-10-07. Integrado en App y Dashboard, con las tablas, filtros, paginación, confirmaciones, perfil lateral y secciones de Productos. Conserva componentes compartidos, CSS Modules y tokens existentes. No añade dependencias ni modifica `.env`.

El usuario informó que ejecutó las migraciones y los seeds del backend. El agente no los ejecutó ni comprobó su instalación en Oracle. **Esta entrega no requiere nuevas migraciones ni seeds.** No se modificó el backend.

## Vistas y operaciones

El menú ofrece dieciséis bandejas. Las evaluaciones y los seguimientos tienen listados/detalles auxiliares y se enlazan desde su expediente. Rutas frontend `/sanitaria/{vista}`, `/{uuid}`, `/nuevo` cuando corresponda y `/{uuid}/{accion}`. La entrada `/sanitaria` abre Casos. El cliente consume `/api/sanitaria` mediante cookies y descargas privadas del cliente compartido.

| Vista | Funcionalidad |
| --- | --- |
| Casos | Segregación desde existencia vigente, evaluación técnica, decisiones parciales, cierre/seguimiento e historial. |
| Cuarentenas pendientes | Adopción de cuarentena existente, conservando inventario y versión. |
| Evaluaciones | Criterios, dictamen, cantidad, referencias documentales y vínculo opcional con hasta diez archivos privados del caso. |
| Decisiones | Solicitud, autorización independiente y cancelación del saldo pendiente. Liberación exige dictamen apto y ubicación de almacenamiento. |
| Bajas | Autorizaciones con unidades segregadas; cantidad disponible para destrucción y coste documental. |
| Destrucciones | Confirmación parcial de un hecho realizado, acta, gestor, método, fecha, responsables y permisos aplicables. |
| Retiros | Activación por producto/lote y alcance, seguimiento por sucursal, conciliación conservando bloqueo. |
| Seguimientos | Hechos documentados; selección de ventas efectivamente afectadas según impacto actual. |
| Bloqueos vigentes | Evaluación técnica de una causa sanitaria y solicitud de levantamiento. |
| Resoluciones de bloqueo | Autorización independiente/rechazo, criterios e información conservada al evaluar. |
| Alertas | Sincronización explícita por sucursal, atención y cierre documentados. |
| Exposición | Vencimiento, cantidades y coste pendiente/documentado; orden remoto por días o valor documentado. |
| Contingencias | Digitalización de folio e inmovilización real; conciliación independiente y cantidades exactas. |
| Registros | Referencia, estado y vigencia manuales; alta/actualización versionada con alcance corporativo. |
| Correcciones | Fecha compartida del lote vigente, solicitud con evidencia y autorización/rechazo independiente corporativo. |
| Políticas | Umbrales por producto, categoría, tipo o global; alta/actualización versionada. |
| Categorías y clasificación | Catálogo técnico y asignación por producto con versión vigente. |

Detalle con información estructurada, referencias legibles, datos históricos, relaciones, evidencia privada y auditoría paginada según permiso. Los retiros separan físico, reservas incluidas en físico, tránsito y ventas; muestran el alcance inicial y la afectación actual con enlaces a documentos permitidos.

Las dieciocho consultas emplean sus filtros admitidos por el repositorio: sucursal, periodo, estado y referencias aplicables. Filtros en URL, reinicio de página al cambiar consulta y tamaños 50/100/150/200. Las exportaciones PDF/XLSX descargan el conjunto filtrado, sin enviar paginación. Exposición y bandejas pendientes no ofrecen exportación porque el backend no publica ese contrato. No se simula búsqueda de texto ni ordenación local del conjunto remoto.

El filtro por producto se presenta con ancho compacto después de los estados y antes del contador, en todas las bandejas que admiten producto. La barra incluye filtros avanzados y se redistribuye en varias filas cuando falta espacio, manteniendo etiquetas y selección remota. Exposición conserva su selector de prioridad en ese grupo.

Los encabezados de las dieciocho bandejas muestran título y acciones con la composición compacta de Empleados. La descripción no ocupa filas visibles: se conserva como ayuda del título y, junto al alcance, como descripción accesible. Este ajuste del 2026-10-09 afecta únicamente el encabezado; mantiene filtros, tablas, acciones y permisos.

## Reglas y permisos

- Cada ruta, acción y referencia respeta los permisos actuales. Configuración, corrección compartida y aprobación de correcciones requieren acceso corporativo. El servidor conserva la autoridad sobre permisos, alcance, restricciones y estados.
- Solicitante y autorizador distintos en liberaciones, bajas, levantamientos y correcciones. La conciliación de contingencia exige otra persona. La baja aprobada conserva físico: únicamente la destrucción confirmada produce salida definitiva.
- Controlados exigen permiso específico y procedimiento, autorización y evidencia. Se considera la condición histórica y puede indicarse el requisito manualmente; el servidor vuelve a comprobar la condición vigente.
- Cantidades y costes textuales, hasta seis decimales, cálculos exactos con BigInt. Coste ausente se envía como null y se muestra pendiente; cero documental exige referencia. No se calcula una valoración automática.
- Cada operación conserva la versión cargada y una clave de idempotencia por contenido. Se serializan envíos; un reintento de transporte idéntico conserva la clave. Cambios de versión, saldo, evaluación, alcance o lote bloquean el reenvío hasta volver al documento y revisar.
- Formularios con campos etiquetados, errores asociados y foco, confirmación antes de guardar, protección de borradores, estados de carga/vacío/error/reintento y bloqueo después del éxito. Instantes reales interpretados en America/Guatemala.
- Adjuntos PDF/PNG/JPEG hasta 10 MB, subida multipart con versión, consulta/descarga privadas y enlaces a evidencia existente. El backend valida firma y MIME; el navegador no sustituye esa validación.

Para adoptar cuarentenas se requiere además `INVENTARIO.CUARENTENA.VER`; para evaluar un bloqueo, `INVENTARIO.BLOQUEOS.VER`, porque se consulta el documento vigente. Apertura y digitalización necesitan consulta de existencias; corrección requiere consulta de lotes. Referencias maestras usan los permisos de Catálogos/Sucursales correspondientes. Usuarios sin lectura del documento vinculado ven una referencia neutral y el servidor impide su apertura.

## Verificación y continuidad

- `npm run test:sanitaria`: 40 pruebas, incluidos contratos de los 26 cuerpos JSON cotejados con Zod real del backend, multipart/exportaciones, filtros, versiones, precisión, independencia, controlados, respuestas compuestas y serialización/reintentos/conflictos del formulario.
- `node --test tests/*.test.cjs`: 224 pruebas frontend aprobadas. `npm run build` y `npm run lint` aprobados. Vite conserva el aviso de bundle grande.
- Revisión visual con API exclusivamente en memoria: dieciséis bandejas, listado/detalle, evaluación con errores y foco, creación de caso con cantidad exacta, autorización de decisión con confirmación/éxito, afectación y trazabilidad de retiro. Escritorio, móvil 390 px y tableta 768 px; sin desbordamiento horizontal de página. Las capturas se inspeccionaron en la herramienta; el guardado local fue bloqueado por los permisos del navegador.
- `tests/sanitaria-preview.cjs` es una API ficticia de revisión en 3105, sin Oracle ni movimientos de dominio. Valida cuerpos con los contratos reales; sus datos y resultados no acreditan operaciones reales ni equivalencia completa del dominio. Vite se revisó en 5185 con VITE_API_URL sustituida únicamente en el proceso.

Recargar frontend/sesión para recibir los permisos otorgados y comprobar el módulo contra la API real. La instalación reportada, Oracle, concurrencia real, almacenamiento/descargas de archivos y otorgamientos efectivos de roles permanecen sin verificar. No se realizaron operaciones reales de inventario ni comunicaciones externas.

La devolución definitiva al proveedor depende del futuro proceso de Devoluciones; el frontend lo comunica y conserva las unidades segregadas. Entregas, normativa automática, scheduler, comunicaciones y contabilidad permanecen fuera del contrato actual. Se conservan las seis decisiones ya confirmadas por el usuario.
