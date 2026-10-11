import { ListaAuditoria } from '../../../shared/components/auditoria/lista-auditoria'
import { CambiosAuditoria } from '../../../shared/components/auditoria/cambios-auditoria'
import auditoriaStyles from '../../../shared/components/auditoria/auditoria.module.css'
import { useEffect, useMemo, useState } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import {
  PaginacionTabla,
  type ColumnaTabla,
  type ColumnFiltersState,
  type SortingState,
} from '../../../shared/components/tabla-datos'
import { listarAuditoriaEmpleado } from '../empleado-api'
import type {
  AuditoriaEmpleadoPaginada,
  EventoAuditoriaEmpleado,
  ListarAuditoriaEmpleadoParametros,
  OperacionAuditoriaEmpleado,
  OrdenAuditoriaEmpleado,
} from '../empleado.types'
import styles from './empleado-gestion.module.css'

type EmpleadoAuditoriaProps = {
  empleadoId: string
  revision: number
}

const etiquetasOperacion: Record<OperacionAuditoriaEmpleado, string> = {
  CREAR: 'Creación',
  ACTUALIZAR: 'Actualización',
  ACTUALIZAR_FOTO: 'Actualización de fotografía',
  ELIMINAR_FOTO: 'Eliminación de fotografía',
  CAMBIAR_SUCURSAL: 'Cambio de sucursal',
  CAMBIAR_ESTADO: 'Cambio de estado',
  INACTIVAR: 'Inactivación',
}

const opcionesOperacion = Object.entries(etiquetasOperacion).map(([valor, etiqueta]) => ({
  valor,
  etiqueta,
}))

function fechaHora(valor: string): string {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guatemala',
  }).format(new Date(valor))
}

function valorFiltroTexto(filtros: ColumnFiltersState, id: string): string | undefined {
  const valor = filtros.find((filtro) => filtro.id === id)?.value
  return typeof valor === 'string' && valor ? valor : undefined
}

function valoresFiltro(filtros: ColumnFiltersState, id: string): string[] | undefined {
  const valor = filtros.find((filtro) => filtro.id === id)?.value
  if (!Array.isArray(valor)) return undefined
  const valores = valor.filter((item): item is string => typeof item === 'string')
  return valores.length > 0 ? valores : undefined
}

function valorAuditoria(valor: string | null): string {
  return valor === null || valor === '' ? 'Sin valor' : valor
}

function DetalleCambios({ evento }: { evento: EventoAuditoriaEmpleado }) {
  return <CambiosAuditoria id={`detalle-auditoria-${evento.id}`} detalles={evento.detalles} formatearValor={valorAuditoria} />
}

