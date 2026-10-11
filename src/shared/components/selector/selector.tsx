import { Children, Fragment, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AriaAttributes, KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconoAccion } from '../icono-accion'
import styles from './selector.module.css'

type Props = Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid'> & {
  id?: string
  name?: string
  value: string | number
  children: ReactNode
  onValueChange: (valor: string) => void
  disabled?: boolean
  required?: boolean
  compacto?: boolean
  busquedaRemota?: {
    onBuscar?: (valor: string) => void
    cargando: boolean
    hayMas?: boolean
    onCargarMas?: () => void
    error?: string | null
    onReintentar?: () => void
    sinCoincidencias?: boolean
  }
}

type Opcion = { valor: string; etiqueta: string; deshabilitada: boolean }

function texto(children: ReactNode): string {
  return Children.toArray(children).map((child) => isValidElement<{ children?: ReactNode }>(child)
    ? texto(child.props.children) : String(child)).join('')
}

function opcionesDe(children: ReactNode): Opcion[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return []
    if (child.type === Fragment) return opcionesDe(child.props.children)
    return [{ valor: String(child.props.value ?? texto(child.props.children)), etiqueta: texto(child.props.children), deshabilitada: Boolean(child.props.disabled) }]
  })
}

const normalizar = (valor: string) => valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-GT')

function textoEtiqueta(nodo: Node): string {
  if (nodo instanceof Element && (nodo.matches('select, button, [aria-hidden="true"]'))) return ''
  if (nodo.nodeType === Node.TEXT_NODE) return nodo.textContent ?? ''
  return Array.from(nodo.childNodes).map(textoEtiqueta).join(' ').trim()
}

