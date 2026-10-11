import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { TablaDatos, type ColumnaTabla } from '../../../shared/components/tabla-datos/tabla-datos'
import { PaginacionTabla } from '../../../shared/components/tabla-datos/paginacion-tabla'
import type { RegistroFinanzas, PaginaFinanzas } from '../presupuestos.types'
import { operarFinanzas } from '../presupuestos-api'
import form from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import local from '../presupuestos.module.css'
import { SelectorReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
export type CampoFinanzas = { nombre: string; etiqueta: string; tipo?: 'month' | 'date' | 'decimal' | 'porcentaje' | 'sucursal'; inicial?: string }
export type AccionFinanzas = { titulo: string; ruta: string; method?: 'POST' | 'PATCH'; version?: number; extra?: Record<string, unknown>; campos?: CampoFinanzas[]; mensaje?: string; evidenciaPdf?: boolean; sucursalSeleccionable?: boolean }
export function FormularioFinanzas({ sucursalId, accion, onCerrar, onGuardado }: { sucursalId: string; accion: AccionFinanzas; onCerrar: () => void; onGuardado: (r: unknown) => void }) {
  const prefijo = useId(), [valores, setValores] = useState<Record<string, string>>(Object.fromEntries((accion.campos ?? []).map(c => [c.nombre, c.inicial ?? '']))), [motivo, setMotivo] = useState(''), [evidencia, setEvidencia] = useState(''), [error, setError] = useState(''), [errores, setErrores] = useState<Record<string, string>>({}), [guardando, setGuardando] = useState(false), [confirmar, setConfirmar] = useState(false)
  const clave = useRef(crypto.randomUUID()), formulario = useRef<HTMLFormElement>(null), entradaArchivo = useRef<HTMLInputElement>(null), enCurso = useRef(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  useEffect(() => { if (!confirmar && archivo && entradaArchivo.current) { const seleccion = new DataTransfer(); seleccion.items.add(archivo); entradaArchivo.current.files = seleccion.files } }, [confirmar, archivo])
  useEffect(() => {
    if (confirmar) return
    const campo = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? formulario.current?.querySelector<HTMLElement>('input, textarea')
    campo?.focus({ preventScroll: true })
  }, [confirmar, error])
  function revisar(e: FormEvent) { e.preventDefault(); if (accion.sucursalSeleccionable && !valores.sucursalId) { setError('Selecciona la sucursal de la caja chica.'); setErrores({ sucursalId: 'La sucursal es obligatoria.' }); return } if (accion.evidenciaPdf && !archivo) { setError('Selecciona un comprobante PDF de hasta 10 MB.'); setErrores({ archivo: 'El comprobante PDF es obligatorio.' }); return } setError(''); setErrores({}); setConfirmar(true) }
  async function guardar() { if (enCurso.current) return; enCurso.current = true; setGuardando(true); setError(''); const sugerir = accion.ruta === 'presupuestos/sugerencia'
    try {
      const campos = { ...valores }; if (accion.sucursalSeleccionable) delete campos.sucursalId
      const datos = { ...campos, ...accion.extra, ...(accion.version ? { version: accion.version } : {}), motivo, ...(!sugerir ? { ...(!accion.evidenciaPdf ? { evidencia } : {}), claveIdempotencia: clave.current } : {}) }
      let cuerpo: unknown = datos
      if (accion.evidenciaPdf && archivo) { const carga = new FormData(); carga.append('datos', JSON.stringify(datos)); carga.append('archivo', archivo); cuerpo = carga }
      const resultado = await operarFinanzas<unknown>(accion.sucursalSeleccionable ? valores.sucursalId! : sucursalId, accion.ruta, cuerpo, accion.method); setConfirmar(false); onGuardado(resultado)
    }
    catch (e) { setConfirmar(false); setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); if (e instanceof ErrorApi) { setErrores(Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje]))); if (e.estadoHttp === 409) setError(e.message + ' Vuelve al detalle y actualiza antes de reenviar.'); } }
    finally { enCurso.current = false; setGuardando(false) }
  }
  return <ModalEstado abierto apariencia="formulario" tipo="informacion" titulo={accion.titulo} cargando={guardando}
    textoAccionPrincipal={guardando ? 'Guardando…' : confirmar ? 'Confirmar' : 'Continuar'}
    onAccionPrincipal={() => { if (confirmar) void guardar(); else formulario.current?.requestSubmit() }}
    textoAccionSecundaria={confirmar ? 'Volver' : 'Cancelar'}
    onAccionSecundaria={() => { if (confirmar) setConfirmar(false); else onCerrar() }}
    onCerrar={() => { if (!enCurso.current) onCerrar() }}
    mensaje={confirmar ? <div className={local.contenidoModal}>
      <p>{accion.mensaje ?? 'La operación quedará registrada en el historial de la sucursal.'}</p>
      <ResumenFinanzas valores={{ ...Object.fromEntries((accion.campos ?? []).map(c => [c.etiqueta, valores[c.nombre]])), Motivo: motivo, ...(accion.ruta !== 'presupuestos/sugerencia' ? { Evidencia: accion.evidenciaPdf ? archivo?.name : evidencia } : {}) }} />
      <p>Revisa los datos antes de confirmar.</p>
    </div> : <form ref={formulario} className={`${form.formulario} ${local.contenidoModal}`} onSubmit={revisar}>
      {accion.mensaje && <p>{accion.mensaje}</p>}
      {error && <p role="alert" className={local.aviso}>{error}</p>}
      <div className={form.grillaDos}>
        {(accion.campos ?? []).map(c => <div className={form.campo} key={c.nombre}>
          <label htmlFor={prefijo + c.nombre}>{c.etiqueta}</label>
          {c.tipo === 'sucursal' ? <SelectorReferencia id={prefijo + c.nombre} referencia="sucursales" value={valores[c.nombre] ?? ''} requerido error={errores[c.nombre]} descripcionId={errores[c.nombre] ? prefijo + c.nombre + '-error' : undefined} onChange={id => { clave.current = crypto.randomUUID(); setValores(v => ({ ...v, [c.nombre]: id })) }} /> : <input id={prefijo + c.nombre} required type={c.tipo === 'month' || c.tipo === 'date' ? c.tipo : 'text'}
            inputMode={c.tipo === 'decimal' || c.tipo === 'porcentaje' ? 'decimal' : undefined}
            pattern={c.tipo === 'decimal' ? '\\d{1,13}(\\.\\d{1,2})?' : c.tipo === 'porcentaje' ? '-?\\d{1,3}(\\.\\d{1,2})?' : undefined}
            maxLength={c.tipo === 'decimal' ? 16 : 36} value={valores[c.nombre] ?? ''}
            aria-invalid={!!errores[c.nombre]} aria-describedby={errores[c.nombre] ? prefijo + c.nombre + '-error' : undefined}
            onChange={e => { clave.current = crypto.randomUUID(); setValores(v => ({ ...v, [c.nombre]: e.target.value })) }} />}
          {errores[c.nombre] && <small id={prefijo + c.nombre + '-error'} className={form.errorCampo}>{errores[c.nombre]}</small>}
        </div>)}
        <div className={form.campo}>
          <label htmlFor={prefijo + 'motivo'}>Motivo</label>
          <textarea id={prefijo + 'motivo'} required minLength={3} maxLength={250} value={motivo}
            aria-invalid={!!errores.motivo} aria-describedby={errores.motivo ? prefijo + 'motivo-error' : undefined}
            onChange={e => { clave.current = crypto.randomUUID(); setMotivo(e.target.value) }} />
          {errores.motivo && <small id={prefijo + 'motivo-error'} className={form.errorCampo}>{errores.motivo}</small>}
        </div>
        {accion.evidenciaPdf ? <div className={form.campo}>
          <label htmlFor={prefijo + 'archivo'}>Comprobante PDF</label>
          <input id={prefijo + 'archivo'} ref={entradaArchivo} type="file" accept="application/pdf,.pdf" required={!archivo} aria-invalid={!!errores.archivo} aria-describedby={prefijo + 'archivo-ayuda'}
            onChange={e => { const f = e.target.files?.[0] ?? null; clave.current = crypto.randomUUID();
              if (f && (f.type !== 'application/pdf' || f.size === 0 || f.size > 10 * 1024 * 1024)) { setArchivo(null); setError('Selecciona un PDF con contenido de hasta 10 MB.'); setErrores({ archivo: 'El archivo no es válido.' }); e.target.value = ''; return }
              setArchivo(f); setError(''); setErrores({})
            }} />
          <small id={prefijo + 'archivo-ayuda'}>{errores.archivo ?? (archivo ? `Seleccionado: ${archivo.name} · ${Math.ceil(archivo.size / 1024)} KB. Puedes seleccionar otro archivo.` : 'Archivo PDF de hasta 10 MB.')}</small>
        </div> : accion.ruta !== 'presupuestos/sugerencia' && <div className={form.campo}>
          <label htmlFor={prefijo + 'evidencia'}>Evidencia o referencia del comprobante</label>
          <textarea id={prefijo + 'evidencia'} required minLength={3} maxLength={1000} value={evidencia}
            aria-invalid={!!errores.evidencia} aria-describedby={errores.evidencia ? prefijo + 'evidencia-error' : undefined}
            onChange={e => { clave.current = crypto.randomUUID(); setEvidencia(e.target.value) }} />
          {errores.evidencia && <small id={prefijo + 'evidencia-error'} className={form.errorCampo}>{errores.evidencia}</small>}
        </div>}
      </div>
      <button type="submit" hidden tabIndex={-1} aria-hidden="true">Continuar</button>
    </form>} />
}
export function TablaFinanzas<T extends RegistroFinanzas>({ datos, columnas, descripcion }: { datos: T[]; columnas: ColumnaTabla<T>[]; descripcion: string }) { return <div className={local.tabla}><TablaDatos apariencia="tarjetas" descripcion={descripcion} datos={datos} columnas={columnas} filtros={[]} ordenamiento={[]} obtenerIdFila={r => r.id} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} /></div> }
export function PaginacionFinanzas({ lista, onPagina, onTamano, nombre }: { lista: PaginaFinanzas<RegistroFinanzas>; onPagina: (n: number) => void; onTamano: (n: number) => void; nombre: 'presupuestos' | 'liquidaciones' }) { return <PaginacionTabla apariencia="tarjetas" {...lista} unidadSingular={nombre === 'presupuestos' ? 'presupuesto' : 'liquidación'} unidadPlural={nombre} onPaginaChange={onPagina} onTamanoPaginaChange={onTamano} /> }
export function ResumenFinanzas({ valores }: { valores: Record<string, ReactNode> }) { return <dl className={local.resumen}>{Object.entries(valores).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> }
