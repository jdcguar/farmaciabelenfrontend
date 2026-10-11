# Instrucciones del sistema de diseño frontend de Farmacia Belén

## Alcance y objetivo

Estas reglas se aplican únicamente al frontend de Farmacia Belén. Su objetivo es que los módulos nuevos mantengan la identidad visual, la estructura y el comportamiento de los módulos existentes.

- Usar React con TypeScript y respetar la arquitectura, las dependencias, los scripts y la configuración del proyecto.
- Mantener una interfaz profesional, actual, limpia y contenida. Priorizar legibilidad y rapidez operativa.
- Reutilizar los componentes y estilos compartidos antes de crear otros.
- Conservar la identidad azul y cian, las superficies claras, las esquinas redondeadas y los patrones de los módulos actuales.
- Realizar mejoras de accesibilidad por función, sin rediseñar la distribución ni sustituir la identidad de marca.

Las rutas de esta guía son relativas a `Frontend/FarmaciaBelenFrontend/`.

## Fuentes de verdad

- `src/styles/variables.css`: valores efectivos de color, radios, sombra y transición.
- `src/styles/global.css`: tipografía base, estilos globales, foco y movimiento reducido.
- `src/shared/components/gestion-modulo/gestion-modulo.module.css`: estructura de listados, detalles, filtros y acciones.
- `src/shared/components/gestion-modulo/formulario-modulo.module.css`: estructura de formularios, campos y barra de acciones.
- Componentes de `src/shared/components/`: tablas, paginación, selectores, modales, exportación y auditoría.
- Módulos existentes de Roles, Usuarios, Sucursales y Empleados: referencias de composición y comportamiento.

Consultar estas fuentes antes de construir un módulo. Los valores documentados son referencias; no mantener una segunda paleta ni copiar un bloque completo de tokens dentro de cada módulo. Si el código cambia, actualizar la documentación correspondiente.

## Principios de diseño

1. Mantener una jerarquía clara entre título, herramientas, contenido y acciones.
2. Usar espacios funcionales: una pantalla limpia debe permitir trabajar con datos sin sentirse vacía.
3. Asignar colores por significado y jerarquía, no por acción individual.
4. Mostrar una acción principal evidente por contexto o grupo de acciones. Una pantalla puede tener grupos independientes.
5. Comunicar estados mediante texto y añadir iconos cuando ayuden a reconocerlos.
6. Mantener contraste suficiente y foco visible con teclado.
7. Conservar patrones existentes y resolver las necesidades nuevas en la capa compartida cuando sean reutilizables.

## Paleta de marca

La identidad principal pertenece a la paleta de Farmacia Belén. No introducir verde azulado como nuevo primario ni reservar el cian exclusivamente para funciones especiales.

| Rol | Token actual | Referencia | Uso |
| --- | --- | --- | --- |
| Azul principal | `--color-primary` | `#0468BF` | Acción principal, enlaces, iconos funcionales e interacción |
| Azul profundo | `--color-primary-hover` | `#035399` | Hover del primario y superficie actual del menú lateral |
| Cian de marca | `--color-secondary` | `#23B5D4` | Detalles de identidad, acento lateral de títulos y elementos de autenticación |
| Azul claro | `--color-accent` | `#C3E1E5` | Apoyos visuales, fondos suaves y detalles decorativos |
| Fondo general | `--color-background` | `#F2F2F2` | Lienzo de páginas y dashboard |
| Superficie | `--color-surface` | `#FEFEFE` | Tarjetas, formularios, tablas, paneles y modales |
| Superficie suave | `--color-surface-muted` | `#E6F4F7` | Áreas agrupadas y capas visuales sutiles |
| Texto principal | `--color-text` | `#0A1F35` | Títulos, etiquetas y datos esenciales |
| Texto inverso | `--color-text-inverse` | `#FEFEFE` | Texto sobre superficies oscuras con contraste verificado |

Reglas de uso:

