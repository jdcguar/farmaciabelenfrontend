type IconoAccionProps = {
  nombre: 'guardar' | 'cancelar' | 'editar' | 'desactivar' | 'enviar' | 'estado' | 'buscar' | 'ver' | 'agregar' | 'sin-registros' | 'reloj' | 'flecha' | 'filtrar'
  className?: string
}

const trazos = {
  filtrar: <><path d="M4 6h16M4 12h16M4 18h16" /><path d="M8 4v4M16 10v4M10 16v4" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flecha: <path d="M4 12h16m-6-6 6 6-6 6" />,
  'sin-registros': (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h5M8 16h3" />
    </>
  ),
  buscar: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  ver: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  agregar: <path d="M12 5v14M5 12h14" />,
  guardar: (
    <>
      <path d="M5 3h11l3 3v15H5V3Z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </>
  ),
  cancelar: <path d="m6 6 12 12M18 6 6 18" />,
  editar: (
    <>
      <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  desactivar: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 3.2 1.35M16 12l5 5M21 12l-5 5" />
    </>
  ),
  enviar: (
    <>
      <path d="M3 11.5 21 3l-7 18-3.5-7L3 11.5Z" />
      <path d="m10.5 14 4-4" />
    </>
  ),
  estado: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="5" />
      <circle cx="16" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </>
  ),
}

export function IconoAccion({ nombre, className }: IconoAccionProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {trazos[nombre]}
    </svg>
  )
}
