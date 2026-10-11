import { puedeAccederPantalla } from '../../../shared/seguridad/navegacion'
import { useEffect, useState } from 'react'
import { consultarFinanzas } from '../presupuestos-api'
import type { ListaLiquidaciones } from '../presupuestos.types'
import { monto, botonFinanzas } from '../finanzas-reglas'
import styles from '../../../shared/components/gestion-modulo/gestion-modulo.module.css'

export function CajaChicaResumen({ sucursalId, onNavegar, permisos }: { sucursalId: string; onNavegar: (ruta: string) => void; permisos: readonly string[] }) {
  const [datos, setDatos] = useState<ListaLiquidaciones | null>(null), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    void consultarFinanzas<ListaLiquidaciones>(sucursalId, 'caja-chica/liquidaciones?pagina=1&tamanoPagina=50', c.signal).then(r => { setDatos(r); setError('') }).catch(e => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No fue posible consultar el fondo.') })
    return () => c.abort()
  }, [sucursalId, revision])
  return <article id="sucursal-caja-chica" className={styles.tarjetaDetalle}><h2><span className={styles.numeroSeccion}>04</span> Caja chica</h2>
    {error ? <p role="alert">{error} {botonFinanzas('Reintentar', () => setRevision(v => v + 1))}</p> : !datos ? <p role="status">Consultando fondo…</p> : datos.fondo ? <dl>
      <div><dt>Fondo asignado</dt><dd>{monto(datos.fondo.fondo)}</dd></div>
      <div><dt>Efectivo disponible</dt><dd>{monto(datos.activa?.disponible ?? datos.fondo.saldo)}</dd></div>
    </dl> : <p>No hay fondo asignado.</p>}
    <p>{puedeAccederPantalla('caja-chica', permisos) && botonFinanzas('Ver caja chica', () => onNavegar(`/caja/chica/${sucursalId}`))} {puedeAccederPantalla('caja-liquidaciones', permisos) && botonFinanzas('Ver liquidaciones', () => onNavegar(`/caja/liquidaciones/${sucursalId}`))}</p>
  </article>
}