- El cian es parte de la marca cotidiana. Puede aparecer en encabezados y detalles estructurales.
- No usar cian como texto pequeño, enlace o contorno esencial sobre blanco: esa combinación tiene contraste insuficiente.
- Para acciones secundarias usar texto azul, superficie clara o tratamiento neutral.
- El azul claro sirve como apoyo visual; no usarlo como único límite perceptible de campos esenciales.
- Mantener el gradiente de autenticación mediante `--color-login-background-start` y `--color-login-background-end`. Verificar por separado el contraste de cualquier texto situado sobre el gradiente.
- Usar una mayoría de superficies claras, azul para interacción y cian o estados semánticos como apoyos. No calcular porcentajes rígidos ni llenar áreas con color para cumplir una proporción.

## Estados semánticos y ajustes de contraste

Los colores vivos actuales forman parte del aspecto del producto. Conservarlos para ilustraciones y detalles adecuados; utilizar variantes oscuras para texto o rellenos que deban admitir texto inverso.

| Estado | Color vivo actual | Fondo suave actual | Uso |
| --- | --- | --- | --- |
| Éxito | `--color-success`: `#00C07F` | `--color-success-soft`: `#D9F5EB` | Operación completada, estado activo o validación aprobada |
| Advertencia | `--color-warning`: `#FFB400` | `--color-warning-soft`: `#FFF3D6` | Stock bajo, vencimiento cercano, pendientes o precaución |
| Peligro | `--color-danger`: `#FF4757` | `--color-danger-soft`: `#FFEAEA` | Error, bloqueo, validación fallida o acción destructiva |
| Información | `--color-info`: `#0468BF` | `--color-info-soft`: `#C3E1E5` | Ayuda, contexto y mensajes informativos |

El color vivo del estado no debe asumirse apto para texto. Cada etiqueta de estado debe incluir palabras como `Activo`, `Pendiente` o `Bloqueado`.

### Valores objetivo para la adecuación compartida

Los siguientes ajustes están definidos por esta guía, pero **no están implementados por actualizar este documento**. Antes de usarlos, comprobar que existan en `variables.css` y que sus consumidores compartidos hayan sido adaptados.

| Token | Valor objetivo | Motivo |
| --- | --- | --- |
| `--color-text-muted` | `#486580` | Mejorar lectura de ayudas y metadatos sobre fondos claros |
| `--color-border-strong` | `#6B8299` | Delimitar campos y controles cuando su borde sea esencial |
| `--color-focus` | `var(--color-primary)` | Dar contraste al foco sobre superficies claras |
| `--color-focus-inverse` (nuevo) | `var(--color-text-inverse)` | Apoyar el foco sobre superficies oscuras |
| `--color-success-text` (nuevo) | `#047857` | Texto de éxito sobre su fondo suave |
| `--color-warning-text` (nuevo) | `#B45309` | Texto de advertencia sobre su fondo suave |
| `--color-danger-text` (nuevo) | `#C6283A` | Texto de error y peligro sobre su fondo suave |
| `--color-info-text` (nuevo) | `var(--color-primary-hover)` | Texto informativo sobre el fondo azul claro |
| `--color-danger-solid` (nuevo) | `var(--color-danger-text)` | Botón destructivo con texto inverso legible |

La variante oscura de éxito y la de advertencia pueden conservar tonos de la guía previa. Su función es semántica; no sustituyen al azul como color de marca.

Aplicar estos cambios en la capa compartida cuando la tarea incluya su adecuación. Revisar sus usos antes de sustituir valores:

- Usar el borde fuerte en controles esenciales. Mantener bordes suaves en tarjetas y divisores decorativos cuando no necesiten el mismo contraste.
- Adaptar badges, alertas, errores de campo, etiquetas de modales y botones destructivos a sus tokens de texto o relleno respectivos.
- Conservar los colores vivos de ilustraciones y detalles de estado cuando corresponda.
- No introducir colores locales ni una copia de la paleta para resolver un solo módulo.
- Mientras los tokens nuevos no existan, utilizar `--color-text` para texto legible sobre fondos suaves y evitar combinaciones conocidas como insuficientes.
- Documentar los ajustes compartidos realizados y su efecto sobre los módulos existentes.

## Contraste y foco

Objetivo: WCAG 2.2 AA. El texto normal debe alcanzar al menos 4.5:1. El texto grande, según la definición WCAG, debe alcanzar 3:1. Los indicadores visuales necesarios para identificar controles y estados requieren 3:1 contra los colores adyacentes; este requisito no obliga a oscurecer todos los bordes decorativos.

