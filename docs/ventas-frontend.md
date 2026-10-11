# Frontend de Ventas y dispensación

Entrega del 2026-10-07. Implementa todas las vistas y acciones publicadas por el backend de Ventas, con el patrón visual de Productos: perfil lateral, secciones numeradas, navegación de secciones, formularios y barra de acciones; listados con tablas compartidas, filtros, paginación y exportaciones. Integrado en App y Dashboard mediante el menú Ventas y dispensación.

El usuario informó que ya ejecutó las migraciones y el seed de seguridad. El agente no los ejecutó ni comprobó Oracle. **La actualización de Cobro Ventas del 2026-10-09 requiere una migración aditiva preparada, sin ejecutar; no necesita seeds nuevos.** Consultar la sección Cobro Ventas de esta guía.

Actualización de interfaz del 2026-10-09: las herramientas de Ventas siguen el orden **estados → búsqueda → filtros avanzados → contador**. Contingencias reutiliza la barra compartida con contexto, selector de sucursal autorizado y contador, además del resumen y las acciones del listado de Productos. Los formularios de Ventas conservan resumen y secciones laterales sin el recuadro de imagen.

Políticas abre primero en consulta. **Editar política** (o **Configurar política**, cuando no existe) requiere los permisos corporativos de configuración. Cancelar vuelve a consulta y protege cambios pendientes; guardar conserva confirmación, motivo/evidencia, versión y clave de reintento, y permite volver a la política recargada. Cambiar de sucursal regresa a consulta, con descarte confirmado si hay cambios.

## Vistas y contratos

Las rutas siguientes son del frontend. El cliente consume `/api/ventas`, con cookies, errores y descargas privadas del cliente compartido. Los contratos ejecutables permanecen en [venta.validator.ts](C:/FarmaciaBelen/Backend/FarmaciaBelenBackend/src/modules/ventas/venta.validator.ts).

| Vista | Ruta | Funcionalidad |
| --- | --- | --- |
| Ventas | `/ventas` | Número, sucursal, cliente, total y estados comercial/dispensación/fiscal independientes; consulta, búsqueda remota, filtros y exportación PDF/XLSX del conjunto filtrado. |
| Nueva venta | `/ventas/nuevo` | Sucursal, cliente, documento nominativo, presentaciones, unidad y cantidades exactas. Borrador sin cobro ni salida. |
| Detalle | `/ventas/{uuid}` | Importes, caja, precios históricos, condiciones, lotes/reserva, dispensaciones, fiscal, recetas/evidencia privadas, incidencias y auditoría según permisos. |
| Editar borrador | `/ventas/{uuid}/editar` | Solo borrador sin receta, preparación ni contingencia; conserva sucursal y versión. |
| Política | `/ventas/politicas` | Consulta inicial de tasa, reserva, vida útil mínima y catálogo OTC. Edición/configuración mediante acción explícita, con permisos corporativos, motivo/evidencia y versión. |
| Contingencias | `/ventas/contingencias` | Consulta paginada por sucursal, periodo autorizado, estado y acciones permitidas. |
| Autorizar contingencia | `/ventas/contingencias/nueva` | Periodo real de Guatemala, motivo/evidencia y saldos confiables/conteos físicos por existencia. |
| Digitalizar folio | `/ventas/contingencias/digitalizar` | Contingencia de la sucursal, turno, cliente, folio, hora real, total/efectivo, evidencia y lotes exactos en unidad base. Sin cobro/salida hasta conciliación. |
| Detalle/cierre | `/ventas/contingencias/{uuid}` y `/{uuid}/cerrar` | Autorizador, saldos, folios y cierre independiente; el backend impide cerrar con folios pendientes. |

Acciones desde el detalle de la venta:

