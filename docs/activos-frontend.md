# Frontend de Activos Fijos

Implementación del flujo administrativo de activos contra `/api/activos`. El menú se presenta como **Activos Fijos** y conserva los códigos de permisos del backend. No se modificaron los formularios, servicios, estilos ni reglas de Productos, empleados o sucursales.

## Vistas

| Vista | Ruta |
| --- | --- |
| Listado de activos | `/activos` |
| Crear activo | `/activos/nuevo` |
| Editar activo | `/activos/:id/editar` |
| Detalle del activo, historial y auditoría | `/activos/:id` |
| Tipos de activo | `/activos/tipos` |
| Crear, editar y consultar tipo | `/activos/tipos/nuevo`, `/activos/tipos/:id/editar`, `/activos/tipos/:id` |
| Listado de asignaciones | `/activos/asignaciones` |
| Crear asignación | `/activos/asignaciones/nuevo` |
| Detalle de asignación | `/activos/asignaciones/:id` |
| Mis activos | `/activos/mis-activos` |
| Detalle propio con todos los activos y su custodia | `/activos/mis-activos/:id` |
| Revisión inicial | `/activos/mis-activos/:id/revision` |
| Solicitar devolución posterior | `/activos/mis-activos/:id/solicitar` |
| Mis devoluciones | `/activos/mis-devoluciones` |
| Detalle de devolución propia | `/activos/mis-devoluciones/:id` |
| Listado administrativo de devoluciones | `/activos/devoluciones` |
| Detalle administrativo de devolución | `/activos/devoluciones/:id` |
| Registrar recepción física | `/activos/devoluciones/:id/recibir` |
| Resolver devolución | `/activos/devoluciones/:id/resolver` |

Crear, editar, consultar, revisar, solicitar, recibir y resolver son páginas completas. Los modales compartidos se emplean para confirmaciones, avisos y resultados. Baja, mantenimiento e inactivación requieren un motivo y envían la versión del registro.

## Diseño y componentes reutilizados

- Composición de Productos: cabecera, acciones, tabla de tarjetas y formularios con resumen lateral y secciones.
- Estilos existentes de `catalogos.module.css`, `empleado-crear-view.module.css`, `empleado-gestion.module.css`, `gestion-modulo.module.css` y `formulario-modulo.module.css`.
- `TablaDatos`, `PaginacionTabla`, `HerramientasListado`, `Selector`, `NavegacionSecciones`, `BotonExportar`, `IconoAccion`, `ModalEstado`, `ListaAuditoria` y `CambiosAuditoria`.
- Icono PDF existente y cliente compartido de descargas. El CSS del módulo solo compone estilos existentes y organiza contenido; no agrega colores, radios, tipografías ni medidas de diseño.

## Contrato y reglas

- Sucursal obligatoria y explícita en altas y asignaciones, sin valor inicial obtenido de la sucursal de sesión. El selector consulta las sucursales activas permitidas por el backend. La edición conserva la sucursal y omite `sucursalId`, código y situación del cuerpo enviado.
- Tipos y prefijos editables; no se envían códigos históricos. Serie opcional: recorte exterior, máximo 100 caracteres y conservación de separadores internos. La unicidad global es autoritativa en el backend.
- Selectores remotos con búsqueda, paginación, cancelación de solicitudes anteriores, conservación de la opción seleccionada, error y reintento. Cambiar sucursal limpia empleado y activos de la asignación.
- Condición de entrega por activo, versiones individuales, límite de 200 activos y prevención de duplicados. La creación recibe el acta y el resultado de generación PDF del servidor. Si el PDF falla después de guardar, informa que el acta está creada y permite continuar sin repetir el alta.
- Listados con búsqueda, filtros, ordenamiento y paginación del servidor; tamaños 50, 100, 150 y 200. Carga, vacío, sin coincidencias y error con reintento. Los resultados anteriores se ocultan durante la búsqueda y las solicitudes nuevas. Exportación utiliza los mismos criterios, sin página ni tamaño.
- Estados específicos para cada proceso; no se reutiliza el hook que inyecta `ACTIVO/INACTIVO`. Esos valores solo corresponden al catálogo de tipos y se traducen al filtro booleano `activo` del backend.
- Mis activos y Mis devoluciones usan exclusivamente los endpoints propios. El frontend no envía un identificador de empleado en consultas ni decisiones de custodia.
- Revisión única, selección de activos todavía asignados y motivo individual. Consulta de solicitudes activas antes de permitir una devolución posterior. Los activos no seleccionados permanecen bajo custodia.
- Recepción con todos los detalles originales y sin controles para agregar, sustituir o quitar activos. Resolución separada con aprobación/rechazo y motivo obligatorio.
- Los detalles y las tablas muestran custodia actual, entrega y devolución. Las devoluciones incluyen acta, activos, resultado administrativo y responsables recibidos del servidor. El icono PDF final se muestra únicamente para devoluciones aprobadas.
- Permisos funcionales y de navegación reales; no se deducen acciones por nombre de rol. Auditoría visible solo con el permiso correspondiente. No existe devolución administrativa directa ni módulo de reparación.
- Sesión y descargas mediante los clientes compartidos con `credentials: 'include'`. No se guardan tokens, sesión ni datos de custodia en `localStorage`.
- Los errores de versión conservan lo escrito y ofrecen consultar los datos actuales con confirmación. La recarga nunca reenvía automáticamente una operación. Navegación con cambios pendientes usa la protección existente de `App.tsx`.

