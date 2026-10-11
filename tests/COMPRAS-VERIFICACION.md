# Verificación de Compras y Recepción — 2026-10-06

Las vistas usan el cliente autenticado existente y los endpoints reales de Compras. La revisión de esta cuenta utilizó contratos y un servidor de demostración en memoria. **No se ha probado el flujo contra Oracle.** La instalación de migraciones/permisos fue confirmada por el usuario; no se repitió.

## Comandos

Desde `C:/FarmaciaBelen/Frontend/FarmaciaBelenFrontend`:

```powershell
npm run build
npm run lint
npm run test:compras
npm run test:catalogos-farmacia
npm run test:inventario
```

Compras: 25 pruebas de cuerpos frente a Zod real, permisos/actor/alcance, estados/rutas, precisión decimal, idempotencia, requests, multipart y aceptación facturable de todas las páginas. Catálogos: 30; Inventario: 15. Desde el backend, `npm run test:compras`: 22 pruebas aprobadas con dobles, HTTP local y almacenamiento temporal. El primer intento HTTP falló por el sandbox; la repetición autorizada fuera del sandbox pasó. Ninguno de estos comandos acredita persistencia o bloqueos en Oracle.

## Revisión visual reproducible sin Oracle

Desde F, en dos terminales:

```powershell
node tests/compras-preview.cjs
```

```powershell
$env:VITE_API_URL='http://localhost:3101/api'
npm run dev -- --host 127.0.0.1 --port 5180 --strictPort
```

Abrir `http://localhost:5180/compras/solicitudes`. El usuario mostrado es «Cuenta de prueba simulada». El servidor conserva datos solo en memoria y entrega una sesión ficticia. Nunca usarlo para validar seguridad real ni apuntar a producción. No modifica `.env`. Sus transiciones permiten comprobar interacción, no reproducen todos los bloqueos/reglas transaccionales del backend. Adjuntos y exportaciones devuelven 501 explícito para no aparentar firma/almacenamiento/binarios reales.

Se revisaron: solicitudes (incluido 0.000001 y creador propio), cotizaciones/selección homologada/comparación/adjudicación, orden y revisión, recepción con dos lotes, documental/física/técnica/confirmación, factura con saldo disponible, obligación/autorización y evaluación/métricas. También carga, vacío sin coincidencias, error de exportación, auditoría, estado final, conflicto 409 con recarga explícita y cambios sin guardar. Fechas verificadas con teclado nativo. Escritorio 1265 px, tableta 820 px y móvil 390 px; listados y formularios sin desbordamiento horizontal de página. Capturas en `tests/evidencias-compras` son exclusivamente simuladas.

## Pendiente: integración en la base de prueba autorizada

`http://localhost:3000/api/health` rechazó la conexión durante la revisión. F conserva esa URL de API configurada. Antes de iniciar pruebas reales, identificar la base/esquema de prueba, confirmar que sus datos son controlados y autorizar las escrituras; indicar dos usuarios independientes y un usuario de otra sucursal, con accesos mediante un archivo local seguro. No colocar contraseñas aquí. Respetar `B/AGENTS.md`, punto 7 de validación. Confirmar URL y CORS (B declara frontend localhost:5173).

| Caso real pendiente | Evidencia que registrar |
| --- | --- |
| Sesión y permisos efectivos, alcance local/corporativo y auditoría | Actores/sucursales de prueba sin secretos; rutas permitidas/403 |
| Solicitud → oferta homologada → adjudicación → orden y aprobación independiente | Identificadores controlados, versiones, estados y rechazos por creador/vigencia |
| Revisión antes del suministro y sustitución al aprobar; avisos y sobrantes | Orden anterior conservada, restricciones y saldos exactos |
| Recepciones parciales/múltiples lotes, física cero/diferencia, rechazo y cuarentena | Cantidades/destinos/vida útil/evidencias; stock intacto hasta confirmar |
| Confirmación, reintento y conflicto con dos sesiones | Un ingreso/kardex; inventario/saldos/auditoría; transacción y bloqueo Oracle |
| Factura coincidente/diferente, conciliación, obligación, retención/anulación | Solo aceptación facturable, sin duplicidad, versión propia, sin pago |
| Evaluación única, cierre/cancelación según estado | Métricas e historial conservados |
| Adjuntos PDF/PNG/JPEG válidos e inválidos, límites/descarga | Firma, almacenamiento/compensación, versión, cookies/headers |
| PDF/XLSX de seis documentos con filtros y alcance | Archivos abiertos y datos correctos, límite de exportación, errores |

Registrar request/response y código de error seguros antes de cualquier cambio de backend. Traslados y abastecimiento interno siguen fuera de esta etapa; cerrar la verificación de Compras antes de avanzar al siguiente módulo acordado.