| Sufijo de ruta | Acción / controles visibles |
| --- | --- |
| `/preparar` | FEFO automático; selección manual opcional con permiso, motivo por línea y existencias/cantidades base. |
| `/cancelar` | Motivo/evidencia y liberación de reservas de una venta ordinaria previa al cobro. |
| `/receta` | Paciente/prescriptor mínimos, número, fechas, indicaciones/evidencia y líneas cubiertas. |
| `/validar-receta` | Receta pendiente, decisión técnica, motivo/evidencia y usuario autorizado. |
| `/fracciones` | Asignación de lote, apertura, vigencia de uso, trazabilidad, motivo/evidencia. |
| `/verificar` | Registro técnico antes de cobrar; cotejo de productos, cantidades, lotes y controles. |
| `/confirmar` | Total comunicado/aceptado, efectivo, cambio exacto y evidencia; permisos de Ventas y Caja. |
| `/entregar` | Registro de entrega después de cobro/verificación, con motivo/evidencia y observaciones. |
| `/anular` | Actor distinto del confirmador, turno de compensación y ubicación de cuarentena; bloqueada después de entrega o con emisión fiscal incierta. |
| `/fiscal` | Emisión/anulación del trabajo real. Sin proveedor conserva pendiente; no presenta certificado ficticio. |
| `/comprobante` | Descarga PDF interno; motivo/evidencia y registro de impresión/copia por el servidor. |
| `/adjuntar` | Un archivo PDF/PNG/JPEG hasta 10 MB; receta opcional; multipart versionado y descarga privada autorizada. |
| `/conciliar` | Incorporación del folio por persona distinta del digitador; diferencias pendientes sin forzar precio, stock o caja. |

La paginación de ventas, contingencias y auditoría ofrece 50/100/150/200. Cambiar filtros reinicia página y se corrige si disminuye el total. Las consultas obsoletas se abortan y no se presentan como resultados nuevos. Las opciones remotas permiten buscar, cargar más y reintentar. El detalle y las operaciones actualizan el vencimiento de la reserva mientras están abiertos.

## Permisos y preparación para uso

1. Compilar/reiniciar el backend y recargar frontend. Los DTO generales ahora incluyen `creadoPorId`, `confirmadoPorId` y `contingenciaId`; contingencias incluyen `autorizadaPorId`. Permiten indicar independencia del autorizador, sin exponer datos clínicos ni sustituir validaciones del backend.
2. Revisar permisos del rol y renovar sesión. El seed publica los 26 permisos `VENTAS.*`; **no los asigna a roles**. Las vistas operativas necesitan `VENTAS.VENTAS.VER` además de su permiso. Digitalizar necesita consulta de Ventas/Contingencia y DIGITALIZAR; cierre necesita VER/CONCILIAR de Contingencia. Configurar política necesita POLITICAS.VER/CONFIGURAR y ACCESO.CORPORATIVO.
3. Configurar explícitamente la tasa efectiva y política por sucursal. La interfaz no instala una tasa predeterminada. Reserva aprobada: **15 minutos**. La tasa ficticia del simulador no es una recomendación fiscal ni se instala en el sistema real.
4. Verificar clientes, unidades/conversiones, presentaciones, precios vigentes, lotes aptos, stock y turno real de Caja. La sucursal de la venta deriva del turno en el servidor.

Cobrar/conciliar requiere también `CAJA.MOVIMIENTOS.COBRAR`; anular, `CAJA.MOVIMIENTOS.ANULAR_VENTA`. Operar el turno de otro cajero y autorizar fuera de horario conserva los permisos y controles de Caja. El permiso corporativo solo amplía alcance; no concede escrituras ni reemplaza independencia.

Los nombres/selectores de clientes, unidades, presentaciones, ubicaciones y sucursales reutilizan los permisos de sus catálogos/Organización. Consultar turnos necesita `CAJA.TURNOS.VER`; resolver responsables necesita `SEGURIDAD.USUARIOS.VER`. Seleccionar existencias manuales necesita `INVENTARIO.EXISTENCIAS.VER`, o la referencia UUID documentada si el usuario no puede consultar. FEFO ordinario no exige elegir existencias. No se modificaron roles reales.

