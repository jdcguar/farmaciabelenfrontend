import styles from './empleado-crear-view.module.css'

export function EmpleadoFormularioNav() {
  return (
    <nav className={styles.navegacionFormulario} aria-label="Secciones del formulario">
      <p>Completa el expediente</p>
      <a href="#empleado-personal"><span>01</span><div>Información personal<small>Identificación y nombres</small></div></a>
      <a href="#empleado-contacto"><span>02</span><div>Contacto y residencia<small>Medios de contacto y dirección</small></div></a>
      <a href="#empleado-laboral"><span>03</span><div>Información laboral<small>Puesto y contratación</small></div></a>
    </nav>
  )
}
