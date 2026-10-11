type NombreIcono =
  | 'inicio'
  | 'ventas'
  | 'inventario'
  | 'catalogos'
  | 'empleados'
  | 'roles'
  | 'compras'
  | 'organizacion'
  | 'seguridad'
  | 'reportes'
  | 'menu'
  | 'cerrar'
  | 'campana'
  | 'sucursal'
  | 'chevron'
  | 'escudo'
  | 'llave'
  | 'reloj'
  | 'usuarios'
  | 'departamento'
  | 'puesto'
  | 'estado'
  | 'flecha'
  | 'check'
  | 'calendario'
  | 'permisos'
  | 'sesion'
  | 'perfil'
  | 'buscar'
  | 'salir'
  | 'informacion'

type IconoProps = {
  nombre: NombreIcono
  className?: string
}

const trazos: Record<NombreIcono, React.ReactNode> = {
  buscar: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  salir: <><path d="M10 4H4v16h6M9 12h12M17 8l4 4-4 4" /></>,
  informacion: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  inicio: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  ventas: <><path d="M7 3h10v4H7zM5 10h14l2 10H3l2-10Z" /><path d="M9 7v3M15 7v3M7 15h3M14 14h3v3h-3z" /></>,
  inventario: <><rect x="3" y="5" width="18" height="5" rx="1" /><path d="M5 10v10h14V10M10 14h4M9 5V3h6v2" /></>,
  catalogos: <><path d="M4 5a2 2 0 0 1 2-2h14v17H6a2 2 0 0 1-2-2V5ZM4 17h16M8 3v14" /><path d="M12 7h4M12 11h4" /></>,
  empleados: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3" /></>,
  roles: <><path d="M10 3 3 6v5c0 4 2.5 7.5 7 9M10 3l7 3v3" /><circle cx="16" cy="14" r="3" /><path d="M16 17v4M16 19h3" /></>,
  compras: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M9 7h6M9 11h6M9 15h2" /></>,
  organizacion: <><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-4h12v4" /></>,
  seguridad: <><path d="m12 3-8 3v5c0 4.5 3 8 8 10 5-2 8-5.5 8-10V6l-8-3Z" /><rect x="9" y="10" width="6" height="6" rx="1" /><path d="M10 10V8a2 2 0 0 1 4 0v2" /></>,
  reportes: <><path d="M14 3H5v18h14V8l-5-5ZM14 3v5h5M8 17v-3M12 17v-6M16 17v-4" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
  campana: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  sucursal: <><path d="M3 9h18l-2-5H5L3 9ZM4 13v8h16v-8M9 21v-6h6v6" /><path d="M3 9v2a3 3 0 0 0 6 0V9M9 9v2a3 3 0 0 0 6 0V9M15 9v2a3 3 0 0 0 6 0V9" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  escudo: <><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" /><path d="M9.5 12h5" /></>,
  llave: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  usuarios: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="3" /><path d="M5.5 18a6.5 6.5 0 0 1 13 0" /></>,
  departamento: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M9 21v-6h6v6" /></>,
  puesto: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 12l9 3 9-3M12 13v4" /></>,
  estado: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8" cy="9" r="1" /><path d="M12 9h5M7 15l1.5 1.5L11 14M14 15h3" /></>,
  flecha: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h2M15 14h2M7 17h2" /></>,
  permisos: <><path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3" /><circle cx="13" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></>,
  sesion: <><path d="M20.5 10a9 9 0 1 0-10 10.9M12 7v5l3 2" /><path d="m15 19 2 2 4-5" /></>,
  perfil: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="9" r="3" /><path d="M7 18v-1a5 5 0 0 1 10 0v1" /></>,
}

export function Icono({ nombre, className }: IconoProps) {
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