`VENTAS.RECETAS.VER` controla el montaje y las solicitudes de los paneles privados de recetas/adjuntos. Sin ese permiso solo se consulta el resumen técnico general; no se cargan datos clínicos. Los responsables técnicos deben tener los permisos de consulta y validación apropiados. Motivos/observaciones generales no deben contener datos clínicos privados.

## Consistencia y diseño

### Exportación de Contingencias (2026-10-09)

El encabezado de `/ventas/contingencias` incorpora BotonExportar con Excel/PDF, igual que Ventas. Exige `VENTAS.CONTINGENCIA.VER` y el permiso existente `VENTAS.VENTAS.EXPORTAR`. Se deshabilita al cargar, ante error del listado y mientras genera el archivo; los errores de descarga usan ErrorVenta. Exporta todas las contingencias de la sucursal seleccionada, sin paginación ni filtros propios de ventas ordinarias, mediante `POST /api/ventas/contingencias/exportaciones`. El backend comprueba alcance, máximo y auditoría. Los roles y seeds existentes se conservan.

Frontend build/lint y **32/32 Ventas** aprobados; backend typecheck/build y **62/62 Ventas**. Revisión visual en escritorio y móvil 390, sin desbordamiento de página; menú y ambas descargas simuladas comprobados. Los archivos válidos y el contenido de Excel se verifican con pruebas del servicio backend en memoria. [Captura del menú](ventas-contingencias-exportar.png). Reiniciar backend si no recarga automáticamente y recargar frontend; no requiere migraciones ni seeds.

### Sucursal lateral en Contingencias (2026-10-09)

En el listado de Contingencias, la etiqueta Sucursal se sitúa a la izquierda del selector y centrada verticalmente para compactar la barra. Ajuste CSS limitado a `selectorListado`, conservando la asociación accesible y el comportamiento del filtro. Build/lint aprobados; revisión con API en memoria en escritorio y móvil 390, sin desbordamiento de página. Captura: [Sucursal lateral](ventas-contingencias-sucursal-lateral.png).

### Costo de ventas: distribución (2026-10-09)

`/ventas/costos` muestra la descripción bajo el título, dos tarjetas de indicadores (costo neto de reversiones y registros pendientes), una nota histórica compacta y HerramientasListado con contexto, filtros avanzados y contador. El panel de resultados agrupa título, actualización, limpieza de filtros, tabla y paginación. Los indicadores muestran `—` durante carga o error para evitar presentar cifras de la consulta anterior. Se mantiene la precisión de seis decimales y los contratos de consulta/exportación.

Verificado con API en memoria en escritorio 1440, tableta 768 y móvil 390, sin desbordamiento horizontal de página. Apertura/aplicación/limpieza de filtros y estado sin coincidencias comprobados. Capturas: [escritorio](ventas-costos-reordenado.png) y [móvil](ventas-costos-movil.png). Build, lint y 37/37 pruebas de Costeo/Ventas aprobados. Este ajuste es de frontend y no requiere migraciones ni seeds.

- Datos de entrada explícitos y estrictos, sin precio/descuento/sucursal/usuario como autoridad. Dinero/cantidades textuales, cambio en centavos BigInt, fechas reales y `-06:00` para instantes introducidos en Guatemala. Las conversiones, cálculo proporcional e impuestos se determinan en el servidor.
- Versiones del documento y clave de idempotencia estable por contenido. Se impide doble envío; éxito bloquea el formulario y ofrece detalle actualizado. Conflictos de versión/precio/preparación obligan a actualizar/revisar, sin aceptar automáticamente un importe nuevo.
- Errores de API/campos visibles, asociaciones accesibles, carga/reintento, estados escritos, vacío/sin coincidencias y protección al salir con cambios pendientes. Confirmaciones reutilizan ModalEstado; la anulación inicia foco en el contenido, manteniendo Escape, retención/retorno de foco y variante destructiva.
- CSS local utiliza tokens existentes y conserva azul/cian. Reutiliza TablaDatos, PaginacionTabla, Selector, SelectorReferencia, SelectorCaja, HerramientasListado, NavegacionSecciones, ModalEstado, BotonExportar y auditoría compartida. Las tablas se desplazan dentro de su contenedor en pantallas estrechas.
- Los formularios muestran productos, cantidades, lotes y condiciones de la versión que se está operando. La consulta de privacidad se mantiene separada. El backend revalida todo al confirmar.
- En Caja se actualizó únicamente el aviso de integración: Ventas ya origina cobros/anulaciones atómicos; Devoluciones sigue pendiente. Los formularios de Caja conservan sus contratos.

