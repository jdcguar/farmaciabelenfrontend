# Casillas del frontend

Los checkbox y radio usan controles nativos de 1.25 rem, sin relleno interno y sin encogerse en filas flexibles. El color de selección y el foco de teclado usan el azul de marca en `src/styles/global.css`.

Los estilos de campos de texto compartidos y de inventario excluyen estos controles para evitar que hereden el ancho completo, la altura y el relleno de un input de texto. La regla para asteriscos obligatorios solo se aplica a los indicadores con `aria-hidden="true"`; el texto de una casilla conserva su color normal.

`opcionCasilla`, en `formulario-modulo.module.css`, organiza la casilla y su etiqueta en dos columnas: control compacto y texto flexible. Mantiene una fila interactiva de al menos 2.75 rem y permite etiquetas de varias líneas. Catálogos, caja, ventas, sanitaria, traslados y vigencias de roles de usuarios reutilizan este estilo mediante CSS Modules.

Las opciones booleanas de catálogos ya no llevan el contorno de un campo de texto. Los permisos y la opción «Indefinido» usan el mismo checkbox nativo que el resto del frontend. Los filtros de tablas y las asignaciones de roles toman también el tamaño global.

Para nuevas casillas, usar `type="checkbox"`, una etiqueta asociada y `opcionCasilla` para opciones simples. Conservar `checked`, `onChange`, `disabled` y la asociación de ayudas y errores según el formulario.

## Verificación

Se revisó una vista temporal con componentes reales de catálogos, permisos y roles de usuarios, además de los estilos de ventas, sanitaria, caja, traslados, inventario y filtros. En Edge, a 1280, 768 y 375 px, los 14 controles midieron 20 × 20 px, sin relleno interno ni desbordamiento de página. Se comprobó marcar con la etiqueta, alternar con Espacio y activar «Indefinido». La vista temporal se retiró después de la revisión.

Capturas: [escritorio](capturas/checkbox/1280.png), [tableta](capturas/checkbox/768.png) y [móvil](capturas/checkbox/375.png).

`npm run build` y `npm run lint` completados. Vite muestra avisos de PostCSS y del tamaño del bundle que no impiden la compilación.
