import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import formulario from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { crearInventario } from '../inventario-api'
import { etiqueta, grupoMovimiento, tiposMovimiento, vistas } from '../inventario.config'
import { entradaFormulario, fechaLocal, lineaInicial, tipoEsEntrada } from '../inventario-reglas'
import { camposFormulario, validarFormulario } from '../inventario-formulario'
import type { DatosFormulario, LineaMovimiento, TipoMovimiento, VistaInventario } from '../inventario.types'
import { CampoInventario, type Campo } from './inventario-campo'
import styles from '../inventario.module.css'
import { InventarioLoteFormulario } from './inventario-lote-formulario'
import { InventarioReservaFormulario } from './inventario-reserva-formulario'
import { InventarioOperacionFormulario } from './inventario-operacion-formulario'
import empleado from '../../empleados/components/empleado-crear-view.module.css'
import local from './inventario-posiciones.module.css'

type LineaUi = LineaMovimiento & { bodegaId?: string }
export function InventarioFormularioView({ vista, tipoInicial, onCambiosPendientes }: { vista: VistaInventario; tipoInicial?: TipoMovimiento | null; onCambiosPendientes: (pendientes: boolean) => void }) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const aparienciaEmpleados = vista === 'movimientos' || vista === 'ajustes' || vista === 'carga-inicial'
  const esMovimiento = ['movimientos', 'ajustes', 'carga-inicial'].includes(vista)
  const tipos = tiposMovimiento.filter(tipo => sesion.permisos.includes(`INVENTARIO.${grupoMovimiento(tipo)}.CREAR`) && (vista !== 'ajustes' || tipo.startsWith('AJUSTE_')) && (vista !== 'carga-inicial' || tipo === 'CARGA_INICIAL'))
  const tipoPredeterminado = tipoInicial && tipos.includes(tipoInicial) ? tipoInicial : tipos[0]
  const [datos, setDatos] = useState<DatosFormulario>({ sucursalId: sesion.sucursal.id, tipo: tipoPredeterminado ?? '', fechaIngreso: fechaLocal(), fechaCorte: fechaLocal(), alcance: 'PRODUCTO', clase: 'OPERATIVO' })
  const [lineas, setLineas] = useState<LineaUi[]>([lineaInicial(tipoPredeterminado)])
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [creado, setCreado] = useState<{ id: string } | null>(null)
  const [modificado, setModificado] = useState(false)
  const [clave, setClave] = useState(() => crypto.randomUUID())
  const [intento, setIntento] = useState(false)
  const enviando = useRef(false)
  const recurso = esMovimiento ? 'movimientos' : vista as 'lotes' | 'reservas' | 'bloqueos' | 'conteos'
  const regreso = sesion.permisos.includes(`INVENTARIO.${vistas[recurso].grupo}.VER`) ? vista === 'carga-inicial' ? '/inventario/carga-inicial' : vista === 'ajustes' ? '/inventario/ajustes' : `/inventario/${recurso}` : '/'
  useEffect(() => { onCambiosPendientes(modificado && !creado); return () => onCambiosPendientes(false) }, [creado, modificado, onCambiosPendientes])
  function modificar() { if (intento) { setClave(crypto.randomUUID()); setIntento(false) }; setModificado(true); setError(null) }
  function cambiar(campo: string, valor: string) {
    modificar()
    setDatos(d => ({ ...d, [campo]: valor, ...(campo === 'alcance' ? { objetivoId: '' } : campo === 'sucursalId' ? { bodegaId: '', ubicacionId: '', ...(d.alcance === 'UBICACION' ? { objetivoId: '' } : {}) } : campo === 'bodegaId' ? { ubicacionId: '' } : {}) }))
    if (campo === 'tipo' || campo === 'sucursalId') setLineas([lineaInicial(campo === 'tipo' ? valor as TipoMovimiento : datos.tipo as TipoMovimiento)])
    setErrores({})
  }
  function cambiarLinea(i: number, cambios: Partial<LineaUi>) { modificar(); setLineas(prev => prev.map((l, n) => n === i ? { ...l, ...cambios } : l)); setErrores({}) }
  async function guardar(e: FormEvent) {
    e.preventDefault(); if (enviando.current || creado) return
    const validacion = validarFormulario(vista, datos, lineas, corporativo)
    setErrores(validacion)
    if (Object.keys(validacion).length) { document.getElementById('inv-' + Object.keys(validacion)[0])?.focus(); return }
    enviando.current = true; setGuardando(true); setError(null); setIntento(true)
    try { const resultado = await crearInventario(recurso, entradaFormulario(vista, datos, lineas, clave)); setCreado(resultado); setModificado(false); onCambiosPendientes(false) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); if (e instanceof ErrorApi) setErrores(Object.fromEntries(e.detalles.map(d => [d.campo, d.mensaje]))) }
    finally { setGuardando(false); enviando.current = false }
  }
  const campos = camposFormulario(vista, datos, corporativo)
  const campo = (c: Campo) => <CampoInventario key={c.clave} campo={c} unidadCantidad={c.clave === 'cantidad' ? { unidadId: datos.unidadId } : undefined} value={datos[c.clave] ?? ''} onChange={v => cambiar(c.clave, v)} error={errores[c.clave]} disabled={guardando || Boolean(creado) || (c.clave === 'ubicacionId' && !datos.bodegaId)} soloSucursalActual={!corporativo} criterios={c.clave === 'bodegaId' || c.clave === 'objetivoId' && datos.alcance === 'UBICACION' ? { sucursalId: datos.sucursalId } : c.clave === 'ubicacionId' ? { bodegaId: datos.bodegaId } : undefined} />
  const lineasFormulario = esMovimiento && <fieldset id="inv-lineas" className={aparienciaEmpleados ? undefined : styles.seccion} disabled={guardando || Boolean(creado)}><legend><span className={aparienciaEmpleados ? empleado.numeroSeccion : formulario.numeroSeccion}>{aparienciaEmpleados ? '03' : '02'}</span> {vista === 'carga-inicial' ? 'Líneas de la carga inicial' : vista === 'ajustes' ? 'Líneas del ajuste' : 'Líneas del movimiento'}</legend>
            {aparienciaEmpleados && <p className={empleado.descripcionSeccion}>Registra origen, destino y cantidades por presentación. Las cantidades se convierten a unidades base en el servidor.</p>}
            {errores.lineas && <p role="alert">{errores.lineas}</p>}
            {lineas.map((l, i) => {
              const prefijo = `inv-lineas.${i}.`
              const render = (c: Campo, v: string, cambiar: (valor: string) => void, extra: Partial<Parameters<typeof CampoInventario>[0]> = {}) => <CampoInventario apariencia={aparienciaEmpleados ? 'empleados' : undefined} key={c.clave} prefijo={prefijo} campo={c} unidadCantidad={c.clave === 'cantidad' ? { unidadId: l.unidadId } : undefined} value={v} onChange={cambiar} error={errores[`lineas.${i}.${c.clave}`]} {...extra} />
              return <section key={i} className={aparienciaEmpleados ? local.lineaOperacion : styles.linea} aria-label={`Línea ${i + 1}`}><div className={aparienciaEmpleados ? local.cabeceraLinea : styles.acciones}><h3>Línea {i + 1}</h3>{lineas.length > 1 && <button type="button" className={aparienciaEmpleados ? empleado.botonSecundario : styles.secundario} onClick={() => { modificar(); setLineas(prev => prev.filter((_, n) => n !== i)); setErrores({}) }}>Quitar línea {i + 1}</button>}</div>
                <div className={aparienciaEmpleados ? empleado.grillaDos : styles.grilla}>
                  {render({ clave: 'presentacionId', etiqueta: 'Presentación', referencia: 'presentaciones', requerido: true }, l.presentacionId, v => cambiarLinea(i, { presentacionId: v, loteId: null, origenExistenciaId: null }))}
                  {!tipoEsEntrada(datos.tipo) ? render({ clave: 'origenExistenciaId', etiqueta: 'Existencia de origen', inventario: 'existencias', requerido: true }, l.origenExistenciaId ?? '', v => cambiarLinea(i, { origenExistenciaId: v }), { consulta: { sucursalId: datos.sucursalId, presentacionId: l.presentacionId || undefined }, disabled: !l.presentacionId, onElegir: r => cambiarLinea(i, { origenExistenciaId: r.id, presentacionId: r.presentacionId!, loteId: r.loteId ?? null, ...(datos.tipo === 'BLOQUEO' ? { destinoUbicacionId: r.ubicacionId! } : datos.tipo === 'REUBICACION' ? { condicionDestino: r.condicion! } : {}) }) }) : render({ clave: 'loteId', etiqueta: 'Lote', inventario: 'lotes', ayuda: 'Selecciona el lote si el producto requiere trazabilidad.' }, l.loteId ?? '', v => cambiarLinea(i, { loteId: v || null }), { consulta: { presentacionId: l.presentacionId || undefined }, disabled: !l.presentacionId })}
                  {datos.tipo !== 'AJUSTE_NEGATIVO' && datos.tipo !== 'BLOQUEO' && <>
                    {render({ clave: 'bodegaId', etiqueta: 'Bodega de destino', referencia: 'bodegas', requerido: true }, l.bodegaId ?? '', v => cambiarLinea(i, { bodegaId: v, destinoUbicacionId: null }), { criterios: { sucursalId: datos.sucursalId } })}
                    {render({ clave: 'destinoUbicacionId', etiqueta: 'Ubicación de destino', referencia: 'ubicaciones', requerido: true }, l.destinoUbicacionId ?? '', v => cambiarLinea(i, { destinoUbicacionId: v }), { criterios: { bodegaId: l.bodegaId }, disabled: !l.bodegaId })}
                  </>}
                  {tipoEsEntrada(datos.tipo) && render({ clave: 'condicionDestino', etiqueta: 'Condición de ingreso', tipo: 'opciones', requerido: true, opciones: ['APTA', 'BLOQUEADA', 'CUARENTENA'].map(v => ({ valor: v, etiqueta: etiqueta(v) })) }, l.condicionDestino, v => cambiarLinea(i, { condicionDestino: v as LineaMovimiento['condicionDestino'] }))}
                  {render({ clave: 'unidadId', etiqueta: 'Unidad de la cantidad', referencia: 'unidades', requerido: true }, l.unidadId, v => cambiarLinea(i, { unidadId: v }))}
                  {render({ clave: 'cantidad', etiqueta: 'Cantidad', tipo: 'decimal', requerido: true }, l.cantidad, v => cambiarLinea(i, { cantidad: v }))}
                  {render({ clave: 'costeUnitarioBase', etiqueta: 'Coste unitario base (GTQ)', tipo: 'decimal', ayuda: 'Vacío: coste pendiente. Cero expresa un coste conocido de cero.' }, l.costeUnitarioBase ?? '', v => cambiarLinea(i, { costeUnitarioBase: v || null }))}
                </div>
                {datos.tipo === 'BLOQUEO' && <small>El bloqueo parcial conserva la ubicación de origen y cambia la condición a bloqueada.</small>}
                {datos.tipo === 'CUARENTENA' && <small>El destino debe ser una ubicación de tipo cuarentena.</small>}
                {datos.tipo === 'REUBICACION' && <small>La reubicación conserva la condición de la existencia de origen: {etiqueta(l.condicionDestino)}.</small>}
              </section>
            })}
            <button className={aparienciaEmpleados ? empleado.botonSecundario : styles.secundario} type="button" disabled={lineas.length >= 100} onClick={() => { modificar(); setLineas(prev => [...prev, lineaInicial(datos.tipo as TipoMovimiento)]) }}><IconoAccion nombre="agregar" />Agregar línea</button>
          </fieldset>
  if (vista === 'movimientos' || vista === 'bloqueos' || vista === 'conteos' || vista === 'ajustes' || vista === 'carga-inicial') return <InventarioOperacionFormulario vista={vista} datos={datos} errores={errores} error={error} guardando={guardando} creado={creado} regreso={regreso} rutaDetalle={esMovimiento ? '/inventario/movimientos' : regreso} tipos={tipos} lineas={lineasFormulario} onCambiar={cambiar} onGuardar={guardar} />
  if (vista === 'lotes') return <InventarioLoteFormulario datos={datos} errores={errores} error={error} guardando={guardando} creado={creado} regreso={regreso} onCambiar={cambiar} onGuardar={guardar} />
  if (vista === 'reservas') return <InventarioReservaFormulario datos={datos} errores={errores} error={error} guardando={guardando} creado={creado} regreso={regreso} onCambiar={cambiar} onGuardar={guardar} />
  return <section className={`${formulario.paginaFormulario} ${styles.modulo}`}>
    <header className={formulario.encabezadoPagina}><h1>Registrar {vistas[vista].singular}</h1><span className={formulario.indicadorFormulario}>Campos obligatorios *</span></header>
    <p className={styles.descripcion}>{vistas[vista].descripcion}</p>
    <form onSubmitCapture={validarCantidadesAlEnviar} noValidate onSubmit={e => void guardar(e)} className={formulario.formulario} aria-busy={guardando}>
      <div className={formulario.layoutFormulario}>
        <NavegacionSecciones lateral secciones={[{ id: 'inv-datos', titulo: 'Datos del registro' }, ...(esMovimiento ? [{ id: 'inv-lineas', titulo: 'Líneas del movimiento' }] : [])]} />
        <div className={formulario.contenidoFormulario}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <fieldset className={styles.seccion} id="inv-datos" disabled={guardando || Boolean(creado)}><legend><span className={formulario.numeroSeccion}>01</span> Datos del registro</legend>
            {esMovimiento && <><CampoInventario campo={{ clave: 'tipo', etiqueta: 'Tipo de movimiento', tipo: 'opciones', requerido: true, opciones: tipos.map(t => ({ valor: t, etiqueta: etiqueta(t) })) }} value={datos.tipo} onChange={v => cambiar('tipo', v)} />
              <p className={styles.aviso}>El movimiento se guarda pendiente. Las existencias cambian al confirmarlo. Las cantidades se convierten a la unidad base del producto.</p></>}
            <div className={styles.grilla}>{campos.map(campo)}</div>
          </fieldset>
          {lineasFormulario}
        </div>
      </div>
      <div className={formulario.accionesFormulario}><button type="button" className={formulario.botonSecundario} disabled={guardando} onClick={() => onNavegar(regreso)}>Cancelar</button><button className={formulario.botonPrincipal} disabled={guardando || Boolean(creado)}><IconoAccion nombre="guardar" />{guardando ? 'Guardando…' : esMovimiento ? 'Guardar pendiente' : 'Guardar registro'}</button></div>
    </form>
    <ModalEstado abierto={Boolean(creado)} tipo="exito" titulo="Registro guardado" mensaje={esMovimiento ? 'El movimiento está pendiente. Revísalo y confírmalo para actualizar las existencias.' : 'El registro se guardó correctamente.'} textoAccionPrincipal={regreso !== '/' ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={() => onNavegar(regreso !== '/' ? `${regreso}/${creado!.id}` : '/')} onCerrar={() => onNavegar(regreso)} />
  </section>
}