export function EmpleadoAuditoria({ empleadoId, revision }: EmpleadoAuditoriaProps) {
  const [resultado, setResultado] = useState<AuditoriaEmpleadoPaginada | null>(null)
  const [pagina, setPagina] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(50)
  const [filtros, setFiltros] = useState<ColumnFiltersState>([])
  const [ordenamiento, setOrdenamiento] = useState<SortingState>([
    { id: 'fecha', desc: true },
  ])
  const [eventoExpandidoId, setEventoExpandidoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [solicitudFinalizada, setSolicitudFinalizada] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  const parametros = useMemo<ListarAuditoriaEmpleadoParametros>(() => {
    const ordenActual = ordenamiento[0]
    return {
      pagina,
      tamanoPagina,
      fecha: valorFiltroTexto(filtros, 'fecha'),
      operaciones: valoresFiltro(filtros, 'operacion') as OperacionAuditoriaEmpleado[] | undefined,
      usuario: valorFiltroTexto(filtros, 'usuario'),
      sucursal: valorFiltroTexto(filtros, 'sucursal'),
      resumen: valorFiltroTexto(filtros, 'resumen'),
      orden: (ordenActual?.id ?? 'fecha') as OrdenAuditoriaEmpleado,
      direccion: ordenActual?.desc === false ? 'asc' : 'desc',
    }
  }, [filtros, ordenamiento, pagina, tamanoPagina])
  const claveSolicitud = useMemo(
    () => JSON.stringify({ empleadoId, parametros, reintento, revision }),
    [empleadoId, parametros, reintento, revision],
  )
  const cargando = solicitudFinalizada !== claveSolicitud

  useEffect(() => {
    const controlador = new AbortController()
    void listarAuditoriaEmpleado(empleadoId, parametros, controlador.signal)
      .then((respuesta) => {
        setResultado(respuesta)
        setEventoExpandidoId(null)
        setError(null)
      })
      .catch((errorActual: unknown) => {
        if (controlador.signal.aborted) return
        setError(
          errorActual instanceof ErrorApi
            ? errorActual.message
            : 'No fue posible cargar la pista de auditoría.',
        )
      })
      .finally(() => {
        if (!controlador.signal.aborted) setSolicitudFinalizada(claveSolicitud)
      })
    return () => controlador.abort()
  }, [claveSolicitud, empleadoId, parametros])

  const columnas = useMemo<ColumnaTabla<EventoAuditoriaEmpleado>[]>(() => [
    {
      id: 'fecha',
      titulo: 'Fecha y hora',
      obtenerValor: (evento) => evento.ocurridoEn,
      ordenable: true,
      filtro: { tipo: 'fecha', etiqueta: 'Fecha del evento' },
      celda: (evento) => fechaHora(evento.ocurridoEn),
    },
    {
      id: 'operacion',
      titulo: 'Acción',
      obtenerValor: (evento) => evento.tipoOperacion,
      ordenable: true,
      filtro: {
        tipo: 'opciones',
        etiqueta: 'Seleccionar acciones',
        buscable: false,
        opciones: opcionesOperacion,
      },
      celda: (evento) => (
        <span className={styles.accionAuditoria}>
          {etiquetasOperacion[evento.tipoOperacion] ?? evento.tipoOperacion}
        </span>
      ),
    },
    {
      id: 'usuario',
      titulo: 'Realizado por',
      obtenerValor: (evento) => evento.usuarioNombre ?? 'SISTEMA',
      ordenable: true,
      filtro: { tipo: 'texto', etiqueta: 'Filtrar usuario', placeholder: 'Nombre de usuario' },
      celda: (evento) => evento.usuarioNombre ?? 'SISTEMA',
    },
    {
      id: 'sucursal',
      titulo: 'Sucursal',
      obtenerValor: (evento) => evento.sucursal?.nombre ?? '',
      ordenable: true,
      filtro: { tipo: 'texto', etiqueta: 'Filtrar sucursal', placeholder: 'Nombre o código' },
      celda: (evento) => evento.sucursal
        ? <><strong>{evento.sucursal.nombre}</strong><small>{evento.sucursal.codigo}</small></>
        : 'Sin sucursal',
    },
    {
      id: 'resumen',
      titulo: 'Resumen',
      obtenerValor: (evento) => evento.resumen ?? '',
      ordenable: true,
      filtro: { tipo: 'texto', etiqueta: 'Filtrar resumen', placeholder: 'Descripción de la acción' },
      celda: (evento) => evento.resumen ?? 'Sin resumen',
    },
    {
      id: 'cambios',
      titulo: 'Cambios',
      obtenerValor: (evento) => evento.detalles.length,
      celda: (evento) => evento.detalles.length > 0 ? (
        <button
          className={auditoriaStyles.botonCambios}
          type="button"
          aria-expanded={eventoExpandidoId === evento.id}
          aria-controls={`detalle-auditoria-${evento.id}`}
          onClick={() => setEventoExpandidoId((actual) => actual === evento.id ? null : evento.id)}
        >
          {eventoExpandidoId === evento.id ? 'Ocultar cambios' : `Ver cambios (${evento.detalles.length})`}
        </button>
      ) : <span className={styles.sinDato}>Sin detalle</span>,
    },
  ], [eventoExpandidoId])

  const cambiarFiltros = (siguientes: ColumnFiltersState) => {
    setFiltros(siguientes)
    setPagina(1)
  }

  const cambiarOrdenamiento = (siguiente: SortingState) => {
    setOrdenamiento(siguiente.length > 0 ? siguiente : [{ id: 'fecha', desc: true }])
    setPagina(1)
  }

  return (
    <article id="auditoria-empleado" className={auditoriaStyles.panel} aria-busy={cargando}>
      <div className={auditoriaStyles.cabecera}>
        <div>
          <h2>Pista de auditoría</h2>
          <p>Consulta quién realizó cada acción y los cambios registrados.</p>
        </div>
        <div className={auditoriaStyles.acciones}>
          {cargando && <span role="status">Actualizando…</span>}
          {resultado && <span>{resultado.total} {resultado.total === 1 ? 'evento' : 'eventos'}</span>}
          {filtros.length > 0 && (
            <button type="button" onClick={() => cambiarFiltros([])}>
              Limpiar filtros ({filtros.length})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={auditoriaStyles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReintento((actual) => actual + 1)}>Reintentar</button>
        </div>
      )}

      {!resultado && cargando ? (
        <p className={auditoriaStyles.estado}>Cargando pista de auditoría…</p>
      ) : resultado?.items.length ? (
        <div className={auditoriaStyles.contenido}>
          <ListaAuditoria
            descripcion="Pista de auditoría del empleado con filtros por columna"
            datos={resultado.items}
            columnas={columnas}
            filtros={filtros}
            ordenamiento={ordenamiento}
            obtenerIdFila={(evento) => evento.id}
            onFiltrosChange={cambiarFiltros}
            onOrdenamientoChange={cambiarOrdenamiento}
            renderizarFilaExpandida={(evento) =>
              evento.id === eventoExpandidoId ? <DetalleCambios evento={evento} /> : null
            }
          />
          <PaginacionTabla
              apariencia="tarjetas"
            pagina={resultado.pagina}
            tamanoPagina={resultado.tamanoPagina}
            total={resultado.total}
            totalPaginas={resultado.totalPaginas}
            unidadSingular="evento"
            unidadPlural="eventos"
            onPaginaChange={setPagina}
            onTamanoPaginaChange={(tamano) => {
              setTamanoPagina(tamano)
              setPagina(1)
            }}
          />
        </div>
      ) : !error ? (
        <p className={auditoriaStyles.estado}>
          {filtros.length > 0
            ? 'No hay eventos que coincidan con los filtros.'
            : 'No hay eventos de auditoría registrados para este empleado.'}
        </p>
      ) : null}
    </article>
  )
}
