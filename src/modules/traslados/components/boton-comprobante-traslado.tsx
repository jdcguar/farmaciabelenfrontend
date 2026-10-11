import { useRef, useState } from 'react'
import iconoPdf from '../../../assets/acciones/pdf.png'
import { generarComprobanteTrasladoPdf } from '../traslado-api'
import type { RecursoDocumentoTraslado } from '../traslado.types'
import { ErrorTraslado } from './traslado-campo'
import styles from '../traslado.module.css'

export function BotonComprobanteTraslado({ recurso, id, referencia }: { recurso: 'traslados' | RecursoDocumentoTraslado; id: string; referencia: string }) {
  const [generando, setGenerando] = useState(false), [error, setError] = useState<unknown>(null)
  const pendiente = useRef(false)
  const generar = async () => {
    if (pendiente.current) return
    pendiente.current = true; setGenerando(true); setError(null)
    try { await generarComprobanteTrasladoPdf(recurso, id) } catch (e) { setError(e) }
    finally { pendiente.current = false; setGenerando(false) }
  }
  return <div className={styles.comprobanteFila}>
    <button type="button" className={styles.generarComprobante} title="Generar comprobante en PDF" aria-label={`Generar comprobante de ${referencia} en PDF`} aria-busy={generando} disabled={generando} onClick={generar}>
      <img src={iconoPdf} alt="" aria-hidden="true" /><span>{generando ? 'Generando…' : 'Generar comprobante'}</span>
    </button>
    <ErrorTraslado error={error} />
  </div>
}
