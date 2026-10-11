# Frontend de Caja y flujo de efectivo

Entrega completa solicitada el 7 de octubre de 2026. El módulo está integrado en App y en el menú de Dashboard, siguiendo las tablas, filtros en modal, formularios y detalles existentes de Farmacia Belén.

## Vistas y operaciones

Todos los recursos tienen listado paginado, filtros admitidos por el servidor, detalle, auditoría según permiso y exportación privada PDF/XLSX del conjunto filtrado. La paginación admite 50, 100, 150 y 200 registros. Los estados permanecen visibles; las fechas de los listados filtran el registro técnico en Guatemala.

| Vista | Ruta | Operaciones disponibles según permiso, estado y responsable |
| --- | --- | --- |
| Flujo de efectivo | `/caja/consolidado` (también `/caja`) | Consultar por periodo y sucursal |
| Configuración de caja | `/caja/politicas` | Configurar sucursal, editar política versionada |
| Cajas | `/caja/cajas` | Crear caja de ventas/chica, cambiar estado |
| Turnos de caja | `/caja/turnos` | Abrir con fondo contado, solicitar cierre, retiro/transferencia/fondo de cambio, cobro/reintegro/anulación de origen |
| Movimientos | `/caja/movimientos` | Registrar ingreso extraordinario/egreso de caja chica, confirmar, cancelar, corregir con compensación |
| Arqueos | `/caja/arqueos` | Preparar ordinario/ciego/sorpresivo/incidencia, contar, aprobar |
| Cierres de turno | `/caja/cierres` | Aprobar, aprobar con investigación, reabrir |
| Remesas | `/caja/remesas` | Aceptar personalmente, retornar retiro no entregado, entregar custodia |
| Cadena de custodia | `/caja/custodias` | Aceptar entrega personalmente |
| Depósitos | `/caja/depositos` | Preparar, registrar entrega bancaria, verificar independientemente, cancelar preparación |
| Cobros de repartidores | `/caja/cobros-repartidor` | Consultar cobros creados por el proceso de Entregas |
| Rendiciones | `/caja/rendiciones` | Declarar personalmente, recibir, cancelar declaración |
| Incidencias de caja | `/caja/incidencias` | Consultar y resolver con evidencia, sin editar saldos |
| Cierres diarios | `/caja/cierres-diarios` | Consolidar día operativo de sucursal |

Creaciones admitidas: `/{recurso}/nuevo`; detalles: `/{recurso}/{uuid}`; configuración: `/{uuid}/editar`. Las demás operaciones se inician desde el documento correspondiente. Cierres, remesas, custodia, cobros e incidencias nacen de su flujo de negocio, sin formularios de creación libre. Los siete formularios generales de creación y las 23 acciones se definen en `caja-operaciones.ts`; la política tiene formulario propio completo.

## Preparación para uso

El usuario informó que ejecutó las migraciones y el seed de seguridad. Esta entrega no ejecutó ninguno y no requiere nuevas migraciones ni seeds.

1. Compilar y reiniciar el backend para cargar la consulta aditiva `GET /api/caja/arqueos/:id/contexto-conteo`.
2. Revisar que los roles tengan los permisos `CAJA.*` necesarios. El seed publica 47 permisos, pero no los asigna a roles. Actualizar la sesión después de cambios de permisos.
3. Configurar explícitamente por sucursal horario, corte, turnos simultáneos, límites y denominaciones autorizadas.
4. Crear las cajas y abrir el turno con el conteo real del fondo.

Para abrir desde la interfaz se necesitan `CAJA.TURNOS.ABRIR`, `CAJA.CAJAS.VER` y `CAJA.POLITICAS.VER`. Los detalles y operaciones posteriores requieren VER del recurso y el permiso de la acción. El consolidado usa `CAJA.CIERRES.VER`. El alcance corporativo no concede permisos operativos; una sesión local mantiene su sucursal. Las referencias a usuarios se resuelven si existe `SEGURIDAD.USUARIOS.VER`; en caso contrario se admite el UUID requerido por la API, manteniendo los actores personales fijados a la sesión.

Corrección de Roles (2026-10-07): creación y asignación admiten hasta 1000 permisos por rol. El límite anterior de 200 impedía guardar la selección completa del administrador al añadir Caja. El formulario ahora muestra los detalles de errores de permisos junto al selector. No requiere migración ni seed; actualizar el backend en ejecución y volver a guardar el rol. Scripts `test:roles`: 6 pruebas backend y 3 frontend aprobadas, sin Oracle ni asignaciones reales.

Ventas ya tiene backend y frontend e integración transaccional con Caja e Inventario. El cobro y la anulación se originan desde el documento real de Ventas; las acciones de origen en Caja conservan autorización y prevención de duplicados. Entregas y Devoluciones siguen pendientes: sus adaptadores responden `503 CAJA_ORIGEN_NO_DISPONIBLE` y la pantalla lo explica. Los importes y aprobaciones del origen deben provenir del servidor. Los fondos tienen flujo propio; los cobros contra entrega requieren hechos creados por Entregas. Ver [guía de Ventas](C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend/docs/ventas-frontend.md).

## Controles implementados

