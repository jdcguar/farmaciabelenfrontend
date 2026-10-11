import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import type { FormEvent, ReactNode } from 'react'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { camposFormulario } from '../inventario-formulario'
import { etiqueta } from '../inventario.config'
import type { DatosFormulario, TipoMovimiento } from '../inventario.types'
import { CampoInventario } from './inventario-campo'
import { IconoPosicion } from './inventario-posicion-identidad'
import styles from '../../empleados/components/empleado-crear-view.module.css'
import local from './inventario-posiciones.module.css'

type Props = {
  vista: 'movimientos' | 'bloqueos' | 'conteos' | 'ajustes' | 'carga-inicial'; datos: DatosFormulario; errores: Record<string, string>; error: string | null; guardando: boolean
  creado: { id: string } | null; regreso: string; rutaDetalle?: string; tipos: TipoMovimiento[]; lineas: ReactNode
  onCambiar: (campo: string, valor: string) => void; onGuardar: (e: FormEvent) => Promise<void>
}
export function InventarioOperacionFormulario({ vista, datos, errores, error, guardando, creado, regreso, rutaDetalle = regreso, tipos, lineas, onCambiar, onGuardar }: Props) {
  const { sesion, onNavegar } = useContextoCatalogo()
  const ajuste = vista === 'ajustes', cargaInicial = vista === 'carga-inicial'
  const movimiento = vista === 'movimientos' || ajuste || cargaInicial, conteo = vista === 'conteos'
  const singular = cargaInicial ? 'carga inicial' : ajuste ? 'ajuste' : movimiento ? 'movimiento' : conteo ? 'conteo físico' : 'bloqueo', nuevo = cargaInicial ? 'Nueva carga inicial' : ajuste ? 'Nuevo ajuste' : movimiento ? 'Nuevo movimiento' : conteo ? 'Nuevo conteo' : 'Nuevo bloqueo'
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  const campos = camposFormulario(vista, datos, corporativo)
  const secciones = movimiento ? [
    { id: 'operacion-identificacion', titulo: cargaInicial ? 'Identificación de la carga inicial' : ajuste ? 'Identificación del ajuste' : 'Identificación del movimiento', descripcion: 'Sucursal, tipo de operación y documento de referencia.', campos: ['sucursalId', ...(cargaInicial ? [] : ['tipo']), 'referencia', ...campos.filter(c => !['sucursalId', 'referencia', 'motivo', 'evidencia'].includes(c.clave)).map(c => c.clave)] },
    { id: 'operacion-justificantes', titulo: 'Motivo y evidencia', descripcion: 'Documenta la causa y el respaldo de la operación.', campos: ['motivo', 'evidencia'] },
  ] : conteo ? [
    { id: 'operacion-identificacion', titulo: 'Sucursal y ubicación', descripcion: 'Selecciona la bodega y la ubicación donde realizarás el conteo.', campos: ['sucursalId', 'bodegaId', 'ubicacionId'] },
    { id: 'operacion-referencia', titulo: 'Identificación del conteo', descripcion: 'Documento de referencia para identificar los resultados.', campos: ['referencia'] },
    { id: 'operacion-justificantes', titulo: 'Motivo y evidencia', descripcion: 'Documenta la causa y el respaldo del conteo físico.', campos: ['motivo', 'evidencia'] },
  ] : [
    { id: 'operacion-identificacion', titulo: 'Sucursal y clase de bloqueo', descripcion: 'Define dónde se aplica la restricción y su clase.', campos: ['sucursalId', 'clase'] },
    { id: 'operacion-alcance', titulo: 'Alcance de la restricción', descripcion: 'Selecciona el producto, lote o ubicación que deseas restringir.', campos: ['alcance', 'objetivoId'] },
    { id: 'operacion-justificantes', titulo: 'Motivo y evidencia', descripcion: 'Documenta la causa y el respaldo del bloqueo.', campos: ['motivo', 'evidencia'] },
  ]
  const navegacion = [...secciones, ...(movimiento ? [{ id: 'inv-lineas', titulo: cargaInicial ? 'Líneas de la carga inicial' : ajuste ? 'Líneas del ajuste' : 'Líneas del movimiento', descripcion: 'Origen, destino, cantidades y costes de cada presentación.' }] : [])]
  return <section aria-labelledby="titulo-formulario-operacion">
    <div className={styles.encabezadoPagina}><h1 id="titulo-formulario-operacion">Registrar {singular}</h1><span className={styles.indicadorFormulario}>{nuevo}</span></div>
    {error && <div className={styles.alertaError} role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
    <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.formulario} noValidate onSubmit={e => void onGuardar(e)} aria-busy={guardando}>
      <fieldset className={styles.panelPerfil} disabled={guardando || Boolean(creado)}><legend>{cargaInicial ? 'Resumen de la carga inicial' : `Resumen del ${singular}`}</legend>
        <div className={styles.selectorFoto}><div className={`${styles.vistaPreviaFoto} ${local.perfilIcono}`}><IconoPosicion /></div><div className={styles.controlesFoto}><strong>{movimiento || conteo ? datos.referencia || nuevo : `Bloqueo de ${etiqueta(datos.alcance ?? 'PRODUCTO').toLowerCase()}`}</strong><p>{conteo ? 'La ubicación quedará congelada para movimientos físicos hasta conciliar o cancelar el conteo.' : movimiento ? 'Se guarda pendiente. Las existencias cambian al confirmarlo.' : 'Restricción por producto, lote o ubicación con causa y evidencia.'}</p></div></div>
        <nav className={styles.navegacionFormulario} aria-label={`Secciones del formulario de ${singular}`}><p>Completa el registro</p>{navegacion.map((s, i) => <a href={`#${s.id}`} key={s.id} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}><span>{String(i + 1).padStart(2, '0')}</span><div>{s.titulo}<small>{s.descripcion}</small></div></a>)}</nav>
      </fieldset>
      {secciones.map((s, i) => <fieldset id={s.id} key={s.id} disabled={guardando || Boolean(creado)}><legend><span className={styles.numeroSeccion}>{String(i + 1).padStart(2, '0')}</span>{s.titulo}</legend><p className={styles.descripcionSeccion}>{s.descripcion}</p>
        <div className={styles.grillaDos}>{s.campos.map(clave => <CampoInventario key={clave} apariencia="empleados" campo={clave === 'tipo' ? { clave, etiqueta: 'Tipo de movimiento', tipo: 'opciones', requerido: true, opciones: tipos.map(t => ({ valor: t, etiqueta: etiqueta(t) })) } : campos.find(c => c.clave === clave)!} value={datos[clave] ?? ''} onChange={v => onCambiar(clave, v)} error={errores[clave]} soloSucursalActual={!corporativo} criterios={clave === 'bodegaId' ? { sucursalId: datos.sucursalId } : clave === 'ubicacionId' ? { bodegaId: datos.bodegaId } : clave === 'objetivoId' && datos.alcance === 'UBICACION' ? { sucursalId: datos.sucursalId } : undefined} disabled={guardando || Boolean(creado) || clave === 'ubicacionId' && !datos.bodegaId || clave === 'objetivoId' && datos.alcance === 'UBICACION' && !datos.sucursalId} />)}</div>
      </fieldset>)}
      {movimiento && lineas}
      <div className={styles.accionesFormulario}><p><span aria-hidden="true">*</span> Campos obligatorios</p><div>
        <button className={styles.botonSecundario} type="button" disabled={guardando} onClick={() => onNavegar(regreso)}><IconoAccion nombre="cancelar" className={styles.iconoBoton} /><span>Cancelar</span></button>
        <button className={styles.botonPrincipal} type="submit" disabled={guardando || Boolean(creado)}><IconoAccion nombre="guardar" className={styles.iconoBoton} /><span>{guardando ? 'Guardando…' : movimiento ? 'Guardar pendiente' : conteo ? 'Registrar conteo' : 'Registrar bloqueo'}</span></button>
      </div></div>
    </form>
    <ModalEstado abierto={Boolean(creado)} tipo="exito" titulo={cargaInicial ? 'Carga inicial registrada' : ajuste ? 'Ajuste registrado' : movimiento ? 'Movimiento registrado' : conteo ? 'Conteo registrado' : 'Bloqueo registrado'} mensaje={conteo ? 'El conteo está abierto. Registra las cantidades físicas y revisa sus diferencias antes de cerrar y conciliar.' : cargaInicial ? 'La carga inicial está pendiente. Revísala y confírmala para incorporar las existencias de apertura.' : ajuste ? 'El ajuste está pendiente. Revísalo y confírmalo para actualizar las existencias.' : movimiento ? 'El movimiento está pendiente. Revísalo y confírmalo para actualizar las existencias.' : 'La restricción se registró correctamente.'} textoAccionPrincipal={regreso !== '/' ? 'Ver detalle' : 'Volver al inicio'} onAccionPrincipal={() => onNavegar(regreso !== '/' ? `${rutaDetalle}/${creado!.id}` : '/')} onCerrar={() => onNavegar(regreso)} />
  </section>
}
