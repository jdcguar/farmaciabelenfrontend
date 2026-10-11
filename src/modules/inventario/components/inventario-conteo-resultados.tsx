import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { TablaDatos, PaginacionTabla, type ColumnaTabla } from '../../../shared/components/tabla-datos'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { IconoPosicion } from './inventario-posicion-identidad'
import { EstadoOperacion } from './inventario-estado-operacion'
import formulario from '../../empleados/components/empleado-crear-view.module.css'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { NombreReferencia } from '../../catalogos-farmacia/components/referencia-catalogo'
import { obtenerInventario, registrarConteo } from '../inventario-api'
import { esDecimal, textoCantidad } from '../inventario-reglas'
import type { Condicion, LineaConteo, RegistroInventario } from '../inventario.types'
import { etiqueta } from '../inventario.config'
import { CampoInventario } from './inventario-campo'
import { NombreInventario, ValorInventario } from './inventario-datos'
import styles from '../../empleados/components/empleado-gestion.module.css'
import local from './inventario-posiciones.module.css'

type Captura = { cantidad: string; evidencia: string }
type Encontrada = Captura & { presentacionId: string; loteId: string | null; condicion: Condicion }
const encontradaInicial = (): Encontrada => ({ presentacionId: '', loteId: null, condicion: 'APTA', cantidad: '', evidencia: '' })
export function InventarioConteoResultados({ id, onCambiosPendientes }: { id: string; onCambiosPendientes: (valor: boolean) => void }) {
  const { onNavegar } = useContextoCatalogo()
  const [conteo, setConteo] = useState<RegistroInventario | null>(null), [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [revision, setRevision] = useState(0), [finalizada, setFinalizada] = useState('')
  const [pagina, setPagina] = useState(1), [tamanoPagina, setTamanoPagina] = useState(50)
  const [capturas, setCapturas] = useState<Record<string, Captura>>({}), [encontradas, setEncontradas] = useState<Encontrada[]>([])
  const [nueva, setNueva] = useState<Encontrada>(encontradaInicial)
  const [guardando, setGuardando] = useState(false), [exito, setExito] = useState(false)
  const enviando = useRef(false), clave = `${id}/${revision}`, cargando = finalizada !== clave
  const pendientes = Object.keys(capturas).length + encontradas.length
  const nuevaModificada = Boolean(nueva.presentacionId || nueva.cantidad || nueva.evidencia)
  useEffect(() => { onCambiosPendientes(pendientes > 0 || nuevaModificada); return () => onCambiosPendientes(false) }, [nuevaModificada, onCambiosPendientes, pendientes])
  useEffect(() => {
    const c = new AbortController()
    void obtenerInventario('conteos', id, c.signal).then(r => { if (!c.signal.aborted) { setConteo(r); setConflicto(false); setErrorCarga(null); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setErrorCarga(e instanceof Error ? e.message : 'No se pudo cargar el conteo.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, id])
  const lineas = (conteo?.lineas ?? []) as LineaConteo[]
  const paginaActual = Math.min(pagina, Math.max(1, Math.ceil(lineas.length / tamanoPagina)))
  const visibles = lineas.slice((paginaActual - 1) * tamanoPagina, paginaActual * tamanoPagina)
  function capturar(l: LineaConteo, campo: keyof Captura, valor: string) { setCapturas(c => ({ ...c, [l.existenciaId]: { cantidad: c[l.existenciaId]?.cantidad ?? l.contadaBase ?? '', evidencia: c[l.existenciaId]?.evidencia ?? l.evidencia ?? '', [campo]: valor } })) }
  async function guardar(e: FormEvent) {
    e.preventDefault(); if (enviando.current || !conteo || cargando || errorCarga || conflicto || conteo.estado !== 'ABIERTO') return
    if (nuevaModificada) { setError('Agrega la posición encontrada a la captura o limpia sus campos antes de guardar.'); return }
    if (!pendientes || pendientes > 200) { setError('Guarda entre 1 y 200 posiciones por operación.'); return }
    const valores = [...Object.values(capturas), ...encontradas]
    if (valores.some(v => !esDecimal(v.cantidad, true) || v.evidencia.trim().length < 5)) { setError('Cada posición requiere cantidad desde cero según la precisión de su unidad y evidencia de al menos cinco caracteres.'); return }
    enviando.current = true; setGuardando(true); setError(null)
    try {
      const r = await registrarConteo(id, conteo.version, [
        ...Object.entries(capturas).map(([existenciaId, c]) => ({ existenciaId, loteId: null, condicion: 'APTA', cantidad: c.cantidad.trim(), evidencia: c.evidencia.trim() })),
        ...encontradas.map(e => ({ existenciaId: null, presentacionId: e.presentacionId, loteId: e.loteId || null, condicion: e.condicion, cantidad: e.cantidad.trim(), evidencia: e.evidencia.trim() })),
      ])
      setConteo(r); setCapturas({}); setEncontradas([]); setNueva(encontradaInicial()); onCambiosPendientes(false); setExito(true)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudieron guardar las cantidades.'); setConflicto(e instanceof ErrorApi && e.estadoHttp === 409) }
    finally { enviando.current = false; setGuardando(false) }
  }
  const columnas: ColumnaTabla<LineaConteo>[] = [
    { id: 'posicion', titulo: 'Existencia', obtenerValor: l => l.existenciaId, celda: l => <NombreInventario recurso="existencias" id={l.existenciaId} /> },
    { id: 'esperada', titulo: 'Cantidad esperada', obtenerValor: l => l.esperadaBase, celda: l => textoCantidad(l.esperadaBase) },
    { id: 'cantidad', titulo: 'Cantidad contada', obtenerValor: l => l.contadaBase, celda: l => <CampoInventario apariencia="empleados" prefijo={`conteo-${l.id}-`} campo={{ clave: 'cantidad', etiqueta: 'Cantidad contada', tipo: 'decimal', requerido: true }} unidadCantidad={{ existenciaId: l.existenciaId }} value={capturas[l.existenciaId]?.cantidad ?? l.contadaBase ?? ''} onChange={v => capturar(l, 'cantidad', v)} disabled={guardando || conflicto} error={capturas[l.existenciaId]?.cantidad && !esDecimal(capturas[l.existenciaId].cantidad, true) ? 'Cantidad inválida.' : undefined} /> },
    { id: 'evidencia', titulo: 'Evidencia', obtenerValor: l => l.evidencia, celda: l => <CampoInventario apariencia="empleados" prefijo={`conteo-${l.id}-`} campo={{ clave: 'evidencia', etiqueta: 'Evidencia del resultado', requerido: true, maximo: 500 }} value={capturas[l.existenciaId]?.evidencia ?? l.evidencia ?? ''} onChange={v => capturar(l, 'evidencia', v)} disabled={guardando || conflicto} /> },
  ]
  return <section aria-labelledby="titulo-captura">
    <header className={formulario.encabezadoPagina}><h1 id="titulo-captura">Registrar conteo físico</h1><span className={formulario.indicadorFormulario}>Captura de cantidades</span></header><button type="button" className={formulario.botonSecundario} disabled={guardando} onClick={() => onNavegar(`/inventario/conteos/${id}`)}>Volver al detalle</button>
    {cargando && <p className={local.estadoCarga} role="status">Cargando conteo…</p>}
    {!cargando && errorCarga && <div className={styles.alertaError} role="alert"><p>{errorCarga}</p><button type="button" onClick={() => setRevision(r => r + 1)}>Reintentar</button></div>}
    {!cargando && !errorCarga && conteo && (conteo.estado !== 'ABIERTO' ? <div className={styles.alertaAdvertencia} role="status"><p>El conteo ya no está abierto. Sus cantidades no pueden editarse.</p></div> : <form onSubmitCapture={validarCantidadesAlEnviar} noValidate onSubmit={e => void guardar(e)} className={formulario.formulario} aria-busy={guardando}>
      <fieldset className={formulario.panelPerfil} disabled={guardando || conflicto}><legend>Resumen del conteo</legend><div className={formulario.selectorFoto}><div className={`${formulario.vistaPreviaFoto} ${local.perfilIcono}`}><IconoPosicion /></div><div className={formulario.controlesFoto}><strong>{conteo.referencia}</strong><EstadoOperacion valor={conteo.estado} /><p><ValorInventario campo="ubicacionId" registro={conteo} /></p><p>Captura cantidades en unidades base. Cero significa que no se encontraron unidades. Guardar resultados no cambia las existencias; los ajustes se aplican al conciliar el conteo.</p></div></div><nav className={formulario.navegacionFormulario} aria-label="Secciones de captura"><p>Completa los resultados</p>{[{ id: 'inv-capturas', titulo: 'Posiciones del conteo', descripcion: 'Cantidades y evidencia por existencia.' }, { id: 'inv-encontradas', titulo: 'Unidades encontradas', descripcion: 'Posiciones sin registro previo.' }].map((s, i) => <a key={s.id} href={`#${s.id}`} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}><span>{String(i + 1).padStart(2, '0')}</span><div>{s.titulo}<small>{s.descripcion}</small></div></a>)}</nav></fieldset>
      {error && <div role="alert" className={`${formulario.alertaError} ${local.errorCaptura}`}>{error}<button type="button" className={formulario.botonSecundario} disabled={guardando} onClick={() => { setCapturas({}); setEncontradas([]); setNueva(encontradaInicial()); setRevision(r => r + 1) }}>Descartar captura y recargar</button></div>}
      <fieldset id="inv-capturas" disabled={guardando || conflicto}><legend><span className={formulario.numeroSeccion}>01</span>Posiciones del conteo</legend><p className={formulario.descripcionSeccion}>{pendientes} {pendientes === 1 ? 'posición modificada' : 'posiciones modificadas'}. Máximo 200 por guardado.</p><div className={local.tablaCaptura}><TablaDatos apariencia="tarjetas" descripcion="Captura de conteo en unidades base" datos={visibles} columnas={columnas} obtenerIdFila={l => l.id} filtros={[]} ordenamiento={[]} onFiltrosChange={() => {}} onOrdenamientoChange={() => {}} />
        <PaginacionTabla apariencia="tarjetas" pagina={paginaActual} tamanoPagina={tamanoPagina} total={lineas.length} totalPaginas={Math.ceil(lineas.length / tamanoPagina)} unidadSingular="posición" unidadPlural="posiciones" onPaginaChange={setPagina} onTamanoPaginaChange={t => { setTamanoPagina(t); setPagina(1) }} />
      </div></fieldset>
      <fieldset id="inv-encontradas" disabled={guardando || conflicto}><legend><span className={formulario.numeroSeccion}>02</span>Unidades encontradas</legend><p className={formulario.descripcionSeccion}>Agrega presentaciones, lotes y condiciones encontrados sin posición previa.</p><div className={formulario.grillaDos}>
        <CampoInventario apariencia="empleados" prefijo="encontrada-" campo={{ clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones' }} value={nueva.presentacionId} onChange={v => setNueva(n => ({ ...n, presentacionId: v, loteId: null }))} />
        <CampoInventario apariencia="empleados" prefijo="encontrada-" campo={{ clave: 'loteId', etiqueta: 'Lote', inventario: 'lotes' }} value={nueva.loteId ?? ''} onChange={v => setNueva(n => ({ ...n, loteId: v || null }))} consulta={{ presentacionId: nueva.presentacionId || undefined }} disabled={!nueva.presentacionId} />
        <CampoInventario apariencia="empleados" prefijo="encontrada-" campo={{ clave: 'condicion', etiqueta: 'Condición', tipo: 'opciones', opciones: ['APTA', 'BLOQUEADA', 'CUARENTENA'].map(v => ({ valor: v, etiqueta: etiqueta(v) })) }} value={nueva.condicion} onChange={v => setNueva(n => ({ ...n, condicion: v as Condicion }))} />
        <CampoInventario apariencia="empleados" prefijo="encontrada-" campo={{ clave: 'cantidad', etiqueta: 'Cantidad en unidades base', tipo: 'decimal' }} unidadCantidad={{ presentacionId: nueva.presentacionId }} value={nueva.cantidad} onChange={v => setNueva(n => ({ ...n, cantidad: v }))} />
        <CampoInventario apariencia="empleados" prefijo="encontrada-" campo={{ clave: 'evidencia', etiqueta: 'Evidencia', tipo: 'area', maximo: 500 }} value={nueva.evidencia} onChange={v => setNueva(n => ({ ...n, evidencia: v }))} />
      </div><div className={local.cabeceraLinea}><button type="button" className={formulario.botonSecundario} disabled={pendientes >= 200} onClick={() => {
        if (!nueva.presentacionId || !esDecimal(nueva.cantidad, true) || nueva.evidencia.trim().length < 5) { setError('Completa presentación, cantidad y evidencia de la posición encontrada.'); return }
        if (encontradas.some(e => e.presentacionId === nueva.presentacionId && e.loteId === nueva.loteId && e.condicion === nueva.condicion)) { setError('La posición encontrada ya está agregada.'); return }
        setEncontradas(prev => [...prev, nueva]); setNueva(encontradaInicial()); setError(null)
      }}>Agregar a la captura</button><button type="button" className={formulario.botonSecundario} onClick={() => setNueva(encontradaInicial())}>Limpiar campos</button></div>
        {encontradas.map((e, i) => <div className={local.lineaOperacion} key={i}><NombreReferencia referencia="presentaciones" id={e.presentacionId} /> · {e.loteId ? <NombreInventario recurso="lotes" id={e.loteId} /> : 'Sin lote'} · <span>{textoCantidad(e.cantidad)} unidades base · {etiqueta(e.condicion)} · </span><button type="button" className={formulario.botonSecundario} onClick={() => setEncontradas(prev => prev.filter((_, n) => n !== i))}>Quitar posición encontrada {i + 1}</button></div>)}
      </fieldset>
      <div className={formulario.accionesFormulario}><p>{pendientes} {pendientes === 1 ? 'posición modificada' : 'posiciones modificadas'}</p><div><button type="button" className={formulario.botonSecundario} disabled={guardando} onClick={() => onNavegar(`/inventario/conteos/${id}`)}><IconoAccion nombre="cancelar" className={formulario.iconoBoton} /><span>Cancelar</span></button><button type="submit" className={formulario.botonPrincipal} disabled={guardando || conflicto || pendientes === 0 || pendientes > 200}><IconoAccion nombre="guardar" className={formulario.iconoBoton} /><span>{guardando ? 'Guardando cantidades…' : 'Guardar cantidades'}</span></button></div></div>
    </form>)}
    <ModalEstado abierto={exito} tipo="exito" titulo="Cantidades registradas" mensaje="Los resultados se guardaron. Continúa con las demás posiciones o vuelve al detalle para revisar y cerrar el conteo." textoAccionPrincipal="Continuar captura" onAccionPrincipal={() => setExito(false)} textoAccionSecundaria="Ver detalle" onAccionSecundaria={() => onNavegar(`/inventario/conteos/${id}`)} onCerrar={() => setExito(false)} />
  </section>
}