### Combinaciones de referencia

Los ratios siguientes son aproximados, calculados con colores sólidos sin transparencia. El cumplimiento se determina con el valor sin redondear. Verificar nuevamente si cambian el fondo, la opacidad, los tokens o su composición.

| Combinación | Ratio aproximado | Aplicación |
| --- | ---: | --- |
| Azul principal `#0468BF` / superficie `#FEFEFE` | 5.57:1 | Texto normal, incluido texto inverso sobre primario |
| Azul profundo `#035399` / superficie `#FEFEFE` | 7.71:1 | Texto normal e inverso |
| Texto principal `#0A1F35` / advertencia suave `#FFF3D6` | 15.11:1 | Texto neutral dentro de avisos |
| Texto secundario objetivo `#486580` / superficie `#FEFEFE` | 6.04:1 | Ayudas y metadatos |
| Texto secundario objetivo `#486580` / fondo `#F2F2F2` | 5.44:1 | Ayudas y metadatos |
| Texto secundario objetivo `#486580` / superficie suave `#E6F4F7` | 5.41:1 | Ayudas y metadatos |
| Borde fuerte objetivo `#6B8299` / superficie `#FEFEFE` | 3.94:1 | Límite esencial de un control |
| Borde fuerte objetivo `#6B8299` / superficie suave `#E6F4F7` | 3.53:1 | Límite esencial de un control |
| Éxito de texto objetivo `#047857` / éxito suave `#D9F5EB` | 4.76:1 | Badge o mensaje de éxito |
| Advertencia de texto objetivo `#B45309` / advertencia suave `#FFF3D6` | 4.55:1 | Badge o mensaje de advertencia |
| Peligro de texto objetivo `#C6283A` / peligro suave `#FFEAEA` | 4.84:1 | Badge o mensaje de peligro |
| Información de texto objetivo `#035399` / información suave `#C3E1E5` | 5.64:1 | Badge o mensaje informativo |
| Peligro sólido objetivo `#C6283A` / texto inverso `#FEFEFE` | 5.53:1 | Botón destructivo |

Combinaciones actuales que requieren adecuación para texto normal: cian sobre superficie (2.41:1), texto secundario sobre superficie (4.39:1), éxito vivo sobre éxito suave (2.06:1), peligro vivo sobre peligro suave (2.89:1) e información sobre información suave (4.07:1).

Reglas de foco:

- Usar preferentemente un anillo de 2 px con 2 px de separación sobre superficies claras.
- En superficies oscuras, usar un indicador contrastante; combinar anillos claros y oscuros cuando haya elementos seleccionados con fondo claro.
- Se permite foco interior en campos si resulta visible y cumple contraste en su contexto.
- No eliminar `outline` sin un reemplazo visible. Evitar que `overflow`, menús o barras fijas recorten u oculten el foco.
- Añadir texto o iconos no compensa un contraste de texto insuficiente.