/** Conserva los valores y las opciones del select; el menú se renderiza fuera de paneles que recortan su contenido. */
export function Selector({ id, name, value, children, onValueChange, disabled, required, compacto, busquedaRemota, ...aria }: Props) {
  const generado = useId()
  const controlId = id ?? generado
  const listaId = `${controlId}-opciones`
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const busquedaInput = useRef<HTMLInputElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [etiquetaLista, setEtiquetaLista] = useState('Opciones')
  const [activo, setActivo] = useState<string | null>(null)
  const [posicion, setPosicion] = useState({ left: 0, top: 0 as number | undefined, bottom: undefined as number | undefined, width: 0, maxHeight: 280 })
  const opciones = useMemo(() => opcionesDe(children), [children])
  const seleccionada = opciones.find((opcion) => opcion.valor === String(value))
  const visibles = busquedaRemota ? opciones : opciones.filter((opcion) => normalizar(opcion.etiqueta).includes(normalizar(busqueda.trim())))
  const habilitadas = visibles.filter((opcion) => !opcion.deshabilitada)
  const activa = habilitadas.find((opcion) => opcion.valor === activo) ?? habilitadas[0]
  const conBusqueda = busquedaRemota ? Boolean(busquedaRemota.onBuscar) : opciones.length > 6
  const conBusquedaRemota = Boolean(busquedaRemota)
  const indiceActivo = visibles.findIndex((opcion) => opcion.valor === activa?.valor)
  const activoId = indiceActivo < 0 ? undefined : `${listaId}-${indiceActivo}`

  const cerrar = (devolverFoco = false) => {
    setAbierto(false)
    if (devolverFoco) boton.current?.focus()
  }

  const abrir = (ultimo = false) => {
    if (boton.current?.matches(':disabled')) return
    const etiqueta = boton.current?.labels?.[0]
    setEtiquetaLista(aria['aria-label'] ?? (etiqueta ? textoEtiqueta(etiqueta) : 'Opciones'))
    setBusqueda('')
    busquedaRemota?.onBuscar?.('')
    const habilitadasTodas = opciones.filter((opcion) => !opcion.deshabilitada)
    setActivo(ultimo ? habilitadasTodas.at(-1)?.valor ?? null
      : habilitadasTodas.find((opcion) => opcion.valor === String(value))?.valor ?? habilitadasTodas[0]?.valor ?? null)
    setAbierto(true)
  }

  const seleccionar = (opcion: Opcion) => {
    if (opcion.deshabilitada || boton.current?.matches(':disabled')) return
    onValueChange(opcion.valor)
    cerrar(true)
  }

  const teclado = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      if (abierto) { event.preventDefault(); event.stopPropagation(); cerrar(true) }
      return
    }
    if (event.key === 'Tab') {
      if (busquedaRemota && abierto && (busquedaRemota.hayMas || busquedaRemota.error) && !event.shiftKey && (event.target === busquedaInput.current || event.target === lista.current)) return
      if (abierto) boton.current?.focus(); cerrar(); return
    }
    if (event.target instanceof HTMLButtonElement && event.target !== boton.current) return
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (!abierto) { abrir(event.key === 'End' || event.key === 'ArrowUp'); return }
      const indice = habilitadas.findIndex((opcion) => opcion.valor === activa?.valor)
      const siguiente = event.key === 'Home' ? 0 : event.key === 'End' ? habilitadas.length - 1
        : Math.max(0, Math.min(habilitadas.length - 1, indice + (event.key === 'ArrowDown' ? 1 : -1)))
      setActivo(habilitadas[siguiente]?.valor ?? null)
    } else if (event.key === 'Enter' || (event.key === ' ' && !conBusqueda)) {
      event.preventDefault()
      if (abierto && activa) seleccionar(activa)
      else if (!abierto) abrir()
    } else if (!abierto && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const siguiente = opciones.find((opcion) => !opcion.deshabilitada && normalizar(opcion.etiqueta).startsWith(normalizar(event.key)))
      if (siguiente) { event.preventDefault(); onValueChange(siguiente.valor) }
    }
  }

  useLayoutEffect(() => {
    if (!abierto) return
    const colocar = () => {
      const rect = boton.current?.getBoundingClientRect()
      if (!rect) return
      const ancho = Math.min(Math.max(rect.width, compacto ? 150 : 240), window.innerWidth - 16)
      const abajo = window.innerHeight - rect.bottom - 16
      const alturaDeseada = Math.min(360, opciones.length * 44 + (conBusqueda ? 66 : 12) + (conBusquedaRemota ? 84 : 0))
      const arriba = abajo < alturaDeseada && rect.top > abajo
      const altura = Math.max(0, Math.min(alturaDeseada, arriba ? rect.top - 16 : abajo))
      setPosicion({ left: Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8)), top: arriba ? undefined : rect.bottom + 6,
        bottom: arriba ? window.innerHeight - rect.top + 6 : undefined, width: ancho, maxHeight: altura })
    }
    colocar()
    window.addEventListener('resize', colocar)
    window.addEventListener('scroll', colocar, true)
    return () => { window.removeEventListener('resize', colocar); window.removeEventListener('scroll', colocar, true) }
  }, [abierto, compacto, conBusqueda, conBusquedaRemota, opciones.length])

  useEffect(() => {
    if (!abierto) return
    if (conBusqueda) busquedaInput.current?.focus()
    else lista.current?.focus()
    const fuera = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && !boton.current?.contains(event.target)) cerrar()
    }
    const campo = boton.current?.closest('fieldset')
    const observar = new MutationObserver(() => { if (boton.current?.matches(':disabled')) setAbierto(false) })
    if (campo) observar.observe(campo, { attributes: true, attributeFilter: ['disabled'] })
    if (boton.current) observar.observe(boton.current, { attributes: true, attributeFilter: ['disabled'] })
    document.addEventListener('pointerdown', fuera)
    return () => { document.removeEventListener('pointerdown', fuera); observar.disconnect() }
  }, [abierto, conBusqueda])

  useEffect(() => {
    if (abierto && activoId) document.getElementById(activoId)?.scrollIntoView({ block: 'nearest' })
  }, [abierto, activoId])

  return (
    <div className={`${styles.selector} ${compacto ? styles.compacto : ''}`}>
      <select hidden name={name} value={value} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true"
        onChange={(event) => onValueChange(event.target.value)}
        onInvalid={(event) => { event.preventDefault(); boton.current?.focus() }}>
        {children}
      </select>
      <button ref={boton} id={controlId} type="button" className={styles.control} role="combobox" disabled={disabled}
        aria-expanded={abierto} aria-controls={listaId} aria-haspopup="listbox" aria-required={required} {...aria}
        onClick={() => abierto ? cerrar() : abrir()} onKeyDown={teclado}>
        <span className={!value ? styles.placeholder : undefined}>{seleccionada?.etiqueta ?? 'Selecciona una opción'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {abierto && !disabled && createPortal(
        <div ref={panel} className={styles.panel} style={posicion} onKeyDown={teclado}>
          {conBusqueda && <div className={styles.busqueda}><IconoAccion nombre="buscar" /><input ref={busquedaInput} type="search" role="combobox"
            aria-label="Buscar opciones" aria-expanded="true" aria-controls={listaId} aria-autocomplete="list" aria-activedescendant={activoId}
            placeholder="Buscar opciones…" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); busquedaRemota?.onBuscar?.(event.target.value); setActivo(null) }} /></div>}
          <div ref={lista} className={styles.lista} id={listaId} role="listbox" tabIndex={-1}
            aria-label={etiquetaLista}
            aria-activedescendant={conBusqueda ? undefined : activoId}>
            {visibles.map((opcion, indice) => <div key={opcion.valor} id={`${listaId}-${indice}`} role="option"
              aria-selected={opcion.valor === String(value)} aria-disabled={opcion.deshabilitada || undefined}
              data-activa={opcion.valor === activa?.valor} className={styles.opcion}
              onPointerMove={() => { if (!opcion.deshabilitada) setActivo(opcion.valor) }}
              onMouseDown={(event) => event.preventDefault()} onClick={() => seleccionar(opcion)}>
              <span>{opcion.etiqueta}</span>{opcion.valor === String(value) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>}
            </div>)}
            {visibles.length === 0 && !busquedaRemota?.cargando && <p className={styles.sinResultados}>No hay opciones que coincidan.</p>}
          </div>
          {busquedaRemota && <div className={styles.estadoRemoto}>
            {busquedaRemota.cargando && <span role="status">Buscando opciones…</span>}
            {busquedaRemota.sinCoincidencias && !busquedaRemota.cargando && !busquedaRemota.error && <span role="status">No hay opciones que coincidan.</span>}
            {busquedaRemota.error && <><span role="alert">{busquedaRemota.error}</span><button type="button" onClick={busquedaRemota.onReintentar}>Reintentar</button></>}
            {busquedaRemota.hayMas && !busquedaRemota.error && <button type="button" disabled={busquedaRemota.cargando} onClick={busquedaRemota.onCargarMas}>Cargar más opciones</button>}
          </div>}
        </div>, document.body,
      )}
    </div>
  )
}
