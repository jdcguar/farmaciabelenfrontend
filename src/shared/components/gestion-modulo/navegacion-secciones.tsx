import styles from './gestion-modulo.module.css'

export type SeccionModulo = { id: string; titulo: string }

export function NavegacionSecciones({ secciones, lateral = false, className }: { secciones: readonly SeccionModulo[]; lateral?: boolean; className?: string }) {
  return (
    <nav className={className ?? (lateral ? styles.navegacionFormulario : styles.navegacionDetalle)} aria-label="Secciones del registro">
      {lateral && <strong>Secciones</strong>}
      {secciones.map((seccion, indice) => (
        <a key={seccion.id} href={`#${seccion.id}`} onClick={(evento) => {
          if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return
          const destino = document.getElementById(seccion.id)
          if (!destino) return
          evento.preventDefault()
          destino.scrollIntoView({ block: 'start' })
        }}>
          {lateral && <span aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>}
          {seccion.titulo}
        </a>
      ))}
    </nav>
  )
}
