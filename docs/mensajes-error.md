# Mensajes de error

Todos los errores usan `--color-danger-text` (`#C6283A`), definido en `src/styles/variables.css`. El rojo mantiene contraste de texto normal sobre las superficies claras y el fondo suave de peligro.

`src/styles/global.css` aplica este color a las alertas con `role="alert"` y a sus textos. Los estilos compartidos de formularios, auditoría y `ModalEstado` usan el mismo token; los errores locales también lo utilizan. Los errores dentro de un modal de confirmación conservan el rojo aunque el modal sea informativo o de advertencia.

Las vistas que comparten una pantalla de carga y error asignan `role="alert"` solamente cuando existe un error. Los mensajes de carga e información conservan sus estilos. Los botones mantienen sus colores de acción.

Al añadir un mensaje de error, reutilizar los estilos compartidos y anunciarlo con `role="alert"` cuando corresponda. Para errores de campo sin anuncio, utilizar `errorCampo` y mantener la asociación con el control mediante `aria-describedby`.
