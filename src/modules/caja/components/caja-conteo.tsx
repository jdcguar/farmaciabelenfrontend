import type { ConteoCaja, ErroresCaja } from '../caja.types'
import { centavosCaja, decimalCaja, esMontoCaja, totalConteoCaja } from '../caja-reglas'
import { CampoCaja, ErrorCaja } from './caja-comun'
import styles from '../caja.module.css'
export function CajaConteo({ lineas, onChange, errores, disabled }: { lineas: ConteoCaja[]; onChange: (v: ConteoCaja[]) => void; errores: ErroresCaja; disabled?: boolean }) {
  const valido = lineas.length > 0 && lineas.every(l => esMontoCaja(l.valor, true) && /^\d{1,9}$/.test(l.cantidad) && Number(l.cantidad) <= 100000000)
  return <div className={styles.contenido}><p>{lineas.length ? 'Introduce cuántos billetes o monedas tienes de cada denominación autorizada.' : 'Selecciona el documento de origen para cargar sus denominaciones autorizadas.'}</p><ErrorCaja error={errores.denominaciones} /><div className={styles.lineas}>{lineas.map((l, i) => <div className={styles.linea} key={l.valor}><div><strong>Q {l.valor}</strong><p>{valido ? `Subtotal: Q ${decimalCaja(centavosCaja(l.valor) * BigInt(l.cantidad))}` : 'Subtotal pendiente de conteo'}</p></div><CampoCaja nombre={`denominaciones.${i}.cantidad`} etiqueta={`Cantidad de Q ${l.valor}`} value={l.cantidad} inputMode="numeric" maxLength={9} disabled={disabled} error={errores[`denominaciones.${i}.cantidad`]} onChange={v => onChange(lineas.map((x, n) => n === i ? { ...x, cantidad: v } : x))} /></div>)}</div><p className={styles.monto} role="status">Total contado: {valido ? `Q ${decimalCaja(totalConteoCaja(lineas))}` : 'Completa el conteo'}</p></div>
}
