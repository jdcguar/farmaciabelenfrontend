import { InventarioFefoConsulta } from './inventario-fefo-consulta'
import { validarConsultaStock } from '../inventario-consultas-reglas'
import { InventarioDisponibilidadConsulta } from './inventario-disponibilidad-consulta'
import { useEffect, useState, type FormEvent } from 'react'
import { useContextoCatalogo } from '../../catalogos-farmacia/catalogo-contexto'
import { consultarDisponibilidad, consultarFefo } from '../inventario-api'
import type { Disponibilidad, Fefo } from '../inventario.types'

type ConsultaStock = { sucursalId: string; presentacionId: string; unidadId: string; cantidad: string; vidaUtilMinimaDias: number }
export function InventarioDisponibilidadView({ fefo = false }: { fefo?: boolean }) {
  const { sesion } = useContextoCatalogo()
  const [datos, setDatos] = useState({ sucursalId: sesion.sucursal.id, presentacionId: '', unidadId: '', cantidad: '', dias: '0' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [consulta, setConsulta] = useState<ConsultaStock | null>(null), [revision, setRevision] = useState(0)
  const [resultado, setResultado] = useState<Disponibilidad | Fefo | null>(null), [error, setError] = useState<string | null>(null), [finalizada, setFinalizada] = useState('')
  const clave = JSON.stringify({ consulta, revision }), cargando = Boolean(consulta) && finalizada !== clave
  const corporativo = sesion.permisos.includes('INVENTARIO.ACCESO.CORPORATIVO')
  useEffect(() => {
    if (!consulta) return
    const c = new AbortController()
    const peticion = fefo ? consultarFefo(consulta, c.signal) : consultarDisponibilidad({ sucursalId: consulta.sucursalId, presentacionId: consulta.presentacionId }, c.signal)
    void peticion.then(r => { if (!c.signal.aborted) { setResultado(r); setError(null) } }).catch((e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo consultar.') }).finally(() => { if (!c.signal.aborted) setFinalizada(clave) })
    return () => c.abort()
  }, [clave, consulta, fefo])
  function consultar(e: FormEvent) {
    e.preventDefault(); if (cargando) return
    const validacion = validarConsultaStock(datos, fefo)
    setErrores(validacion)
    if (Object.keys(validacion).length) { setError('Completa los campos de la consulta.'); document.getElementById('inv-' + Object.keys(validacion)[0])?.focus(); return }
    setError(null); setResultado(null); setConsulta({ sucursalId: datos.sucursalId, presentacionId: datos.presentacionId, unidadId: datos.unidadId, cantidad: datos.cantidad.trim(), vidaUtilMinimaDias: Number(datos.dias) }); setRevision(r => r + 1)
  }
  const cambiar = (campo: keyof typeof datos, valor: string) => { setDatos(d => ({ ...d, [campo]: valor })); setErrores({}); setError(null); setResultado(null) }
  const reintentar = () => { setResultado(null); setRevision(r => r + 1) }
  if (!fefo) return <InventarioDisponibilidadConsulta datos={datos} corporativo={corporativo} cargando={cargando} error={error} errores={errores} resultado={!cargando && !error && resultado && 'posiciones' in resultado ? resultado : null} consultado={Boolean(consulta)} onCambiar={cambiar} onConsultar={consultar} onReintentar={reintentar} />
  return <InventarioFefoConsulta datos={datos} corporativo={corporativo} cargando={cargando} error={error} errores={errores} resultado={!cargando && !error && resultado && 'seleccion' in resultado ? resultado : null} consulta={consulta} consultado={Boolean(consulta)} onCambiar={cambiar} onConsultar={consultar} onReintentar={reintentar} />
}
