import { NavegacionSecciones } from '../../../shared/components/gestion-modulo/navegacion-secciones'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ErrorApi } from '../../../shared/api/cliente-api'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { crearRol, obtenerCatalogoPermisos } from '../rol-api'
import type { CatalogoPermisos } from '../rol.types'
import { erroresDesdeDetallesRol, validarFormularioRol, type DatosFormularioRol, type ErroresFormularioRol } from '../validacion-rol'
import { RolFormularioCampos } from './rol-formulario-campos'
import styles from '../../../shared/components/gestion-modulo/formulario-modulo.module.css'

type RolCrearViewProps = {
  onNavegar: (ruta: string) => void
  onCambiosPendientes: (pendientes: boolean) => void
}

const datosIniciales: DatosFormularioRol = { codigo: '', nombre: '', descripcion: '' }

export function RolCrearView({ onNavegar, onCambiosPendientes }: RolCrearViewProps) {
  const [datos, setDatos] = useState(datosIniciales)
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoPermisos | null>(null)
  const [errores, setErrores] = useState<ErroresFormularioRol>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [reintento, setReintento] = useState(0)
  const formularioRef = useRef<HTMLFormElement>(null)
  const tieneCambios = useMemo(
    () => JSON.stringify(datos) !== JSON.stringify(datosIniciales) || permisosSeleccionados.length > 0,
    [datos, permisosSeleccionados],
  )

  useEffect(() => {
    onCambiosPendientes(tieneCambios && !exito)
  }, [exito, onCambiosPendientes, tieneCambios])
  useEffect(() => () => onCambiosPendientes(false), [onCambiosPendientes])

  useEffect(() => {
    const controlador = new AbortController()
    void obtenerCatalogoPermisos(controlador.signal)
      .then((respuesta) => {
        setCatalogo(respuesta)
        setErrorGeneral(null)
      })
      .catch((error: unknown) => {
        if (!controlador.signal.aborted) {
          setErrorGeneral(error instanceof ErrorApi ? error.message : 'No fue posible cargar los permisos.')
        }
      })
    return () => controlador.abort()
  }, [reintento])

  const enfocarPrimerError = (siguientes: ErroresFormularioRol) => {
    const campo = Object.keys(siguientes)[0]
    if (campo) formularioRef.current?.querySelector<HTMLElement>(`#${campo}`)?.focus()
  }

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const siguientes = validarFormularioRol(datos)
    setErrores(siguientes)
    if (Object.keys(siguientes).length > 0) {
      enfocarPrimerError(siguientes)
      return
    }

    setGuardando(true)
    setErrorGeneral(null)
    try {
      await crearRol({
        codigo: datos.codigo.trim().toUpperCase(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim() || null,
        permisosIds: permisosSeleccionados,
      })
      onCambiosPendientes(false)
      setExito(true)
    } catch (error: unknown) {
      if (error instanceof ErrorApi) {
        setErrorGeneral(error.message)
        const erroresApi = erroresDesdeDetallesRol(error.detalles)
        if (Object.keys(erroresApi).length > 0) setErrores(erroresApi)
      } else setErrorGeneral('No fue posible registrar el rol.')
    } finally {
      setGuardando(false)
    }
  }

  if (!catalogo) {
    return (
      <section className={styles.estadoCargaFormulario} role={errorGeneral ? 'alert' : undefined}>
        
        <h1>{errorGeneral ? 'No se pudo preparar el formulario' : 'Preparando formulario…'}</h1>
        <p>{errorGeneral ?? 'Estamos cargando el catálogo de permisos.'}</p>
        {errorGeneral && <button type="button" onClick={() => setReintento((valor) => valor + 1)}>Reintentar</button>}
      </section>
    )
  }

  return (
    <section className={styles.paginaFormulario}>
      <header className={styles.encabezadoPagina}>
        <div><h1>Crear nuevo rol</h1></div>
      </header>
      {errorGeneral && <div className={styles.alertaError} role="alert"><span>!</span><p>{errorGeneral}</p></div>}
      <form ref={formularioRef} className={styles.formulario} onSubmit={(event) => void guardar(event)} noValidate><div className={styles.layoutFormulario}><NavegacionSecciones lateral secciones={[{"id":"rol-seccion-1","titulo":"Información del rol"},{"id":"rol-seccion-2","titulo":"Asignación de permisos"}]} /><div className={styles.contenidoFormulario}>
        <RolFormularioCampos
          datos={datos}
          errores={errores}
          catalogo={catalogo}
          permisosSeleccionados={permisosSeleccionados}
          onDatosChange={(siguientes) => { setDatos(siguientes); setErrores({}) }}
          onPermisosChange={(seleccionados) => { setPermisosSeleccionados(seleccionados); setErrores((actuales) => ({ ...actuales, permisosIds: undefined })) }}
          deshabilitado={guardando}
        />
        <div className={styles.accionesFormulario}>
          <p><span aria-hidden="true">*</span> Campos obligatorios</p>
          <div>
            <button className={styles.botonSecundario} type="button" onClick={() => onNavegar('/seguridad/roles')} disabled={guardando}>
              <IconoAccion nombre="cancelar" className={styles.iconoBoton} /><span>Cancelar</span>
            </button>
            <button className={styles.botonPrincipal} type="submit" disabled={guardando}>
              <IconoAccion nombre="guardar" className={styles.iconoBoton} /><span>{guardando ? 'Registrando rol…' : 'Registrar rol'}</span>
            </button>
          </div>
        </div>
      </div></div></form>
      <ModalEstado
        abierto={exito}
        tipo="exito"
        titulo="Rol registrado"
        mensaje="El rol y sus permisos fueron guardados correctamente."
        textoAccionPrincipal="Aceptar"
        onAccionPrincipal={() => onNavegar('/seguridad/roles')}
        onCerrar={() => onNavegar('/seguridad/roles')}
      />
    </section>
  )
}
