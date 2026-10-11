export const maximoImagenProductoBytes = 5 * 1024 * 1024
export function validarImagenProducto(archivo: Pick<File, 'type' | 'size'>): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) return 'La imagen debe tener formato JPG, PNG o WebP.'
  if (!archivo.size) return 'La imagen está vacía.'
  if (archivo.size > maximoImagenProductoBytes) return 'La imagen no puede superar 5 MB.'
  return null
}