## Archivos

Código del módulo: [src/modules/ventas](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/src/modules/ventas). Contratos/API/rutas/reglas/entradas/hooks y componentes de listado, borrador, detalle, operación, política, contingencia, referencias y resumen operativo. Integración: `src/App.tsx`, `src/modules/dashboard/components/dashboard-view.tsx`; ajuste del aviso de Caja y prop opcional `focoInicial` de ModalEstado, con comportamiento anterior por defecto.

Pruebas: [ventas.test.cjs](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/tests/ventas.test.cjs), script `npm run test:ventas`. Simulador: [ventas-preview.cjs](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/tests/ventas-preview.cjs), API en memoria 3104 y Vite 5184 con VITE_API_URL sustituida exclusivamente en ese proceso. No conecta Oracle ni ejecuta servicios de negocio; sus importes/usuarios/productos son ficticios. Valida cuerpos contra Zod real, pero no acredita efectos de persistencia ni genera archivos fiscales reales.

## Verificación y límites

Mejoras del 2026-10-09: build y lint aprobados; **30/30 Ventas y 216/216 regresiones frontend (246/246 en total)**. Prueba nueva de apertura en consulta sin montar envío/formulario, permisos corporativos y política inexistente sin tasa implícita. Revisión visual de las vistas solicitadas en escritorio; búsqueda y contador, modal de filtros, edición/cancelación/guardado de política con API en memoria; listados en móvil 390 y Ventas en tableta 768 sin desbordamiento de página. Capturas: [listado](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/docs/ventas-listado-mejoras.png) y [consulta de política](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/docs/ventas-politica-consulta.png). Sin cambios de backend, permisos, dependencias, migraciones, seeds ni `.env`; sin escrituras reales. Las comprobaciones siguientes corresponden a la entrega inicial.

- Frontend: build y lint aprobados; **29/29** pruebas de Ventas y **155/155** regresiones de Catálogos/Inventario/Compras/Traslados/Caja/Roles. Contratos reales de los formularios, permisos/alcance/independencia, dinero/cantidades/fechas, idempotencia, multipart/descargas/exportación, errores accesibles y resumen sin datos clínicos. Vite conserva aviso de bundle grande.
- Backend: typecheck/build y **56/56** Ventas, incluidas dos pruebas nuevas de DTO/identificación de actores. HTTP repetido fuera del aislamiento con autorización para localhost; sin Oracle.
- Revisión visual con datos simulados: listado/detalle, búsqueda/selección de producto y cliente, creación, preparación, verificación, cobro, rechazo de importe inválido, reserva vencida, descarte protegido, validación de receta y aviso FEL pendiente. Política, periodo/saldos/folios y formulario de conciliación inspeccionados; confirmación de anulación y foco comprobados sin registrar la operación. Inspección adaptable en escritorio, móvil 390 y tableta 768. Las fechas nativas y archivos se verifican por contratos/render; no se acredita un flujo real de archivo/Oracle desde el navegador.

No se ejecutaron migraciones/seeds, no se alteraron `.env`, dependencias ni permisos reales y no se hicieron cobros, dispensaciones ni conexiones FEL reales. Continúan pendientes la integración de prueba con Oracle/archivos reales y el proveedor FEL. Pedidos comerciales, Entregas a domicilio, Devoluciones completas y contabilidad pertenecen a sus módulos futuros; no hay operación digital offline ni botones para forzar diferencias.


## Cobro Ventas (2026-10-09)

