import { validarCantidadesAlEnviar } from '../../../shared/cantidades/formulario-cantidad'
import { useState } from 'react'
import { IconoAccion } from '../../../shared/components/icono-accion'
import { ModalEstado } from '../../../shared/components/modal-estado'
import { textoValor } from '../catalogo-reglas'
import type { DefinicionCatalogo } from '../catalogo.types'
import { CatalogoCampo } from './catalogo-campo'
import styles from '../catalogos.module.css'

type Props = {
  catalogo: DefinicionCatalogo
  valores: Record<string, string>
  soloSucursalActual: boolean
  onAplicar: (valores: Record<string, string>) => void
}

export function FiltrosCatalogo({ catalogo, valores, soloSucursalActual, onAplicar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [borrador, setBorrador] = useState<Record<string, string>>({})
  const activos = catalogo.filtros.filter((campo) => Boolean(valores[campo.clave])).length
  const aplicar = () => { onAplicar(borrador); setAbierto(false) }
  return <>
    <button type="button" className={styles.botonHerramienta} aria-haspopup="dialog" aria-label={`Filtros del catálogo${activos ? `, ${activos} aplicados` : ''}`} data-activo={activos > 0} onClick={() => { setBorrador({ ...valores }); setAbierto(true) }}>
      <IconoAccion nombre="filtrar" /><span>Filtros</span>{activos > 0 && <span className={styles.contadorFiltros} aria-hidden="true">{activos}</span>}
    </button>
    <ModalEstado abierto={abierto} tipo="informacion" apariencia="formulario" titulo={`Filtrar ${catalogo.titulo.toLocaleLowerCase('es')}`} onCerrar={() => setAbierto(false)} textoAccionPrincipal="Aplicar filtros" onAccionPrincipal={aplicar} textoAccionSecundaria="Limpiar" onAccionSecundaria={() => setBorrador({})} mensaje={<div className={styles.panelHerramienta}>
      <p className={styles.ayudaHerramienta}>Ajusta los criterios y aplícalos para actualizar la lista.</p>
      <form onSubmitCapture={validarCantidadesAlEnviar} className={styles.camposHerramienta} onSubmit={(event) => { event.preventDefault(); aplicar() }}>
        {catalogo.filtros.map((campo) => <CatalogoCampo key={campo.clave} prefijo="filtro-" campo={campo} valor={borrador[campo.clave] ?? ''} filtro soloSucursalActual={soloSucursalActual} onChange={(valor) => setBorrador((actual) => ({ ...actual, [campo.clave]: textoValor(valor) }))} />)}
      </form>
    </div>} />
  </>
}