Referencias: [contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Estructura de los módulos

### Listados

- Usar cabecera con título y acento lateral cian, siguiendo los estilos compartidos.
- Agrupar las acciones de cabecera. La creación suele ser primaria; la exportación, secundaria.
- Reutilizar `HerramientasListado` para búsqueda, filtros rápidos y resumen de resultados.
- Reutilizar `TablaDatos` y sus filtros por columna. En listados equivalentes a los actuales, utilizar `apariencia="tarjetas"`.
- Mantener estados escritos, acciones por fila consistentes y nombres accesibles para botones con iconos.
- Mostrar carga, errores con reintento, ausencia de registros y ausencia de coincidencias con mensajes distintos.
- Mantener la paginación junto al listado.

### Formularios de creación y edición

- Reutilizar `formulario-modulo.module.css` para cabecera, campos, secciones y acciones.
- Agrupar campos relacionados en `fieldset` con `legend` y numeración de sección.
- Reutilizar `NavegacionSecciones` cuando el formulario tenga varias secciones.
- Utilizar dos columnas cuando el espacio lo permita y una columna en pantallas estrechas.
- Mantener etiquetas visibles, ayudas y errores junto a los campos.
- Usar barra inferior de acciones con `Guardar` o la acción equivalente como primaria y `Cancelar` como neutral.
- Las barras fijas no deben tapar el último campo, su error ni el control enfocado.

### Vistas de detalle

- Mantener tarjeta de identidad o resumen, estado del registro y acciones relacionadas.
- Organizar el contenido en secciones y tarjetas siguiendo `gestion-modulo.module.css`.
- Reutilizar navegación de secciones y componentes de auditoría cuando correspondan.
- Adaptar el diseño lateral a una columna en pantallas estrechas.

### Dashboard y autenticación

- Mantener el menú lateral azul profundo y sus estados activos claros.
- Conservar los grupos de módulos, tarjetas y acentos actuales del dashboard.
- Mantener la composición y el gradiente azul/cian de autenticación.
- Incorporar módulos nuevos al patrón existente de navegación e iconografía.

## Componentes compartidos

Reutilizar antes de crear:

| Necesidad | Componente o recurso existente |
| --- | --- |
| Tablas y filtros por columna | `TablaDatos` y recursos de `src/shared/components/tabla-datos/` |
| Paginación | `PaginacionTabla` |
| Selección | `Selector`, en `src/shared/components/selector/selector.tsx` |
| Búsqueda y filtros rápidos | `HerramientasListado` |
| Navegación de secciones | `NavegacionSecciones` |
| Confirmaciones y mensajes modales | `ModalEstado` |
| Exportación | `BotonExportar` |
| Iconos de acciones | `IconoAccion` y los recursos existentes de marca y acciones |
| Historial y cambios | Recursos de `src/shared/components/auditoria/` |
| Carga | Recursos de `src/shared/carga/` |

`ModalEstado` utiliza los tipos existentes `exito`, `error`, `advertencia` e `informacion`, y la variante de acción principal `predeterminada` o `peligro`. Respetar esa API; no inventar variantes incompatibles.

Para necesidades nuevas, ampliar la capa compartida con props y variantes tipadas. No crear otra tabla, selector, modal o sistema de botones cuando el existente ya resuelva el caso. La apariencia de las acciones debe depender de su jerarquía, no de un nuevo color por funcionalidad.

## Jerarquía de acciones

| Categoría | Tratamiento | Ejemplos |
| --- | --- | --- |
| Principal | Azul principal relleno con texto inverso | Crear, Guardar, Confirmar, Cobrar |
| Secundaria | Texto azul, contorno adecuado o fondo sutil | Ver detalle, Editar, Exportar, Aplicar filtro |
| Neutral | Texto principal o secundario legible sobre superficie clara | Cancelar, Volver, Cerrar |
| Precaución | Contexto de advertencia y confirmación según impacto | Desactivar un registro reversible |
| Destructiva | Rojo sólido oscuro con texto inverso y confirmación según impacto | Eliminar, Anular venta |

- `Generar reporte`, `Automatizar` y `Analizar` siguen la jerarquía del contexto; no requieren una categoría cromática especial.
- No usar ámbar como color rutinario de botones.
- Distinguir desactivación reversible, bloqueo operativo y eliminación. Clasificar por consecuencias, no solo por el nombre de la acción.
- Para desactivaciones equivalentes a las actuales, mantener el contexto de advertencia y solicitar motivo cuando el flujo del módulo lo requiera.
- Explicar qué registro se afectará y qué ocurrirá antes de confirmar una operación sensible.
- Implementar hover, active, disabled, loading y focus-visible cuando correspondan.
- Evitar envíos duplicados durante carga. Conservar el ancho y la etiqueta de la acción; comunicar el proceso mediante un estado accesible.

## Tipografía

Usar la pila tipográfica compartida:

```css
font-family: Inter, system-ui, "Segoe UI", Roboto, sans-serif;
```

Para mostrar Inter de forma consistente, comprobar que se cargue una fuente disponible. Declarar su nombre no garantiza su disponibilidad. Resolver la carga en el punto común del frontend.

Usar preferentemente pesos 400, 500, 600 y 700. Unificar otros pesos al adecuar estilos compartidos, comprobando la fuente utilizada.

| Nivel | Tamaño recomendado | Peso | Uso |
| --- | --- | --- | --- |
| Título de página | 1.75–2.25 rem | 700 | Mantener el escalado adaptable de las cabeceras |
| Sección o modal | 1.125–1.25 rem | 600 | Secciones principales y diálogos |
| Tarjeta o panel | 1 rem | 600 | Subtítulos |
| Cuerpo | 0.875–1 rem | 400 | Texto general |
| Datos de tabla | 0.8125–0.875 rem | 400–600 | Lectura operativa |
| Botón | 0.875 rem | 600 | Acciones |
| Etiqueta, ayuda o metadato | 0.75–0.8125 rem | 400–600 | Contenido auxiliar |

Con la base habitual de 16 px, los mínimos de tabla y contenido auxiliar equivalen a 13 px y 12 px. No reducir el tamaño raíz para aparentar que se cumplen esos mínimos. Estos tamaños son criterios de diseño del producto, no umbrales tipográficos de WCAG.

- Mantener altura de línea de 1.45 a 1.60 en texto de cuerpo.
- Usar oración normal en títulos y etiquetas; reservar mayúsculas para microetiquetas breves.
- Construir jerarquía con tamaño y peso; usar el color como apoyo.
- Permitir zoom y reflujo sin ocultar contenido ni acciones.
- Mejorar ayudas y metadatos pequeños al adecuar los estilos comunes; evitar excepciones por módulo.

## Forma, espacio y profundidad

- Mantener `--radius-small: 0.75rem`, `--radius-medium: 1rem` y `--radius-large: 1.5rem`.
- Reutilizar los radios de tarjetas, campos, botones, paneles y modales existentes. Reservar formas circulares para avatares, estados y acciones por fila que sigan ese patrón.
- Utilizar pasos de espaciado de 0.25, 0.5, 0.75, 1, 1.25, 1.5 y 2 rem, priorizando los valores del recurso compartido que se reutiliza.
- Mantener espacios de secciones de aproximadamente 1–1.5 rem cuando coincidan con el patrón existente.
- Usar `--shadow-card` donde corresponda; no añadir sombras intensas a cada elemento.
- Centralizar en tokens los nuevos fondos de superposición y sombras reutilizables. No introducir valores RGB o hexadecimales aislados en módulos.
- Respetar `--transition-fast` y `prefers-reduced-motion`.

## Accesibilidad y comportamiento

- Usar HTML semántico antes de añadir ARIA.
- Todos los controles deben funcionar con teclado.
- Cada campo debe tener etiqueta asociada. El placeholder no sustituye la etiqueta.
- Asociar ayudas y errores mediante identificadores y `aria-describedby`; marcar campos inválidos con `aria-invalid` cuando corresponda.
- Los botones con solo icono deben tener nombre accesible y una forma de reconocer su función que no dependa exclusivamente del hover.
- Los errores importantes deben anunciarse sin repetir mensajes de forma innecesaria. Usar `role="alert"`, `role="status"` o regiones vivas según urgencia.
- Al abrir un modal, mover el foco a un control apropiado. Para una operación destructiva, preferir inicialmente una acción segura o el contenido que explique sus consecuencias.
- Conservar el foco dentro del modal y devolverlo al control de origen al cerrar. Permitir Escape cuando el flujo lo admita.
- Durante una operación pendiente, explicar el estado de carga y evitar cierres que dejen ambiguo el resultado.
- Reutilizar el comportamiento accesible de `ModalEstado` y revisar si su foco inicial es adecuado para cada caso.
- Conservar las ilustraciones y animaciones de marca cuando aporten contexto; mantener una alternativa con movimiento reducido y evitar animaciones que distraigan del trabajo.

## Diseño adaptable y tablas

- Seguir la estrategia adaptable existente. No reorganizar un módulo únicamente para imponer mobile-first.
- Reutilizar los breakpoints y consultas de contenedor de los estilos compartidos. Añadir otros solo cuando el contenido lo requiera.
- Mantener acción principal, etiquetas y datos esenciales en móvil, tableta y escritorio.
- En tablas anchas, permitir desplazamiento dentro del contenedor. No reducir la tipografía para hacer caber todas las columnas.
- La apariencia `tarjetas` describe la presentación de filas de la tabla existente; no asumir que por sí sola convierte el contenido en tarjetas móviles independientes.
- Evitar desbordamiento horizontal de la página y revisar barras fijas, paneles laterales y menús.
- Usar 44 × 44 px CSS como objetivo para controles táctiles, especialmente acciones por fila, cierres y paginación. Puede ampliarse el área interactiva sin aumentar el icono.
- Ese objetivo de 44 px es una decisión de diseño; WCAG 2.2 AA contempla un mínimo de 24 px con excepciones, y el criterio mejorado de 44 px corresponde a AAA.

Referencias: [tamaño mínimo de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) y [tamaño mejorado](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).

## Paginación, búsqueda y filtros

- Reutilizar `PaginacionTabla` con opciones de 50, 100, 150 y 200 registros por página y 50 como tamaño inicial en listados equivalentes a los actuales.
- Mostrar el rango visible y el total de registros, diferenciando correctamente singular y plural.
- Reiniciar a la primera página al cambiar búsqueda, filtros o tamaño de página.
- Deshabilitar navegación fuera de los límites y corregir la página si el total de resultados disminuye.
- Mantener búsqueda y filtros coherentes con la consulta al servidor. No filtrar únicamente la página visible cuando la operación corresponde a todo el conjunto.
- Distinguir `No hay registros` de `Sin coincidencias` y ofrecer creación o limpieza de filtros según el caso y los permisos.
- Mostrar estado de actualización sin presentar resultados anteriores como si correspondieran a la consulta nueva.

## Reglas técnicas

- Usar componentes funcionales y hooks siguiendo las convenciones del proyecto.
- Mantener tipado explícito de props, modelos, variantes y estados; evitar `any` y justificar excepciones inevitables.
- Respetar la configuración TypeScript vigente. La activación global de `strict`, si no está habilitado, es una adecuación técnica aparte; no realizarla automáticamente por una tarea visual.
- Mantener CSS Modules y los estilos compartidos existentes. No añadir otro framework de estilos para un módulo aislado.
- Respetar los scripts actuales de compilación y linting y las herramientas disponibles.
- No codificar colores directamente en componentes ni estilos de funcionalidades. Definir los nuevos valores semánticos en `variables.css`.
- Evitar marcado duplicado cuando pueda componerse con los recursos existentes.
- Mantener los permisos del módulo en acciones y navegación, siguiendo los patrones existentes.
- Añadir pruebas cuando verifiquen comportamiento relevante; ejecutar las comprobaciones apropiadas al alcance del cambio.

## Lista de validación

Antes de terminar un módulo o cambio frontend, verificar:

- La paleta sigue siendo la de Farmacia Belén y usa los tokens efectivos de `variables.css`.
- Se reutilizan las estructuras y componentes compartidos adecuados.
- La cabecera, búsqueda, filtros, tabla, formulario o detalle corresponden al patrón del módulo equivalente.
- Existe una acción principal clara por grupo; las secundarias y neutrales no compiten con ella.
- Los estados incluyen texto y no dependen únicamente del color.
- Texto, controles y foco cumplen contraste en sus fondos reales, incluidas transparencias y estados.
- Los tokens propuestos utilizados existen y su adecuación se ha realizado en la capa compartida.
- Los campos tienen etiquetas y sus errores están asociados programáticamente.
- Los controles con iconos tienen nombre accesible y funcionan con teclado.
- Los modales gestionan foco, cierre y retorno correctamente.
- Se contemplan carga, vacío, error, deshabilitado, hover, active y foco cuando correspondan.
- La tipografía conserva los mínimos y el contenido admite zoom y reflujo.
- Las acciones táctiles tienen un área adecuada y no dependen del hover.
- La paginación permite 50, 100, 150 y 200 registros y se reinicia cuando cambia la consulta.
- El diseño funciona en móvil, tableta y escritorio sin contenido tapado por barras fijas.
- Los ajustes compartidos mantienen coherencia en los módulos existentes.
- Compilación, linting y pruebas pertinentes pasan; revisar visualmente el resultado según el alcance.
