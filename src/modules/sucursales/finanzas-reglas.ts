import { createElement } from 'react'
import form from '../../shared/components/gestion-modulo/formulario-modulo.module.css'
export const mesActual = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit' }).format(new Date())
export const hoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const monto = (valor: string) => `Q${valor.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
export const fecha = (v: string | null) => v ? new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'Sin registro'
const nombres: Record<string, string> = { BORRADOR: 'Borrador', APROBADO: 'Aprobado', CERRADO: 'Cerrado', SOLICITADA: 'Solicitada', ABIERTA: 'Abierta', CERRADA: 'Cerrada', SOLICITADO: 'Solicitado', RECHAZADO: 'Rechazado', CANCELADO: 'Cancelado', AMPLIACION: 'Ampliación', REDUCCION: 'Reducción', EGRESO: 'Gasto', REPOSICION: 'Reposición', CORRECCION: 'Corrección' }
export const etiqueta = (s: string) => nombres[s] ?? s.toLowerCase().replaceAll('_', ' ')
export const botonFinanzas = (texto: string, accion: () => void, disabled = false) => createElement('button', { type: 'button', disabled, className: form.botonSecundario, onClick: accion }, texto)

export const puedeGestionarPresupuestos = (permisos: readonly string[]) => permisos.includes('ORGANIZACION.SUCURSALES.PRESUPUESTOS_VER') && ['PRESUPUESTOS_ASIGNAR', 'PRESUPUESTOS_APROBAR', 'PRESUPUESTOS_SUGERIR'].some(a => permisos.includes('ORGANIZACION.SUCURSALES.' + a))