Submenú **Caja y flujo de efectivo → Cobro Ventas**, ruta `/caja/cobro-ventas`. Pendientes por defecto; estados Todos/Pendientes/Cobradas/Canceladas/Anuladas con diseño de puntos y selección azul compartido. Búsqueda remota por número, filtros avanzados de cliente/vendedor/fecha, paginación, reintento, vacíos y actualización automática cada 30 segundos/al recuperar foco.

El administrador con `VENTAS.ACCESO.CORPORATIVO` selecciona sucursal. El usuario local ve su sucursal asignada y el backend impide alterar el alcance. El listado separa Por preparar/Por verificar/Reserva vencida/Lista para cobrar. Ofrece Cobrar solo con preparación verificada, reserva vigente, creador distinto, permiso de confirmación y turno propio abierto. El estado y los importes se revalidan en servidor.

Registrar una venta no solicita turno. Vendedores pueden registrar en paralelo sin abrir Caja. El formulario `/caja/cobro-ventas/{uuid}/cobrar` reutiliza productos, lotes, total/efectivo/cambio, evidencia, confirmación y protección de versiones/reintentos. La operación asigna automáticamente el único turno abierto del cajero en la sucursal; no selecciona el turno de otra persona. Al concluir regresa a pendientes. El detalle enlaza a esta nueva opción; la ruta anterior de confirmar se conserva por compatibilidad. Digitalización manual conserva su selección de turno histórico y conciliación.

Preparada, sin ejecutar: `1792022400000-SepararVentaCobro.ts`. Desde el backend ejecutar `npm run migrate:ventas-cobro` antes de usar la actualización y reiniciar servidor; no requiere nuevos seeds. Mantiene los permisos existentes: leer ventas y cobrar Caja para acceder; confirmar Ventas además para cobrar.

Validación: frontend build/lint y 35/35 Ventas, 44/44 Caja; backend build y 73/73 Ventas, 49/49 Caja. Pruebas en memoria y revisión visual con API simulada: escritorio, tableta 768 y móvil 390 sin desbordamiento tras estabilizar el cambio de viewport; búsqueda, estados, filtros, sucursal, alcance local, registro sin turno y cobro simulado que sale de pendientes. Capturas `cobro-ventas-escritorio.png` y `cobro-ventas-movil.png`. Se corrigió durante revisión la integración del proveedor compartido de referencias. Sin conexión a Oracle, migraciones, seeds ni cobros reales. Build conserva advertencias existentes de PostCSS y tamaño de bundle.

## Corrección del ciclo de carga en Cobro Ventas (2026-10-10)

El listado muestra `clienteNombre` de la respuesta de Cobro Ventas, correspondiente al nombre histórico del documento. Retira `NombreReferencia` de la columna Cliente para evitar consultas por fila al catálogo, que puede rechazar el acceso del cajero. Documentos sin nombre muestran una etiqueta explícita. Los permisos y la navegación existentes se conservan.

En `ReferenciasCatalogo`, el resolver permanece estable al renovar una sesión con el mismo usuario, sucursal y permisos, aunque cambie el callback de navegación. La caché conserva las referencias rechazadas con 403 hasta cambiar ese contexto de acceso; los errores transitorios permiten reintentar. Esto evita que la renovación de sesión disparada por un 403 repita la petición indefinidamente en otras referencias.

Verificación: build/lint aprobados; **35/35 Ventas, 32/32 Catálogos y 46/46 Caja**. Regresiones de render sin acceso al catálogo, nombre histórico/fallback, treinta renovaciones equivalentes sin solicitudes adicionales, cambios de usuario/sucursal/permisos, deduplicación y reintento tras 500. Backend typecheck/build y 82/82 Ventas aprobados.

Revisión en navegador con cuatro ventas ficticias y perfil restringido de cajero: carga estable, actualización, detalle y retorno a la bandeja. Los filtros mantienen un error visible cuando el catálogo no está autorizado, sin bloquear la lista ni iniciar un ciclo. Captura [Cobro Ventas estable](cobro-ventas-sin-bucle.png). `tests/ventas-preview.cjs` incorpora ese perfil y simula el 403 sin modificar roles reales. Sin Oracle, cobros reales, migraciones, seeds, dependencias ni cambios en `.env`. Reiniciar backend y recargar frontend.