- GTQ decimal textual exacto, hasta dos decimales y 13 dígitos enteros; conteos y subtotales en centavos con `BigInt`. No se inventan límites de negocio ni denominaciones. Los conteos históricos utilizan la política del turno.
- Arqueo pendiente: conteo personal por el responsable. El contexto devuelve solo identificadores, versión y denominaciones; no exige leer la política o el saldo del turno. El arqueo ciego no presenta esperado ni diferencia hasta declarar; el servidor protege también saldo, movimientos y consolidado.
- Acciones condicionadas por permiso, sucursal, estado y actor. Se conservan aprobaciones independientes, receptor designado y separación entre cajero/repartidor/transportista/verificador. La API mantiene la decisión definitiva sobre reservas, saldo, horarios y concurrencia.
- Conteos físicos, evidencia, explicaciones de diferencia, control de horario y digitalización con instante de Guatemala y folio físico cuando corresponde. Una recepción con diferencia muestra que la entrega queda pendiente y conserva la custodia anterior.
- Clave de idempotencia estable para el mismo contenido, bloqueo de doble envío y confirmación explícita. Una versión desactualizada o clave incompatible bloquea el reenvío hasta revisar el documento vigente. Los errores conservan el formulario y enfocan el primer campo inválido.
- Protección de borradores al navegar y cerrar la página. Tras éxito, los campos quedan bloqueados y se ofrece el documento resultante.
- Flujo del periodo y posiciones de custodia actuales se presentan por separado; el consolidado se identifica como informativo, sin atribuirle naturaleza contable. Diferencias firmadas se muestran como faltante/sobrante.
- Cargas, errores con reintento, vacío/sin coincidencias, auditoría paginada y enlaces entre documentos. Los filtros de exportación excluyen la paginación y se envían dentro de `filtros`, conforme al contrato.

## Verificación y límites

### Corrección de la configuración (2026-10-09)

En Configuración de caja, cada fila ofrece **Editar** además de Ver. El detalle conserva **Editar configuración** y explica la justificación obligatoria. Ambas acciones requieren `CAJA.POLITICAS.VER`, `CAJA.POLITICAS.CONFIGURAR` y alcance de la sucursal (sesión local o `CAJA.ACCESO.CORPORATIVO`).

El formulario carga los valores vigentes para corregir, agregar o quitar denominaciones, así como modificar horarios y límites. **Justificación del cambio** exige 3–250 caracteres; no se reutiliza automáticamente una justificación anterior. Si Configurar sucursal carga una política existente, también se presenta como edición. La API existente registra autor, versión, motivo y configuraciones anterior/nueva, conserva idempotencia y rechaza versiones desactualizadas. No requiere cambios de esquema o permisos nuevos.

Las correcciones se aplican a las próximas aperturas. Cada turno abierto mantiene su política histórica, incluidos los valores permitidos para conteos y cierres. Esto evita que una edición altere retrospectivamente operaciones de efectivo.

Verificación de esta corrección: build/lint frontend, **46/46 pruebas Caja frontend** y **51/51 backend**. Nuevas pruebas de permisos/alcance, justificación, autor y valores en auditoría, política histórica y nueva apertura, reintento, versión y rollback al fallar auditoría. La prueba HTTP simulada requirió ejecutarse fuera del aislamiento para acceder a localhost. Revisión en navegador con API en memoria: entrada directa desde Editar, bloqueo sin justificación con foco en el campo, corrección y guardado simulados, detalle corregido y recorrido móvil 390 sin desbordamiento de página. Consola sin errores. Captura `docs/caja-configuracion-editar.png`; servidores temporales detenidos. No se conectó Oracle, no se cambiaron políticas/roles reales y no se generaron ni ejecutaron migraciones o seeds.

Verificación de la entrega inicial: frontend `npm run build`, `npm run lint` y **152/152 pruebas** aprobadas (42 de Caja y 110 regresiones). Backend: `npm run typecheck`, `npm run build` y **48/48 pruebas de Caja** aprobadas. Los cuerpos de los 30 formularios generales se comparan contra los esquemas Zod reales del backend. Vite conserva su aviso de tamaño del bundle.

Se revisaron en navegador los 13 listados y detalles, los ocho formularios de creación/configuración, apertura contada, arqueo ciego, recepción con diferencia y rechazo de versión concurrente. Se comprobó el reflujo a 390/768/1440 px, sin desplazamiento horizontal de página. Se corrigió el desbordamiento de formularios causado por los estilos heredados de leyendas.

`tests/caja-preview.cjs` sirve exclusivamente datos ficticios en memoria en 3103. Para revisión local, iniciar Vite en 5183 con `VITE_API_URL=http://127.0.0.1:3103/api` solo en el proceso; no cambiar `.env`. El simulador valida contratos y respuestas de interfaz, pero no reproduce transacciones de dominio, restricciones de Oracle ni binarios de exportación. No usarlo como backend operativo. Las pruebas backend generan los documentos PDF/XLSX en memoria.

No se conectó a Oracle, no se registraron operaciones reales, no se modificaron roles ni `.env` y no se añadieron dependencias. La instalación reportada por el usuario y el funcionamiento real de Oracle no fueron verificados por esta entrega.