## Archivos

- Nuevos: `src/modules/activos/activo.types.ts`, `activo.config.ts`, `activo-api.ts`, `activo-reglas.ts`, `activo-hooks.ts`, `activo-estilos.ts`, `activos.module.css` y los componentes de `src/modules/activos/components/`.
- Integración: `src/App.tsx`, `src/modules/dashboard/components/dashboard-view.tsx`, `src/shared/seguridad/navegacion.ts` (sincronizado desde el catálogo canónico del backend) y `package.json`.
- Pruebas: `tests/activos.test.cjs`, `tests/activos-preview.mjs` y `tests/activos-ui.cjs`.

## Verificación

Fecha: 10 de octubre de 2026.

| Capa | Resultado |
| --- | --- |
| Lint | Sin errores ni advertencias de lint. |
| TypeScript y build | Compilación satisfactoria. Vite conserva las advertencias de PostCSS y tamaño del bundle general. |
| Contratos automatizados | 8 pruebas nuevas aprobadas contra los validadores estrictos reales del backend. |
| Suite completa del frontend | 284 de 285 pruebas aprobadas. La falla corresponde a `tests/navegacion.test.cjs`: el catálogo canónico incluye `planillas-configuracion-salarial`, pero no hay integración de Planillas en el menú del frontend. No se alteró ni debilitó esa prueba. |
| Navegador | Alta/edición, tipos/prefijos, asignación múltiple, ambas decisiones iniciales, devolución posterior, solicitud activa, recepción, aprobación, rechazo, cierre parcial/total, privacidad, PDF, exportación, reintentos, conflicto y baja/inactivación verificados con Chromium. Sin errores de JavaScript. |
| Visual | Escritorio 1440×1000, tablet 820×1180 y móvil 390×844. Capturas revisadas y sin desbordamiento horizontal del documento. |
| Base de datos | No se ejecutaron migraciones, seeds ni escrituras en Oracle. |
| Aceptación E2E real | Pendiente con autenticación, permisos y Oracle del entorno de aceptación. La prueba local usa servicios reales, validadores y generación documental con repositorio en memoria y sesión simulada. No acredita bloqueos, índices, auditoría persistida ni cookies reales de producción. |

Evidencia local en `tmp/activos-ui/`: capturas, PDF de devolución aprobado, exportación Excel y `resultado.json`.

## Reproducir la prueba local

1. Desde el directorio del backend, iniciar un escenario nuevo sin conexión a Oracle:

   ```powershell
   node node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json ../../Frontend/FarmaciaBelenFrontend/tests/activos-preview.mjs
   ```

2. Desde el directorio del frontend, iniciar Vite apuntando exclusivamente a ese escenario:

   ```powershell
   $env:VITE_API_URL='http://127.0.0.1:3105/api'
   npm run dev -- --host 127.0.0.1 --port 5185 --strictPort
   ```

3. En otra terminal del frontend:

   ```powershell
   npm run test:activos
   npm run test:activos:ui
   ```

La prueba de navegador utiliza Playwright del runtime local de Codex y Chrome instalado. Reiniciar el servidor de pruebas para cada ejecución: el recorrido modifica exclusivamente el escenario en memoria.

En el entorno real, los permisos funcionales y de navegación deben existir y estar asignados al perfil correspondiente. El seed de Activos del backend registra definiciones, pero no concede permisos automáticamente a roles. Esta entrega no ejecuta ese seed ni cambia perfiles reales.