## Consultas repetidas del vendedor con HTTP 200 (2026-10-10)

La corrección anterior del 403 no resolvía un segundo ciclo: `TablaDatos` convertía los callbacks de las columnas en componentes mediante `FlexRender`. Cobro Ventas recrea esas columnas al actualizar el reloj de las reservas cada segundo; React desmontaba sus celdas y montaba de nuevo `NombreUsuarioCaja`, reiniciando las peticiones aunque el servidor devolviera 200. Las notificaciones de carga también podían provocar nuevos renders.

El componente compartido ahora invoca `ColumnaTabla.celda` como renderer de un nodo React dentro de la celda con su clave existente. Conserva la identidad y el estado de los componentes hijos cuando cambian los callbacks, sin cambiar filtros, ordenamiento, filas expandidas, diseño, API o permisos. Se mantiene la actualización de reservas cada segundo y de la bandeja cada 30 segundos. Al recargar la lista, el hook existente retira los resultados durante la carga y puede consultar nuevamente los nombres; esto corresponde a una actualización de lista y no al reloj de las reservas.

Regresiones nuevas en `tests/tabla-datos.test.cjs`: treinta actualizaciones con columnas/datos recreados conservan la ruta de identidad de una referencia; texto, componentes, fragmentos y filas expandidas mantienen su contenido. La prueba de identidad falla con el renderizado anterior y pasa con la corrección. Build/lint y la suite completa `node --test --test-reporter=dot tests/*.test.cjs` aprobados; comprobación dirigida de Tabla/Ventas/Caja/Catálogos: 115/115.

Navegador con cuatro ventas ficticias y permiso de lectura de usuarios: nombres del vendedor visibles, actualización manual y automática estables, sin errores de consola. Ocho mediciones consecutivas de un segundo mantuvieron iguales los contadores de consultas de bandeja y vendedor; las recargas normales de lista se midieron aparte. El simulador añade `/__prueba/lecturas` para contar GET exclusivamente en memoria. Captura [Vendedor estable](cobro-ventas-vendedor-estable.png). Sin modificaciones backend, Oracle, operaciones financieras, permisos reales, migraciones, seeds o dependencias. Recargar el frontend; si usa una compilación estática, recompilar y servir el resultado actualizado.

## Comprobante después de cobrar y desde Movimientos (2026-10-10)

Después de confirmar un cobro en `/caja/cobro-ventas/:id/cobrar`, el éxito ofrece **Ver comprobante**. Al pulsarlo o cerrar el mensaje de éxito, abre un segundo `ModalEstado` con el comprobante, **Generar**, **Imprimir** y regreso a pendientes. El resumen HTML accesible usa el detalle confirmado, sin consultas adicionales de clientes, y permanece legible sin visor PDF integrado. Incluye cliente, fecha, productos, cantidades, precios, impuestos, total, efectivo y cambio; muestra la sucursal de sesión únicamente cuando coincide con la venta. El PDF incorpora siempre la sucursal resuelta por el servidor. El contenido se desplaza dentro del modal para mantener sus botones disponibles en móvil.

La vista previa GET no consume el original. Generar solicita el comprobante auditado por POST y descarga el PDF; Imprimir solicita el mismo documento si todavía no fue emitido y espera a que cargue antes de llamar a la impresión del navegador. Ambos reutilizan el archivo definitivo; bloquean doble clic y conservan UUID/cuerpo al reintentar, incluso cambiando de botón. Los object URLs se liberan al cerrar y la consulta se cancela al desmontar. Existe enlace para abrir el PDF en otra pestaña si el navegador no permite imprimirlo dentro del modal.

