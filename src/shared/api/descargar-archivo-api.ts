import { construirUrlApi, ErrorApi } from './cliente-api'
import { iniciarCargaGlobal } from '../carga/estado-carga-global'

type RespuestaErrorApi = {
  error?: {
    code?: string
    message?: string
    details?: Array<{ campo: string; mensaje: string }>
  }
}

type OpcionesDescarga = Omit<RequestInit, 'body'> & {
  datos?: unknown
  nombreArchivoAlternativo: string
}

function obtenerNombreArchivo(response: Response, alternativo: string): string {
  const disposicion = response.headers.get('Content-Disposition') ?? ''
  const utf8 = disposicion.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const basico = disposicion.match(/filename="([^"]+)"/i)?.[1]
  let nombre = alternativo

  if (utf8) {
    try {
      nombre = decodeURIComponent(utf8)
    } catch {
      nombre = alternativo
    }
  } else if (basico) {
    nombre = basico
  }

  return nombre.replace(/[\\/:*?"<>|]/g, '_')
}

async function crearErrorApi(response: Response): Promise<ErrorApi> {
  let contenido: RespuestaErrorApi | null = null
  try {
    contenido = await response.json() as RespuestaErrorApi
  } catch {
    contenido = null
  }

  return new ErrorApi(
    contenido?.error?.code ?? 'ERROR_HTTP',
    response.status,
    contenido?.error?.details ?? [],
    contenido?.error?.message ?? `La API respondió con estado ${response.status}.`,
  )
}

export type ArchivoApi = { contenido: Blob; nombreArchivo: string }

export async function obtenerArchivoApi(
  ruta: string,
  opciones: OpcionesDescarga,
): Promise<ArchivoApi> {
  const finalizarCarga = iniciarCargaGlobal()
  const { datos, nombreArchivoAlternativo, headers: headersIniciales, ...requestInit } = opciones
  const headers = new Headers(headersIniciales)
  headers.set('Accept', 'application/octet-stream, application/json')
  if (datos !== undefined) headers.set('Content-Type', 'application/json')

  try {
    const response = await fetch(construirUrlApi(ruta), {
      ...requestInit,
      headers,
      credentials: 'include',
      body: datos === undefined ? undefined : JSON.stringify(datos),
    })
    if (!response.ok) throw await crearErrorApi(response)

    return { contenido: await response.blob(), nombreArchivo: obtenerNombreArchivo(response, nombreArchivoAlternativo) }
  } finally {
    finalizarCarga()
  }
}

export function guardarArchivoApi(archivo: ArchivoApi): void {
  const enlace = document.createElement('a'), url = URL.createObjectURL(archivo.contenido)
  enlace.href = url; enlace.download = archivo.nombreArchivo; enlace.hidden = true
  document.body.append(enlace); enlace.click(); enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function descargarArchivoApi(ruta: string, opciones: OpcionesDescarga): Promise<void> {
  guardarArchivoApi(await obtenerArchivoApi(ruta, opciones))
}
