import { ErrorApi } from '../../shared/api/cliente-api'
export function erroresApi(error: unknown) { return error instanceof ErrorApi ? Object.fromEntries(error.detalles.map(d => [d.campo, d.mensaje])) : {} }