En `/caja/movimientos`, **Generar comprobante** se ubica junto a Ver detalle, con el icono PDF existente. Solo aparece en movimientos VENTA confirmados vinculados a ventas, y exige los permisos de lectura de Movimientos, lectura de Ventas y comprobantes de Ventas. Usa el ID del movimiento; el servidor determina la venta y revalida alcance/arqueo. Errores visibles y UUID de reintento por movimiento. Otras clases de movimientos conservan sus acciones anteriores.

Archivos: `src/modules/ventas/components/venta-comprobante-modal.tsx`, `venta-comprobante-resumen.tsx`, `venta-operacion-view.tsx`, `src/modules/ventas/venta-api.ts`, `venta.module.css`; `src/modules/caja/components/caja-listado-view.tsx`, `src/modules/caja/caja-api.ts`, `caja.module.css`; `src/shared/api/descargar-archivo-api.ts` separa obtener/guardar un archivo conservando las descargas existentes. Pruebas: `tests/comprobantes-venta.test.cjs`, incluido en `npm run test:ventas`; `tests/ventas-preview.cjs` genera PDFs reales con los exportadores compilados y datos ficticios en memoria.

Verificación: frontend build/lint y **275/275** pruebas, incluidas cinco nuevas de preview, contrato de movimiento, emisión única, bloqueo de doble clic, espera de impresión, reintentos y privacidad del resumen. Backend build/typecheck, 89/89 Ventas y 51/51 Caja. Navegador con cobro exclusivamente simulado: éxito, apertura por botón/cierre, resumen y retorno; descargas completadas desde el modal y Movimientos, original/copia. Revisión adaptable en escritorio, móvil 390 y tableta 768; [modal](cobro-ventas-comprobante-modal.png), [modal móvil](cobro-ventas-comprobante-movil.png), [movimientos](caja-movimientos-comprobante.png) y [movimientos móvil](caja-movimientos-comprobante-movil.png). PDFs A4 vertical renderizados e inspeccionados, incluido documento de cien líneas en diez páginas. El navegador de revisión no dispone de visor PDF nativo; el resumen HTML sí fue comprobado. La llamada de impresión se verifica con la ventana simulada en las regresiones; queda pendiente la prueba en una impresora física. Build conserva advertencias existentes de PostCSS y tamaño del bundle.

Sin Oracle, cobros reales, migraciones, seeds, cambios de roles, dependencias ni `.env`. Esta mejora no requiere migraciones/seeds; reiniciar backend y recargar frontend. No sustituye la factura FEL ni habilita cobro por el vendedor de la misma venta.

### Apertura del PDF como botón (2026-10-10)

La acción **Abrir PDF en otra pestaña** del comprobante utiliza el estilo compartido de botón secundario, con contorno, altura táctil y foco de teclado. Conserva su ubicación y la apertura del archivo actual en una pestaña nueva con `noopener noreferrer`. Cambio visual en `components/venta-comprobante-modal.tsx` y `venta.module.css`, sin alterar emisión ni impresión. Lint y 40/40 pruebas de Ventas aprobados; recargar el frontend para ver el cambio.

## Comprobante de Movimientos: diseño y botón rectangular (2026-10-10)

Generar comprobante utiliza el PDF del servidor con el diseño del resumen mostrado al cobrar: cabecera azul, cliente/fecha/sucursal en celeste, productos con precio unitario, cantidad/total y totales debajo. Todos los puntos de emisión comparten ese formato A4 vertical.

En src/modules/caja/caja.module.css, el botón sobrescribe el radio circular heredado de los botones de acciones con el token radius-small. Sus dimensiones, separación, tipografía e icono siguen el patrón de Generar recepción. Conserva nombre accesible, permisos, descarga y bloqueo durante generación. Captura: [Movimientos con comprobante rectangular](caja-movimientos-comprobante-rectangular.png).

Validación: build/lint y 86/86 pruebas dirigidas de Ventas, comprobantes y Caja aprobados. Revisión en navegador con API simulada y descarga del PDF real generado por el exportador, sin Oracle ni operaciones reales. No requiere migraciones/seeds; reiniciar backend y recargar frontend.
